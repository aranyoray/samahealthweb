"""
Which AKTIV tests and parameters the /ncd page needs, and how a reported
parameter name maps to the page's codes.

Two levels, because AKTIV bills a TEST (e.g. "LIPID PROFILE") and reports
PARAMETERS under it (e.g. "LDL CHOLESTEROL"):

  TEST_PATTERNS       SQL-LIKE patterns against MAST_TEST.TESTNAME / LABSLIPNAME.
                      Picks the bills worth reading.
  PARAMETER_PATTERNS  Regexes against the reported parameter name. Turns a
                      result row into one of the page's codes, or None.

The first twelve codes match RawTest in app/ncd/lib/types.ts. eGFR and FIB-4
are not here: the page derives them from CREAT, and from AST, ALT, PLT and age.

The EXTENDED codes after them are for the NCD burden analysis (etl-ncd/analysis):
the page ignores codes it does not know, so they are additive. On this install
the analyte name comes from MAST_DESCRIPTION.DESCRIPTION (the row's own
PARAMETER column is the method line), e.g. "PLASMA GLUCOSE (F)",
"SERUM SGPT (ALAT)", "PLATELETS COUNT", "THYROXINE, FREE (FT4)".

Units to watch downstream: PLATELETS COUNT is reported in Lakh/cu.mm
(x100 = the page's 10^3/uL); UACR in ug/mg (= mg/g).
"""

from __future__ import annotations

import re

TEST_PATTERNS: dict[str, list[str]] = {
    "diabetes": [
        "%HBA1C%", "%HB A1C%", "%GLYCATED%", "%GLYCOSYLATED%",
        "%FASTING BLOOD SUGAR%", "%FBS%", "%BLOOD SUGAR%", "%GLUCOSE%", "%DIABETIC%",
    ],
    "kidney": [
        "%CREATININE%", "%KFT%", "%RFT%", "%KIDNEY FUNCTION%", "%RENAL FUNCTION%", "%RENAL PROFILE%",
        "%MICROALBUMIN%", "%ALBUMIN CREATININE%", "%ALBUMIN/CREATININE%", "%(ACR)%", "%UACR%", "%URIC ACID%", "%UREA%",
    ],
    "heart": [
        "%LIPID%", "%CHOLESTEROL%", "%LDL%", "%HDL%", "%TRIGLYCERIDE%",
        "%TROPONIN%", "%TROP-T%", "%TROP T%", "%CPK%", "%CK-MB%", "%BNP%", "%CARDIAC%",
    ],
    "thyroid": [
        "%TSH%", "%THYROID%", "%T3%", "%T4%",
    ],
    "liver": [
        "%LFT%", "%LIVER FUNCTION%", "%SGPT%", "%SGOT%", "%(ALT)%", "% ALT%", "%(AST)%", "% AST%",
        "%CBC%", "%COMPLETE BLOOD COUNT%", "%HAEMOGRAM%", "%HEMOGRAM%", "%PLATELET%",
    ],
    "anaemia": [
        "%HAEMOGLOBIN%", "%HEMOGLOBIN%", "%TC DC%", "%HB %", "%FERRITIN%", "%IRON%", "%B12%", "%B 12%",
    ],
    "inflammation": [
        "%CRP%", "%C-REACTIVE%", "%C REACTIVE%", "%ESR%",
    ],
    "other": [
        "%VITAMIN D%", "%VIT D%", "%25%OH%", "%PSA%", "%PROSTATE%", "%INSULIN%", "%HOMA%", "%LIPOPROTEIN%", "%ELECTROLYTE%", "%CALCIUM%",
    ],
}

