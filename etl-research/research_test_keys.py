"""
Curated TEST_KEY filters for the Anubhav Life Care research mirror.

Three research domains: anaemia, tuberculosis, cardiac markers.

TWO sources for the keys:
  1. Numeric fallback lists  — best-effort guesses (may not match every install).
  2. Name-pattern discovery  — resolves real TEST_KEYs at runtime by SQL-LIKE
                                matching against MAST_TEST.TEST_NAME.

Different AKTIV installs assign different numeric TEST_KEYs to the same test,
so the name-pattern path is the source of truth. The numeric lists are kept
for offline reproducibility and as a backstop if MAST_TEST is unreachable.
"""

# ---------------------------------------------------------------------------
# Numeric fallbacks (install-specific — likely incomplete on a fresh install)
# ---------------------------------------------------------------------------
ANEMIA_TEST_KEYS = [
    861, 64, 2434, 257, 112, 266, 56, 96, 99, 97, 98, 1787, 1786,
    10, 11, 1928, 18,
    2362, 243,
    127,
]

TB_TEST_KEYS = [
    1806, 1843, 821, 819, 820, 577, 1810, 1815,
    2461, 251, 1818, 1930, 2363, 1820, 1826, 1831, 1834,
    2238, 2388, 1154, 1156, 675, 260, 2184,
    46, 2264, 256,
    1851, 582,
]

CARDIAC_TEST_KEYS = [
    1871, 91, 261, 92, 1010,
    2467, 2022, 2320, 580,
    1865, 1100,
    76,
    2323, 2327, 175, 698,
    597, 2026, 2269,
    1928,
    2412, 2411, 2409, 2410, 2395, 2394,
]

ALL_RESEARCH_TEST_KEYS = sorted(set(ANEMIA_TEST_KEYS + TB_TEST_KEYS + CARDIAC_TEST_KEYS))


# ---------------------------------------------------------------------------
# Name patterns — SQL Server LIKE, case-insensitive (collation default)
# These are the source of truth. Edit here when a test isn't being picked up.
# ---------------------------------------------------------------------------

ANEMIA_NAME_PATTERNS = [
    "%hemoglobin%",       "%haemoglobin%",
    "% hb %", "hb ", "hb,", "hb-",                 # bare "Hb" in test names
    "%h.b.%",
    "%complete blood count%", "%C.B.C%", "%CBC%",
    "%h.b.%",
    "%MCV%", "%MCH%", "%MCHC%", "%RDW%", "%PCV%",
    "%hematocrit%", "%haematocrit%",
    "%reticulocyte%",
    "%peripheral smear%", "%PBF%", "%PBS%",
    "%RBC%", "%red cell%",
    "%iron%", "%serum iron%", "%fe%",              # broad; review --list-tests
    "%TIBC%", "%total iron binding%", "%transferrin%",
    "%ferritin%",
    "%vitamin B12%", "%vit B12%", "%B 12%", "%cobalamin%",
    "%folate%", "%folic acid%",
    "%g6pd%", "%glucose-6-phosphate%",             # haemolytic-anaemia workup
    "%electrophoresis%hb%", "%HPLC%hb%", "%hb electrophoresis%",
    "%sickling%", "%sickle%",
]

TB_NAME_PATTERNS = [
    "%AFB%",                                       # AFB smear, AFB culture, AFB PCR
    "%acid fast%",
    "%ziehl%", "%neelsen%",
    "%sputum%",
    "%mycobacter%", "%tuberculos%", "%tubercular%", "%TB %", "% TB",
    "%mantoux%", "%tuberculin%", "%PPD%",
    "%IGRA%", "%QFT%", "%QuantiFERON%", "%TB gold%", "%TB-gold%",
    "%CBNAAT%", "%GeneXpert%", "%gene xpert%", "%MTB%", "%Mtb/RIF%",
    "%LJ medium%", "%MGIT%", "%LPA%", "%line probe%",
    "%ADA%", "%adenosine deamin%",
    "%pleural%fluid%", "%CSF%", "%ascitic%",       # body-fluid workups in TB
]

