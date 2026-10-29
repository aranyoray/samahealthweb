"""
NCD lab results from AKTIV, for the /ncd page. Runs on the clinic PC.

    python ncd_extract.py --introspect
        Schema only. Lists the result tables, their columns, the NCD tests
        found in MAST_TEST and the parameter master, and proposes a column
        mapping. Writes ncd_introspect.json and ncd_mapping.proposed.json.
        Neither file contains patient data; send them back for review.

    python ncd_extract.py --export [--since 2022-10-01] [--until 2026-10-31]
        Needs ncd_mapping.json with "confirmed": true (the reviewed copy of
        the proposed mapping). Writes one row per reported NCD parameter,
        the shape of the planned Neon lab_results view, to
        out/lab_results_<month>.csv on this PC.

Safety, from the brief:
  * AKTIV is read-only. Every statement is a SELECT (or reads
    INFORMATION_SCHEMA / sys views). No temp tables, no schema changes.
  * No locks during clinic hours. The script refuses to start between
    07:00 and 20:00 IST and stops cleanly if a batch would run into 07:00.
    Reads use READ UNCOMMITTED so they take no shared locks, with a short
    lock timeout and low deadlock priority so AKTIV always wins.
  * Nothing is written to Neon. The export CSVs contain names and phone
    numbers (needed to link visits into one person), so they stay on this
    PC: out/ is gitignored. Free-text narrative tables and columns
    (*_DESC, *_PAD, remarks, comments) are never read.
"""

from __future__ import annotations

import argparse
import csv
import datetime as dt
import json
import os
import re
import sys
import time
from pathlib import Path

try:
    import pyodbc
except ImportError:
    pyodbc = None

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None

from ncd_tests import TEST_PATTERNS, code_for_parameter, parse_number

HERE = Path(__file__).resolve().parent
OUT_DIR = HERE / "out"
MAPPING_PATH = HERE / "ncd_mapping.json"
PROPOSED_PATH = HERE / "ncd_mapping.proposed.json"
INTROSPECT_PATH = HERE / "ncd_introspect.json"

PARAM_LIMIT = 2000          # below SQL Server's 2,100 parameters per statement
IST = dt.timezone(dt.timedelta(hours=5, minutes=30))
CLINIC_OPEN, CLINIC_CLOSE = 7, 20   # hours, IST

# Never read these: free text that may name the patient or the doctor.
NARRATIVE_TABLE = re.compile(r"_(DESC|PAD)$", re.IGNORECASE)
NARRATIVE_COL = re.compile(r"REMARK|COMMENT|NARRAT|NOTE|DESC|INTERPRET|IMPRESSION|ADVICE|HISTORY", re.IGNORECASE)

OUT_FIELDS = [
    "bill_key", "regt_key", "patient_key", "bill_date", "report_date",
    "name", "phone", "age", "sex",
    "test_key", "testname", "parameter", "code",
    "value_text", "value_num", "unit", "ref_low", "ref_high", "flag",
    "source_table",
]


# ---------------------------------------------------------------------------
# Guard rails
# ---------------------------------------------------------------------------

def now_ist() -> dt.datetime:
    return dt.datetime.now(IST)


def in_clinic_hours(t: dt.datetime | None = None) -> bool:
    t = t or now_ist()
    return CLINIC_OPEN <= t.hour < CLINIC_CLOSE


def require_off_hours() -> None:
    t = now_ist()
    if in_clinic_hours(t):
        raise SystemExit(
            f"It is {t:%H:%M} IST, inside clinic hours ({CLINIC_OPEN:02d}:00 to {CLINIC_CLOSE:02d}:00). "
            "AKTIV must not be read now. Run again after 20:00 IST."
        )


def minutes_until_open(t: dt.datetime | None = None) -> float:
    t = t or now_ist()
    opening = t.replace(hour=CLINIC_OPEN, minute=0, second=0, microsecond=0)
    if t >= opening:
        opening += dt.timedelta(days=1)
    return (opening - t).total_seconds() / 60


# ---------------------------------------------------------------------------
# Connection (same .env names as etl-research)
# ---------------------------------------------------------------------------

def load_env() -> None:
    if not load_dotenv:
        return
    for p in (HERE / ".env", HERE.parent / "etl-research" / ".env"):
        if p.exists():
            load_dotenv(p)
            return


def need(name: str) -> str:
    v = os.getenv(name)
    if not v:
        raise SystemExit(f"Missing {name}. Copy .env.example to .env and fill it in.")
    return v


