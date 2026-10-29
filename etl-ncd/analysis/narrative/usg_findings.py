#!/usr/bin/env python3
"""Structured NCD findings from the USG narrative corpus (usg_reports.csv).

Reads the plain-text column of each report once and writes usg_findings.csv,
one row per report, with flags only (no narrative text):
  fatty_liver_grade  0 = liver described and no fatty change, 1/2/3 = grade,
                     -1 = fatty change mentioned without a grade, '' = liver not described
  fatty_pancreas, hepatomegaly, cld (cirrhosis / coarse echotexture / portal hypertension),
  ckd_signs (raised cortical echogenicity / lost corticomedullary differentiation /
  renal parenchymal disease / contracted kidneys), renal_calculi, hydronephrosis,
  gallstones, prostatomegaly, splenomegaly, ascites, pcos, thyroid_nodule, goitre

Usage: python usg_findings.py [usg_reports.csv ...] -o usg_findings.csv
"""
from __future__ import annotations
import argparse, csv, re, sys
from pathlib import Path

csv.field_size_limit(10**9)

ROMAN = {"i": 1, "ii": 2, "iii": 3, "1": 1, "2": 2, "3": 3}
WORD = {"mild": 1, "moderate": 2, "severe": 3, "gross": 3, "marked": 3}

FATTY = re.compile(r"fatty\s+(change|infiltrat|liver|chang)|steatosis|fatty\s+hepat", re.I)
GRADE = re.compile(r"grade\s*[-:]?\s*(iii|ii|i|[123])\b", re.I)
GRADEWORD = re.compile(r"\b(mild|moderate|severe|gross|marked)\b", re.I)
LIVER_SECTION = re.compile(r"\bliver\s*:", re.I)
NEG = re.compile(r"\b(no|not|without|absent|nor)\b", re.I)

PATTERNS = {
    "fatty_pancreas": re.compile(r"fatty\s+(change|infiltrat)[^.\n]{0,40}pancrea|pancrea[^.\n]{0,60}fatty", re.I),
    "hepatomegaly": re.compile(r"hepatomegaly|liver[^.\n]{0,60}\benlarged\b", re.I),
    "cld": re.compile(r"cirrho|coarse(ned)?\s+echotexture|coarse\s+(hepatic\s+)?parenchym|chronic\s+liver\s+disease|\bCLD\b|portal\s+hypertension|shrunken\s+liver|nodular\s+(outline|surface)[^.\n]{0,30}liver|liver[^.\n]{0,40}nodular\s+(outline|surface)", re.I),
    "ckd_signs": re.compile(r"cortical\s+echogenicity\s+is\s+(slightly\s+|mildly\s+|moderately\s+|markedly\s+|grossly\s+)?(increased|raised)|(increased|raised)\s+(renal\s+|bilateral\s+)?cortical\s+echogenicity|attenuat\w*\s+(of\s+)?(the\s+)?corticomedullary|corticomedullary\s+differentiation\s+is\s+(lost|reduced|attenuated|poor|diminished|not\s+maintained|partially)|loss\s+of\s+corticomedullary|renal\s+parenchymal\s+(disease|change)|medical\s+renal\s+disease|contracted\s+kidney|small\s+(sized\s+)?kidneys|bilateral\s+small\s+kidney|grade\s*(iii|ii|i|[123])\s+(renal|nephropathy)", re.I),
    "renal_calculi": re.compile(r"(renal|kidney|calyceal|pelvic|ureteric|nephro)[^.\n]{0,50}calcul|calcul[^.\n]{0,50}(kidney|renal|calyx|calyces|pelvis|ureter)|nephrolithiasis|urolithiasis", re.I),
    "hydronephrosis": re.compile(r"hydronephro|hydroureter|pelvicalyceal\s+(system\s+)?(is\s+)?(mildly\s+|moderately\s+|grossly\s+)?dilat", re.I),
    "gallstones": re.compile(r"cholelithiasis|gall\s*stone|gall\s*bladder[^.\n]{0,80}calcul|calcul[^.\n]{0,60}gall\s*bladder|calculous\s+cholecystitis", re.I),
    "prostatomegaly": re.compile(r"prostatomegaly|prostate[^.\n]{0,40}\benlarged\b|enlarged\s+prostate|benign\s+prostatic|\bBPH\b|prostatic\s+hyperplasia|prostatic\s+enlargement", re.I),
    "splenomegaly": re.compile(r"splenomegaly|spleen[^.\n]{0,40}\benlarged\b", re.I),
    # "Free fluid : Nil" label lines are the common case, so only positive phrasing counts.
    "ascites": re.compile(r"\bascites\b|(mild|minimal|moderate|gross|significant|small amount of)\s+free\s+fluid|free\s+fluid\s+(is\s+)?(seen|present|noted)", re.I),
    "pcos": re.compile(r"polycystic|\bPCO[SD]?\b|peripheral(ly)?\s+(arranged\s+)?(small\s+)?(cysts|follicles)[^.\n]{0,60}(stromal|stroma)|increased\s+stromal\s+echogenicity", re.I),
    "thyroid_nodule": re.compile(r"thyroid[^.\n]{0,80}nodul|nodul[^.\n]{0,80}thyroid|nodular\s+goit|multinodular|\bTIRADS?\b|\bTI-RADS\b", re.I),
    "goitre": re.compile(r"goit(re|er)|thyroid[^.\n]{0,40}\b(enlarged|enlargement|bulky)\b|(enlarged|bulky)[^.\n]{0,20}thyroid|thyromegaly", re.I),
}


