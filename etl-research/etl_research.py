"""
Anubhav Life Care research ETL: AKTIV SQL Server  →  Neon Postgres.

Modes:
    --introspect       Describe source schema + estimate filtered row counts.
                       Run this FIRST. No writes to Neon.
    --init             Drop and re-create all mirror tables on Neon, using
                       column metadata introspected from SQL Server.
    --sync   (default) Mirror lookup tables + filtered result tables.
    --table <name>     Sync only one table (still runs bill-key discovery
                       first for filtered tables).
    --days <N>         Restrict bill-key discovery to the last N days
                       (test slice). Applies to --introspect and --sync.

The filter strategy per table is resolved at runtime against the actual
columns reported by SQL Server's INFORMATION_SCHEMA. No column names are
hard-coded in this script — that's the point of the --introspect gate.
"""

from __future__ import annotations

import argparse
import json
import logging
import logging.handlers
import os
import sys
import time
from contextlib import contextmanager
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable, Iterator

try:
    import pyodbc
except ImportError:
    pyodbc = None

try:
    import psycopg2
    import psycopg2.extras
except ImportError:
    psycopg2 = None

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None

from research_test_keys import ALL_RESEARCH_TEST_KEYS
from tables import (
    FILTERED_TABLES,
    LOOKUP_TABLES,
    resolve_strategy,
)
from type_mapping import mssql_ident, pg_ident, translate_type


# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

SCRIPT_DIR = Path(__file__).resolve().parent
ENV_PATH = SCRIPT_DIR / ".env"
LOG_PATH = SCRIPT_DIR / "etl.log"
MSSQL_PARAM_LIMIT = 2000      # safely below SQL Server's 2100-parameter cap
PG_INSERT_BATCH = 1000
PG_FETCH_BATCH = 5000


# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

def configure_logging() -> logging.Logger:
    log = logging.getLogger("etl_research")
    log.setLevel(logging.INFO)
    log.handlers.clear()

    stream = logging.StreamHandler(sys.stdout)
    stream.setFormatter(logging.Formatter("%(asctime)s  %(levelname)-7s  %(message)s",
                                          datefmt="%Y-%m-%d %H:%M:%S"))
    log.addHandler(stream)

    try:
        rotating = logging.handlers.TimedRotatingFileHandler(
            LOG_PATH, when="midnight", backupCount=7, encoding="utf-8"
        )
        rotating.setFormatter(logging.Formatter("%(asctime)s  %(levelname)-7s  %(message)s"))
        log.addHandler(rotating)
    except Exception as e:
        log.warning("Could not attach rotating file handler at %s: %s", LOG_PATH, e)

    return log


# ---------------------------------------------------------------------------
# Connections
# ---------------------------------------------------------------------------

def load_env() -> None:
    if load_dotenv and ENV_PATH.exists():
        load_dotenv(ENV_PATH)


def require_env(name: str) -> str:
    v = os.getenv(name)
    if not v:
        raise SystemExit(f"Missing required environment variable: {name}")
    return v


def _pick_mssql_driver() -> str:
    """Pick the best installed SQL Server ODBC driver, or guide the user."""
    override = os.getenv("MSSQL_DRIVER")
    if override:
        # Allow either raw "ODBC Driver 18 for SQL Server" or "{...}".
        return override if override.startswith("{") else "{" + override + "}"

    available = [d for d in pyodbc.drivers() if "SQL Server" in d]
    preferred_order = [
        "ODBC Driver 18 for SQL Server",
        "ODBC Driver 17 for SQL Server",
        "ODBC Driver 13 for SQL Server",
        "SQL Server Native Client 11.0",
        "SQL Server",
    ]
    for p in preferred_order:
        if p in available:
            return "{" + p + "}"

    raise SystemExit(
        "\nNo Microsoft SQL Server ODBC driver is installed.\n\n"
        "Install ODBC Driver 18 for SQL Server, then re-run.\n"
        "  Download: https://learn.microsoft.com/sql/connect/odbc/download-odbc-driver-for-sql-server\n"
        "  Or:      winget install Microsoft.ODBCDriver.18.MSSQL\n\n"
        f"pyodbc currently sees these drivers: {pyodbc.drivers()!r}\n"
    )


