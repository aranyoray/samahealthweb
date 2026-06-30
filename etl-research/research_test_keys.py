"""
Curated TEST_KEY filters for the Anubhav Life Care research mirror.

Three research domains: anaemia, tuberculosis, cardiac markers.
Edit these lists to add/remove tests without touching ETL code.
"""

# ---------------------------------------------------------------------------
# Anaemia: Haematology + Iron / B12 / Ferritin markers
# ---------------------------------------------------------------------------
ANEMIA_TEST_KEYS = [
    861, 64, 2434, 257, 112, 266, 56, 96, 99, 97, 98, 1787, 1786,  # Haem panel (CBC, Hb, MCV, MCH, MCHC, RDW, reticulocyte, ...)
    10, 11, 1928, 18,                                              # Iron, TIBC, transferrin saturation
    2362, 243,                                                     # Vitamin B12
    127,                                                           # Ferritin
]

# ---------------------------------------------------------------------------
# Tuberculosis: Sputum AFB / AFB-PCR / Culture / Mantoux / IGRA / serology
# ---------------------------------------------------------------------------
TB_TEST_KEYS = [
    1806, 1843, 821, 819, 820, 577, 1810, 1815,                    # Sputum AFB (ZN smear, grading)
    2461, 251, 1818, 1930, 2363, 1820, 1826, 1831, 1834,
    2238, 2388, 1154, 1156, 675, 260, 2184,                        # AFB / PCR / Culture
    46, 2264, 256,                                                 # Mantoux variants
    1851, 582,                                                     # TB-Gold / IGRA (QFT-Plus)
]

# ---------------------------------------------------------------------------
# Cardiac: Troponin / CPK / Pro-BNP / Lipid / HbA1c / diabetes panels
# ---------------------------------------------------------------------------
CARDIAC_TEST_KEYS = [
    1871, 91, 261, 92, 1010,                                       # CPK panel, HBDH
    2467, 2022, 2320, 580,                                         # Troponin variants
    1865, 1100,                                                    # Pro-BNP
    76,                                                            # Lipid profile
    2323, 2327, 175, 698,                                          # HbA1c / Diabetic packages
    597, 2026, 2269,                                               # Protein electrophoresis
    1928,                                                          # Iron profile (overlap with anaemia)
    2412, 2411, 2409, 2410, 2395, 2394,                            # Cardiac packages
]

# Union of all research tests (deduplicated automatically)
ALL_RESEARCH_TEST_KEYS = sorted(set(ANEMIA_TEST_KEYS + TB_TEST_KEYS + CARDIAC_TEST_KEYS))


def domain_for_key(test_key: int) -> str:
    """Return 'anemia' / 'tb' / 'cardiac' / 'unknown' for a TEST_KEY."""
    if test_key in ANEMIA_TEST_KEYS and test_key in TB_TEST_KEYS:
        return "anemia+tb"
    if test_key in ANEMIA_TEST_KEYS and test_key in CARDIAC_TEST_KEYS:
        return "anemia+cardiac"
    if test_key in TB_TEST_KEYS and test_key in CARDIAC_TEST_KEYS:
        return "tb+cardiac"
    if test_key in ANEMIA_TEST_KEYS:
        return "anemia"
    if test_key in TB_TEST_KEYS:
        return "tb"
    if test_key in CARDIAC_TEST_KEYS:
        return "cardiac"
    return "unknown"


if __name__ == "__main__":
    print(f"ANEMIA_TEST_KEYS   : {len(ANEMIA_TEST_KEYS)} keys")
    print(f"TB_TEST_KEYS       : {len(TB_TEST_KEYS)} keys")
    print(f"CARDIAC_TEST_KEYS  : {len(CARDIAC_TEST_KEYS)} keys")
    print(f"ALL (deduplicated) : {len(ALL_RESEARCH_TEST_KEYS)} keys")
    overlaps = {k: domain_for_key(k) for k in ALL_RESEARCH_TEST_KEYS if "+" in domain_for_key(k)}
    if overlaps:
        print(f"Multi-domain keys  : {overlaps}")