def pick_driver() -> str:
    override = os.getenv("MSSQL_DRIVER")
    if override:
        return override if override.startswith("{") else "{" + override + "}"
    for d in ("ODBC Driver 18 for SQL Server", "ODBC Driver 17 for SQL Server",
              "ODBC Driver 13 for SQL Server", "SQL Server Native Client 11.0", "SQL Server"):
        if d in pyodbc.drivers():
            return "{" + d + "}"
    raise SystemExit(f"No SQL Server ODBC driver installed. pyodbc sees: {pyodbc.drivers()!r}")


def connect():
    if pyodbc is None:
        raise SystemExit("pyodbc not installed. Run: python -m pip install -r requirements.txt")
    conn = pyodbc.connect(
        f"DRIVER={pick_driver()};SERVER={need('MSSQL_HOST')},{os.getenv('MSSQL_PORT', '1433')};"
        f"DATABASE={need('MSSQL_DB')};UID={need('MSSQL_USER')};PWD={need('MSSQL_PASSWORD')};"
        "Encrypt=yes;TrustServerCertificate=yes;ApplicationIntent=ReadOnly;",
        autocommit=True,
        timeout=15,
    )
    cur = conn.cursor()
    # Dirty reads are fine for research counts; holding no shared locks is not optional.
    cur.execute("SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED")
    cur.execute("SET LOCK_TIMEOUT 5000")
    cur.execute("SET DEADLOCK_PRIORITY LOW")
    return conn


def q(name: str) -> str:
    """Quote a SQL Server identifier."""
    return "[" + name.replace("]", "]]") + "]"


def chunks(seq, size):
    seq = list(seq)
    for i in range(0, len(seq), size):
        yield seq[i:i + size]


# ---------------------------------------------------------------------------
# Schema helpers (INFORMATION_SCHEMA and sys views only)
# ---------------------------------------------------------------------------

def all_tables(cur) -> list[str]:
    cur.execute("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'")
    return sorted(r[0] for r in cur.fetchall())


def columns(cur, table: str) -> list[dict]:
    cur.execute(
        "SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = ? ORDER BY ORDINAL_POSITION",
        (table,),
    )
    return [{"name": r[0], "type": str(r[1]).lower()} for r in cur.fetchall()]


def approx_rows(cur, table: str) -> int | None:
    """Row count from partition metadata: no table scan, no locks on data."""
    cur.execute(
        "SELECT SUM(p.rows) FROM sys.partitions p JOIN sys.tables t ON t.object_id = p.object_id "
        "WHERE t.name = ? AND p.index_id IN (0, 1)",
        (table,),
    )
    r = cur.fetchone()
    return int(r[0]) if r and r[0] is not None else None


def like_to_re(pat: str) -> re.Pattern:
    return re.compile("".join(".*" if c == "%" else "." if c == "_" else re.escape(c) for c in pat), re.IGNORECASE)


def ncd_test_keys(cur) -> dict[int, dict]:
    """TEST_KEY -> {name, conditions} for every MAST_TEST row an NCD pattern matches."""
    cur.execute(
        "SELECT TEST_KEY, COALESCE(TESTNAME, '') + ' | ' + COALESCE(LABSLIPNAME, '') FROM MAST_TEST "
        "WHERE TESTNAME IS NOT NULL OR LABSLIPNAME IS NOT NULL"
    )
    compiled = {c: [like_to_re(p) for p in pats] for c, pats in TEST_PATTERNS.items()}
    out: dict[int, dict] = {}
    for tk, name in cur.fetchall():
        hits = [c for c, rxs in compiled.items() if any(rx.fullmatch(name) for rx in rxs)]
        if hits:
            out[int(tk)] = {"name": name.strip(" |"), "conditions": hits}
    return out


def first(cols: list[str], *patterns: str, exclude: str | None = None) -> str | None:
    """First column whose name matches any pattern, in pattern order."""
    for p in patterns:
        rx = re.compile(p, re.IGNORECASE)
        for c in cols:
            if rx.search(c) and not (exclude and re.search(exclude, c, re.IGNORECASE)):
                return c
    return None


# ---------------------------------------------------------------------------
# --introspect
# ---------------------------------------------------------------------------