def mssql_connect() -> "pyodbc.Connection":
    if pyodbc is None:
        raise SystemExit("pyodbc not installed. Run: pip install -r requirements.txt")

    host = require_env("MSSQL_HOST")
    port = os.getenv("MSSQL_PORT", "1433")
    db = require_env("MSSQL_DB")
    user = require_env("MSSQL_USER")
    pwd = require_env("MSSQL_PASSWORD")

    driver = _pick_mssql_driver()
    # Driver 18 defaults to Encrypt=yes and a strict cert check, which fails
    # against an unmanaged self-signed cert on a clinic LAN. TrustServerCertificate=yes
    # keeps the encrypted channel but skips the cert chain check.
    conn_str = (
        f"DRIVER={driver};"
        f"SERVER={host},{port};"
        f"DATABASE={db};"
        f"UID={user};PWD={pwd};"
        f"TrustServerCertificate=yes;"
        f"Encrypt=yes;"
    )
    return pyodbc.connect(conn_str, autocommit=False)


def pg_connect():
    if psycopg2 is None:
        raise SystemExit("psycopg2 not installed. Run: pip install -r requirements.txt")
    return psycopg2.connect(require_env("NEON_RESEARCH_DATABASE_URL"))


# ---------------------------------------------------------------------------
# SQL Server introspection
# ---------------------------------------------------------------------------

@dataclass
class ColumnInfo:
    name: str
    sql_type: str
    max_length: int | None
    precision: int | None
    scale: int | None
    is_nullable: bool

    def pg_type(self) -> str:
        return translate_type(self.sql_type, self.max_length, self.precision, self.scale)


@dataclass
class TableInfo:
    name: str
    columns: list[ColumnInfo] = field(default_factory=list)
    row_count: int | None = None
    filter_strategy: str = "lookup"           # "lookup" | "test_key" | "bill_key" | "report_key" | "bill_number" | "unsupported"
    head_table: str | None = None
    estimated_filtered_rows: int | None = None

    @property
    def column_names(self) -> set[str]:
        return {c.name for c in self.columns}


def table_exists(cursor, table: str) -> bool:
    cursor.execute(
        "SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = ?",
        (table,),
    )
    return cursor.fetchone() is not None


def list_columns(cursor, table: str) -> list[ColumnInfo]:
    cursor.execute(
        """
        SELECT  COLUMN_NAME,
                DATA_TYPE,
                CHARACTER_MAXIMUM_LENGTH,
                NUMERIC_PRECISION,
                NUMERIC_SCALE,
                IS_NULLABLE
        FROM    INFORMATION_SCHEMA.COLUMNS
        WHERE   TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION
        """,
        (table,),
    )
    rows = cursor.fetchall()
    return [
        ColumnInfo(
            name=r[0],
            sql_type=str(r[1] or "").lower(),
            max_length=int(r[2]) if r[2] is not None else None,
            precision=int(r[3]) if r[3] is not None else None,
            scale=int(r[4]) if r[4] is not None else None,
            is_nullable=(str(r[5]).upper() == "YES"),
        )
        for r in rows
    ]


def table_row_count(cursor, table: str) -> int | None:
    try:
        cursor.execute(f"SELECT COUNT_BIG(*) FROM {mssql_ident(table)}")
        row = cursor.fetchone()
        return int(row[0]) if row else None
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Bill-key discovery (the hot path)
# ---------------------------------------------------------------------------

