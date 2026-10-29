# NCD results from AKTIV

Pulls the lab results the [/ncd](../app/ncd) page needs from the AKTIV SQL Server:
- HbA1c and fasting sugar
- creatinine and urine ACR
- lipids
- TSH and free T4
- SGPT and SGOT
- platelets

Each reported parameter becomes one row, in the shape of the planned Neon `lab_results` view. It runs on the clinic PC, because AKTIV is only reachable on the clinic LAN.

```
AKTIV SQL Server  →  ncd_extract.py on the clinic PC  →  out/lab_results_<month>.csv (stays on this PC)
```

## What it will and won't do

- **Read-only.** It only runs SELECTs and reads schema views. It creates no tables (not even temp tables) and changes nothing in AKTIV.
- **Never during clinic hours.** It refuses to start between 07:00 and 20:00 IST. A long export stops on its own 30 minutes before 07:00, so you can resume the next night with `--since`.
- **No locks.** Reads use `READ UNCOMMITTED` with a 5-second lock timeout and low deadlock priority, so AKTIV always wins.
- **No Neon writes.** Neon is near its monthly compute limit, so loading data there is a separate, agreed step.
- **No free text.** `*_DESC` and `*_PAD` tables are never read. Neither are remark, comment or interpretation columns.
- **Exports stay on this PC.** The CSVs contain names and phone numbers, which are needed to join visits into one person. `out/` and `*.csv` are gitignored.

## Setup (once, on the clinic PC)

Python and ODBC Driver 17/18 are already installed for the existing ETLs.

```cmd
cd D:\samahealthweb
git pull
cd etl-ncd
python -m pip install -r requirements.txt
```

If `..\etl-research\.env` exists, the script uses its AKTIV credentials. Otherwise, set them up here:

```cmd
copy .env.example .env
notepad .env
```

## Step 1: introspect (after 20:00 IST)

```cmd
python ncd_extract.py --introspect
```

This writes two files. Neither contains patient data.

| File | What it holds |
| --- | --- |
| `ncd_introspect.json` | The NCD tests found in `MAST_TEST`, plus the columns and approximate size of every result table. It also lists which parameter names in the parameter master map to which code. |
| `ncd_mapping.proposed.json` | A guess at which column is the bill date, patient name, phone, result value, unit, reference range and so on. |

Send both back, either by committing them or by copying them across:

```cmd
git add ncd_introspect.json ncd_mapping.proposed.json
git commit -m "etl-ncd: introspect output"
git push
```

Column names differ between AKTIV installs, so the guesses get checked against the real schema. The reviewed copy comes back as `ncd_mapping.json` with `"confirmed": true`. The export refuses to run without it.

## Step 2: export (after 20:00 IST)

```cmd
git pull
python ncd_extract.py --export --since 2022-10-01
```

It works through one month at a time, with a short pause between months. Each month goes to its own file, `out\lab_results_YYYY-MM.csv`. If it stops before 07:00, re-run the next night from the month it printed.

Each row holds:
- the bill: `bill_key`, `regt_key`, `patient_key`, `bill_date`, `report_date`
- the patient: `name`, `phone`, `age`, `sex`
- the test: `test_key`, `testname`, `parameter`
- `code`, one of HBA1C, FBS, CREAT, UACR, LDL, HDL, TG, TSH, FT4, ALT, AST, PLT
- the result: `value_text`, `value_num`, `unit`, `ref_low`, `ref_high`, `flag`
- `source_table`

`value_num` is empty for results like `<5` or `Positive`, and the original text stays in `value_text`.

## Step 3: real numbers on /ncd

The /ncd page's pipeline links visits into people and computes the follow-up figures. Running it on these CSVs on this PC gives totals and percentages only, with no names, phones or rows. Those are what get committed to replace the simulated cohort. This step is built once step 2 has produced real files, so it can be checked against them.

## Files

| File | Purpose |
| --- | --- |
| `ncd_extract.py` | `--introspect` and `--export`. |
| `ncd_tests.py` | Which tests and parameter names count, and how each maps to a code. Run `python ncd_tests.py` to self-check. |
| `requirements.txt` | `pyodbc`, `python-dotenv`. |
| `.env.example` | AKTIV connection names. |