def sentences(text: str):
    for s in re.split(r"(?<=[.\n])\s+|\n", text):
        s = " ".join(s.split())
        if s:
            yield s


def negated(sentence: str, start: int) -> bool:
    """A 'no ...' / 'not' / 'without' within the 60 characters before the match,
    or a 'nil / absent / not seen' verdict after a 'Finding :' label."""
    before = sentence[max(0, start - 60):start]
    after = sentence[start:start + 80]
    return bool(NEG.search(before)) or bool(re.search(r":\s*(nil|absent|none|not\s+seen|no\b)", after, re.I))


def fatty_liver(text: str):
    """(grade, liver_described). grade: 0 none, 1-3, -1 ungraded, None if liver not described."""
    described = bool(LIVER_SECTION.search(text)) or bool(re.search(r"\bliver\b", text, re.I))
    best = None
    for s in sentences(text):
        for m in FATTY.finditer(s):
            if re.search(r"pancrea", s, re.I) and not re.search(r"\bliver\b|hepat", s, re.I):
                continue
            if negated(s, m.start()):
                continue
            window = s[max(0, m.start() - 70): m.end() + 40]
            g = GRADE.search(window)
            grade = ROMAN[g.group(1).lower()] if g else None
            if grade is None:
                w = GRADEWORD.search(s[max(0, m.start() - 50): m.end()])
                grade = WORD[w.group(1).lower()] if w else -1
            if best is None or (best == -1 and grade != -1) or (grade not in (None, -1) and grade > (best if best != -1 else 0)):
                best = grade
    if best is None:
        return (0 if described else None)
    return best


def flags(text: str) -> dict:
    out = {}
    for name, rx in PATTERNS.items():
        hit = 0
        for s in sentences(text):
            for m in rx.finditer(s):
                if negated(s, m.start()):
                    continue
                hit = 1
                break
            if hit:
                break
        out[name] = hit
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("inputs", nargs="*", default=["usg_reports.csv"])
    ap.add_argument("-o", "--out", default="usg_findings.csv")
    args = ap.parse_args()
    fields = ["report_key", "bill_key", "report_date", "title1", "fatty_liver_grade"] + list(PATTERNS)
    n = 0
    with open(args.out, "w", newline="", encoding="utf-8") as fo:
        w = csv.DictWriter(fo, fieldnames=fields)
        w.writeheader()
        for path in args.inputs:
            with open(path, encoding="utf-8-sig", newline="") as f:
                for row in csv.DictReader(f):
                    text = row.get("report_text") or ""
                    g = fatty_liver(text)
                    rec = {"report_key": row["report_key"], "bill_key": row["bill_key"], "report_date": row["report_date"],
                           "title1": (row.get("title1") or "")[:60], "fatty_liver_grade": "" if g is None else g}
                    rec.update(flags(text))
                    w.writerow(rec)
                    n += 1
                    if n % 10000 == 0:
                        print(n, flush=True)
    print(f"wrote {n} rows -> {args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
