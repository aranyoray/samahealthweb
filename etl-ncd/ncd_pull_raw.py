"""
Raw structured-result pull from AKTIV, for the NCD burden analysis.

    python ncd_pull_raw.py [--since 2022-10-01] [--until 2026-10-31] [--out out/raw]

Where ncd_extract.py --export keeps only the twelve parameters the /ncd page
reads, this pulls EVERY reported parameter from the structured result tables
(one row per analyte: PARAMETER, RESULT, unit, reference range), so that
conditions outside the page's scope (anaemia, uric acid, total cholesterol,
PP/random glucose, T3/T4, bilirubin, albumin, CRP, vitamin D, B12 ...) can be
classified offline, without another night on the clinic PC.

Same rails as ncd_extract.py, and it reuses its connection:
  * SELECT only, READ UNCOMMITTED, 5 s lock timeout, low deadlock priority.
  * Refuses to start inside clinic hours (07:00-20:00 IST).
  * Never reads *_DESC / *_PAD tables or any remark, comment, note,
    impression or history column. Only the structured columns listed in
    RESULT_COLS / HEAD_COLS / BILL_COLS below are selected.
  * Output stays on this PC: out/ is gitignored. Bills carry names and
    phone numbers because that is how visits get linked into one person.

Output (one CSV per table under --out):
  bills.csv              one row per bill (all bills, cancelled flagged), for denominators
  bill_tests.csv         one row per ordered test (BILL_TEST_DTLS), with confirm flag
  results_<TABLE>.csv    one row per reported parameter, with report date + confirm flag
  report_heads.csv       imaging / narrative report headers (titles + dates only, no text)
  mast_*.csv             test, category, package-inclusion and parameter masters
"""

from __future__ import annotations

import argparse
import csv
import datetime as dt
import sys
import time
from pathlib import Path

from ncd_extract import HERE, connect, load_env, now_ist, q, require_off_hours

# Structured result tables. Those with BILL_KEY on the detail row join BILL_HEAD
# directly; the rest reach the bill through their *_HEAD on REPORT_KEY.
RESULT_TABLES = [
    "CHEMICAL_DTLS", "HAEMATOLOGY_DTLS", "HORMONE_DTLS", "URINE_DTLS",
    "SEROLOGY_DTLS", "IMMUNOLOGY_DTLS", "MIXED_DTLS", "FLUID_DTLS",
]
RESULT_COLS = [
    "REPORT_KEY", "REPORT_DTLS_KEY", "DESCRIPTION_KEY", "TEST_KEY", "PARAMETER", "RESULT",
    "UNITNAME", "NORMALRANGE", "LOWER_RANGE", "UPPER_RANGE",
    "CRITICAL_LOWERRANGE", "CRITICAL_UPPERRANGE", "BEFORE_HEADING", "STYLE", "RECHECKED",
]
HEAD_COLS = ["REPORTDATE", "CONFIRM_REPORT", "INVESTIGATOR1_KEY", "REPORT_TITLE1", "REPORT_TITLE2"]

# Bill header: identity + demographics + channel. No address, remarks or history.
BILL_COLS = [
    "BILL_KEY", "BILL_NO", "BILLDATE", "REGT_KEY", "FAMILY_MEMBER_KEY", "PATIENT_ID",
    "PATIENTNAME", "PHONE", "WHATSAPPNO", "SEX", "AGEYEAR", "AGEMONTH",
    "REFRDOCTOR_KEY", "DR_STAFF_KEY", "COLLCENTRE_KEY", "ORGANISATION_KEY", "ZONE_KEY",
    "NETAMOUNT", "BILLCANCEL", "OUTSIDE", "BOOKING_KEY", "APP_BOOKING_KEY", "FORMID",
]
BILL_TEST_COLS = [
    "BILL_KEY", "BILL_TEST_DTLS_KEY", "BILLDATE", "TEST_KEY", "CATEGORY_KEY", "PACKAGE_KEY",
    "REPORT_KEY", "REPORTDATE", "SAMPLEDATE", "REPORTSTATUS", "CONFIRM_REPORT", "TESTCANCEL",
]
# Narrative departments: header only (what was done and when), never REPORT_DESC.
NARRATIVE_HEADS = ["USG_HEAD", "XRAY_HEAD", "CARDIOLOGY_HEAD", "NEUROLOGY_HEAD", "CTSCAN_HEAD", "HISTOPATHOLOGY_HEAD"]
NARRATIVE_HEAD_COLS = ["REPORT_KEY", "BILL_KEY", "REPORTDATE", "EXAMDATE", "REPORT_TITLE1", "REPORT_TITLE2", "CONFIRM_REPORT", "INVESTIGATOR1_KEY"]