def cmd_introspect(args) -> None:
    require_off_hours()
    conn = connect()
    cur = conn.cursor()
    tables = all_tables(cur)
    print(f"{len(tables)} tables in {os.getenv('MSSQL_DB')}")

    tests = ncd_test_keys(cur)
    by_cond = {c: sum(1 for t in tests.values() if c in t["conditions"]) for c in TEST_PATTERNS}
    print(f"NCD tests matched in MAST_TEST: {len(tests)}  {by_cond}")

    # Result tables: *_HEAD / *_DTLS families plus anything that looks like a parameter master.
    wanted = [t for t in tables if re.search(r"_(HEAD|DTLS)$", t, re.I) or re.search(r"PARAM|MAST_TEST", t, re.I)]
    wanted += [t for t in ("BILL_HEAD", "BILL_TEST_DTLS", "MAST_PATIENT", "MAST_PATIENT_FAMILY_DTLS") if t in tables]
    wanted = sorted({t for t in wanted if not NARRATIVE_TABLE.search(t)})

    schema = {}
    for t in wanted:
        cols = columns(cur, t)
        schema[t] = {"approx_rows": approx_rows(cur, t), "columns": cols}
    print(f"described {len(schema)} candidate tables")

    # Parameter masters hold no patient data; sample their names so the
    # mapping can be checked by eye. Patient-bearing tables are never sampled.
    param_samples = {}
    for t, info in schema.items():
        names = [c["name"] for c in info["columns"]]
        if not re.match(r"MAST_", t, re.I) or re.search(r"PATIENT", t, re.I):
            continue
        name_col = first(names, r"PARAM.*NAME", r"^PARAMETER$", r"PARAM", r"ITEM.*NAME", r"TEST.*NAME")
        key_col = first(names, r"PARAM.*KEY", r"ITEM.*KEY", r"_KEY$")
        if not name_col or not key_col or not re.search(r"PARAM|ITEM", t + name_col, re.I):
            continue
        cur.execute(f"SELECT TOP 3000 {q(key_col)}, {q(name_col)} FROM {q(t)}")
        rows = [(r[0], str(r[1] or "").strip()) for r in cur.fetchall()]
        mapped = [{"key": k, "name": n, "code": code_for_parameter(n)} for k, n in rows if code_for_parameter(n)]
        param_samples[t] = {"key_col": key_col, "name_col": name_col, "rows": len(rows), "ncd_parameters": mapped}
        print(f"  parameter master {t}: {len(rows)} rows, {len(mapped)} map to NCD codes")

    proposed = propose_mapping(schema, param_samples)
    INTROSPECT_PATH.write_text(json.dumps({
        "generated_at_ist": now_ist().isoformat(timespec="seconds"),
        "database": os.getenv("MSSQL_DB"),
        "ncd_tests": {str(k): v for k, v in sorted(tests.items())},
        "tables": schema,
        "parameter_masters": param_samples,
    }, indent=2, default=str), encoding="utf-8")
    PROPOSED_PATH.write_text(json.dumps(proposed, indent=2), encoding="utf-8")
    print(f"\nWrote {INTROSPECT_PATH.name} and {PROPOSED_PATH.name}. Neither contains patient data.")
    print("Send both back for review. The export runs once the reviewed copy is saved as ncd_mapping.json.")


