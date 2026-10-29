"""
Stage 1 of the NCD burden analysis: raw pull -> tidy, person-linked tables.

    python analysis/build_dataset.py

Reads etl-ncd/out/raw/*.csv (ncd_pull_raw.py) plus the narrative-derived flag
files from report-typing-export, links bills into people the way the /ncd
page's identity module does (phone first; fuzzy name + sex + birth year within
a phone; shared numbers never link; name-only fallback), and writes parquet
tables to etl-ncd/out/dataset/:

  persons.parquet   person_id, sex, birth_year, n_bills, first/last bill date, phone_status
  bills.parquet     bill_key, person_id, date, age, sex, collcentre, referrer key
  obs.parquet       one row per numeric result: person_id, bill_key, date, code, value, lo, hi, source
  usg.parquet       USG findings per report with person_id and date
  cardio.parquet    ECHO / ECG / PFT findings per report with person_id and date
  diagnostics.json  identity and coverage counts (no patient data)

Everything here stays on this PC: out/ is gitignored.
"""

from __future__ import annotations

import json
import re
import sys
import time
from collections import defaultdict
from pathlib import Path

import numpy as np
import pandas as pd
from rapidfuzz.distance import JaroWinkler

HERE = Path(__file__).resolve().parent
ETL = HERE.parent
RAW = ETL / "out" / "raw"
OUT = ETL / "out" / "dataset"
NARR = Path(r"C:\Users\admin\report-typing-export")
sys.path.insert(0, str(ETL))
from ncd_tests import code_for_parameter, parse_number  # noqa: E402

RESULT_TABLES = ["chemical", "haematology", "hormone", "urine", "serology", "immunology", "mixed", "fluid"]
SEX = {1: "M", 2: "F"}
HONORIFICS = {"MR", "MRS", "MS", "MISS", "DR", "MASTER", "MST", "BABY", "SMT", "SRI", "SHRI", "SREE", "KUMARI", "KM",
              "MD", "SK", "LATE", "PROF", "BABA", "B", "O", "C", "W", "S", "D", "JR", "SR"}
SHARED_PHONE_PEOPLE = 20     # a number carrying more than this many names is an agent / camp desk
NAME_SIM = 0.88              # Jaro-Winkler on the normalised full name
BIRTH_YEAR_TOL = 3           # typed ages drift and get rounded


# ---------------------------------------------------------------------------
# Normalisation
# ---------------------------------------------------------------------------

def norm_phone(raw) -> tuple[str, str | None]:
    """('valid'|'missing'|'junk', 10-digit number or None), same rules as identity.ts."""
    d = re.sub(r"\D", "", str(raw or ""))
    if not d:
        return "missing", None
    if len(d) == 12 and d.startswith("91"):
        d = d[2:]
    if len(d) == 11 and d.startswith("0"):
        d = d[1:]
    if len(d) != 10 or d[0] not in "6789":
        return "junk", None
    if len(set(d)) <= 2 or re.search(r"(\d)\1{6,}", d):
        return "junk", None
    if d in "0123456789012" or d in "9876543210987":
        return "junk", None
    return "valid", d


def norm_name(raw) -> str:
    s = re.sub(r"[^A-Z ]", " ", str(raw or "").upper())
    toks = [t for t in s.split() if t not in HONORIFICS]
    return " ".join(toks)


class UnionFind:
    def __init__(self, n: int):
        self.p = np.arange(n)

    def find(self, i: int) -> int:
        p = self.p
        while p[i] != i:
            p[i] = p[p[i]]
            i = p[i]
        return i

    def union(self, a: int, b: int) -> None:
        ra, rb = self.find(a), self.find(b)
        if ra != rb:
            self.p[rb] = ra


# ---------------------------------------------------------------------------
# Bills and identity
# ---------------------------------------------------------------------------

def load_bills() -> pd.DataFrame:
    b = pd.read_csv(RAW / "bills.csv", low_memory=False)
    b["date"] = pd.to_datetime(b.BILLDATE).dt.normalize()
    b["sex"] = b.SEX.map(SEX).fillna("")
    b["age"] = b.AGEYEAR.astype(float) + b.AGEMONTH.fillna(0).astype(float) / 12
    b["birth_year"] = b.date.dt.year - b.AGEYEAR
    st = b.PHONE.map(norm_phone)
    b["phone_status"] = [s for s, _ in st]
    b["phone"] = [p for _, p in st]
    b["name_n"] = b.PATIENTNAME.map(norm_name)
    b["first_tok"] = b.name_n.str.split().str[0].fillna("")
    b = b.sort_values(["date", "BILL_KEY"]).reset_index(drop=True)
    return b