MASTERS = {
    "MAST_TEST": ["TEST_KEY", "TESTCODE", "TESTNAME", "LABSLIPNAME", "SUBDEPARTMENT_KEY", "CATEGORY_KEY",
                  "REPORT_GROUP_KEY", "SEX", "SUBTEST", "TESTPACKAGE", "PACKAGE", "INACTIVE", "SHOW_ONLINE"],
    "MAST_TEST_CATEGORY": ["SUBDEPARTMENT_KEY", "CATEGORY_KEY", "CATEGORY", "HEADERTABLE", "DETAILSTABLE"],
    "MAST_TEST_INC_TEST": None,          # package -> member tests; small, all columns
    "MAST_DESCRIPTION": None,            # parameter master with sex-specific ranges
    "MAST_DESCRIPTION_INTR": None,       # age-banded ranges
    "MAST_SUBDEPARTMENT": None,
    "MAST_COLLCENTRE": None,
}
# Patient master: demographics and geography for the person-level join. No address lines.
PATIENT_COLS = ["REGT_KEY", "REGTDATE", "PATIENTNAME", "PHONE", "PHONE2", "WHATSAPPNO", "SEX", "DATEOFBIRTH",
                "AGEYEAR", "CITY", "DISTRICT", "STATE", "PIN", "OCCUPATION", "REGISTRATION_CANCEL"]


def existing_columns(cur, table: str) -> set[str]:
    cur.execute("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = ?", (table,))
    return {r[0] for r in cur.fetchall()}


def stream(cur, sql: str, params: tuple, path: Path, header_extra: list[str] | None = None) -> int:
    """Run one SELECT and stream its rows to a CSV. Returns the row count."""
    cur.execute(sql, params)
    names = [d[0] for d in cur.description]
    n = 0
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(names)
        while True:
            rows = cur.fetchmany(5000)
            if not rows:
                break
            w.writerows(rows)
            n += len(rows)
    return n