def discover_relevant_bill_keys(
    cursor,
    days: int | None,
    log: logging.Logger,
    cohort: str = "bill",
) -> tuple[set[int], int]:
    """
    Returns (bill_key_set, distinct_test_key_count).

    cohort = "bill"    → only bills that contain a curated research test
    cohort = "patient" → expand to every bill ever issued for any patient
                         in the research cohort (gives the full panel —
                         urinalysis, body fluids, CBCs, etc., for the same
                         patients regardless of which day they were drawn)

    Uses chunked IN clauses to stay under SQL Server's 2100-parameter cap.
    """
    log.info("Discovering BILL_KEYs via TEST_KEY filter (%d test keys, cohort=%s)...",
             len(ALL_RESEARCH_TEST_KEYS), cohort)
    seed_bill_keys: set[int] = set()
    test_keys_seen: set[int] = set()

    date_clause = ""
    date_params: list = []
    if days and days > 0:
        date_clause = (
            " AND btd.BILL_KEY IN "
            "(SELECT BILL_KEY FROM BILL_HEAD "
            " WHERE BILLDATE >= DATEADD(day, -?, CAST(GETDATE() AS date)))"
        )
        date_params.append(days)

    for chunk in _chunked(ALL_RESEARCH_TEST_KEYS, MSSQL_PARAM_LIMIT):
        placeholders = ",".join("?" * len(chunk))
        sql = (
            f"SELECT DISTINCT btd.BILL_KEY, btd.TEST_KEY "
            f"FROM BILL_TEST_DTLS btd "
            f"WHERE btd.TEST_KEY IN ({placeholders}){date_clause}"
        )
        cursor.execute(sql, list(chunk) + date_params)
        for bk, tk in cursor.fetchall():
            if bk is not None:
                seed_bill_keys.add(int(bk))
            if tk is not None:
                test_keys_seen.add(int(tk))

    log.info("Seed BILL_KEYs (bills containing a research test): %d", len(seed_bill_keys))
    log.info("Distinct curated TEST_KEYs actually hit: %d / %d",
             len(test_keys_seen), len(ALL_RESEARCH_TEST_KEYS))

    if cohort != "patient" or not seed_bill_keys:
        return seed_bill_keys, len(test_keys_seen)

    # ----- expand to all bills for the same patients -----
    log.info("Expanding to patient-level cohort (all bills for these patients)...")
    _create_bill_key_temp_table(cursor, seed_bill_keys, name="#seed_bills")
    cursor.execute(
        "SELECT DISTINCT bh.BILL_KEY "
        "FROM BILL_HEAD bh "
        "INNER JOIN BILL_HEAD seed ON seed.PATIENT_KEY = bh.PATIENT_KEY "
        "INNER JOIN #seed_bills sb ON sb.bill_key = seed.BILL_KEY"
    )
    expanded: set[int] = {int(r[0]) for r in cursor.fetchall() if r[0] is not None}
    cursor.execute("IF OBJECT_ID('tempdb..#seed_bills') IS NOT NULL DROP TABLE #seed_bills")

    log.info("Expanded BILL_KEYs (all bills for cohort patients): %d (Δ +%d)",
             len(expanded), len(expanded) - len(seed_bill_keys))
    return expanded, len(test_keys_seen)


def bill_date_range(cursor, bill_keys: set[int]) -> tuple[str | None, str | None]:
    if not bill_keys:
        return None, None
    sample = list(bill_keys)[:MSSQL_PARAM_LIMIT]
    placeholders = ",".join("?" * len(sample))
    cursor.execute(
        f"SELECT MIN(BILLDATE), MAX(BILLDATE) FROM BILL_HEAD WHERE BILL_KEY IN ({placeholders})",
        sample,
    )
    row = cursor.fetchone()
    if not row:
        return None, None
    lo = row[0].isoformat() if row[0] else None
    hi = row[1].isoformat() if row[1] else None
    return lo, hi


def estimate_filtered_rows(cursor, table: str, strategy: str, bill_keys: set[int]) -> int | None:
    """
    Quick count via a temp-table join for tables filtered by BILL_KEY or
    REPORT_KEY. Returns None when we can't safely estimate.
    """
    if strategy in ("lookup", "unsupported"):
        return None

    if strategy == "test_key":
        if table == "BILL_TEST_DTLS":
            # Use the curated test-key list directly.
            total = 0
            for chunk in _chunked(ALL_RESEARCH_TEST_KEYS, MSSQL_PARAM_LIMIT):
                placeholders = ",".join("?" * len(chunk))
                cursor.execute(
                    f"SELECT COUNT_BIG(*) FROM BILL_TEST_DTLS WHERE TEST_KEY IN ({placeholders})",
                    list(chunk),
                )
                total += int(cursor.fetchone()[0])
            return total

    if not bill_keys:
        return 0

    # Use a real temp table — much faster than a giant IN(...) list.
    _create_bill_key_temp_table(cursor, bill_keys)

    try:
        if strategy == "bill_key":
            cursor.execute(
                f"SELECT COUNT_BIG(*) FROM {mssql_ident(table)} t "
                f"INNER JOIN #relevant_bills rb ON rb.bill_key = t.BILL_KEY"
            )
        elif strategy == "report_key":
            # head_table needed; the caller passes it via the wrapper below.
            # We don't have it here — return None and let the caller handle it.
            return None
        elif strategy == "bill_number":
            cursor.execute(
                f"SELECT COUNT_BIG(*) FROM {mssql_ident(table)} t "
                f"INNER JOIN BILL_HEAD bh ON bh.BILL_NUMBER = t.BILL_NUMBER "
                f"INNER JOIN #relevant_bills rb ON rb.bill_key = bh.BILL_KEY"
            )
        else:
            return None
        return int(cursor.fetchone()[0])
    except Exception:
        return None