def compatible(sex_a, sex_b, by_a, by_b) -> bool:
    if sex_a and sex_b and sex_a != sex_b:
        return False
    if pd.notna(by_a) and pd.notna(by_b) and abs(by_a - by_b) > BIRTH_YEAR_TOL:
        return False
    return True


def resolve_identities(b: pd.DataFrame) -> tuple[np.ndarray, dict]:
    n = len(b)
    uf = UnionFind(n)
    diag = {}

    # 1. Same registration + family member = same person (checked for sex agreement).
    key = b.REGT_KEY.astype("Int64").astype(str) + "/" + b.FAMILY_MEMBER_KEY.astype("Int64").astype(str)
    ok = b.REGT_KEY.gt(0) & b.FAMILY_MEMBER_KEY.notna()
    linked = 0
    pos_ok = np.where(ok.values)[0]
    for _, idx in b[ok].groupby(key[ok]).indices.items():
        if len(idx) < 2:
            continue
        idx = pos_ok[idx]            # groupby positions are relative to the filtered frame
        first = idx[0]
        for j in idx[1:]:
            if compatible(b.sex.iat[first], b.sex.iat[j], b.birth_year.iat[first], b.birth_year.iat[j]):
                uf.union(first, j)
                linked += 1
    diag["registration_links"] = linked

    # 2. Within a valid, non-shared phone: fuzzy name + sex + birth year.
    valid = b.phone_status.eq("valid")
    names_per_phone = b[valid].groupby("phone").name_n.nunique()
    shared = set(names_per_phone[names_per_phone > SHARED_PHONE_PEOPLE].index)
    diag["phones_valid"] = int(names_per_phone.size)
    diag["phones_shared"] = len(shared)
    b["phone_shared"] = b.phone.isin(shared)
    usable = valid & ~b.phone_shared
    phone_links = 0
    pos_usable = np.where(usable.values)[0]
    for _, idx in b[usable].groupby("phone").indices.items():
        idx = list(pos_usable[idx])  # positions relative to the filtered frame -> full frame
        clusters: list[list[int]] = []
        for j in idx:
            nm, sx, by, ft = b.name_n.iat[j], b.sex.iat[j], b.birth_year.iat[j], b.first_tok.iat[j]
            best = None
            for c in clusters:
                k = c[0]
                if not compatible(sx, b.sex.iat[k], by, b.birth_year.iat[k]):
                    continue
                sim = JaroWinkler.normalized_similarity(nm, b.name_n.iat[k])
                if sim >= NAME_SIM or (ft and ft == b.first_tok.iat[k]):
                    best = c
                    break
            if best is None:
                clusters.append([j])
            else:
                best.append(j)
                uf.union(best[0], j)
                phone_links += 1
    diag["phone_links"] = phone_links

    # 3. No usable phone: attach to a unique phone-linked person with the same
    #    name + sex + birth year, else link name-only among themselves.
    roots = np.array([uf.find(i) for i in range(n)])
    by_key: dict[tuple, dict[int, list[float]]] = defaultdict(lambda: defaultdict(list))
    for j in np.where(usable.values)[0]:
        by_key[(b.name_n.iat[j], b.sex.iat[j])][roots[j]].append(b.birth_year.iat[j])
    attach = nameonly = 0
    rest = np.where(~usable.values)[0]
    tmp = b.iloc[rest]
    for (nm, sx), idx in tmp.groupby(["name_n", "sex"]).indices.items():
        if not nm:
            continue
        idx = [rest[i] for i in idx]
        cands = by_key.get((nm, sx), {})
        clusters: list[list[int]] = []
        for j in idx:
            by = b.birth_year.iat[j]
            hits = [r for r, bys in cands.items() if any(pd.isna(by) or pd.isna(x) or abs(x - by) <= BIRTH_YEAR_TOL for x in bys)]
            if len(hits) == 1:
                uf.union(int(hits[0]), j)
                attach += 1
                continue
            placed = False
            for c in clusters:
                if compatible(sx, sx, by, b.birth_year.iat[c[0]]):
                    c.append(j)
                    uf.union(c[0], j)
                    nameonly += 1
                    placed = True
                    break
            if not placed:
                clusters.append([j])
    diag["nameonly_attach_to_phone_person"] = attach
    diag["nameonly_links"] = nameonly

    roots = np.array([uf.find(i) for i in range(n)])
    _, person = np.unique(roots, return_inverse=True)
    return person, diag