def pull(args) -> None:
    require_off_hours()
    out = (HERE / args.out) if not Path(args.out).is_absolute() else Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    since = dt.date.fromisoformat(args.since)
    until = (dt.date.fromisoformat(args.until) if args.until else now_ist().date()) + dt.timedelta(days=1)
    conn = connect()
    cur = conn.cursor()
    t_all = time.time()

    def log(msg):
        print(f"[{time.time() - t_all:6.0f}s] {msg}", flush=True)

    # Masters first (small, no patient data).
    for table, cols in MASTERS.items():
        have = existing_columns(cur, table)
        if not have:
            log(f"skip {table}: not on this install")
            continue
        sel = ", ".join(q(c) for c in cols if c in have) if cols else "*"
        n = stream(cur, f"SELECT {sel} FROM {q(table)}", (), out / f"mast_{table[5:].lower()}.csv")
        log(f"{table}: {n} rows")

    have = existing_columns(cur, "MAST_PATIENT")
    sel = ", ".join(q(c) for c in PATIENT_COLS if c in have)
    n = stream(cur, f"SELECT {sel} FROM MAST_PATIENT", (), out / "patients.csv")
    log(f"MAST_PATIENT: {n} rows")

    # Bills in range (all of them, cancelled flagged, so the analysis can count denominators).
    have = existing_columns(cur, "BILL_HEAD")
    sel = ", ".join("bh." + q(c) for c in BILL_COLS if c in have)
    n = stream(cur, f"SELECT {sel} FROM BILL_HEAD bh WHERE bh.BILLDATE >= ? AND bh.BILLDATE < ?", (since, until), out / "bills.csv")
    log(f"BILL_HEAD: {n} bills {since}..{until - dt.timedelta(days=1)}")
    time.sleep(args.pause)

    have = existing_columns(cur, "BILL_TEST_DTLS")
    sel = ", ".join("btd." + q(c) for c in BILL_TEST_COLS if c in have)
    n = stream(cur, f"SELECT {sel} FROM BILL_TEST_DTLS btd JOIN BILL_HEAD bh ON bh.BILL_KEY = btd.BILL_KEY "
                    "WHERE bh.BILLDATE >= ? AND bh.BILLDATE < ?", (since, until), out / "bill_tests.csv")
    log(f"BILL_TEST_DTLS: {n} ordered tests")
    time.sleep(args.pause)

    # Structured results, one table at a time.
    for table in RESULT_TABLES:
        have = existing_columns(cur, table)
        if not have:
            log(f"skip {table}: not on this install")
            continue
        head = table.replace("_DTLS", "_HEAD")
        have_h = existing_columns(cur, head)
        sel = ["d." + q(c) for c in RESULT_COLS if c in have]
        sel += ["h." + q(c) + " AS " + q("HEAD_" + c) for c in HEAD_COLS if c in have_h]
        bill_expr = "COALESCE(d.BILL_KEY, h.BILL_KEY)" if "BILL_KEY" in have else "h.BILL_KEY"
        sel.append(f"{bill_expr} AS BILL_KEY")
        sql = (f"SELECT {', '.join(sel)} FROM {q(table)} d "
               f"LEFT JOIN {q(head)} h ON h.REPORT_KEY = d.REPORT_KEY "
               f"JOIN BILL_HEAD bh ON bh.BILL_KEY = {bill_expr} "
               f"WHERE bh.BILLDATE >= ? AND bh.BILLDATE < ?")
        t0 = time.time()
        n = stream(cur, sql, (since, until), out / f"results_{table.lower()}.csv")
        log(f"{table}: {n} parameter rows ({time.time() - t0:.0f}s)")
        time.sleep(args.pause)

    # Narrative departments: headers only.
    frames = []
    path = out / "report_heads.csv"
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["DEPT"] + NARRATIVE_HEAD_COLS)
        for head in NARRATIVE_HEADS:
            have_h = existing_columns(cur, head)
            if not have_h:
                continue
            sel = ", ".join(("h." + q(c)) if c in have_h else "NULL" for c in NARRATIVE_HEAD_COLS)
            cur.execute(f"SELECT {sel} FROM {q(head)} h JOIN BILL_HEAD bh ON bh.BILL_KEY = h.BILL_KEY "
                        "WHERE bh.BILLDATE >= ? AND bh.BILLDATE < ?", (since, until))
            n = 0
            while True:
                rows = cur.fetchmany(5000)
                if not rows:
                    break
                w.writerows([head[:-5]] + list(r) for r in rows)
                n += len(rows)
            log(f"{head}: {n} report headers")
    log(f"done -> {out}. These files hold names and phone numbers: keep them on this PC.")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--since", default="2022-10-01")
    ap.add_argument("--until", default=None)
    ap.add_argument("--out", default="out/raw")
    ap.add_argument("--pause", type=float, default=2.0)
    args = ap.parse_args()
    load_env()
    pull(args)
    return 0


if __name__ == "__main__":
    sys.exit(main())
