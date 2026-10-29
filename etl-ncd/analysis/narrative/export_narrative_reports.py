#!/usr/bin/env python3
"""Export AKTIV narrative reports (RTF -> plain text) for the NCD analysis.

Same shape and approach as export_usg_reports.py, generalised:
  python export_narrative_reports.py CARDIOLOGY_HEAD -o cardiology_reports.csv
  python export_narrative_reports.py USG_HEAD --since 2026-07-19 -o usg_reports_since_2026-07-19.csv

Credentials come from C:\\Users\\admin\\anubhavapi\\.env (MSSQL_*), never hardcoded.
Reads are READ UNCOMMITTED and streamed; run it after clinic hours.
"""
from __future__ import annotations
import argparse, csv, os, sys, time
from pathlib import Path

import pymssql
from dotenv import load_dotenv
from striprtf.striprtf import rtf_to_text

load_dotenv(Path(r"C:\Users\admin\anubhavapi\.env"))

FIELDS = ["report_key", "bill_key", "report_date", "exam_date", "title1", "title2",
          "radiologist_key", "confirm_report", "linecount", "report_text"]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("table")
    ap.add_argument("--since", default=None, help="REPORTDATE >= this ISO date")
    ap.add_argument("-o", "--out", required=True)
    args = ap.parse_args()
    where = "u.REPORT_DESC IS NOT NULL AND LEN(u.REPORT_DESC) > 10"
    params: tuple = ()
    if args.since:
        where += " AND u.REPORTDATE >= %s"
        params = (args.since,)
    sql = f"""
        SELECT u.REPORT_KEY, u.BILL_KEY, CONVERT(varchar(10), u.REPORTDATE, 23), CONVERT(varchar(10), u.EXAMDATE, 23),
               u.REPORT_TITLE1, u.REPORT_TITLE2, u.INVESTIGATOR1_KEY, u.CONFIRM_REPORT, u.LINECOUNT, u.REPORT_DESC
        FROM {args.table} u WHERE {where} ORDER BY u.REPORTDATE, u.REPORT_KEY"""
    conn = pymssql.connect(server=os.environ["MSSQL_HOST"], port=os.environ.get("MSSQL_PORT", "1433"),
                           user=os.environ["MSSQL_USER"], password=os.environ["MSSQL_PASSWORD"],
                           database=os.environ["MSSQL_DB"], tds_version=os.environ.get("MSSQL_TDS_VERSION", "7.0"),
                           login_timeout=15, timeout=1200)
    cur = conn.cursor()
    cur.execute("SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED")
    cur.execute(sql, params)
    n, bad, t0 = 0, 0, time.time()
    with open(args.out, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(FIELDS)
        while True:
            rows = cur.fetchmany(500)
            if not rows:
                break
            for r in rows:
                rtf = r[9] or ""
                try:
                    text = rtf_to_text(rtf, errors="ignore") if rtf.lstrip().startswith("{\\rtf") else rtf
                except Exception:
                    text, bad = rtf, bad + 1
                w.writerow(list(r[:9]) + [text])
                n += 1
            if n % 5000 == 0:
                print(f"{n} rows {time.time() - t0:.0f}s", flush=True)
    print(f"wrote {n} rows ({bad} rtf failures) -> {args.out} in {time.time() - t0:.0f}s")
    return 0


if __name__ == "__main__":
    sys.exit(main())