def estimate_via_head_table(cursor, table: str, head_table: str) -> int | None:
    try:
        cursor.execute(
            f"SELECT COUNT_BIG(*) FROM {mssql_ident(table)} t "
            f"INNER JOIN {mssql_ident(head_table)} h ON h.REPORT_KEY = t.REPORT_KEY "
            f"INNER JOIN #relevant_bills rb ON rb.bill_key = h.BILL_KEY"
        )
        return int(cursor.fetchone()[0])
    except Exception:
        return None


def _create_bill_key_temp_table(cursor, bill_keys: set[int], name: str = "#relevant_bills") -> None:
    cursor.execute(f"IF OBJECT_ID('tempdb..{name}') IS NOT NULL DROP TABLE {name}")
    cursor.execute(f"CREATE TABLE {name} (bill_key bigint NOT NULL PRIMARY KEY)")
    for chunk in _chunked(sorted(bill_keys), 1000):
        values = ",".join("(?)" for _ in chunk)
        cursor.execute(
            f"INSERT INTO {name} (bill_key) VALUES {values}",
            list(chunk),
        )


def _chunked(seq, size):
    seq = list(seq)
    for i in range(0, len(seq), size):
        yield seq[i:i + size]


# ---------------------------------------------------------------------------
# --introspect mode
# ---------------------------------------------------------------------------

def cmd_introspect(args, log: logging.Logger) -> None:
    log.info("=" * 72)
    log.info("INTROSPECT (no writes)")
    log.info("=" * 72)

    with mssql_connect() as mss:
        cur = mss.cursor()

        all_tables = LOOKUP_TABLES + FILTERED_TABLES
        infos: dict[str, TableInfo] = {}

        log.info("Phase 1/3 — column metadata + naive row counts (%d tables)", len(all_tables))
        missing: list[str] = []
        for t in all_tables:
            if not table_exists(cur, t):
                missing.append(t)
                continue
            cols = list_columns(cur, t)
            if not cols:
                log.warning("  %-26s  EXISTS but no INFORMATION_SCHEMA columns", t)
                continue
            rc = table_row_count(cur, t)
            ti = TableInfo(name=t, columns=cols, row_count=rc)
            if t in LOOKUP_TABLES:
                ti.filter_strategy = "lookup"
            else:
                strat, head = resolve_strategy(t, ti.column_names)
                ti.filter_strategy = strat
                ti.head_table = head
            infos[t] = ti
            log.info("  %-26s  rows=%s  cols=%d  strategy=%s%s",
                     t,
                     f"{rc:,}" if rc is not None else "?",
                     len(cols),
                     ti.filter_strategy,
                     f" via {ti.head_table}" if ti.head_table else "")
        if missing:
            log.info("  Tables not present in this AKTIV install (skipped): %s",
                     ", ".join(missing))

        log.info("Phase 2/3 — bill-key discovery (cohort=%s)", args.cohort)
        bill_keys, distinct_tk = discover_relevant_bill_keys(cur, args.days, log, args.cohort)
        lo, hi = bill_date_range(cur, bill_keys)
        log.info("  Bill-key set size : %d", len(bill_keys))
        log.info("  Distinct TEST_KEYs hit (of %d curated): %d", len(ALL_RESEARCH_TEST_KEYS), distinct_tk)
        log.info("  Bill date range   : %s … %s", lo, hi)

        if bill_keys:
            log.info("Phase 3/3 — estimated filtered row counts")
            _create_bill_key_temp_table(cur, bill_keys)
            for t in FILTERED_TABLES:
                ti = infos.get(t)
                if not ti or ti.filter_strategy == "unsupported":
                    continue
                if ti.filter_strategy == "report_key" and ti.head_table:
                    est = estimate_via_head_table(cur, t, ti.head_table)
                else:
                    est = estimate_filtered_rows(cur, t, ti.filter_strategy, bill_keys)
                ti.estimated_filtered_rows = est
                pct = ""
                if est is not None and ti.row_count:
                    pct = f"  ({100*est/ti.row_count:.1f}% of source)"
                log.info("  %-26s  est=%s%s",
                         t,
                         f"{est:,}" if est is not None else "?",
                         pct)

        # --- emit machine-readable summary -------------------------------
        out_path = SCRIPT_DIR / "introspect_report.json"
        summary = {
            "generated_at_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "cohort": args.cohort,
            "bill_keys_count": len(bill_keys),
            "distinct_test_keys_hit": distinct_tk,
            "curated_test_keys_count": len(ALL_RESEARCH_TEST_KEYS),
            "bill_date_range": {"min": lo, "max": hi},
            "days_window": args.days,
            "missing_tables": missing,
            "tables": [
                {
                    "name": ti.name,
                    "row_count": ti.row_count,
                    "filter_strategy": ti.filter_strategy,
                    "head_table": ti.head_table,
                    "estimated_filtered_rows": ti.estimated_filtered_rows,
                    "columns": [
                        {
                            "name": c.name,
                            "sql_type": c.sql_type,
                            "max_length": c.max_length,
                            "precision": c.precision,
                            "scale": c.scale,
                            "nullable": c.is_nullable,
                            "pg_type": c.pg_type(),
                        }
                        for c in ti.columns
                    ],
                }
                for ti in infos.values()
            ],
        }
        out_path.write_text(json.dumps(summary, indent=2, default=str))
        log.info("Wrote machine-readable report → %s", out_path)