# ---------------------------------------------------------------------------
# Observations
# ---------------------------------------------------------------------------

DIP = [(r"^\s*(nil|neg|negative|absent|none|not\s+found|-)\s*\*?\s*$", 0.0), (r"trace|faint", 0.5),
       (r"\+{4}|4\s*\+", 4.0), (r"\+{3}|3\s*\+", 3.0), (r"\+{2}|2\s*\+", 2.0), (r"\+|present|positive|1\s*\+", 1.0)]


def dipstick(v) -> float | None:
    s = str(v or "").strip().lower()
    if not s or s == "nan":
        return None
    for rx, val in DIP:
        if re.search(rx, s):
            return val
    return None


def load_obs(bill_dates: pd.Series) -> tuple[pd.DataFrame, dict]:
    md = pd.read_csv(RAW / "mast_description.csv", low_memory=False)[["DESCRIPTION_KEY", "DESCRIPTION"]]
    md["DESCRIPTION"] = md.DESCRIPTION.astype(str).str.strip()
    frames, diag = [], {}
    for t in RESULT_TABLES:
        p = RAW / f"results_{t}_dtls.csv"
        if not p.exists():
            continue
        d = pd.read_csv(p, low_memory=False)
        d = d.merge(md, on="DESCRIPTION_KEY", how="left")
        d = d[d.HEAD_CONFIRM_REPORT.eq(1)]
        names = d.DESCRIPTION.fillna("")
        if t == "urine":
            up = names.str.upper().str.strip()
            is_prot = up.isin(["PROTEIN", "ALBUMIN", "ALBUMIN (URINE)"])
            is_glu = up.isin(["GLUCOSE", "GLUCOSE (URINE)", "SUGAR"])
            d = d[is_prot | is_glu].copy()
            d["code"] = np.where(is_prot[d.index], "UPROT_DIP", "UGLU_DIP")
            d["value"] = d.RESULT.map(dipstick)
            d["text"] = d.RESULT.astype(str)
            d["lo"] = np.nan
            d["hi"] = np.nan
        else:
            d["code"] = names.map(code_for_parameter)
            d = d[d.code.notna()].copy()
            d["value"] = d.RESULT.map(parse_number)
            d["text"] = d.RESULT.astype(str)
            d["lo"] = d.LOWER_RANGE.map(parse_number)
            d["hi"] = d.UPPER_RANGE.map(parse_number)
        d["date"] = pd.to_datetime(d.HEAD_REPORTDATE, errors="coerce").dt.normalize()
        d["source"] = t
        d["unit"] = d.UNITNAME.astype(str).str.strip()
        frames.append(d[["BILL_KEY", "REPORT_KEY", "date", "code", "value", "text", "unit", "lo", "hi", "source", "DESCRIPTION"]])
        diag[t] = {"rows_confirmed_coded": int(len(d))}
    obs = pd.concat(frames, ignore_index=True).rename(columns={"BILL_KEY": "bill_key", "REPORT_KEY": "report_key"})
    # Report date missing -> bill date.
    obs["date"] = obs.date.fillna(obs.bill_key.map(bill_dates))

    # Unit harmonisation (the page's units): platelets Lakh/cu.mm -> 10^3/uL.
    plt = obs.code.eq("PLT")
    lakh = plt & (obs.unit.str.contains("lakh", case=False) | obs.value.lt(20))
    obs.loc[lakh, ["value", "lo", "hi"]] = obs.loc[lakh, ["value", "lo", "hi"]] * 100
    # TLC reported per cu.mm; keep. ESR mm/hr; keep.
    # Censored values ('<0.5', '>1000') stay text-only; drop clearly impossible numbers.
    bad = (obs.code.eq("HBA1C") & ~obs.value.between(3, 20)) | (obs.code.isin(["FBS", "PPBS", "RBS"]) & ~obs.value.between(20, 1000)) \
        | (obs.code.eq("CREAT") & ~obs.value.between(0.1, 30)) | (obs.code.eq("TSH") & ~obs.value.between(0.001, 500)) \
        | (obs.code.eq("HB") & ~obs.value.between(2, 25)) | (obs.code.eq("PLT") & ~obs.value.between(5, 2000)) \
        | (obs.code.isin(["ALT", "AST"]) & ~obs.value.between(1, 5000)) | (obs.code.eq("LDL") & ~obs.value.between(5, 600)) \
        | (obs.code.eq("TG") & ~obs.value.between(10, 5000)) | (obs.code.eq("HDL") & ~obs.value.between(5, 200)) \
        | (obs.code.eq("UACR") & ~obs.value.between(0, 10000)) | (obs.code.eq("URIC") & ~obs.value.between(0.5, 25))
    diag["dropped_implausible"] = int((bad & obs.value.notna()).sum())
    obs.loc[bad, "value"] = np.nan
    return obs, diag