# Order matters: the first match wins, so the specific patterns come first
# ("LDL" before "CHOLESTEROL", "FREE T4" before "T4", "HS-CRP" before "CRP").
PARAMETER_PATTERNS: list[tuple[str, str]] = [
    # --- the twelve RawTest codes the /ncd page reads -------------------------
    ("HBA1C", r"\bhb\s*a1c\b|glycated|glycosylated|\ba1c\b"),
    ("FBS", r"fasting.*(sugar|glucose)|\bfbs\b|glucose.*fasting|\bfpg\b|glucose\s*\(\s*f\s*\)"),
    ("UACR", r"albumin\s*[/:-]?\s*creatinine|\bacr\b|\buacr\b"),
    ("CREAT", r"^(serum\s*)?creatinine\b(?!.*(clearance|ratio|urine))"),
    ("LDL", r"\bldl\b(?!.*(ratio|/))"),
    ("HDL", r"\bhdl\b(?!.*(ratio|/))"),
    ("TG", r"triglyceride(?!.*fluid)"),
    ("FT4", r"free\s*t4|\bft4\b|free\s*thyroxine|thyroxine,?\s*free"),
    ("TSH", r"\btsh\b|thyroid\s*stimulating"),
    ("ALT", r"\bsgpt\b|\balt\b|\balat\b|alanine\s*amino"),
    ("AST", r"\bsgot\b|\bast\b|\basat\b|aspartate\s*amino"),
    ("PLT", r"platelets?\s*count|^platelets?$|\bplt\b"),
    # --- EXTENDED: glycaemia ------------------------------------------------
    ("PPBS", r"glucose\s*\(\s*pp\b|post\s*-?\s*prandial|\bppbs\b|\bpp\s*(bs|glucose)"),
    ("RBS", r"glucose\s*\(\s*random|random.*(sugar|glucose)|\brbs\b"),
    ("INSULIN_F", r"insulin\s*\(?\s*fasting"),
    ("HOMA_IR", r"homa\s*-?\s*ir"),
    # --- EXTENDED: kidney ----------------------------------------------------
    ("UMALB", r"microalbumin(?!.*creatinine)"),
    ("UREA", r"^(serum\s*)?urea\b(?!.*urin)"),
    ("BUN", r"blood\s*urea\s*nitrogen|\bbun\b(?!.*ratio)"),
    ("URIC", r"uric\s*acid"),
    ("EGFR_LAB", r"glomerular\s*filtration|\begfr\b|gfr\s*by"),
    ("UPCR", r"protein\s*[/:-]?\s*creatinine\s*ratio"),
    # --- EXTENDED: lipids ------------------------------------------------------
    ("VLDL", r"\bvldl\b"),
    ("TC", r"cholesterol,?\s*total|total\s*cholesterol|^(serum\s*)?cholesterol\b(?!.*(hdl|ldl|vldl|ratio|fluid))"),
    ("LPA", r"lipoprotein\s*\(?a\)?$|lipoprotein\s+a\b"),
    # --- EXTENDED: thyroid -----------------------------------------------------
    ("FT3", r"free\s*t3|\bft3\b|triiodothyronine,?\s*free"),
    ("T4", r"thyroxine,?\s*total|\btt4\b|^t4\b"),
    ("T3", r"triiodothyronine,?\s*total|\btt3\b|^t3\b"),
    ("ANTI_TPO", r"peroxidase|anti\s*tpo"),
    # --- EXTENDED: liver -------------------------------------------------------
    ("ALP", r"alkaline\s*phosphatase|\balp\b"),
    ("GGT", r"gamma\s*glutamyl|\bggt\b"),
    ("BILI_T", r"bilirubin,?\s*total|total\s*bilirubin"),
    ("BILI_D", r"^conjugated$|bilirubin,?\s*(direct|conjugated)|direct\s*bilirubin"),
    ("ALB", r"^serum\s*albumin$"),
    ("TP", r"total\s*protein"),
    # --- EXTENDED: haematology / anaemia ---------------------------------------
    ("HB", r"^ha?emoglobin$|^hb$|^ha?emoglobin\s*\(hb\)$"),
    ("TLC", r"total\s*leucocyt|\btlc\b|\bwbc\s*count"),
    ("ESR", r"\besr\b|erythrocyte\s*sedimentation|^1st\s*hour$"),
    ("FERRITIN", r"ferritin"),
    ("IRON", r"^serum\s*iron$"),
    ("B12", r"\bb\s*12\b|cobalamin"),
    ("MCV", r"^m\s*c\s*v$|mean\s*corpuscular\s*volume"),
    # --- EXTENDED: inflammation / cardiac markers ------------------------------
    ("HSCRP", r"high\s*sensitiv.*crp|\bhs-?\s*crp\b"),
    ("CRP", r"c-?\s*reactive|\bcrp\b"),
    ("NTPROBNP", r"pro-?\s*bnp|\bbnp\b"),
    ("CKMB", r"cpk\s*-?\s*mb|ck\s*-?\s*mb"),
    ("CPK", r"^(serum\s*)?cpk$|creatine\s*(phospho)?kinase(?!.*mb)"),
    ("TROP", r"troponin|trop-?\s*[ti]\b"),
    ("LDH", r"(\bldh\b|lactate\s*dehydrogenase)(?!.*(fluid|body))"),
    # --- EXTENDED: electrolytes / minerals / vitamins / others ---------------
    ("NA", r"sodium\s*\(na|^serum\s*sodium"),
    ("K", r"potassium(?!.*urin)"),
    ("CA", r"^serum\s*calcium"),
    ("VITD", r"vitamin\s*d\b|25\s*\(?oh\)?"),
    ("PSA", r"(?<!free )\bpsa\b(?!.*(free|ratio))|(?<!free )prostate\s*specific"),
]

_COMPILED = [(code, re.compile(rx, re.IGNORECASE)) for code, rx in PARAMETER_PATTERNS]

# Parameters whose name is ambiguous enough that a urine or ratio variant
# must not be read as the blood value.
_EXCLUDE = re.compile(r"urine|urinary|ratio|clearance|/\s*hdl|vldl|non[\s-]*hdl", re.IGNORECASE)
# Codes that legitimately contain one of those words.
_EXCLUDE_EXEMPT = {"UACR", "UMALB", "UPCR", "VLDL", "EGFR_LAB", "BUN"}

# The twelve codes the page knows; everything else is EXTENDED.
PAGE_CODES = {"HBA1C", "FBS", "UACR", "CREAT", "LDL", "HDL", "TG", "FT4", "TSH", "ALT", "AST", "PLT"}