# ---------------------------------------------------------------------------
# --init mode
# ---------------------------------------------------------------------------

DDL_SYNC_LOG = """
CREATE TABLE IF NOT EXISTS etl_sync_log (
  id                       serial PRIMARY KEY,
  synced_at                timestamptz DEFAULT now(),
  mode                     text,
  duration_seconds         numeric,
  relevant_bill_keys_count integer,
  total_rows_synced        bigint,
  rows_per_table           jsonb,
  status                   text,
  error                    text
);
"""


def build_create_table_sql(ti: TableInfo) -> str:
    cols_sql = []
    for c in ti.columns:
        col_def = f"  {pg_ident(c.name)} {c.pg_type()}"
        if not c.is_nullable:
            col_def += " NULL"   # we intentionally relax NOT NULL on mirror
        cols_sql.append(col_def)
    return (
        f"CREATE TABLE {pg_ident(ti.name)} (\n"
        + ",\n".join(cols_sql)
        + "\n);"
    )


def cmd_init(args, log: logging.Logger) -> None:
    log.info("=" * 72)
    log.info("INIT — drop and re-create mirror tables on Neon")
    log.info("=" * 72)

    with mssql_connect() as mss:
        cur = mss.cursor()
        ti_by_name: dict[str, TableInfo] = {}
        for t in LOOKUP_TABLES + FILTERED_TABLES:
            if not table_exists(cur, t):
                log.info("  %s — not present in this AKTIV install, skipping", t)
                continue
            cols = list_columns(cur, t)
            if not cols:
                log.warning("  Skipping %s (no columns)", t)
                continue
            ti_by_name[t] = TableInfo(name=t, columns=cols)

    ddl_statements: list[tuple[str, str]] = []
    for name, ti in ti_by_name.items():
        ddl_statements.append((name, build_create_table_sql(ti)))

    # Dump generated DDL for inspection before running it.
    ddl_path = SCRIPT_DIR / "init_ddl.sql"
    with ddl_path.open("w", encoding="utf-8") as f:
        f.write("-- Auto-generated by etl_research.py --init\n")
        f.write("-- Review carefully before applying to Neon.\n\n")
        f.write(DDL_SYNC_LOG + "\n")
        for name, ddl in ddl_statements:
            f.write(f"-- {name}\n")
            f.write(f"DROP TABLE IF EXISTS {pg_ident(name)} CASCADE;\n")
            f.write(ddl + "\n\n")
    log.info("Wrote DDL preview → %s", ddl_path)

    if args.dry_run:
        log.info("--dry-run set, not executing against Neon.")
        return

    with pg_connect() as pg:
        with pg.cursor() as pcur:
            pcur.execute(DDL_SYNC_LOG)
            for name, ddl in ddl_statements:
                log.info("  CREATE %s", name)
                pcur.execute(f"DROP TABLE IF EXISTS {pg_ident(name)} CASCADE;")
                pcur.execute(ddl)
        pg.commit()
    log.info("INIT complete.")