CARDIAC_NAME_PATTERNS = [
    "%troponin%", "%Trop%T%", "%Trop%I%", "%hs-trop%", "%high sensitivity tropon%",
    "%CPK%", "%CK-MB%", "%CK MB%", "%creatine kinase%", "%creatine phospho%",
    "%LDH%", "%lactate dehydro%",
    "%HBDH%", "%hydroxybutyrate%",
    "%BNP%", "%pro-BNP%", "%proBNP%", "%NT-proBNP%", "%nt probnp%",
    "%lipid%", "%cholesterol%", "%HDL%", "%LDL%", "%triglyceride%", "%VLDL%",
    "%HbA1c%", "%glycated h%", "%glyco h%", "%glycosylated h%",
    "%fasting blood sugar%", "%FBS%", "%PPBS%", "%random blood sugar%", "%RBS%",
    "%OGTT%", "%glucose tolerance%",
    "%protein electrophoresis%", "%SPEP%", "%serum protein elec%",
    "%homocyst%",
    "%apolipo%", "%apo a%", "%apo b%",
]


def domain_for_key(test_key: int) -> str:
    if test_key in ANEMIA_TEST_KEYS and test_key in CARDIAC_TEST_KEYS:
        return "anemia+cardiac"
    if test_key in ANEMIA_TEST_KEYS and test_key in TB_TEST_KEYS:
        return "anemia+tb"
    if test_key in TB_TEST_KEYS and test_key in CARDIAC_TEST_KEYS:
        return "tb+cardiac"
    if test_key in ANEMIA_TEST_KEYS:
        return "anemia"
    if test_key in TB_TEST_KEYS:
        return "tb"
    if test_key in CARDIAC_TEST_KEYS:
        return "cardiac"
    return "unknown"


def discover_test_keys_by_name(cursor) -> dict:
    """
    Run LIKE matches against MAST_TEST.TEST_NAME for each domain. Returns
    a dict of {"anemia": set[int], "tb": set[int], "cardiac": set[int],
              "all": set[int], "matches": dict[int, dict]}.

    The matches dict maps TEST_KEY → {"name": ..., "domains": [...]} for
    every key that hit at least one pattern. Useful for `--list-tests`
    so the operator can sanity-check what got picked up.
    """
    domain_patterns = {
        "anemia": ANEMIA_NAME_PATTERNS,
        "tb": TB_NAME_PATTERNS,
        "cardiac": CARDIAC_NAME_PATTERNS,
    }

    cursor.execute(
        "SELECT TEST_KEY, TEST_NAME FROM MAST_TEST WHERE TEST_NAME IS NOT NULL"
    )
    all_tests = [(int(r[0]), str(r[1])) for r in cursor.fetchall()]

    out = {"anemia": set(), "tb": set(), "cardiac": set(), "matches": {}}
    import re

    def _like_to_re(pat: str) -> re.Pattern:
        # Convert SQL LIKE pattern → Python regex. % → .* ; _ → .
        # Anchors with .* so any-position substring match works.
        rx = ""
        for ch in pat:
            if ch == "%":
                rx += ".*"
            elif ch == "_":
                rx += "."
            else:
                rx += re.escape(ch)
        return re.compile(rx, re.IGNORECASE)

    compiled = {
        d: [_like_to_re(p) for p in pats]
        for d, pats in domain_patterns.items()
    }

    for tk, name in all_tests:
        hit_domains = []
        for d, rxs in compiled.items():
            if any(rx.fullmatch(name) for rx in rxs):
                out[d].add(tk)
                hit_domains.append(d)
        if hit_domains:
            out["matches"][tk] = {"name": name, "domains": hit_domains}

    out["all"] = out["anemia"] | out["tb"] | out["cardiac"]
    return out


if __name__ == "__main__":
    print(f"ANEMIA_TEST_KEYS  (fallback): {len(ANEMIA_TEST_KEYS)} keys")
    print(f"TB_TEST_KEYS      (fallback): {len(TB_TEST_KEYS)} keys")
    print(f"CARDIAC_TEST_KEYS (fallback): {len(CARDIAC_TEST_KEYS)} keys")
    print(f"ALL (deduplicated, fallback): {len(ALL_RESEARCH_TEST_KEYS)} keys")
    print(f"\nName-pattern counts:")
    print(f"  ANEMIA  patterns: {len(ANEMIA_NAME_PATTERNS)}")
    print(f"  TB      patterns: {len(TB_NAME_PATTERNS)}")
    print(f"  CARDIAC patterns: {len(CARDIAC_NAME_PATTERNS)}")