# ---------------------------------------------------------------------------

def main() -> int:
    t0 = time.time()
    OUT.mkdir(parents=True, exist_ok=True)
    b = load_bills()
    print(f"bills {len(b)}  ({time.time() - t0:.0f}s)")
    person, diag = resolve_identities(b)
    b["person_id"] = person
    print(f"persons {b.person_id.nunique()}  {diag}  ({time.time() - t0:.0f}s)")

    # Person table: modal sex, median birth year, phone status.
    g = b.groupby("person_id")
    persons = pd.DataFrame({
        "sex": g.sex.agg(lambda s: s[s != ""].mode().iat[0] if (s != "").any() else ""),
        "birth_year": g.birth_year.median(),
        "n_bills": g.size(),
        "first_date": g.date.min(),
        "last_date": g.date.max(),
        "has_phone": g.phone_status.agg(lambda s: (s == "valid").any()),
        "collcentre": g.COLLCENTRE_KEY.agg(lambda s: s.mode().iat[0]),
        "by_spread": g.birth_year.agg(lambda s: s.max() - s.min()),
    }).reset_index()
    diag["persons"] = int(len(persons))
    diag["persons_multi_bill"] = int((persons.n_bills >= 2).sum())
    diag["persons_birthyear_spread_gt5"] = int((persons.by_spread > 5).sum())
    persons.to_parquet(OUT / "persons.parquet", index=False)
    bills = b[["BILL_KEY", "person_id", "date", "age", "sex", "COLLCENTRE_KEY", "REFRDOCTOR_KEY", "NETAMOUNT", "phone_status", "phone_shared"]] \
        .rename(columns={"BILL_KEY": "bill_key", "COLLCENTRE_KEY": "collcentre", "REFRDOCTOR_KEY": "refrdoctor"})
    bills.to_parquet(OUT / "bills.parquet", index=False)

    bill_dates = b.set_index("BILL_KEY").date
    obs, odiag = load_obs(bill_dates)
    diag["obs"] = odiag
    pid = b.set_index("BILL_KEY").person_id
    obs["person_id"] = obs.bill_key.map(pid)
    obs = obs[obs.person_id.notna()].copy()
    obs["person_id"] = obs.person_id.astype(int)
    age_at = b.set_index("BILL_KEY").age
    obs["age"] = obs.bill_key.map(age_at)
    obs["sex"] = obs.person_id.map(persons.set_index("person_id").sex)
    obs.to_parquet(OUT / "obs.parquet", index=False)
    diag["obs_rows"] = int(len(obs))
    diag["obs_numeric"] = int(obs.value.notna().sum())
    diag["obs_by_code"] = obs[obs.value.notna()].code.value_counts().to_dict()
    print(f"obs {len(obs)} rows, {obs.value.notna().sum()} numeric  ({time.time() - t0:.0f}s)")

    # Narrative-derived findings.
    usg = pd.read_csv(NARR / "usg_findings_all.csv", low_memory=False)
    usg["person_id"] = usg.bill_key.map(pid)
    usg = usg[usg.person_id.notna()].copy()
    usg["person_id"] = usg.person_id.astype(int)
    usg["date"] = pd.to_datetime(usg.report_date, errors="coerce")
    usg["age"] = usg.bill_key.map(age_at)
    usg.to_parquet(OUT / "usg.parquet", index=False)
    car = pd.read_csv(NARR / "cardiology_findings.csv", low_memory=False)
    car["person_id"] = car.bill_key.map(pid)
    car = car[car.person_id.notna()].copy()
    car["person_id"] = car.person_id.astype(int)
    car["date"] = pd.to_datetime(car.report_date, errors="coerce")
    car["age"] = car.bill_key.map(age_at)
    car.to_parquet(OUT / "cardio.parquet", index=False)
    diag["usg_reports_linked"] = int(len(usg))
    diag["cardio_reports_linked"] = int(len(car))

    (OUT / "diagnostics.json").write_text(json.dumps(diag, indent=2, default=str), encoding="utf-8")
    print(f"done in {time.time() - t0:.0f}s -> {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