def code_for_parameter(name: str | None) -> str | None:
    """Map a reported parameter name to a code, or None if not used."""
    if not name:
        return None
    n = " ".join(str(name).split())
    for code, rx in _COMPILED:
        if not rx.search(n):
            continue
        if code not in _EXCLUDE_EXEMPT and _EXCLUDE.search(n):
            return None
        return code
    return None


_NUM = re.compile(r"^\s*([-+]?\d+(?:\.\d+)?)\s*$")


def parse_number(value) -> float | None:
    """Numeric value, or None for '<5', '>1000', 'Positive', 'Haemolysed' etc.

    Censored values stay in value_text; guessing a number for them would
    put a made-up result into somebody's timeline.
    """
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    m = _NUM.match(str(value).replace(",", ""))
    return float(m.group(1)) if m else None


if __name__ == "__main__":
    # Quick self-check of the parameter mapping, including this install's real names.
    cases = {
        "HbA1c": "HBA1C", "GLYCATED HAEMOGLOBIN": "HBA1C", "GLYCOSYLATED HAEMOGLOBIN (HBA1C)": "HBA1C",
        "Fasting Blood Sugar": "FBS", "PLASMA GLUCOSE (F)": "FBS", "PLASMA GLUCOSE (PP)": "PPBS",
        "PLASMA GLUCOSE (RANDOM)": "RBS", "ESTIMATED AVERAGE GLUCOSE (EAG)": None, "GLUCOSE": None, "GLUCOSE (URINE)": None,
        "Serum Creatinine": "CREAT", "SERUM CREATININE.": "CREAT", "CREATININE CLEARANCE": None, "Urine Creatinine": None,
        "URINARY CREATININE": None, "Urine Albumin/Creatinine Ratio": "UACR", "MICROALBUMIN / CREATININE RATIO": "UACR",
        "URINARY MICROALBUMIN": "UMALB", "SERUM UREA": "UREA", "URINARY UREA (SPOT URINE)": None, "SERUM URIC ACID": "URIC",
        "ESTIMATED GLOMERULAR FILTRATION RATE": "EGFR_LAB", "BUN/CREATININE RATIO": None,
        "LDL CHOLESTEROL": "LDL", "SERUM LDL CHOLESTEROL": "LDL", "VLDL": "VLDL", "SERUM VLDL CHOLESTEROL": "VLDL",
        "LDL/HDL RATIO": None, "SERUM LDL / SERUM HDL RATIO": None, "SERUM CHOLESTEROL / SERUM HDL RATIO": None,
        "HDL Cholesterol": "HDL", "Triglycerides": "TG", "SERUM TRIGLYCERIDES": "TG", "TRIGLYCERIDES (FLUID)": None,
        "Total Cholesterol": "TC", "SERUM CHOLESTEROL, TOTAL": "TC", "CHOLESTEROL (FLUID)": None,
        "TSH": "TSH", "THYROID STIMULATING HORMONE (TSH) (3RD GEN.)": "TSH", "Free T4": "FT4", "THYROXINE, FREE (FT4)": "FT4",
        "THYROXINE, TOTAL (TT4)": "T4", "TRIIODOTHYRONINE, TOTAL (TT3)": "T3", "TRIIODOTHYRONINE, FREE  (FT3)": "FT3",
        "SGPT (ALT)": "ALT", "SERUM SGPT (ALAT)": "ALT", "SGOT": "AST", "SERUM SGOT (ASAT)": "AST",
        "SERUM ALKALINE PHOSPHATASE (ALP)": "ALP", "GAMMA GLUTAMYL TRANSFERASE (GGT)": "GGT",
        "SERUM BILIRUBIN, TOTAL": "BILI_T", "CONJUGATED": "BILI_D", "UNCONJUGATED": None, "SERUM ALBUMIN": "ALB", "ALBUMIN": None,
        "Platelet Count": "PLT", "PLATELETS COUNT": "PLT", "Haemoglobin": "HB", "HAEMOGLOBIN A2": None, "1ST HOUR": "ESR",
        "C-REACTIVE PROTEIN (CRP)": "CRP", "HIGH SENSITIVE CRP (HSCRP)": "HSCRP", "NT- PROBNP": "NTPROBNP", "CPK - MB": "CKMB",
        "SERUM CPK": "CPK", "TROPONIN-T": "TROP", "LDH (LACTATE DEHYDROGENASE)": "LDH", "LDH (BODY FLUID)": None,
        "SERUM 25(OH) VITAMIN D/D3": "VITD", "VITAMIN  B12": "B12", "PSA (PROSTATE SPECIFIC ANTIGEN) (METHOD CLIA)": "PSA",
        "FREE PSA": None, "SERUM SODIUM (NA+)": "NA", "SERUM POTASSIUM (K+)": "K", "SERUM CALCIUM": "CA",
    }
    bad = {k: (code_for_parameter(k), v) for k, v in cases.items() if code_for_parameter(k) != v}
    print("all parameter cases pass" if not bad else f"MISMATCHES: {bad}")
    assert not bad
    assert parse_number("6.4") == 6.4 and parse_number("<5") is None and parse_number("1,200") == 1200.0
