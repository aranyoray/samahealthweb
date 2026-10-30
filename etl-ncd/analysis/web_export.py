#!/usr/bin/env python3
"""Trim analysis/results into the one JSON file the /ncd page reads.

    python analysis/web_export.py        # writes app/ncd/data/aktiv.json

Input is only the committed aggregates in analysis/results (no patient-level
rows), so this runs anywhere, not just on the clinic PC. Rerun it after
build_report.py whenever the results are refreshed.
"""
from __future__ import annotations

import csv
import json
from collections import defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
RES = HERE / "results"
OUT = HERE.parent.parent / "app" / "ncd" / "data" / "aktiv.json"


def r1(x: float | None) -> float | None:
    return None if x is None else round(float(x), 1)


def main() -> None:
    s = json.loads((RES / "summary.json").read_text())
    pop, cas, prog = s["population"], s["cascade"], s["progression"]

    prevalence = []
    with open(RES / "prevalence.csv", newline="") as f:
        for r in csv.DictReader(f):
            prevalence.append({
                "condition": r["condition"], "category": r["category"],
                "tested": int(r["tested"]), "positive": int(r["positive"]),
                "pct": r1(r["prevalence_pct"]), "lo": r1(r["ci_low"]), "hi": r1(r["ci_high"]),
                "std": r1(r["age_sex_standardised_pct"]) if r["age_sex_standardised_pct"] else None,
            })

    # Crude adult prevalence by sex (the file's "all" age band), for the NFHS women / men rows.
    by_sex: dict[str, dict[str, list[int]]] = defaultdict(lambda: {"F": [0, 0], "M": [0, 0]})
    with open(RES / "prevalence_by_age_sex.csv", newline="") as f:
        for r in csv.DictReader(f):
            if r["sex"] in ("F", "M") and r["age_band"] == "all":
                c = by_sex[r["condition"]][r["sex"]]
                c[0] += int(r["tested"])
                c[1] += int(r["positive"])
    sex = {
        cond: {k: {"tested": t, "positive": p, "pct": r1(100 * p / t) if t else None} for k, (t, p) in v.items()}
        for cond, v in by_sex.items()
        if cond in ("Diabetes (confirmed)", "Diabetes incl. unconfirmed", "Hypothyroidism (any)", "Anaemia (WHO)",
                    "CKD: eGFR < 60 (ever)", "Fatty liver on USG", "LDL >= 130")
    }

    with open(RES / "rates_by_year.csv", newline="") as f:
        rows = list(csv.DictReader(f))
    conds = [k[: -len(" tested")] for k in rows[0] if k.endswith(" tested") and "per 1000" not in k]
    by_year = [
        {"year": int(r["year"]), "adults": int(r["adults_seen"]),
         "rates": {c: {"tested": int(r[f"{c} tested"]), "per1000": round(float(r[f"{c} per 1000 tested"]))} for c in conds}}
        for r in rows
    ]

    pairs = []
    with open(RES / "pairwise_associations.csv", newline="") as f:
        for r in csv.DictReader(f):
            try:
                lo, aor = float(r["adj_or_lo"]), float(r["adj_or"])
            except ValueError:
                continue
            if int(r["n_tested_both"]) >= 500 and lo > 1 and aor < 1000:
                pairs.append({"a": r["a"], "b": r["b"], "n": int(r["n_tested_both"]),
                              "pba": r1(r["p_b_given_a_pct"]), "pbna": r1(r["p_b_given_not_a_pct"]),
                              "aor": round(aor, 2), "lo": round(lo, 2), "hi": round(float(r["adj_or_hi"]), 2)})
    # Each pair appears once per direction; keep the direction listed first.
    seen: set[frozenset[str]] = set()
    pairs = [p for p in pairs if not (frozenset((p["a"], p["b"])) in seen or seen.add(frozenset((p["a"], p["b"]))))]
    pairs.sort(key=lambda p: -p["aor"])

    with open(RES / "condition_accrual.csv", newline="") as f:
        accrual = [{"condition": r["condition"], "negEarly": int(r["negative_early"]), "newLater": int(r["new_positive_later"]),
                    "pct": r1(r["new_positive_pct"])} for r in csv.DictReader(f)]
    accrual.sort(key=lambda a: -a["negEarly"])

    mm = s["multimorbidity"]
    out = {
        "generated": s["generated"],
        "population": {
            "from": pop["date_range"][0], "to": pop["date_range"][1],
            "bills": pop["bills"], "persons": pop["persons_total"], "adults": pop["adults"],
            "children": pop["children_under18"], "femalePct": r1(pop["adult_female_pct"]), "medianAge": pop["adult_median_age"],
            "repeat": pop["adults_with_2plus_visits"], "followed1y": pop["adults_followed_1yr_plus"],
            "results": pop["numeric_results"], "usg": pop["usg_reports"], "echo": pop["echo_reports"],
        },
        "prevalence": prevalence,
        "bySex": sex,
        "byYear": by_year,
        "multimorbidity": {
            "domains": mm["domains"],
            "tested3": {"persons": mm["min_tested_3"]["persons"], "pct": {k: r1(v) for k, v in mm["min_tested_3"]["pct"].items()},
                        "twoPlusByAge": {k: r1(v["two_plus_pct"]) for k, v in mm["min_tested_3"]["by_age"].items()}},
            "anyTested": {"persons": mm["min_tested_1"]["persons"], "pct": {k: r1(v) for k, v in mm["min_tested_1"]["pct"].items()}},
            "topCombos": mm["top_combinations"][:10],
        },
        "pairs": pairs,
        "ckm": {"n": s["ckm"]["n_evaluable"], "pct": {k: r1(v) for k, v in s["ckm"]["stage_pct"].items()},
                "twoPlusByAge": {a: r1(sum(v for k, v in d.items() if int(k) >= 2)) for a, d in s["ckm"]["by_age_pct"].items()}},
        "cascade": {
            "dmN": cas["dm_n"], "hba1c": r1(cas["dm_with_hba1c_pct"]), "creat": r1(cas["dm_egfr_tested_pct"]),
            "acr": r1(cas["dm_acr_tested_pct"]), "lipid": r1(cas["dm_lipid_tested_pct"]), "usg": r1(cas["dm_usg_liver_pct"]),
            "echo": r1(cas["dm_echo_pct"]),
            "control": {k: r1(v) for k, v in cas["dm_hba1c_control_dist_pct"].items()},
            "dmCkd": r1(cas["dm_ckd_pct_among_egfr_tested"]), "dmAlb": r1(cas["dm_albuminuria_pct_among_acr_tested"]),
            "dmFatty": r1(cas["dm_fatty_pct_among_usg"]),
            "ckdN": cas["ckd_n"], "ckdAcr": r1(cas["ckd_with_acr_pct"]), "ckdAnaemia": r1(cas["ckd_anaemia_pct"]),
            "nonCkdAnaemia": r1(cas["nonckd_anaemia_pct"]), "ckdStages": cas["ckd_g_stage_dist"],
            "fattyN": cas["fatty_n"], "fattyGrades": cas["fatty_grade_dist"], "fattyLft": r1(cas["fatty_with_lft_pct"]),
            "fattyTrans": r1(cas["fatty_transaminitis_pct"]), "fattyFib4": r1(cas["fatty_fib4_indet_plus_pct"]),
        },
        "progression": {
            "preN": prog["fbs"]["prediabetic_first_n"], "preToDm": r1(prog["fbs"]["pre_to_diabetic_range_pct"]),
            "preToDmPer100py": r1(prog["fbs"]["pre_to_diabetic_rate_per_100py"]), "preReverted": r1(prog["fbs"]["pre_reverted_to_normal_pct"]),
            "a1cN": prog["hba1c"]["persons_repeat"], "a1cStillHigh": r1(prog["hba1c"]["still_uncontrolled_among_first_uncontrolled_pct"]),
            "egfrN": prog["egfr"]["persons_slope"], "egfrSlope": r1(prog["egfr"]["median_slope"]),
            "egfrRapid": r1(prog["egfr"]["rapid_decline_pct(<=-5/yr)"]), "egfrNewCkd": r1(prog["egfr"]["new_ckd_pct(first>=60,last<60)"]),
            "ckdIncidence": {k: {"atRisk": v["at_risk"], "events": v["events"], "per100py": r1(v["rate_per_100py"])}
                             for k, v in prog["egfr_incidence_by_group"].items()},
            "usgN": s["fatty_liver_progression"]["persons_repeat_usg"],
            "usgNewFatty": r1(s["fatty_liver_progression"]["new_fatty_liver_pct(first 0, last >=1)"]),
            "usgNormalN": s["fatty_liver_progression"]["n_first_normal"],
            "subN": prog["tsh"]["subclinical_first_n"], "subOvert": r1(prog["tsh"]["sub_to_overt_pct(>10)"]),
            "subNormalised": r1(prog["tsh"]["sub_normalised_pct"]),
        },
        "accrual": accrual,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, indent=1) + "\n")
    print(f"wrote {OUT.relative_to(HERE.parent.parent)} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