def propose_mapping(schema: dict, param_samples: dict) -> dict:
    """Best guess at which column means what. A person confirms it before --export."""
    def cols(t):
        return [c["name"] for c in schema.get(t, {}).get("columns", [])]

    bh = cols("BILL_HEAD")
    bill = {
        "table": "BILL_HEAD",
        "bill_key": first(bh, r"^BILL_KEY$"),
        "regt_key": first(bh, r"^REGT_KEY$", r"REG.*KEY"),
        "patient_key": first(bh, r"^PATIENT_KEY$", r"PAT.*KEY"),
        "bill_date": first(bh, r"^BILL_?DATE$", r"BILL.*DATE", r"^REG.*DATE", r"DATE", exclude=r"MODIF|UPDATE|CANCEL"),
        "name": first(bh, r"PATIENT_?NAME", r"^P_?NAME$", r"^NAME$", r"NAME", exclude=r"DOCTOR|DR_|REF|USER|COMPANY|AGENT"),
        "phone": first(bh, r"MOBILE", r"PHONE", r"CONTACT", exclude=r"DOCTOR|DR_|REF|AGENT"),
        "age": first(bh, r"^AGE$", r"AGE", exclude=r"PAGE|STAGE|PACKAGE|IMAGE"),
        "sex": first(bh, r"^SEX$", r"GENDER", r"SEX"),
        "cancelled": first(bh, r"CANCEL", r"DELETE"),
        "cancelled_when": None,
    }

    results = []
    for t in sorted(schema):
        if not re.search(r"_DTLS$", t, re.I) or t in ("BILL_TEST_DTLS", "BILL_DTLS") or re.search(r"PATIENT|CULTURE|ANTIBIOTIC|BACTERIA", t, re.I):
            continue
        c = cols(t)
        value = first(c, r"^RESULT$", r"RESULT_?VALUE", r"^VALUE$", r"RESULT", r"VALUE", r"OBS", exclude=r"KEY|DATE|UNIT|FLAG")
        if not value:
            continue
        head = re.sub(r"_DTLS$", "_HEAD", t, flags=re.I)
        hc = cols(head)
        results.append({
            "table": t,
            "head_table": head if head in schema else None,
            "bill_key": first(c, r"^BILL_KEY$"),
            "report_key": first(c, r"^REPORT_KEY$"),
            "head_bill_key": first(hc, r"^BILL_KEY$"),
            "head_report_key": first(hc, r"^REPORT_KEY$"),
            "report_date": first(hc, r"REPORT.*DATE", r"AUTH.*DATE", r"APPROV.*DATE", r"RESULT.*DATE", exclude=r"MODIF") or
                           first(c, r"REPORT.*DATE", r"AUTH.*DATE", r"APPROV.*DATE"),
            "report_date_in": "head" if first(hc, r"REPORT.*DATE", r"AUTH.*DATE", r"APPROV.*DATE", r"RESULT.*DATE", exclude=r"MODIF") else "dtls",
            "test_key": first(c, r"^TEST_KEY$") or first(hc, r"^TEST_KEY$"),
            "test_key_in": "dtls" if first(c, r"^TEST_KEY$") else "head",
            "parameter_key": first(c, r"PARAM.*KEY", r"ITEM.*KEY", r"SUB.*TEST.*KEY"),
            "parameter_name": first(c, r"PARAM.*NAME", r"^PARAMETER$", r"ITEM.*NAME", r"SUB.*TEST.*NAME"),
            "value": value,
            "unit": first(c, r"UNIT"),
            "ref_low": first(c, r"(NORMAL|REF|RANGE).*(LOW|MIN|FROM)", r"^(LOW|MIN)"),
            "ref_high": first(c, r"(NORMAL|REF|RANGE).*(HIGH|MAX|TO)", r"^(HIGH|MAX)"),
            "ref_text": first(c, r"NORMAL", r"REF.*RANGE", r"RANGE"),
            "flag": first(c, r"FLAG", r"ABNORMAL", r"^HL$", r"H_?L"),
        })

    master = next(iter(param_samples.items()), None)
    return {
        "confirmed": False,
        "_note": "Generated by --introspect. Check every column against ncd_introspect.json, fix any wrong guess, "
                 "drop result tables that hold no NCD parameters, set confirmed to true and save as ncd_mapping.json.",
        "bill": bill,
        "results": results,
        "parameter_master": {
            "table": master[0], "key": master[1]["key_col"], "name": master[1]["name_col"],
        } if master else None,
    }


# ---------------------------------------------------------------------------
# --export
# ---------------------------------------------------------------------------

def load_mapping() -> dict:
    if not MAPPING_PATH.exists():
        raise SystemExit("ncd_mapping.json not found. Run --introspect, review ncd_mapping.proposed.json, save it as ncd_mapping.json.")
    m = json.loads(MAPPING_PATH.read_text(encoding="utf-8"))
    if m.get("confirmed") is not True:
        raise SystemExit('ncd_mapping.json is not confirmed. Set "confirmed": true once every column has been checked.')
    for t in [m["bill"]["table"]] + [r["table"] for r in m["results"]] + [r.get("head_table") for r in m["results"]]:
        if t and NARRATIVE_TABLE.search(t):
            raise SystemExit(f"{t} is a free-text table and must not be read.")
    for r in m["results"]:
        for k, col in r.items():
            if k in ("table", "head_table") or not col:
                continue
            if NARRATIVE_COL.search(col) and k != "ref_text":
                raise SystemExit(f"{r['table']}.{col} looks like a free-text column; remove it from the mapping.")
    return m


