#!/usr/bin/env python3
"""Structured findings from CARDIOLOGY_HEAD narratives (ECHO / ECG / TMT / Holter / PFT).

Reads cardiology_reports.csv (export_narrative_reports.py) and writes
cardiology_findings.csv, one row per report, flags only:
  kind            ECHO | FETAL | PFT | HOLTER | TMT | ECG | OTHER
  lvef            lowest LVEF % quoted in the report (20-85), else blank
  lvh             concentric LV hypertrophy
  dd_grade        LV diastolic dysfunction: 0 absent/adequate, 1/2/3, blank if not assessed
  rwma            regional wall motion abnormality / ischaemic heart disease on echo
  global_hypo     global LV hypokinesia
  valve_mod_sev   moderate or severe regurgitation / stenosis (any valve), or rheumatic valve disease
  ph              pulmonary hypertension stated, or PASP >= 36 mmHg
  pasp            PASP mmHg if quoted
  af              atrial fibrillation / flutter
  dilated_la      dilated left atrium
  dcm             dilated cardiomyopathy
  peric_eff       pericardial effusion (more than a chink)
  ecg_isch        ECG / TMT: significant ST depression / positive for inducible ischaemia
  holter_sig      Holter: VT, high-grade AV block, pauses
  pft_obstructive / pft_restrictive
"""
from __future__ import annotations
import argparse, csv, re, sys

csv.field_size_limit(10**9)
ROMAN = {"i": 1, "ii": 2, "iii": 3, "1": 1, "2": 2, "3": 3}
NEG = re.compile(r"\b(no|not|without|absent|nor|normal)\b", re.I)


def sentences(text: str):
    for s in re.split(r"(?<=[.\n])\s+|\n", text):
        s = " ".join(s.split())
        if s:
            yield s


def negated(s: str, start: int, end: int) -> bool:
    before = s[max(0, start - 50):start]
    after = s[end:end + 40]
    return bool(NEG.search(before)) or bool(re.search(r"^\s*[-:]?\s*(absent|nil|none|not seen|no\b|normal)", after, re.I))


def any_hit(text: str, rx: re.Pattern) -> int:
    for s in sentences(text):
        for m in rx.finditer(s):
            if not negated(s, m.start(), m.end()):
                return 1
    return 0


RX = {
    "lvh": re.compile(r"concentric\s+(left\s+ventricular|lv)\s+hypertroph|concentric\s+lvh|\blvh\b|left\s+ventricular\s+hypertrophy", re.I),
    "rwma": re.compile(r"ischa?emic\s+heart\s+disease|rwma\s+as\s+described|hypokinesia|hypokinetic|akinetic|akinesia|dyskine|regional\s+wall\s+motion\s+abnormalit(y|ies)\s+(is\s+|are\s+)?(seen|present|noted)|\brwma\s*[-:]?\s*(present|seen)", re.I),
    "global_hypo": re.compile(r"global\s+(lv\s+)?(wall\s+)?hypokinesia|global\s+hypokinesia", re.I),
    "valve_mod_sev": re.compile(r"(moderate|severe|gross|moderate\s+to\s+severe)\s+(mitral|aortic|tricuspid|pulmonary|pulmonic)?\s*(regurgitation|stenosis)|(moderate|severe)\s+(mr|ar|tr|ms|as|pr)\b|rheumatic", re.I),
    "ph_text": re.compile(r"(mild|moderate|severe)\s+(pah|pulmonary\s+(arterial\s+)?hypertension)|pulmonary\s+(arterial\s+)?hypertension\s+(is\s+)?(present|seen|noted)|\bpah\s*[-:]?\s*(present|mild|moderate|severe)", re.I),
    "af": re.compile(r"atrial\s+fibrillation|\ba\.?f\.?\b(?=\s*(rhythm|with|noted|seen|present|$))|atrial\s+flutter", re.I),
    "dilated_la": re.compile(r"dilated\s+(la|left\s+atrium|left\s+atrial)|(la|left\s+atrium)\s*[-:]?\s*(is\s+)?(mildly\s+|moderately\s+|grossly\s+)?dilated|left\s+atrial\s+\(la\)\s+cavity", re.I),
    "dcm": re.compile(r"dilated\s+cardiomyopathy|\bdcm\b", re.I),
    "peric_eff": re.compile(r"(mild|minimal|moderate|large|massive|small)\s+pericardial\s+effusion|pericardial\s+effusion\s+(is\s+)?(seen|present|noted)", re.I),
    "ecg_isch": re.compile(r"significant\s+st\s+depression\s+(is\s+)?(seen|noted|present)|positive\s+for\s+(inducible\s+)?ischa?emia|st\s+depression\s+(is\s+)?(seen|noted|present)|st\s+elevation|old\s+(anterior|inferior|lateral|posterior)?\s*(wall\s+)?(myocardial\s+)?infarct|\bmi\b\s*(changes|pattern)|t\s+wave\s+inversion|strain\s+pattern", re.I),
    "holter_sig": re.compile(r"ventricular\s+tachycardia|\bvt\b|high[\s-]*grade\s+av\s+block\s+(noted|seen|present)|complete\s+heart\s+block|pauses?\s+(of|>|more\s+than)\s*\d|sinus\s+pause", re.I),
    "pft_obstructive": re.compile(r"obstructive\s+ventilatory\s+defect|flow\s*-?\s*volume\s+loop\s*:?\s*obstructive|small\s+air-?\s*way\s+obstruction|obstructive\s+(pattern|defect|airway)", re.I),
    "pft_restrictive": re.compile(r"restrictive\s+ventilatory\s+defect|mild\s+restriction|restrictive\s+(pattern|defect)(?!.*diastolic)", re.I),
}
EF = re.compile(r"(?:lvef|ejection\s+fraction|\bef)\s*(?:\(tech\))?\s*[-:=|(]*\s*(\d{2})(?:\.\d)?\s*%", re.I)
DD_GRADE = re.compile(r"grade\s*-?\s*(iii|ii|i|[123])\s*(?:lv\s*)?(?:left\s+ventricular\s+)?(?:diastolic\s+dysfunction|lvdd)|diastolic\s+dysfunction[^.\n]{0,25}?grade\s*-?\s*(iii|ii|i|[123])", re.I)
DD_ANY = re.compile(r"reduced\s+diastolic\s+compliance|impaired\s+relaxation|diastolic\s+dysfunction", re.I)
DD_NONE = re.compile(r"diastolic\s+dysfunction\s*[-:]?\s*absent|adequate\s+diastolic\s+compliance|diastolic\s+compliance\s*[-:]?\s*(adequate|normal)|no\s+diastolic\s+dysfunction", re.I)
PASP = re.compile(r"(?:pasp|rvsp)\s*[-=:]?\s*(\d{2,3})\s*mm", re.I)


