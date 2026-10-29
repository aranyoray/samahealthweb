"""
Which AKTIV tests and parameters the /ncd page needs, and how a reported
parameter name maps to the page's codes.

Two levels, because AKTIV bills a TEST (e.g. "LIPID PROFILE") and reports
PARAMETERS under it (e.g. "LDL CHOLESTEROL"):

  TEST_PATTERNS       SQL-LIKE patterns against MAST_TEST.TESTNAME / LABSLIPNAME.
                      Picks the bills worth reading.
  PARAMETER_PATTERNS  Regexes against the reported parameter name. Turns a
                      result row into one of the page's codes, or None.

The codes match RawTest in app/ncd/lib/types.ts. eGFR and FIB-4 are not here:
the page derives them from CREAT, and from AST, ALT, PLT and age.
"""

from __future__ import annotations

import re

TEST_PATTERNS: dict[str, list[str]] = {
    "diabetes": [
        "%HBA1C%", "%HB A1C%", "%GLYCATED%", "%GLYCOSYLATED%",
        "%FASTING BLOOD SUGAR%", "%FBS%", "%BLOOD SUGAR%", "%GLUCOSE%", "%DIABETIC%",
    ],
    "kidney": [
        "%CREATININE%", "%KFT%", "%RFT%", "%KIDNEY FUNCTION%", "%RENAL FUNCTION%",
        "%MICROALBUMIN%", "%ALBUMIN CREATININE%", "%ALBUMIN/CREATININE%", "%(ACR)%", "%UACR%",
    ],
    "heart": [
        "%LIPID%", "%CHOLESTEROL%", "%LDL%", "%HDL%", "%TRIGLYCERIDE%",
    ],
    "thyroid": [
        "%TSH%", "%THYROID%", "%T3%", "%T4%",
    ],
    "liver": [
        "%LFT%", "%LIVER FUNCTION%", "%SGPT%", "%SGOT%", "%(ALT)%", "% ALT%", "%(AST)%", "% AST%",
        "%CBC%", "%COMPLETE BLOOD COUNT%", "%HAEMOGRAM%", "%HEMOGRAM%", "%PLATELET%",
    ],
}

# Order matters: the first match wins, so the specific patterns come first
# ("LDL" before "CHOLESTEROL", "FREE T4" before "T4").
PARAMETER_PATTERNS: list[tuple[str, str]] = [
    ("HBA1C", r"\bhb\s*a1c\b|glycated|glycosylated|\ba1c\b"),
    ("FBS", r"fasting.*(sugar|glucose)|\bfbs\b|glucose.*fasting|\bfpg\b"),
    ("UACR", r"albumin\s*[/:-]?\s*creatinine|\bacr\b|\buacr\b"),
    ("CREAT", r"^(serum\s*)?creatinine\b(?!.*(clearance|ratio|urine))"),
    ("LDL", r"\bldl\b(?!.*(ratio|/))"),
    ("HDL", r"\bhdl\b(?!.*(ratio|/))"),
    ("TG", r"triglyceride"),
    ("FT4", r"free\s*t4|\bft4\b|free\s*thyroxine"),
    ("TSH", r"\btsh\b|thyroid\s*stimulating"),
    ("ALT", r"\bsgpt\b|\balt\b|alanine\s*amino"),
    ("AST", r"\bsgot\b|\bast\b|aspartate\s*amino"),
    ("PLT", r"platelet\s*count|^platelets?$|\bplt\b"),
]

_COMPILED = [(code, re.compile(rx, re.IGNORECASE)) for code, rx in PARAMETER_PATTERNS]

# Parameters whose name is ambiguous enough that a urine or ratio variant
# must not be read as the blood value.
_EXCLUDE = re.compile(r"urine|urinary|ratio|clearance|/\s*hdl|vldl|non[\s-]*hdl", re.IGNORECASE)


def code_for_parameter(name: str | None) -> str | None:
    """Map a reported parameter name to a page code, or None if not used."""
    if not name:
        return None
    n = " ".join(str(name).split())
    for code, rx in _COMPILED:
        if not rx.search(n):
            continue
        if code not in ("UACR",) and _EXCLUDE.search(n):
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
    # Quick self-check of the parameter mapping.
    cases = {
        "HbA1c": "HBA1C", "GLYCATED HAEMOGLOBIN": "HBA1C", "Fasting Blood Sugar": "FBS",
        "Serum Creatinine": "CREAT", "CREATININE CLEARANCE": None, "Urine Creatinine": None,
        "Urine Albumin/Creatinine Ratio": "UACR", "LDL CHOLESTEROL": "LDL", "VLDL": None,
        "LDL/HDL RATIO": None, "HDL Cholesterol": "HDL", "Triglycerides": "TG", "TSH": "TSH",
        "Free T4": "FT4", "SGPT (ALT)": "ALT", "SGOT": "AST", "Platelet Count": "PLT",
        "Total Cholesterol": None, "Haemoglobin": None,
    }
    bad = {k: (code_for_parameter(k), v) for k, v in cases.items() if code_for_parameter(k) != v}
    print("all parameter cases pass" if not bad else f"MISMATCHES: {bad}")
    assert parse_number("6.4") == 6.4 and parse_number("<5") is None and parse_number("1,200") == 1200.0