# ---------------------------------------------------------------------------
# --sync mode
# ---------------------------------------------------------------------------

def cmd_sync(args, log: logging.Logger) -> None:
    log.info("=" * 72)
    log.info("SYNC — mirror lookup + filtered tables")
    log.info("=" * 72)

    started = time.time()
    rows_per_table: dict[str, int] = {}
    bill_keys: set[int] = set()
    status = "ok"
    error: str | None = None

    try:
        with mssql_connect() as mss, pg_connect() as pg:
            mcur = mss.cursor()

            # ---- discover columns + strategies ----
            all_targets: list[TableInfo] = []
            for t in LOOKUP_TABLES + FILTERED_TABLES:
                if args.table and t != args.table:
                    continue
                if not table_exists(mcur, t):
                    log.info("  %s — not present in this AKTIV install, skipping", t)
                    continue
                cols = list_columns(mcur, t)
                if not cols:
                    log.warning("  Skipping %s (no columns)", t)
                    continue
                ti = TableInfo(name=t, columns=cols)
                if t in LOOKUP_TABLES:
                    ti.filter_strategy = "lookup"
                else:
                    strat, head = resolve_strategy(t, ti.column_names)
                    ti.filter_strategy = strat
                    ti.head_table = head
                all_targets.append(ti)

            if not all_targets:
                log.warning("No tables to sync.")
                return

            # ---- bill-key discovery (only if any filtered table targeted) ----
            need_filter = any(ti.filter_strategy not in ("lookup",) for ti in all_targets)
            if need_filter:
                bill_keys, _ = discover_relevant_bill_keys(mcur, args.days, log, args.cohort)
                if not bill_keys:
                    log.warning("Zero bill_keys discovered — filtered tables will be empty.")
                _create_bill_key_temp_table(mcur, bill_keys)

            # ---- mirror each table ----
            for ti in all_targets:
                rows = sync_one_table(mss, mcur, pg, ti, bill_keys, log)
                rows_per_table[ti.name] = rows

    except Exception as e:
        status = "error"
        error = str(e)
        log.exception("Sync failed: %s", e)
        raise
    finally:
        elapsed = round(time.time() - started, 2)
        try:
            with pg_connect() as pg:
                with pg.cursor() as pcur:
                    pcur.execute(
                        "INSERT INTO etl_sync_log "
                        "(mode, duration_seconds, relevant_bill_keys_count, "
                        " total_rows_synced, rows_per_table, status, error) "
                        "VALUES (%s,%s,%s,%s,%s,%s,%s)",
                        (
                            f"sync{f' (days={args.days})' if args.days else ''}",
                            elapsed,
                            len(bill_keys),
                            sum(rows_per_table.values()),
                            json.dumps(rows_per_table),
                            status,
                            error,
                        ),
                    )
                pg.commit()
        except Exception as e:
            log.warning("Failed to write etl_sync_log: %s", e)

        log.info("Synced %d tables, %d total rows in %.1fs (status=%s)",
                 len(rows_per_table), sum(rows_per_table.values()), elapsed, status)


