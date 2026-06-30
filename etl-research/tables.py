"""
Tables to mirror and the per-table filter strategy.

LOOKUP_TABLES are mirrored in full (small reference data, joined often in
research queries).

FILTERED_TABLES are restricted to rows linked to the curated research
TEST_KEYs. Some result tables have a direct BILL_KEY column; others store
results under REPORT_KEY which links to a *_HEAD table. The strategy is
resolved at runtime against the actual columns introspected from SQL
Server — never trust this file's hints over the introspection result.
"""

LOOKUP_TABLES = [
    "MAST_PATIENT",
    "MAST_PATIENT_FAMILY_DTLS",   # family-member name per result
    "MAST_TEST",
    "MAST_TEST_CATEGORY",
    "MAST_SUBDEPARTMENT",
    "MAST_DEPARTMENT",
    "MAST_REFRDOCTOR",
    "MAST_COLLCENTRE",
    "MAST_ORGANISATION",
    "MAST_INVESTIGATOR",
    "MAST_METHOD",
    "MAST_DESCRIPTION",            # parameter definitions
    "MAST_DESCRIPTION_INTR",       # normal ranges by age/sex
    "MAST_DESCRIPTION_SPEC",       # test specifications
    "MAST_SPECIMEN",
    "MAST_REPORT_TITLE",
    "SYS_BRANCH",
    "SYS_COMPANY",
]

# Strategy hints — verified at runtime against introspected columns.
# - "test_key"    : direct TEST_KEY filter (BILL_TEST_DTLS, AKTIV_LIS_INPUT)
# - "bill_key"    : direct BILL_KEY filter (most *_HEAD, *_DTLS, *_DESC, *_PAD)
# - "report_key"  : table has REPORT_KEY but no BILL_KEY — join via *_HEAD
# - "bill_number" : LIS result table keyed by BILL_NUMBER (string)
#
# The actual strategy used at runtime is derived from real columns; this
# is just a hint for what we expect.

FILTER_STRATEGY_HINT = {
    # Test discovery (gives us the relevant BILL_KEY set)
    "BILL_TEST_DTLS":          ("test_key", None),

    # Bills containing those tests
    "BILL_HEAD":               ("bill_key", None),
    "BILL_DTLS":               ("bill_key", None),

    # Haematology
    "HAEMATOLOGY_HEAD":        ("bill_key", None),
    "HAEMATOLOGY_DTLS":        ("bill_key", "HAEMATOLOGY_HEAD"),
    "HAEMATOLOGY_DESC":        ("bill_key", "HAEMATOLOGY_HEAD"),
    "HAEMATOLOGY_PAD":         ("bill_key", "HAEMATOLOGY_HEAD"),

    # Chemistry
    "CHEMICAL_HEAD":           ("bill_key", None),
    "CHEMICAL_DTLS":           ("bill_key", "CHEMICAL_HEAD"),
    "CHEMICAL_DESC":           ("bill_key", "CHEMICAL_HEAD"),
    "CHEMICAL_PAD":            ("bill_key", "CHEMICAL_HEAD"),

    # Hormone
    "HORMONE_HEAD":            ("bill_key", None),
    "HORMONE_DTLS":            ("bill_key", "HORMONE_HEAD"),
    "HORMONE_DESC":            ("report_key", "HORMONE_HEAD"),
    "HORMONE_PAD":             ("bill_key", "HORMONE_HEAD"),

    # Serology
    "SEROLOGY_HEAD":           ("bill_key", None),
    "SEROLOGY_DTLS":           ("report_key", "SEROLOGY_HEAD"),
    "SEROLOGY_DESC":           ("report_key", "SEROLOGY_HEAD"),
    "SEROLOGY_PAD":            ("report_key", "SEROLOGY_HEAD"),

    # Microbiology
    "MICRO_HEAD":              ("bill_key", None),
    "MICRO_DTLS":              ("report_key", "MICRO_HEAD"),
    "MICRO_DESC":              ("report_key", "MICRO_HEAD"),
    "MICRO_PAD":               ("report_key", "MICRO_HEAD"),

    # Sputum (TB-specific)
    "SPUTUM_HEAD":             ("bill_key", None),
    "SPUTUM_DTLS":             ("report_key", "SPUTUM_HEAD"),
    "SPUTUM_DESC":             ("report_key", "SPUTUM_HEAD"),
    "SPUTUM_PAD":              ("report_key", "SPUTUM_HEAD"),

    # Culture (TB-specific)
    "CULTURE_HEAD":            ("bill_key", None),
    "CULTURE_BACTERIA_DTLS":   ("report_key", "CULTURE_HEAD"),
    "CULTURE_ANTIBIOTIC_DTLS": ("report_key", "CULTURE_HEAD"),
    "CULTURE_PAD":             ("report_key", "CULTURE_HEAD"),

    # Mantoux (TB-specific)
    "MANTOUX_HEAD":            ("bill_key", None),
    "MANTOUX_DTLS":            ("report_key", "MANTOUX_HEAD"),
    "MANTOUX_DESC":            ("report_key", "MANTOUX_HEAD"),
    "MANTOUX_PAD":             ("report_key", "MANTOUX_HEAD"),

    # LIS (lab-instrument middleware)
    "AKTIV_LIS_INPUT":         ("test_key", None),
    "AKTIV_LIS_RESULT":        ("bill_number", None),
}

FILTERED_TABLES = list(FILTER_STRATEGY_HINT.keys())


def resolve_strategy(table: str, actual_columns: set[str]) -> tuple[str, str | None]:
    """
    Pick the real filter strategy given the columns that actually exist.
    Falls back gracefully when the hint was wrong (e.g. a *_DTLS we thought
    had REPORT_KEY actually has BILL_KEY too).

    Priority order at resolve-time:
      1. Direct TEST_KEY column          → "test_key"
      2. Direct BILL_KEY column          → "bill_key"
      3. Direct BILL_NUMBER column       → "bill_number"
      4. REPORT_KEY + sibling *_HEAD     → "report_key"
      5. No usable filter                → "unsupported"
    """
    hint = FILTER_STRATEGY_HINT.get(table, ("bill_key", None))
    hinted_strategy, head_table = hint

    cols = {c.upper() for c in actual_columns}

    # BILL_TEST_DTLS and AKTIV_LIS_INPUT — must filter by TEST_KEY directly.
    if hinted_strategy == "test_key":
        if "TEST_KEY" in cols:
            return ("test_key", None)

    if "TEST_KEY" in cols and table == "BILL_TEST_DTLS":
        return ("test_key", None)

    if "BILL_KEY" in cols:
        return ("bill_key", None)

    if "BILL_NUMBER" in cols and hinted_strategy == "bill_number":
        return ("bill_number", None)

    if "REPORT_KEY" in cols and head_table:
        return ("report_key", head_table)

    return ("unsupported", None)