def kind_of(t: str) -> str:
    u = t.upper()
    if "FETAL" in u or "FOETAL" in u:
        return "FETAL"
    if "PULMONARY FUNCTION" in u or "SPIROMETRY" in u or "VENTILATORY DEFECT" in u:
        return "PFT"
    if "HOLTER" in u:
        return "HOLTER"
    if "TREADMILL" in u or re.search(r"\bTMT\b", u):
        return "TMT"
    if "ECHOCARDIOGRA" in u or "LVEF" in u or "EJECTION" in u or "SYSTOLIC FUNCTION" in u:
        return "ECHO"
    if re.search(r"\bECG\b|ELECTROCARDIOGRA", u):
        return "ECG"
    return "OTHER"


def extract(text: str) -> dict:
    kind = kind_of(text)
    out = {"kind": kind, "lvef": "", "dd_grade": "", "pasp": ""}
    efs = [int(m.group(1)) for m in EF.finditer(text) if 20 <= int(m.group(1)) <= 85]
    if efs and kind == "ECHO":
        out["lvef"] = min(efs)
    if kind == "ECHO":
        grades = [ROMAN[(m.group(1) or m.group(2)).lower()] for m in DD_GRADE.finditer(text)]
        if grades:
            out["dd_grade"] = max(grades)
        elif DD_NONE.search(text) and not any_hit(text, DD_ANY):
            out["dd_grade"] = 0
        elif any_hit(text, DD_ANY):
            out["dd_grade"] = 1
        p = [int(m.group(1)) for m in PASP.finditer(text) if 10 <= int(m.group(1)) <= 150]
        if p:
            out["pasp"] = max(p)
    for name, rx in RX.items():
        if name == "ph_text":
            continue
        out[name] = any_hit(text, rx) if kind != "FETAL" else 0
    out["ph"] = 0 if kind == "FETAL" else int(any_hit(text, RX["ph_text"]) or (out["pasp"] != "" and out["pasp"] >= 36))
    return out


FIELDS = ["report_key", "bill_key", "report_date", "kind", "lvef", "lvh", "dd_grade", "rwma", "global_hypo", "valve_mod_sev",
          "ph", "pasp", "af", "dilated_la", "dcm", "peric_eff", "ecg_isch", "holter_sig", "pft_obstructive", "pft_restrictive"]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("input", nargs="?", default="cardiology_reports.csv")
    ap.add_argument("-o", "--out", default="cardiology_findings.csv")
    args = ap.parse_args()
    n = 0
    with open(args.input, encoding="utf-8-sig", newline="") as f, open(args.out, "w", newline="", encoding="utf-8") as fo:
        w = csv.DictWriter(fo, fieldnames=FIELDS)
        w.writeheader()
        for row in csv.DictReader(f):
            rec = {"report_key": row["report_key"], "bill_key": row["bill_key"], "report_date": row["report_date"]}
            rec.update(extract(row.get("report_text") or ""))
            w.writerow({k: rec.get(k, "") for k in FIELDS})
            n += 1
    print(f"wrote {n} rows -> {args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