def sync_one_table(mss, mcur, pg, ti: TableInfo, bill_keys: set[int], log: logging.Logger) -> int:
    """Truncate + insert one table. Returns rows written."""
    src_cols = [c.name for c in ti.columns]
    src_select = ", ".join(mssql_ident(c) for c in src_cols)
    dst_cols = ", ".join(pg_ident(c) for c in src_cols)
    src_table = mssql_ident(ti.name)
    dst_table = pg_ident(ti.name)

    # Build the source query per strategy.
    sql, params = build_source_query(ti, src_select, src_table, bill_keys)
    if sql is None:
        log.warning("  %-26s  no usable strategy — skipped", ti.name)
        return 0

    t0 = time.time()
    mcur.execute(sql, params or [])
    written = 0

    with pg.cursor() as pcur:
        pcur.execute(f"TRUNCATE TABLE {dst_table};")
        while True:
            batch = mcur.fetchmany(PG_FETCH_BATCH)
            if not batch:
                break
            psycopg2.extras.execute_values(
                pcur,
                f"INSERT INTO {dst_table} ({dst_cols}) VALUES %s",
                batch,
                page_size=PG_INSERT_BATCH,
            )
            written += len(batch)
    pg.commit()
    log.info("  %-26s  rows=%s  in %.1fs  (strategy=%s)",
             ti.name, f"{written:,}", time.time() - t0, ti.filter_strategy)
    return written


def build_source_query(ti: TableInfo, src_select: str, src_table: str, bill_keys: set[int]):
    """
    Returns (sql, params) for the MSSQL source query.
    """
    if ti.filter_strategy == "lookup":
        return (f"SELECT {src_select} FROM {src_table}", None)

    if ti.filter_strategy == "test_key" and ti.name == "BILL_TEST_DTLS":
        placeholders = ",".join("?" * len(ALL_RESEARCH_TEST_KEYS))
        return (
            f"SELECT {src_select} FROM {src_table} WHERE TEST_KEY IN ({placeholders})",
            list(ALL_RESEARCH_TEST_KEYS),
        )

    if ti.filter_strategy == "test_key":
        # AKTIV_LIS_INPUT
        placeholders = ",".join("?" * len(ALL_RESEARCH_TEST_KEYS))
        return (
            f"SELECT {src_select} FROM {src_table} WHERE TEST_KEY IN ({placeholders})",
            list(ALL_RESEARCH_TEST_KEYS),
        )

    if not bill_keys:
        return (None, None)

    if ti.filter_strategy == "bill_key":
        return (
            f"SELECT {src_select} FROM {src_table} t "
            f"INNER JOIN #relevant_bills rb ON rb.bill_key = t.BILL_KEY",
            None,
        )

    if ti.filter_strategy == "report_key" and ti.head_table:
        return (
            f"SELECT {src_select} FROM {src_table} t "
            f"INNER JOIN {mssql_ident(ti.head_table)} h ON h.REPORT_KEY = t.REPORT_KEY "
            f"INNER JOIN #relevant_bills rb ON rb.bill_key = h.BILL_KEY",
            None,
        )

    if ti.filter_strategy == "bill_number":
        return (
            f"SELECT {src_select} FROM {src_table} t "
            f"INNER JOIN BILL_HEAD bh ON bh.BILL_NUMBER = t.BILL_NUMBER "
            f"INNER JOIN #relevant_bills rb ON rb.bill_key = bh.BILL_KEY",
            None,
        )

    return (None, None)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    g = parser.add_mutually_exclusive_group()
    g.add_argument("--introspect", action="store_true", help="Describe source schema, estimate filtered row counts.")
    g.add_argument("--init", action="store_true", help="Drop and re-create mirror tables on Neon.")
    g.add_argument("--sync", action="store_true", help="Mirror lookup + filtered tables. (default)")
    parser.add_argument("--table", help="Sync only one table by name.")
    parser.add_argument("--days", type=int, help="Restrict bill-key discovery to last N days.")
    parser.add_argument(
        "--cohort",
        choices=("bill", "patient"),
        default="patient",
        help=(
            "bill = only bills containing a curated research test (smaller mirror); "
            "patient = every bill ever issued for any patient in the cohort, so the "
            "mirror captures the full panel — urinalysis, body fluids, CBCs, etc. (default)"
        ),
    )
    parser.add_argument("--dry-run", action="store_true", help="For --init: write DDL file but skip executing on Neon.")
    args = parser.parse_args()

    load_env()
    log = configure_logging()

    if args.introspect:
        cmd_introspect(args, log)
    elif args.init:
        cmd_init(args, log)
    else:
        cmd_sync(args, log)
    return 0


if __name__ == "__main__":
    sys.exit(main())