def months(since: dt.date, until: dt.date):
    d = since.replace(day=1)
    while d <= until:
        nxt = (d.replace(day=28) + dt.timedelta(days=4)).replace(day=1)
        yield max(d, since), min(nxt - dt.timedelta(days=1), until)
        d = nxt


def split_range(text) -> tuple[str | None, str | None]:
    """'3.5 - 5.0' -> ('3.5', '5.0'); '< 5.7' -> (None, '5.7')."""
    if text is None:
        return None, None
    s = str(text).replace(",", "")
    m = re.search(r"([-+]?\d+(?:\.\d+)?)\s*(?:-|–|to)\s*([-+]?\d+(?:\.\d+)?)", s)
    if m:
        return m.group(1), m.group(2)
    m = re.search(r"(<|upto|up to|less than)\s*=?\s*([-+]?\d+(?:\.\d+)?)", s, re.I)
    if m:
        return None, m.group(2)
    m = re.search(r"(>|more than|greater than)\s*=?\s*([-+]?\d+(?:\.\d+)?)", s, re.I)
    if m:
        return m.group(2), None
    return None, None


def cmd_export(args) -> None:
    require_off_hours()
    m = load_mapping()
    b = m["bill"]
    since = dt.date.fromisoformat(args.since)
    until = dt.date.fromisoformat(args.until) if args.until else now_ist().date()
    OUT_DIR.mkdir(exist_ok=True)

    conn = connect()
    cur = conn.cursor()
    tests = ncd_test_keys(cur)
    if not tests:
        raise SystemExit("No NCD tests matched in MAST_TEST; check TEST_PATTERNS in ncd_tests.py.")
    test_names = {k: v["name"] for k, v in tests.items()}

    params: dict = {}
    pm = m.get("parameter_master")
    if pm:
        cur.execute(f"SELECT {q(pm['key'])}, {q(pm['name'])} FROM {q(pm['table'])}")
        params = {r[0]: str(r[1] or "").strip() for r in cur.fetchall()}

    bill_cols = {k: v for k, v in b.items() if k not in ("table", "cancelled", "cancelled_when") and v}
    sel_bill = ", ".join(f"bh.{q(c)} AS {q(k)}" for k, c in bill_cols.items())
    # Cancelled bills are dropped only when the mapping names the column and the value that means cancelled.
    cancel, cancel_args = "", ()
    if b.get("cancelled") and b.get("cancelled_when") is not None:
        cancel = f" AND (bh.{q(b['cancelled'])} IS NULL OR bh.{q(b['cancelled'])} <> ?)"
        cancel_args = (b["cancelled_when"],)

    total = 0
    for start, end in months(since, until):
        if minutes_until_open() < args.stop_before:
            print(f"Stopping: less than {args.stop_before} minutes until clinic opens. Re-run tonight with --since {start}.")
            break
        t0 = time.time()

        # 1. Bills in this month that carry at least one NCD test.
        bills: dict = {}
        for keys in chunks(sorted(tests), PARAM_LIMIT - 2):
            cur.execute(
                f"SELECT DISTINCT {sel_bill} FROM {q(b['table'])} bh "
                f"JOIN BILL_TEST_DTLS btd ON btd.BILL_KEY = bh.{q(b['bill_key'])} "
                f"WHERE bh.{q(b['bill_date'])} >= ? AND bh.{q(b['bill_date'])} < ?{cancel} "
                f"AND btd.TEST_KEY IN ({','.join('?' * len(keys))})",
                (start, end + dt.timedelta(days=1), *cancel_args, *keys),
            )
            names = [d[0] for d in cur.description]
            for r in cur.fetchall():
                row = dict(zip(names, r))
                bills[row["bill_key"]] = row

        # 2. Reported parameters on those bills, from each mapped result table.
        out_rows = []
        for spec in m["results"]:
            out_rows += read_results(cur, spec, bills, params, test_names)

        path = OUT_DIR / f"lab_results_{start:%Y-%m}.csv"
        with path.open("w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=OUT_FIELDS)
            w.writeheader()
            w.writerows(out_rows)
        total += len(out_rows)
        print(f"{start:%Y-%m}: {len(bills):>6} bills, {len(out_rows):>7} NCD results  ({time.time() - t0:.1f}s) -> {path.name}")
        time.sleep(args.pause)

    print(f"\nDone: {total} rows in {OUT_DIR}. These files hold names and phone numbers: keep them on this PC.")


def read_results(cur, spec: dict, bills: dict, params: dict, test_names: dict) -> list[dict]:
    if not bills:
        return []
    t, head = spec["table"], spec.get("head_table")
    pick = {
        "value": spec["value"], "unit": spec.get("unit"), "ref_low": spec.get("ref_low"), "ref_high": spec.get("ref_high"),
        "ref_text": spec.get("ref_text"), "flag": spec.get("flag"), "test_key": spec.get("test_key"),
        "parameter_key": spec.get("parameter_key"), "parameter_name": spec.get("parameter_name"),
    }
    sel = [f"d.{q(c)} AS {q(k)}" for k, c in pick.items() if c and k != "test_key"]
    in_head = lambda k: spec.get(k) and spec.get(f"{k}_in") == "head"  # noqa: E731
    need_head = bool(head) and (not spec.get("bill_key") or in_head("test_key") or in_head("report_date"))
    if not spec.get("bill_key") and not (head and spec.get("report_key")):
        print(f"  skip {t}: no way to reach BILL_KEY in the mapping")
        return []
    joins = ""
    if need_head:
        # Join on REPORT_KEY when both sides have it: a bill can carry several reports.
        if spec.get("report_key") and spec.get("head_report_key"):
            on = f"h.{q(spec['head_report_key'])} = d.{q(spec['report_key'])}"
        else:
            on = f"h.{q(spec['head_bill_key'])} = d.{q(spec['bill_key'])}"
        joins = f" JOIN {q(head)} h ON {on}"
    bill_expr = f"d.{q(spec['bill_key'])}" if spec.get("bill_key") else f"h.{q(spec['head_bill_key'])}"
    sel.append(f"{bill_expr} AS [bill_key]")
    if spec.get("test_key"):
        sel.append(f"{'h' if in_head('test_key') else 'd'}.{q(spec['test_key'])} AS [test_key]")
    if spec.get("report_date"):
        sel.append(f"{'h' if in_head('report_date') else 'd'}.{q(spec['report_date'])} AS [report_date]")

    rows = []
    for keys in chunks(list(bills), PARAM_LIMIT):
        cur.execute(f"SELECT {', '.join(sel)} FROM {q(t)} d{joins} WHERE {bill_expr} IN ({','.join('?' * len(keys))})", keys)
        names = [d[0] for d in cur.description]
        for r in cur.fetchall():
            x = dict(zip(names, r))
            pname = x.get("parameter_name") or params.get(x.get("parameter_key")) or ""
            code = code_for_parameter(pname)
            if not code:
                continue
            bill = bills.get(x["bill_key"], {})
            low, high = x.get("ref_low"), x.get("ref_high")
            if low is None and high is None:
                low, high = split_range(x.get("ref_text"))
            tk = x.get("test_key")
            rows.append({
                "bill_key": x["bill_key"],
                "regt_key": bill.get("regt_key"),
                "patient_key": bill.get("patient_key"),
                "bill_date": bill.get("bill_date"),
                "report_date": x.get("report_date"),
                "name": bill.get("name"),
                "phone": bill.get("phone"),
                "age": bill.get("age"),
                "sex": bill.get("sex"),
                "test_key": tk,
                "testname": test_names.get(int(tk)) if tk is not None else None,
                "parameter": pname,
                "code": code,
                "value_text": x.get("value"),
                "value_num": parse_number(x.get("value")),
                "unit": x.get("unit"),
                "ref_low": low,
                "ref_high": high,
                "flag": x.get("flag"),
                "source_table": t,
            })
    return rows


# ---------------------------------------------------------------------------

def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    mode = ap.add_mutually_exclusive_group(required=True)
    mode.add_argument("--introspect", action="store_true", help="schema report and proposed mapping; no patient data")
    mode.add_argument("--export", action="store_true", help="export NCD results to out/*.csv (needs confirmed ncd_mapping.json)")
    ap.add_argument("--since", default="2022-10-01", help="first bill date to export (default 2022-10-01)")
    ap.add_argument("--until", default=None, help="last bill date to export (default today)")
    ap.add_argument("--pause", type=float, default=2.0, help="seconds to wait between monthly batches (default 2)")
    ap.add_argument("--stop-before", type=float, default=30.0, help="stop when fewer than this many minutes remain before 07:00 IST")
    args = ap.parse_args()
    load_env()
    if args.introspect:
        cmd_introspect(args)
    else:
        cmd_export(args)
    return 0


if __name__ == "__main__":
    sys.exit(main())
