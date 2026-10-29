"""
Stage 3a: shape the aggregate results into one JSON blob for the report page.

    python analysis/report_data.py   ->  out/results/report_data.json  (aggregates only)

Also lays out the condition network (networkx spring layout, seeded) so the
page can draw it as static SVG without a library.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import networkx as nx
import numpy as np
import pandas as pd
from scipy import stats

HERE = Path(__file__).resolve().parent
RES = HERE.parent / "out" / "results"
DS = HERE.parent / "out" / "dataset"

CATEGORY_ORDER = ["Metabolic", "Renal", "Cardiac", "Hepatic", "Thyroid", "Haematologic", "Inflammatory", "Urological", "Reproductive-metabolic", "Respiratory"]
STRATA_CONDITIONS = ["Diabetes (confirmed)", "Dyslipidaemia (any)", "Fatty liver on USG", "CKD: eGFR < 60 (ever)", "Hypothyroidism (any)", "Anaemia (WHO)", "LV hypertrophy", "Hyperuricaemia", "Transaminitis (ALT > 40 or AST > 35)"]
MATRIX_NODES = ["Diabetes", "Prediabetes", "High TG", "Low HDL", "High LDL", "Hyperuricaemia", "Fatty liver", "Transaminitis", "FIB-4 indet/high",
                "CKD (eGFR<60)", "Albuminuria", "Proteinuria (dipstick)", "Renal USG changes", "Anaemia", "Raised CRP", "Hypothyroid", "LVH", "Diastolic dysfn", "IHD (echo)", "Structural heart dis."]


def clean(o):
    """JSON-safe copy: NaN / inf -> null (JSON.parse rejects the Python literals), numpy scalars -> Python."""
    if isinstance(o, dict):
        return {str(k): clean(v) for k, v in o.items()}
    if isinstance(o, (list, tuple)):
        return [clean(v) for v in o]
    if isinstance(o, (np.floating, float)):
        return None if (np.isnan(o) or np.isinf(o)) else float(o)
    if isinstance(o, (np.integer,)):
        return int(o)
    if isinstance(o, (np.bool_,)):
        return bool(o)
    return o


def poisson_irr(e1, py1, e0, py0):
    r1, r0 = e1 / py1, e0 / py0
    irr = r1 / r0
    se = np.sqrt(1 / e1 + 1 / e0)
    return irr, np.exp(np.log(irr) - 1.96 * se), np.exp(np.log(irr) + 1.96 * se)


def main() -> int:
    s = json.loads((RES / "summary.json").read_text(encoding="utf-8"))
    prev = pd.read_csv(RES / "prevalence.csv")
    strata = pd.read_csv(RES / "prevalence_by_age_sex.csv")
    pw = pd.read_csv(RES / "pairwise_associations.csv")
    yr = pd.read_csv(RES / "rates_by_year.csv")
    acc = pd.read_csv(RES / "condition_accrual.csv")
    rho = pd.read_csv(RES / "spearman_partial_age_sex.csv", index_col=0)
    nmat = pd.read_csv(RES / "spearman_n.csv", index_col=0)

    out = {"generated": s["generated"], "population": s["population"], "cascade": s["cascade"], "ckm": s["ckm"], "multimorbidity": s["multimorbidity"],
           "progression": s["progression"], "fatty_liver_progression": s["fatty_liver_progression"]}

    # Prevalence by category.
    prev["category"] = pd.Categorical(prev.category, CATEGORY_ORDER)
    prev = prev.sort_values("category", kind="stable")   # keep the clinical order of CONDITIONS within a category
    out["prevalence"] = [
        {"category": cat, "rows": [{k: (None if pd.isna(v) else (float(v) if isinstance(v, (float, np.floating)) else int(v) if isinstance(v, (int, np.integer)) else v)) for k, v in r.items()}
                                   for r in g.drop(columns=["category"]).to_dict(orient="records")]}
        for cat, g in prev.groupby("category", observed=True, sort=False)
    ]

    # Age-sex strata for the small multiples.
    st = strata[strata.condition.isin(STRATA_CONDITIONS) & strata.age_band.ne("all")]
    out["strata"] = {c: {sex: [{"band": b, "pct": float(r.prevalence_pct), "n": int(r.tested)} for b, r in g[g.sex.eq(sex)].set_index("age_band").reindex(["18-29", "30-44", "45-59", "60-74", "75+"]).iterrows() if pd.notna(r.tested)]
                         for sex in ["F", "M"]} for c, g in st.groupby("condition")}

    # Adjusted-OR matrix among core nodes (symmetric: a->b and b->a differ only in direction; use a->b as stored).
    mat = {}
    for _, r in pw.iterrows():
        if r.a in MATRIX_NODES and r.b in MATRIX_NODES:
            mat[f"{r.a}|{r.b}"] = {"adj_or": None if pd.isna(r.adj_or) else float(r.adj_or), "lo": None if pd.isna(r.adj_or_lo) else float(r.adj_or_lo), "hi": None if pd.isna(r.adj_or_hi) else float(r.adj_or_hi),
                                   "p": None if pd.isna(r.adj_p) else float(r.adj_p), "n": int(r.n_tested_both), "p_b_given_a": float(r.p_b_given_a_pct), "p_b_given_not_a": float(r.p_b_given_not_a_pct), "rr": None if pd.isna(r.relative_risk) else float(r.relative_risk)}
    out["matrix"] = {"nodes": MATRIX_NODES, "cells": mat}

    # Strongest links table (one direction per unordered pair: the one with larger n_a is kept).
    sig = pw[(pw.adj_p < 0.001) & (pw.adj_or > 1.3)].copy()
    sig["key"] = sig.apply(lambda r: "|".join(sorted([r.a, r.b])), axis=1)
    sig = sig.sort_values("adj_or", ascending=False).drop_duplicates("key")
    out["top_links"] = [{"a": r.a, "b": r.b, "n": int(r.n_tested_both), "p_b_given_a": float(r.p_b_given_a_pct), "p_b_given_not_a": float(r.p_b_given_not_a_pct), "rr": float(r.relative_risk), "adj_or": float(r.adj_or), "lo": float(r.adj_or_lo), "hi": float(r.adj_or_hi)}
                        for _, r in sig.head(30).iterrows()]

    # Network layout.
    net = s["network"]
    G = nx.Graph()
    for e in net["edges"]:
        G.add_edge(e["a"], e["b"], weight=e["log_or"], adj_or=e["adj_or"])
    comm_of = {}
    for i, c in enumerate(net["communities"]):
        for n in c:
            comm_of[n] = i
    pos = nx.spring_layout(G, weight="weight", seed=7, k=0.9, iterations=400)
    # Nudge each community toward its own anchor so the three clusters read as regions.
    anchors = {0: np.array([-1, -0.3]), 1: np.array([1, -0.3]), 2: np.array([0, 1.0])}
    xy = {n: 0.55 * np.array(pos[n]) + 0.65 * anchors.get(comm_of.get(n, 0), np.zeros(2)) for n in G}
    pos2 = nx.spring_layout(G, pos=xy, fixed=None, weight="weight", seed=7, k=0.6, iterations=60)
    xs = np.array([p[0] for p in pos2.values()]); ys = np.array([p[1] for p in pos2.values()])
    names = list(G)
    P2 = np.array([[(pos2[n][0] - xs.min()) / (xs.max() - xs.min() + 1e-9), (pos2[n][1] - ys.min()) / (ys.max() - ys.min() + 1e-9)] for n in names])
    # Push overlapping nodes apart so labels stay legible (the hub cluster is dense). Units: fraction of the canvas.
    P2[:, 0] *= 1.6                      # the canvas is wider than tall
    for _ in range(400):
        moved = False
        for i in range(len(names)):
            for j in range(i + 1, len(names)):
                d = P2[j] - P2[i]
                dist = float(np.hypot(*d))
                if dist < 0.19:
                    push = (0.19 - dist) / 2 * (d / dist if dist > 1e-6 else np.array([1.0, 0.0]))
                    P2[i] -= push; P2[j] += push; moved = True
        if not moved:
            break
    P2[:, 0] = (P2[:, 0] - P2[:, 0].min()) / (P2[:, 0].max() - P2[:, 0].min() + 1e-9)
    P2[:, 1] = (P2[:, 1] - P2[:, 1].min()) / (P2[:, 1].max() - P2[:, 1].min() + 1e-9)
    deg = dict(G.degree(weight="weight"))
    out["network"] = {
        "nodes": [{"id": n, "x": float(P2[k][0]), "y": float(P2[k][1]),
                   "community": comm_of.get(n, 0), "weighted_degree": float(deg[n]), "degree": int(G.degree(n))} for k, n in enumerate(names)],
        "edges": [{"a": a, "b": b, "adj_or": float(d["adj_or"]), "log_or": float(d["weight"])} for a, b, d in G.edges(data=True)],
        "communities": net["communities"],
        "community_names": ["Metabolic-hepatic", "Renal-anaemia-inflammatory", "Cardiac"],
        "centrality": sorted(net["nodes"], key=lambda n: -n["weighted_degree"])[:8],
    }

    # Correlations: top partial Spearman pairs with n >= 300, and a compact matrix of the main markers.
    main = ["HbA1c", "Fasting glucose", "Triglycerides", "HDL", "LDL", "Uric acid", "eGFR", "UACR", "ALT", "GGT", "Haemoglobin", "TSH", "CRP", "LVEF (min)", "Fatty liver grade"]
    out["correlations"] = {"labels": main, "partial_rho": [[None if pd.isna(rho.loc[i, j]) or nmat.loc[i, j] < 300 else float(rho.loc[i, j]) for j in main] for i in main],
                           "n": [[int(nmat.loc[i, j]) if pd.notna(nmat.loc[i, j]) else 0 for j in main] for i in main]}

    # Incidence rate ratios for new CKD (eGFR < 60) by group.
    inc = s["progression"]["egfr_incidence_by_group"]
    irr = {}
    base = inc.get("no diabetes (tested)")
    for k, v in inc.items():
        if base and k != "no diabetes (tested)" and v["events"] and base["events"]:
            r, lo, hi = poisson_irr(v["events"], v["person_years"], base["events"], base["person_years"])
            irr[k] = {"irr_vs_no_diabetes": float(r), "lo": float(lo), "hi": float(hi)}
    out["ckd_incidence"] = {"groups": inc, "irr": irr}

    out["rates_by_year"] = yr.to_dict(orient="records")
    out["accrual"] = acc.to_dict(orient="records")

    # Headline facts for stat tiles.
    pop = s["population"]
    P = pd.read_parquet(DS / "features.parquet", columns=["adult", "gly_tested", "lip_tested", "egfr_tested", "thy_tested", "hb_tested", "usg_liver_tested", "echo_tested", "dm_any", "dyslip", "ckd_egfr_ever", "hypothyroid", "anaemia", "fatty", "shd", "span_days", "n_bills"])
    a = P[P.adult]
    any_t = a.gly_tested | a.lip_tested | a.egfr_tested | a.thy_tested | a.hb_tested | a.usg_liver_tested | a.echo_tested
    any_c = a.dm_any | a.dyslip | a.ckd_egfr_ever | a.hypothyroid | a.anaemia | a.fatty | a.shd
    out["headline"] = {"adults_tested_any_domain": int(any_t.sum()), "adults_with_any_condition": int((any_t & any_c).sum()),
                       "pct_any_condition_among_tested": 100 * float((any_t & any_c).sum() / any_t.sum()),
                       "adults_followed_1yr": int((a.span_days >= 365).sum()), "adults_repeat": int((a.n_bills >= 2).sum())}
    (RES / "report_data.json").write_text(json.dumps(clean(out), indent=1, allow_nan=False, default=str), encoding="utf-8")
    print("wrote", RES / "report_data.json", (RES / "report_data.json").stat().st_size, "bytes")
    print("headline", out["headline"])
    print("ckd irr", irr)
    print("network nodes", len(out["network"]["nodes"]), "edges", len(out["network"]["edges"]))
    return 0


if __name__ == "__main__":
    sys.exit(main())
