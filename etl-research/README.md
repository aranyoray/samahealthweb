# Anubhav Life Care — Research Data ETL

Mirror filtered clinical lab data from the **AKTIV SQL Server** on the clinic LAN to a **Neon Postgres** research project. Three research domains live in this mirror: **anaemia**, **tuberculosis**, **cardiac markers**.

Separate from the sales-dashboard ETL: different directory, different `.env`, different Neon project, different scheduled job.

```
clinic SQL Server  →  this ETL on the clinic PC  →  Neon research project  →  researcher's Mac
   (LAN-only)            (Windows Task Scheduler)         (read-only role)         (DBeaver / pgAdmin / Next.js /data page)
```

---

## File layout

| File                      | Purpose                                                                |
| ------------------------- | ---------------------------------------------------------------------- |
| `etl_research.py`         | Main script — `--introspect`, `--init`, `--sync`, `--table`, `--days`. |
| `research_test_keys.py`   | The curated `TEST_KEY` lists. Edit here to add/remove tests.           |
| `tables.py`               | Which tables to mirror + per-table filter-strategy hints.              |
| `type_mapping.py`         | SQL Server → Postgres type translator.                                 |
| `requirements.txt`        | `pyodbc`, `psycopg2-binary`, `python-dotenv`.                          |
| `.env`                    | Real credentials (gitignored).                                         |
| `.env.example`            | Template.                                                              |

Generated at runtime (gitignored):

| File                      | Created by         | Purpose                                              |
| ------------------------- | ------------------ | ---------------------------------------------------- |
| `introspect_report.json`  | `--introspect`     | Machine-readable schema + row-count dump.            |
| `init_ddl.sql`            | `--init`           | Generated CREATE TABLE statements for review.        |
| `etl.log`                 | every run          | Rotating daily log (7-day retention).                |

---

## One-time setup

### On the clinic PC (Windows)

```cmd
:: 1. Python 3.11+ already installed for the sales ETL — reuse.
:: 2. ODBC Driver 17 for SQL Server — already installed for the sales ETL.
:: 3. Clone or copy this folder to D:\etl-research

cd D:\etl-research
python -m pip install -r requirements.txt

:: 4. Fill in .env (copy from .env.example, paste real Neon URL).
copy .env.example .env
notepad .env
```

### On a Mac / dev laptop (for testing)

```sh
brew install unixodbc
brew tap microsoft/mssql-release https://github.com/Microsoft/homebrew-mssql-release
brew install msodbcsql17
python -m pip install -r requirements.txt
cp .env.example .env  # paste credentials
```

---

## Run order (the gated workflow)

The CRITICAL RULE: **always run `--introspect` first and share the output before generating DDL or syncing.** The result tables (`HAEMATOLOGY_DTLS`, `SPUTUM_HEAD`, etc.) have their own columns that need to be verified before any column-aware code runs.

### 1. Introspect

```cmd
python etl_research.py --introspect
```

Logs go to stdout and `etl.log`. A machine-readable copy lands at `introspect_report.json`.

Output covers:

- Every lookup + filtered table: row count, column count, resolved filter strategy.
- Bill-key discovery: how many `BILL_KEY`s match the curated `TEST_KEY` list, how many distinct `TEST_KEY`s were actually hit, and the date range covered.
- Estimated filtered row count per table.

To peek at just the last week (test slice):

```cmd
python etl_research.py --introspect --days 7
```

### 2. Init — create empty mirror tables on Neon

```cmd
python etl_research.py --init --dry-run    :: writes init_ddl.sql, doesn't touch Neon
notepad init_ddl.sql                       :: review
python etl_research.py --init              :: actually drop + recreate
```

`--init` also creates `etl_sync_log`.

### 3. Sync — pull data

Test slice first:

```cmd
python etl_research.py --sync --days 7
```

Then full sync (no `--days`):

```cmd
python etl_research.py --sync
```

Single table for debugging:

```cmd
python etl_research.py --sync --table HAEMATOLOGY_DTLS
```

---

## Per-table filter strategy

Each filtered table is mirrored using one of these strategies, resolved at runtime against the actual columns reported by `INFORMATION_SCHEMA`:

| Strategy      | Used when                                | SQL                                                       |
| ------------- | ---------------------------------------- | --------------------------------------------------------- |
| `test_key`    | Table has `TEST_KEY`                     | `WHERE TEST_KEY IN (...curated...)`                       |
| `bill_key`    | Table has `BILL_KEY`                     | `INNER JOIN #relevant_bills ON BILL_KEY`                  |
| `report_key`  | Table has `REPORT_KEY` but no `BILL_KEY` | `JOIN *_HEAD ON REPORT_KEY JOIN #relevant_bills`          |
| `bill_number` | Table is keyed on `BILL_NUMBER` (LIS)    | `JOIN BILL_HEAD ON BILL_NUMBER JOIN #relevant_bills`      |

For the bill-key set (likely 30–60k rows), the ETL uses a SQL Server temp table (`#relevant_bills`) rather than a 60k-element `IN (...)` clause — much faster and well below the 2100-parameter cap.

---

## Editing the test filter

Open `research_test_keys.py`, edit the list, save. Next sync picks it up. To re-discover the bill-key set against the new filter, just re-run `--introspect` or `--sync`.

---

## Scheduling (nightly)

Research data does not need 30-minute freshness like sales. Once a night is plenty.

```cmd
schtasks /create /tn "AnubhavResearchETL" /tr "C:\Python311\python.exe D:\etl-research\etl_research.py --sync" /sc daily /st 02:00 /ru SYSTEM /f
```

---

## Logs

Rotating daily file at `etl.log`, 7-day retention. Each run logs start time, bill-key count, rows per table, total duration, and success/failure. Exit code 0 on success, 1 on failure.

`etl_sync_log` on Neon also stores the same summary as a row per run, with `rows_per_table` as JSONB.

---

## Sample researcher queries

```sql
-- Anaemia cohort: latest Hb per patient with sex from MAST_PATIENT
SELECT  p.patient_key,
        p.name,
        p.sex,
        EXTRACT(YEAR FROM age(p.dob))           AS age_years,
        h.value_numeric                         AS hb,
        h.report_date
FROM    mast_patient p
JOIN    haematology_dtls h ON h.patient_key = p.patient_key
WHERE   h.parameter_name ILIKE 'haemoglobin'
ORDER BY h.report_date DESC;
```

```sql
-- TB-positive patients (any modality)
SELECT DISTINCT p.patient_key, p.name, p.sex, bh.billdate
FROM   mast_patient p
JOIN   bill_head bh ON bh.patient_key = p.patient_key
WHERE  EXISTS (
  SELECT 1 FROM sputum_dtls sd
   JOIN sputum_head sh ON sh.report_key = sd.report_key
  WHERE sh.bill_key = bh.bill_key
    AND sd.result ILIKE '%positive%'
)
   OR EXISTS (
  SELECT 1 FROM serology_dtls sed
   JOIN serology_head seh ON seh.report_key = sed.report_key
  WHERE seh.bill_key = bh.bill_key
    AND sed.parameter_name ILIKE '%igra%'
    AND sed.result ILIKE '%react%'
);
```

> Column names like `value_numeric`, `parameter_name`, `result` are placeholders — replace with the real columns after `--introspect` runs.

---

## Connecting from the researcher's Mac

DBeaver / pgAdmin: paste `NEON_RESEARCH_DATABASE_URL` (or, better, the read-only role's URL). For ad-hoc CLI:

```sh
psql "postgresql://research_ro:...@ep-xxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
```

Create the read-only role once in Neon's SQL editor:

```sql
CREATE ROLE research_ro LOGIN PASSWORD '...';
GRANT CONNECT ON DATABASE neondb TO research_ro;
GRANT USAGE ON SCHEMA public TO research_ro;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO research_ro;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO research_ro;
```

The Next.js `/data` page on `samahealthweb` should use this read-only role, not the `neondb_owner` role.

---

## Troubleshooting

- **`pyodbc.InterfaceError: IM002`** — ODBC Driver 17 for SQL Server is not installed.
- **Sync hangs on a filtered table** — likely the temp-table strategy fell back to a large IN clause. Re-run `--introspect` and check the `filter_strategy` reported for that table.
- **`numeric field overflow`** on Neon insert — `type_mapping.py` resolved `decimal(p,s)` against the wrong precision. Check `introspect_report.json` for the actual `precision`/`scale` and adjust.
- **Stale data** — Task Scheduler job didn't fire (check Event Viewer) or `MSSQL_PASSWORD` rotated.
