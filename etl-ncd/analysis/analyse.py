"""
Stage 2 of the NCD burden analysis: person-level conditions, category
prevalence, the cardio-kidney-metabolic network, within-person multimorbidity
and progression. Aggregates only; nothing written here identifies a person.

    python analysis/analyse.py

Reads out/dataset/*.parquet (build_dataset.py); writes out/results/*.json|csv.

Definitions (thresholds match app/ncd + app/diabetes where they overlap):
  Diabetes        HbA1c >= 6.5 ever, or glucose in the diabetic range (FBS >= 126,
                  PP >= 200, random >= 200) on two different days or two tests on
                  one day (ADA). One isolated diabetic-range glucose = "unconfirmed".
  Prediabetes     latest glycaemic status: HbA1c 5.7-6.4 / FBS 100-125 / PP 140-199, not diabetic.
  Dyslipidaemia   latest profile: LDL >= 130 or TC >= 200 or TG >= 150 or HDL < 40 (M) / < 50 (F).
  Hyperuricaemia  latest uric acid > 7.0 (M) / > 6.0 (F).
  CKD             eGFR (CKD-EPI 2021) < 60 ever; "persistent" = twice >= 90 days apart.
  Albuminuria     UACR >= 30 mg/g ever; proteinuria = dipstick protein >= 1+ on >= 2 days.
  Hypothyroid     latest TSH > 10 (overt) or 4.5-10 (subclinical); hyper = TSH < 0.45 (overt < 0.1).
  Transaminitis   latest ALT > 40 or AST > 35 U/L (lab upper limits). FIB-4 on same-bill AST/ALT/PLT, age >= 35.
  Anaemia         latest Hb < 13 (M) / < 12 (F), age >= 15 (WHO); severe < 8, moderate 8-10.9.
  Fatty liver     any USG report grading hepatic steatosis (grade I-III or ungraded).
  Heart (echo)    LVEF < 50; LVH; diastolic dysfunction grade >= II; RWMA / IHD; mod-severe valve; PH.
"""

from __future__ import annotations

import itertools
import json
import sys
import time
import warnings
from pathlib import Path

import numpy as np
import pandas as pd
from scipy import stats

warnings.filterwarnings("ignore")
HERE = Path(__file__).resolve().parent
DS = HERE.parent / "out" / "dataset"
RES = HERE.parent / "out" / "results"
AGE_BANDS = [(18, 29), (30, 44), (45, 59), (60, 74), (75, 120)]
AGE_LABELS = ["18-29", "30-44", "45-59", "60-74", "75+"]


def age_band(a):
    return pd.cut(a, [b[0] for b in AGE_BANDS] + [121], labels=AGE_LABELS, right=False)


def wilson(k: int, n: int, z: float = 1.96) -> tuple[float, float]:
    if n == 0:
        return (float("nan"), float("nan"))
    p = k / n
    d = 1 + z * z / n
    c = (p + z * z / (2 * n)) / d
    h = z * np.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d
    return (100 * (c - h), 100 * (c + h))


def ckd_epi_2021(creat, age, sex):
    female = sex == "F"
    k = np.where(female, 0.7, 0.9)
    a = np.where(female, -0.241, -0.302)
    r = creat / k
    return 142 * np.minimum(r, 1) ** a * np.maximum(r, 1) ** -1.2 * 0.9938 ** age * np.where(female, 1.012, 1.0)


# ---------------------------------------------------------------------------
# Person-level features
# ---------------------------------------------------------------------------

def latest_first(obs: pd.DataFrame, code: str) -> pd.DataFrame:
    o = obs[obs.code.eq(code) & obs.value.notna()].sort_values("date")
    g = o.groupby("person_id")
    return pd.DataFrame({
        f"{code}_last": g.value.last(), f"{code}_first": g.value.first(),
        f"{code}_max": g.value.max(), f"{code}_min": g.value.min(),
        f"{code}_n": g.size(), f"{code}_dfirst": g.date.first(), f"{code}_dlast": g.date.last(),
    })


def build_features(persons, bills, obs, usg, car):
    P = persons.set_index("person_id").copy()
    last_age = bills.sort_values("date").groupby("person_id").age.last()
    P["age"] = last_age
    P["age_first"] = bills.sort_values("date").groupby("person_id").age.first()
    P["span_days"] = (P.last_date - P.first_date).dt.days

    # Derived observations: eGFR per creatinine row, FIB-4 per bill.
    cr = obs[obs.code.eq("CREAT") & obs.value.notna() & obs.age.notna() & obs.sex.isin(["M", "F"])].copy()
    cr["value"] = ckd_epi_2021(cr.value.values, cr.age.values, cr.sex.values)
    cr["code"] = "EGFR"
    wide = obs[obs.code.isin(["AST", "ALT", "PLT"]) & obs.value.notna()].pivot_table(index=["person_id", "bill_key", "date", "age"], columns="code", values="value", aggfunc="first").reset_index()
    wide = wide.dropna(subset=["AST", "ALT", "PLT"]) if {"AST", "ALT", "PLT"} <= set(wide.columns) else wide.iloc[0:0]
    wide = wide[wide.age.ge(35) & wide.ALT.gt(0) & wide.PLT.gt(0)]
    fib = pd.DataFrame({"person_id": wide.person_id, "bill_key": wide.bill_key, "date": wide.date, "age": wide.age,
                        "code": "FIB4", "value": wide.age * wide.AST / (wide.PLT * np.sqrt(wide.ALT))})
    lip = obs[obs.code.isin(["TC", "HDL"]) & obs.value.notna()].pivot_table(index=["person_id", "bill_key", "date"], columns="code", values="value", aggfunc="first").reset_index()
    nonhdl = pd.DataFrame({"person_id": lip.person_id, "bill_key": lip.bill_key, "date": lip.date, "code": "NONHDL", "value": lip.TC - lip.HDL}) if {"TC", "HDL"} <= set(lip.columns) else None
    obs2 = pd.concat([obs, cr, fib] + ([nonhdl] if nonhdl is not None else []), ignore_index=True)

    codes = ["HBA1C", "FBS", "PPBS", "RBS", "CREAT", "EGFR", "UACR", "UMALB", "UPROT_DIP", "UREA", "URIC", "LDL", "HDL", "TG", "TC", "NONHDL",
             "TSH", "FT4", "T4", "ALT", "AST", "GGT", "ALP", "BILI_T", "ALB", "PLT", "FIB4", "HB", "MCV", "CRP", "VITD", "B12", "PSA", "ESR", "NA", "K", "CA"]
    for c in codes:
        P = P.join(latest_first(obs2, c))

    # Glycaemia by test-day (ADA confirmation logic).
    gl = obs2[obs2.code.isin(["HBA1C", "FBS", "PPBS", "RBS"]) & obs2.value.notna()].copy()
    gl["dm"] = ((gl.code.eq("HBA1C") & gl.value.ge(6.5)) | (gl.code.eq("FBS") & gl.value.ge(126)) | (gl.code.isin(["PPBS", "RBS"]) & gl.value.ge(200)))
    gl["pre"] = ((gl.code.eq("HBA1C") & gl.value.between(5.7, 6.499)) | (gl.code.eq("FBS") & gl.value.between(100, 125.999)) | (gl.code.eq("PPBS") & gl.value.between(140, 199.999)))
    day = gl.groupby(["person_id", "date"]).agg(dm_tests=("dm", "sum"), any_dm=("dm", "max"), any_pre=("pre", "max"), a1c_dm=("dm", lambda s: bool((s & gl.loc[s.index, "code"].eq("HBA1C")).any()))).reset_index()
    per = day.groupby("person_id").agg(dm_days=("any_dm", "sum"), dm_multi_day=("dm_tests", lambda s: (s >= 2).any()), a1c_dm=("a1c_dm", "max"), gly_days=("date", "nunique"))
    last_day = day.sort_values("date").groupby("person_id").last()
    P = P.join(per).join(last_day[["any_dm", "any_pre"]].rename(columns={"any_dm": "last_day_dm", "any_pre": "last_day_pre"}))
    P["gly_tested"] = P.gly_days.fillna(0).gt(0)
    P["dm"] = P.a1c_dm.fillna(False) | P.dm_days.fillna(0).ge(2) | P.dm_multi_day.fillna(False)
    P["dm_unconfirmed"] = ~P.dm & P.dm_days.fillna(0).ge(1)
    P["dm_any"] = P.dm | P.dm_unconfirmed
    P["prediabetes"] = ~P.dm_any & P.last_day_pre.fillna(False)
    P["dm_control"] = pd.cut(P.HBA1C_last, [0, 7, 8, 9, 10, 30], labels=["<7", "7-7.9", "8-8.9", "9-9.9", ">=10"], right=False)

    # Lipids (latest profile values).
    P["lip_tested"] = P.LDL_n.fillna(0).gt(0) | P.TC_n.fillna(0).gt(0) | P.TG_n.fillna(0).gt(0)
    low_hdl = np.where(P.sex.eq("M"), P.HDL_last.lt(40), P.HDL_last.lt(50)) & P.HDL_last.notna()
    P["low_hdl"] = low_hdl
    P["dyslip"] = P.lip_tested & (P.LDL_last.ge(130) | P.TC_last.ge(200) | P.TG_last.ge(150) | low_hdl)
    P["ldl_high"] = P.LDL_last.ge(130)
    P["ldl_vhigh"] = P.LDL_last.ge(190)
    P["tg_high"] = P.TG_last.ge(150)
    P["tg_vhigh"] = P.TG_last.ge(500)
    P["athero_dyslip"] = P.TG_last.ge(150) & low_hdl
    P["hyperuric"] = np.where(P.sex.eq("M"), P.URIC_last.gt(7.0), P.URIC_last.gt(6.0)) & P.URIC_last.notna()

    # Kidney.
    eg = obs2[obs2.code.eq("EGFR") & obs2.value.notna()]
    low = eg[eg.value.lt(60)].groupby("person_id").date.agg(["min", "max", "size"])
    P["egfr_tested"] = P.EGFR_n.fillna(0).gt(0)
    P["ckd_egfr_ever"] = P.EGFR_min.lt(60)
    P["ckd_egfr_persist"] = P.index.isin(low[(low["max"] - low["min"]).dt.days.ge(90)].index)
    P["ckd_egfr_last"] = P.EGFR_last.lt(60)
    P["g_stage"] = pd.cut(P.EGFR_last, [0, 15, 30, 45, 60, 90, 1000], labels=["G5", "G4", "G3b", "G3a", "G2", "G1"], right=False)
    P["acr_tested"] = P.UACR_n.fillna(0).gt(0)
    P["albuminuria"] = P.UACR_max.ge(30)
    P["albuminuria_a3"] = P.UACR_max.gt(300)
    P["a_stage"] = pd.cut(P.UACR_last, [0, 30, 300.0001, 1e9], labels=["A1", "A2", "A3"], right=False)
    dip = obs2[obs2.code.eq("UPROT_DIP") & obs2.value.notna()]
    dipd = dip[dip.value.ge(1)].groupby("person_id").date.nunique()
    P["dip_tested"] = P.UPROT_DIP_n.fillna(0).gt(0)
    P["proteinuria_dip"] = P.index.isin(dipd[dipd.ge(2)].index)
    P["proteinuria_dip_any"] = P.UPROT_DIP_max.ge(1)
    P["ckd_any"] = P.ckd_egfr_ever.fillna(False) | P.albuminuria.fillna(False)
    P["kidney_tested"] = P.egfr_tested | P.acr_tested

    # Thyroid.
    P["thy_tested"] = P.TSH_n.fillna(0).gt(0)
    P["hypo_overt"] = P.TSH_last.gt(10) | (P.TSH_last.gt(4.5) & P.FT4_last.lt(0.8))
    P["hypo_sub"] = P.TSH_last.between(4.5, 10, inclusive="right") & ~P.hypo_overt.fillna(False)
    P["hypothyroid"] = P.hypo_overt.fillna(False) | P.hypo_sub.fillna(False)
    P["hyperthyroid"] = P.TSH_last.lt(0.45)
    P["hyper_overt"] = P.TSH_last.lt(0.1)
    P["thyroid_dys"] = P.hypothyroid | P.hyperthyroid.fillna(False)

    # Liver.
    P["lft_tested"] = P.ALT_n.fillna(0).gt(0)
    P["transaminitis"] = P.ALT_last.gt(40) | P.AST_last.gt(35)
    P["alt_2x"] = P.ALT_last.gt(80)
    P["fib4_tested"] = P.FIB4_n.fillna(0).gt(0)
    fib_low = np.where(P.age.ge(65), 2.0, 1.3)
    P["fib4_cat"] = np.select([P.FIB4_last.ge(2.67), P.FIB4_last.ge(fib_low), P.FIB4_last.notna()], ["high", "indeterminate", "low"], None)
    P["fib4_high"] = P.FIB4_last.ge(2.67)
    P["fib4_indet_plus"] = P.FIB4_last.ge(fib_low)

    # Haematology (WHO, age >= 15).
    P["hb_tested"] = P.HB_n.fillna(0).gt(0) & P.age.ge(15)
    cut = np.where(P.sex.eq("M"), 13.0, 12.0)
    P["anaemia"] = P.hb_tested & P.HB_last.lt(cut)
    P["anaemia_sev"] = np.select([~P.anaemia, P.HB_last.lt(8), P.HB_last.lt(11)], ["none", "severe", "moderate"], "mild")
    P["microcytic"] = P.MCV_last.lt(80)

    # Inflammation, vitamins, PSA.
    P["crp_tested"] = P.CRP_n.fillna(0).gt(0)
    P["crp_high"] = P.CRP_last.gt(6)
    P["vitd_tested"] = P.VITD_n.fillna(0).gt(0)
    P["vitd_def"] = P.VITD_last.lt(20)
    P["b12_def"] = P.B12_last.lt(200)
    P["psa_high"] = P.PSA_last.gt(4)

    # USG findings (any report).
    u = usg.copy()
    u["fatty"] = u.fatty_liver_grade.isin([1, 2, 3, -1])
    u["fatty_grade"] = u.fatty_liver_grade.where(u.fatty_liver_grade.gt(0))
    ug = u.groupby("person_id").agg(usg_liver_n=("fatty_liver_grade", lambda s: s.notna().sum()), fatty=("fatty", "max"), fatty_grade_max=("fatty_grade", "max"),
                                    usg_n=("report_key", "size"), **{c: (c, "max") for c in ["fatty_pancreas", "hepatomegaly", "cld", "ckd_signs", "renal_calculi", "hydronephrosis", "gallstones", "prostatomegaly", "splenomegaly", "ascites", "pcos", "thyroid_nodule", "goitre"]})
    P = P.join(ug)
    P["usg_liver_tested"] = P.usg_liver_n.fillna(0).gt(0)
    P["fatty"] = P.fatty.fillna(False).astype(bool) & P.usg_liver_tested
    P["masld"] = P.fatty & (P.dm_any.fillna(False) | P.prediabetes.fillna(False) | P.tg_high.fillna(False) | P.low_hdl.fillna(False))

    # Echo / ECG / PFT.
    e = car[car.kind.eq("ECHO")].copy()
    eg2 = e.groupby("person_id").agg(echo_n=("report_key", "size"), lvef_min=("lvef", "min"), lvh=("lvh", "max"), dd_grade=("dd_grade", "max"), rwma=("rwma", "max"),
                                     global_hypo=("global_hypo", "max"), valve=("valve_mod_sev", "max"), ph=("ph", "max"), af=("af", "max"), dilated_la=("dilated_la", "max"), dcm=("dcm", "max"), peric=("peric_eff", "max"))
    P = P.join(eg2)
    P["echo_tested"] = P.echo_n.fillna(0).gt(0)
    P["ef_lt50"] = P.lvef_min.lt(50)
    P["ef_lt40"] = P.lvef_min.lt(40)
    P["dd2plus"] = P.dd_grade.ge(2)
    P["dd_any"] = P.dd_grade.ge(1)
    for c in ["lvh", "rwma", "global_hypo", "valve", "ph", "af", "dilated_la", "dcm"]:
        P[c] = P[c].fillna(0).astype(bool)
    P["ihd"] = P.rwma | P.global_hypo
    P["shd"] = P.echo_tested & (P.ef_lt50.fillna(False) | P.ihd | P.valve | P.ph | P.dcm | P.af)        # structural heart disease
    P["remodel"] = P.echo_tested & (P.lvh | P.dd2plus.fillna(False) | P.dilated_la)                     # subclinical remodelling
    oth = car[~car.kind.isin(["ECHO", "FETAL"])].groupby("person_id").agg(ecg_isch=("ecg_isch", "max"), holter_sig=("holter_sig", "max"), pft_obs=("pft_obstructive", "max"), pft_res=("pft_restrictive", "max"), pft_n=("kind", lambda s: (s == "PFT").sum()))
    P = P.join(oth)
    P["pft_tested"] = P.pft_n.fillna(0).gt(0)
    for c in ["ecg_isch", "holter_sig", "pft_obs", "pft_res"]:
        P[c] = P[c].fillna(0).astype(bool)

    P["adult"] = P.age.ge(18)
    P["age_band"] = age_band(P.age)
    return P, obs2


# ---------------------------------------------------------------------------
# Condition catalogue: (label, category, tested-mask column, positive column)
# ---------------------------------------------------------------------------

CONDITIONS = [
    ("Diabetes (confirmed)", "Metabolic", "gly_tested", "dm"),
    ("Diabetes incl. unconfirmed", "Metabolic", "gly_tested", "dm_any"),
    ("Prediabetes (latest)", "Metabolic", "gly_tested", "prediabetes"),
    ("Dyslipidaemia (any)", "Metabolic", "lip_tested", "dyslip"),
    ("LDL >= 130", "Metabolic", "lip_tested", "ldl_high"),
    ("LDL >= 190", "Metabolic", "lip_tested", "ldl_vhigh"),
    ("Triglycerides >= 150", "Metabolic", "lip_tested", "tg_high"),
    ("Low HDL", "Metabolic", "lip_tested", "low_hdl"),
    ("Atherogenic dyslipidaemia (TG high + low HDL)", "Metabolic", "lip_tested", "athero_dyslip"),
    ("Hyperuricaemia", "Metabolic", "URIC_tested", "hyperuric"),
    ("Fatty liver on USG", "Metabolic", "usg_liver_tested", "fatty"),
    ("MASLD (fatty liver + cardiometabolic factor)", "Metabolic", "usg_liver_tested", "masld"),
    ("MASLD among fatty liver with a metabolic test", "Metabolic", "fatty_met_tested", "masld"),
    ("Vitamin D deficiency (< 20)", "Metabolic", "vitd_tested", "vitd_def"),
    ("CKD: eGFR < 60 (ever)", "Renal", "egfr_tested", "ckd_egfr_ever"),
    ("CKD: eGFR < 60 persistent >= 90 d", "Renal", "egfr_tested", "ckd_egfr_persist"),
    ("CKD: eGFR < 60 (latest)", "Renal", "egfr_tested", "ckd_egfr_last"),
    ("Albuminuria (UACR >= 30)", "Renal", "acr_tested", "albuminuria"),
    ("Severe albuminuria (UACR > 300)", "Renal", "acr_tested", "albuminuria_a3"),
    ("Dipstick proteinuria >= 1+ (any)", "Renal", "dip_tested", "proteinuria_dip_any"),
    ("Any CKD marker (eGFR < 60 or UACR >= 30)", "Renal", "kidney_tested", "ckd_any"),
    ("Renal parenchymal disease on USG", "Renal", "usg_tested", "ckd_signs"),
    ("Nephrolithiasis on USG", "Renal", "usg_tested", "renal_calculi"),
    ("Reduced LVEF (< 50%)", "Cardiac", "echo_tested", "ef_lt50"),
    ("HF with reduced EF (< 40%)", "Cardiac", "echo_tested", "ef_lt40"),
    ("LV hypertrophy", "Cardiac", "echo_tested", "lvh"),
    ("Diastolic dysfunction (any grade)", "Cardiac", "echo_tested", "dd_any"),
    ("Diastolic dysfunction grade >= II", "Cardiac", "echo_tested", "dd2plus"),
    ("Ischaemic heart disease (RWMA / hypokinesia)", "Cardiac", "echo_tested", "ihd"),
    ("Moderate-severe valve disease", "Cardiac", "echo_tested", "valve"),
    ("Pulmonary hypertension", "Cardiac", "echo_tested", "ph"),
    ("Atrial fibrillation / flutter", "Cardiac", "echo_tested", "af"),
    ("Structural heart disease (composite)", "Cardiac", "echo_tested", "shd"),
    ("Subclinical remodelling (LVH / DD>=II / dilated LA)", "Cardiac", "echo_tested", "remodel"),
    ("Transaminitis (ALT > 40 or AST > 35)", "Hepatic", "lft_tested", "transaminitis"),
    ("ALT > 2x ULN", "Hepatic", "lft_tested", "alt_2x"),
    ("FIB-4 >= 2.67 (advanced fibrosis likely)", "Hepatic", "fib4_tested", "fib4_high"),
    ("FIB-4 indeterminate or high", "Hepatic", "fib4_tested", "fib4_indet_plus"),
    ("Chronic liver disease / cirrhosis on USG", "Hepatic", "usg_liver_tested", "cld"),
    ("Hepatomegaly on USG", "Hepatic", "usg_liver_tested", "hepatomegaly"),
    ("Gallstones on USG", "Hepatic", "usg_tested", "gallstones"),
    ("Hypothyroidism (overt, TSH > 10)", "Thyroid", "thy_tested", "hypo_overt"),
    ("Subclinical hypothyroidism (TSH 4.5-10)", "Thyroid", "thy_tested", "hypo_sub"),
    ("Hypothyroidism (any)", "Thyroid", "thy_tested", "hypothyroid"),
    ("Hyperthyroidism (TSH < 0.45)", "Thyroid", "thy_tested", "hyperthyroid"),
    ("Thyroid dysfunction (any)", "Thyroid", "thy_tested", "thyroid_dys"),
    ("Anaemia (WHO)", "Haematologic", "hb_tested", "anaemia"),
    ("Moderate-severe anaemia (Hb < 11)", "Haematologic", "hb_tested", "anaemia_modsev"),
    ("Raised CRP (> 6 mg/L)", "Inflammatory", "crp_tested", "crp_high"),
    ("Prostatomegaly on USG (men 40+)", "Urological", "usg_tested_m", "prostatomegaly"),
    ("PSA > 4 ng/mL (men)", "Urological", "PSA_tested", "psa_high"),
    ("PCOS morphology on USG (women 15-45)", "Reproductive-metabolic", "usg_tested_f1545", "pcos"),
    ("Obstructive ventilatory defect (PFT)", "Respiratory", "pft_tested", "pft_obs"),
    ("Restrictive ventilatory defect (PFT)", "Respiratory", "pft_tested", "pft_res"),
]

# Core nodes for the network / CKM analysis.
CORE = {
    "Diabetes": ("gly_tested", "dm_any"), "Prediabetes": ("gly_tested", "prediabetes"), "Dyslipidaemia": ("lip_tested", "dyslip"),
    "High TG": ("lip_tested", "tg_high"), "Low HDL": ("lip_tested", "low_hdl"), "High LDL": ("lip_tested", "ldl_high"),
    "Hyperuricaemia": ("URIC_tested", "hyperuric"), "Fatty liver": ("usg_liver_tested", "fatty"),
    "CKD (eGFR<60)": ("egfr_tested", "ckd_egfr_ever"), "Albuminuria": ("acr_tested", "albuminuria"), "Proteinuria (dipstick)": ("dip_tested", "proteinuria_dip_any"),
    "Transaminitis": ("lft_tested", "transaminitis"), "FIB-4 indet/high": ("fib4_tested", "fib4_indet_plus"),
    "Hypothyroid": ("thy_tested", "hypothyroid"), "Anaemia": ("hb_tested", "anaemia"), "Raised CRP": ("crp_tested", "crp_high"),
    "LVH": ("echo_tested", "lvh"), "Diastolic dysfn": ("echo_tested", "dd_any"), "Structural heart dis.": ("echo_tested", "shd"), "IHD (echo)": ("echo_tested", "ihd"),
    "Renal USG changes": ("usg_tested", "ckd_signs"), "Vit D deficiency": ("vitd_tested", "vitd_def"),
}


def add_masks(P):
    P["URIC_tested"] = P.URIC_n.fillna(0).gt(0)
    P["PSA_tested"] = P.PSA_n.fillna(0).gt(0) & P.sex.eq("M")
    P["usg_tested"] = P.usg_n.fillna(0).gt(0)
    P["usg_tested_m"] = P.usg_tested & P.sex.eq("M") & P.age.ge(40)
    P["fatty_met_tested"] = P.fatty.fillna(False).astype(bool) & (P.gly_tested | P.lip_tested)
    P["usg_tested_f1545"] = P.usg_tested & P.sex.eq("F") & P.age.between(15, 45)
    P["anaemia_modsev"] = P.anaemia & P.HB_last.lt(11)
    for c in ["ckd_signs", "renal_calculi", "cld", "hepatomegaly", "gallstones", "prostatomegaly", "pcos"]:
        P[c] = P[c].fillna(0).astype(bool)
    for _, _, t, c in CONDITIONS:
        P[c] = P[c].fillna(False).astype(bool) & P[t].fillna(False).astype(bool)
    return P


# ---------------------------------------------------------------------------
# Prevalence, standardisation, stratification
# ---------------------------------------------------------------------------

def standardise(P, tested, pos, std_w):
    """Direct age-sex standardised prevalence (%) to the adult tested population."""
    d = P[tested & P.adult]
    if len(d) == 0:
        return float("nan")
    rate = d.groupby(["age_band", "sex"], observed=False)[pos.name].mean()
    w = std_w.reindex(rate.index).fillna(0)
    return float(100 * (rate.fillna(0) * w).sum() / w.sum())


def prevalence_tables(P):
    adults = P[P.adult]
    std_w = adults.groupby(["age_band", "sex"], observed=False).size()
    std_w = std_w / std_w.sum()
    rows, strata = [], []
    for label, cat, t, c in CONDITIONS:
        tested = adults[t].astype(bool)
        n = int(tested.sum())
        k = int((tested & adults[c]).sum())
        lo, hi = wilson(k, n)
        rows.append({"condition": label, "category": cat, "tested": n, "positive": k, "prevalence_pct": 100 * k / n if n else np.nan,
                     "ci_low": lo, "ci_high": hi, "age_sex_standardised_pct": standardise(P, P[t].astype(bool), P[c], std_w),
                     "tested_share_of_adults_pct": 100 * n / len(adults)})
        for sex in ["F", "M"]:
            for band in AGE_LABELS:
                g = adults[tested & adults.sex.eq(sex) & adults.age_band.astype(str).eq(band)]
                if len(g):
                    strata.append({"condition": label, "category": cat, "sex": sex, "age_band": band, "tested": len(g), "positive": int(g[c].sum()), "prevalence_pct": 100 * g[c].mean()})
        for sex in ["F", "M"]:
            g = adults[tested & adults.sex.eq(sex)]
            if len(g):
                strata.append({"condition": label, "category": cat, "sex": sex, "age_band": "all", "tested": len(g), "positive": int(g[c].sum()), "prevalence_pct": 100 * g[c].mean()})
    return pd.DataFrame(rows), pd.DataFrame(strata)


def by_year_rates(P, bills, obs2):
    """Per-1,000-tested rates by calendar year of the person's last test that year (case-growth adjusted)."""
    out = []
    yr_last = bills.groupby(["person_id", bills.date.dt.year]).size().reset_index().rename(columns={"date": "year"})
    for year in sorted(yr_last.year.unique()):
        ids = set(yr_last[yr_last.year.eq(year)].person_id)
        d = P[P.index.isin(ids) & P.adult]
        rec = {"year": int(year), "adults_seen": len(d)}
        for key, (t, c) in {"Diabetes": CORE["Diabetes"], "Dyslipidaemia": CORE["Dyslipidaemia"], "CKD (eGFR<60)": CORE["CKD (eGFR<60)"], "Fatty liver": CORE["Fatty liver"], "Hypothyroid": CORE["Hypothyroid"], "Anaemia": CORE["Anaemia"], "Structural heart dis.": CORE["Structural heart dis."]}.items():
            tt = d[t].astype(bool)
            rec[f"{key} tested"] = int(tt.sum())
            rec[f"{key} per 1000 tested"] = 1000 * d[c][tt].mean() if tt.sum() else np.nan
        out.append(rec)
    return pd.DataFrame(out)


# ---------------------------------------------------------------------------
# Interrelationships
# ---------------------------------------------------------------------------

def adjusted_or(d, a, b):
    """Age-sex adjusted OR of b given a (logistic), among persons tested for both."""
    import statsmodels.api as sm
    X = pd.DataFrame({"a": d[a].astype(float), "age": d.age, "age2": d.age ** 2 / 100, "male": d.sex.eq("M").astype(float)})
    X = sm.add_constant(X)
    y = d[b].astype(float)
    if y.nunique() < 2 or X.a.nunique() < 2:
        return np.nan, np.nan, np.nan, np.nan
    try:
        m = sm.Logit(y, X).fit(disp=0, maxiter=100)
        return float(np.exp(m.params.a)), float(np.exp(m.conf_int().loc["a", 0])), float(np.exp(m.conf_int().loc["a", 1])), float(m.pvalues.a)
    except Exception:
        return np.nan, np.nan, np.nan, np.nan


def pairwise(P):
    adults = P[P.adult]
    rows = []
    for (na, (ta, ca)), (nb, (tb, cb)) in itertools.permutations(CORE.items(), 2):
        d = adults[adults[ta].astype(bool) & adults[tb].astype(bool)]
        if len(d) < 200:
            continue
        a, b = d[ca].astype(bool), d[cb].astype(bool)
        n11, n10, n01, n00 = int((a & b).sum()), int((a & ~b).sum()), int((~a & b).sum()), int((~a & ~b).sum())
        if n11 + n10 < 30 or n01 + n00 < 30:
            continue
        p_b_a = n11 / (n11 + n10)
        p_b_nota = n01 / (n01 + n00)
        orr = ((n11 + 0.5) * (n00 + 0.5)) / ((n10 + 0.5) * (n01 + 0.5))
        se = np.sqrt(sum(1 / (x + 0.5) for x in (n11, n10, n01, n00)))
        aor, alo, ahi, ap = adjusted_or(d, ca, cb)
        _, pfish = stats.fisher_exact([[n11, n10], [n01, n00]])
        rows.append({"a": na, "b": nb, "n_tested_both": len(d), "n_a": n11 + n10, "p_b_given_a_pct": 100 * p_b_a, "p_b_given_not_a_pct": 100 * p_b_nota,
                     "relative_risk": p_b_a / p_b_nota if p_b_nota else np.nan, "crude_or": orr, "crude_or_lo": np.exp(np.log(orr) - 1.96 * se), "crude_or_hi": np.exp(np.log(orr) + 1.96 * se),
                     "adj_or": aor, "adj_or_lo": alo, "adj_or_hi": ahi, "adj_p": ap, "fisher_p": pfish,
                     "jaccard": n11 / (n11 + n10 + n01) if (n11 + n10 + n01) else np.nan})
    return pd.DataFrame(rows)


def network(pw):
    import networkx as nx
    G = nx.Graph()
    sig = pw[(pw.adj_or > 1.3) & (pw.adj_p < 0.001)]
    for _, r in sig.iterrows():
        a, b = sorted([r.a, r.b])
        w = float(np.log(r.adj_or))
        if G.has_edge(a, b):
            G[a][b]["weight"] = max(G[a][b]["weight"], w)
        else:
            G.add_edge(a, b, weight=w, adj_or=float(r.adj_or))
    out = {"nodes": [], "edges": [], "communities": []}
    if G.number_of_nodes():
        deg = dict(G.degree(weight="weight"))
        try:
            eig = nx.eigenvector_centrality(G, weight="weight", max_iter=2000)
        except Exception:
            eig = {n: np.nan for n in G}
        comms = list(nx.algorithms.community.greedy_modularity_communities(G, weight="weight"))
        for n in G:
            out["nodes"].append({"node": n, "weighted_degree": deg[n], "eigenvector_centrality": eig[n], "degree": G.degree(n)})
        for a, b, dta in G.edges(data=True):
            out["edges"].append({"a": a, "b": b, "adj_or": dta["adj_or"], "log_or": dta["weight"]})
        out["communities"] = [sorted(c) for c in comms]
    return out


def correlations(P):
    cols = {"HbA1c": "HBA1C_last", "Fasting glucose": "FBS_last", "Triglycerides": "TG_last", "HDL": "HDL_last", "LDL": "LDL_last", "Non-HDL": "NONHDL_last",
            "Uric acid": "URIC_last", "eGFR": "EGFR_last", "UACR": "UACR_last", "ALT": "ALT_last", "GGT": "GGT_last", "Haemoglobin": "HB_last",
            "TSH": "TSH_last", "CRP": "CRP_last", "Vitamin D": "VITD_last", "LVEF (min)": "lvef_min", "Fatty liver grade": "fatty_grade_max"}
    adults = P[P.adult]
    labels = list(cols)
    rho = pd.DataFrame(index=labels, columns=labels, dtype=float)
    nmat = pd.DataFrame(index=labels, columns=labels, dtype=float)
    prho = rho.copy()
    for i, j in itertools.combinations(labels, 2):
        d = adults[[cols[i], cols[j], "age", "sex"]].dropna()
        d = d[~np.isinf(d[cols[i]]) & ~np.isinf(d[cols[j]])]
        n = len(d)
        nmat.loc[i, j] = nmat.loc[j, i] = n
        if n < 100:
            continue
        r, _ = stats.spearmanr(d[cols[i]], d[cols[j]])
        rho.loc[i, j] = rho.loc[j, i] = r
        # partial Spearman adjusting age + sex: residualise ranks.
        X = np.column_stack([np.ones(n), d.age, d.age ** 2, d.sex.eq("M")])
        ri = stats.rankdata(d[cols[i]]); rj = stats.rankdata(d[cols[j]])
        ei = ri - X @ np.linalg.lstsq(X, ri, rcond=None)[0]
        ej = rj - X @ np.linalg.lstsq(X, rj, rcond=None)[0]
        prho.loc[i, j] = prho.loc[j, i] = stats.pearsonr(ei, ej)[0]
    for lab in labels:
        rho.loc[lab, lab] = prho.loc[lab, lab] = 1.0
    return rho, prho, nmat


# ---------------------------------------------------------------------------
# CKM staging and multimorbidity
# ---------------------------------------------------------------------------

def ckm(P):
    adults = P[P.adult].copy()
    met_tested = adults.gly_tested | adults.lip_tested | adults.usg_liver_tested | adults.egfr_tested | adults.acr_tested
    a = adults[met_tested].copy()
    s1 = a.prediabetes | a.fatty
    s2 = a.dm_any | a.TG_last.ge(135) | a.ckd_egfr_ever | a.albuminuria
    very_high_ckd = a.EGFR_last.lt(30) | a.albuminuria_a3
    s3 = very_high_ckd | (a.echo_tested & (a.lvh | a.dd2plus.fillna(False) | a.dilated_la | a.lvef_min.between(40, 49.99)))
    s4 = a.echo_tested & (a.ihd | a.ef_lt40.fillna(False) | a.af | a.dcm) | a.ecg_isch | a.holter_sig
    a["ckm_stage"] = np.select([s4, s3, s2, s1], [4, 3, 2, 1], 0)
    dist = a.ckm_stage.value_counts().sort_index()
    by_age = a.groupby("age_band", observed=False).ckm_stage.value_counts(normalize=True).unstack().fillna(0) * 100
    by_age_n = a.groupby("age_band", observed=False).size()
    by_sex = a.groupby("sex").ckm_stage.value_counts(normalize=True).unstack().fillna(0) * 100
    # Among people with an echo, how do metabolic/renal findings co-travel with cardiac ones?
    e = a[a.echo_tested]
    echo_cross = {
        "echo_n": int(len(e)),
        "shd_pct_if_dm": 100 * e[e.dm_any].shd.mean() if e.dm_any.any() else np.nan,
        "shd_pct_if_no_dm_tested": 100 * e[e.gly_tested & ~e.dm_any].shd.mean() if (e.gly_tested & ~e.dm_any).any() else np.nan,
        "shd_pct_if_ckd": 100 * e[e.ckd_egfr_ever].shd.mean() if e.ckd_egfr_ever.any() else np.nan,
        "shd_pct_if_no_ckd_tested": 100 * e[e.egfr_tested & ~e.ckd_egfr_ever].shd.mean() if (e.egfr_tested & ~e.ckd_egfr_ever).any() else np.nan,
        "lvh_pct_if_ckd": 100 * e[e.ckd_egfr_ever].lvh.mean() if e.ckd_egfr_ever.any() else np.nan,
        "lvh_pct_if_no_ckd_tested": 100 * e[e.egfr_tested & ~e.ckd_egfr_ever].lvh.mean() if (e.egfr_tested & ~e.ckd_egfr_ever).any() else np.nan,
        "ef_lt50_pct_if_dm_and_ckd": 100 * e[e.dm_any & e.ckd_egfr_ever].ef_lt50.mean() if (e.dm_any & e.ckd_egfr_ever).any() else np.nan,
    }
    return {"n_evaluable": int(len(a)), "stage_counts": {int(k): int(v) for k, v in dist.items()}, "stage_pct": {int(k): 100 * v / len(a) for k, v in dist.items()},
            "by_age_pct": {str(k): {int(c): float(v) for c, v in row.items()} for k, row in by_age.iterrows()},
            "by_age_n": {str(k): int(v) for k, v in by_age_n.items()},
            "by_sex_pct": {str(k): {int(c): float(v) for c, v in row.items()} for k, row in by_sex.iterrows()},
            "echo_cross": echo_cross}, a.ckm_stage


def multimorbidity(P):
    domains = {"Diabetes": ("gly_tested", "dm_any"), "Dyslipidaemia": ("lip_tested", "dyslip"), "CKD/albuminuria": ("kidney_tested", "ckd_any"),
               "Fatty liver": ("usg_liver_tested", "fatty"), "Hypothyroid": ("thy_tested", "hypothyroid"), "Anaemia": ("hb_tested", "anaemia"),
               "Hyperuricaemia": ("URIC_tested", "hyperuric"), "Structural heart dis.": ("echo_tested", "shd"), "Transaminitis": ("lft_tested", "transaminitis")}
    adults = P[P.adult]
    tested_n = sum(adults[t].astype(bool) for t, _ in domains.values())
    pos_n = sum(adults[c].astype(bool) for _, c in domains.values())
    out = {"domains": list(domains)}
    for min_t in [1, 3, 5]:
        d = adults[tested_n >= min_t]
        cnt = pos_n[tested_n >= min_t]
        out[f"min_tested_{min_t}"] = {"persons": int(len(d)), "counts": {str(k): int(v) for k, v in cnt.clip(upper=4).value_counts().sort_index().items()},
                                     "pct": {str(k): 100 * v / len(d) for k, v in cnt.clip(upper=4).value_counts().sort_index().items()},
                                     "mean_conditions_per_tested_domain": float((cnt / tested_n[tested_n >= min_t]).mean()),
                                     "by_age": {str(b): {"persons": int((d.age_band.astype(str) == b).sum()), "two_plus_pct": 100 * (cnt[d.age_band.astype(str) == b] >= 2).mean() if (d.age_band.astype(str) == b).any() else np.nan} for b in AGE_LABELS}}
    # Top combinations among people tested for >= 3 domains with >= 2 conditions.
    d = adults[tested_n >= 3]
    cnt = pos_n[tested_n >= 3]
    combos = {}
    for pid in d[cnt >= 2].index:
        row = d.loc[pid]
        key = " + ".join(k for k, (_, c) in domains.items() if bool(row[c]))
        combos[key] = combos.get(key, 0) + 1
    out["top_combinations"] = sorted(combos.items(), key=lambda x: -x[1])[:25]
    # Conditional burden: given condition X, mean number of OTHER conditions (among tested domains).
    cond = {}
    for k, (t, c) in domains.items():
        sel = adults[c].astype(bool) & (tested_n >= 3)
        if sel.sum():
            cond[k] = {"n": int(sel.sum()), "mean_other_conditions": float((pos_n[sel] - 1).mean()), "two_plus_other_pct": 100 * float(((pos_n[sel] - 1) >= 2).mean())}
    out["given_condition"] = cond
    return out


# ---------------------------------------------------------------------------
# Within-person progression
# ---------------------------------------------------------------------------

def slope(df):
    """Per-person annual slope of value on time (>= 2 points, >= 180 days apart)."""
    out = {}
    for pid, g in df.groupby("person_id"):
        if len(g) < 2:
            continue
        t = (g.date - g.date.min()).dt.days.values / 365.25
        if t.max() < 0.5:
            continue
        s = np.polyfit(t, g.value.values, 1)[0]
        out[pid] = (s, t.max(), g.value.iloc[0], g.value.iloc[-1])
    return pd.DataFrame(out, index=["slope", "years", "first", "last"]).T


def progression(P, obs2):
    adults = set(P[P.adult].index)
    o = obs2[obs2.person_id.isin(adults) & obs2.value.notna()].sort_values("date")
    res = {}

    def fl(code, min_gap=90):
        g = o[o.code.eq(code)].groupby("person_id")
        d = pd.DataFrame({"first": g.value.first(), "last": g.value.last(), "d0": g.date.first(), "d1": g.date.last(), "n": g.size()})
        d["years"] = (d.d1 - d.d0).dt.days / 365.25
        return d[d.n.ge(2) & (d.d1 - d.d0).dt.days.ge(min_gap)]

    # HbA1c
    a = fl("HBA1C")
    res["hba1c"] = {"persons_repeat": int(len(a)), "median_gap_years": float(a.years.median()) if len(a) else np.nan,
                    "worsened_0.5_pct": 100 * float((a["last"] - a["first"] >= 0.5).mean()) if len(a) else np.nan,
                    "improved_0.5_pct": 100 * float((a["last"] - a["first"] <= -0.5).mean()) if len(a) else np.nan,
                    "mean_annual_change": float(((a["last"] - a["first"]) / a.years).mean()) if len(a) else np.nan,
                    "uncontrolled_first_pct": 100 * float((a["first"] >= 8).mean()) if len(a) else np.nan,
                    "uncontrolled_last_pct": 100 * float((a["last"] >= 8).mean()) if len(a) else np.nan,
                    "still_uncontrolled_among_first_uncontrolled_pct": 100 * float((a[a["first"] >= 8]["last"] >= 8).mean()) if (a["first"] >= 8).any() else np.nan}
    # Fasting glucose: prediabetes -> diabetes conversion.
    f = fl("FBS")
    pre0 = f[(f["first"] >= 100) & (f["first"] < 126)]
    norm0 = f[f["first"] < 100]
    res["fbs"] = {"persons_repeat": int(len(f)), "prediabetic_first_n": int(len(pre0)),
                  "pre_to_diabetic_range_pct": 100 * float((pre0["last"] >= 126).mean()) if len(pre0) else np.nan,
                  "pre_to_diabetic_rate_per_100py": 100 * float((pre0["last"] >= 126).sum() / pre0.years.sum()) if len(pre0) else np.nan,
                  "pre_reverted_to_normal_pct": 100 * float((pre0["last"] < 100).mean()) if len(pre0) else np.nan,
                  "normal_first_n": int(len(norm0)), "normal_to_diabetic_range_pct": 100 * float((norm0["last"] >= 126).mean()) if len(norm0) else np.nan,
                  "normal_to_prediabetic_pct": 100 * float(norm0["last"].between(100, 125.999).mean()) if len(norm0) else np.nan,
                  "normal_to_diabetic_rate_per_100py": 100 * float((norm0["last"] >= 126).sum() / norm0.years.sum()) if len(norm0) else np.nan}
    # eGFR slope and stage transitions.
    e = o[o.code.eq("EGFR")]
    s = slope(e)
    res["egfr"] = {"persons_slope": int(len(s)), "median_followup_years": float(s.years.median()) if len(s) else np.nan,
                   "mean_slope_ml_min_yr": float(s.slope.mean()) if len(s) else np.nan, "median_slope": float(s.slope.median()) if len(s) else np.nan,
                   "rapid_decline_pct(<=-5/yr)": 100 * float((s.slope <= -5).mean()) if len(s) else np.nan,
                   "new_ckd_pct(first>=60,last<60)": 100 * float(((s["first"] >= 60) & (s["last"] < 60)).mean()) if len(s) else np.nan,
                   "ckd_persisted_pct(first<60,last<60)": 100 * float((s[s["first"] < 60]["last"] < 60).mean()) if (s["first"] < 60).any() else np.nan}
    # Incidence of a new kidney marker by diabetes status (person-years from first eGFR).
    inc = {}
    for lab, sel in [("diabetes", P.dm_any), ("no diabetes (tested)", P.gly_tested & ~P.dm_any), ("fatty liver", P.fatty), ("hyperuricaemia", P.hyperuric)]:
        ids = set(P[sel & P.adult].index) & set(s.index)
        ss = s.loc[list(ids)]
        at_risk = ss[ss["first"] >= 60]
        if len(at_risk):
            events = int((at_risk["last"] < 60).sum())
            py = float(at_risk.years.sum())
            inc[lab] = {"at_risk": int(len(at_risk)), "events": events, "person_years": py, "rate_per_100py": 100 * events / py if py else np.nan,
                        "mean_slope": float(at_risk.slope.mean())}
    res["egfr_incidence_by_group"] = inc
    # LDL and TG
    l = fl("LDL")
    res["ldl"] = {"persons_repeat": int(len(l)), "rose_30_pct": 100 * float((l["last"] - l["first"] >= 30).mean()) if len(l) else np.nan,
                  "fell_30_pct": 100 * float((l["last"] - l["first"] <= -30).mean()) if len(l) else np.nan,
                  "above130_first_pct": 100 * float((l["first"] >= 130).mean()) if len(l) else np.nan,
                  "still_above130_among_first_above_pct": 100 * float((l[l["first"] >= 130]["last"] >= 130).mean()) if (l["first"] >= 130).any() else np.nan}
    t = fl("TG")
    res["tg"] = {"persons_repeat": int(len(t)), "rose_to_high_pct(first<150,last>=150)": 100 * float((t[t["first"] < 150]["last"] >= 150).mean()) if (t["first"] < 150).any() else np.nan,
                 "stayed_high_pct": 100 * float((t[t["first"] >= 150]["last"] >= 150).mean()) if (t["first"] >= 150).any() else np.nan}
    # TSH
    ts = fl("TSH", 42)
    sub0 = ts[ts["first"].between(4.5, 10, inclusive="right")]
    res["tsh"] = {"persons_repeat": int(len(ts)), "subclinical_first_n": int(len(sub0)),
                  "sub_to_overt_pct(>10)": 100 * float((sub0["last"] > 10).mean()) if len(sub0) else np.nan,
                  "sub_normalised_pct": 100 * float(sub0["last"].between(0.45, 4.5).mean()) if len(sub0) else np.nan,
                  "sub_persisted_pct": 100 * float(sub0["last"].between(4.5, 10, inclusive="right").mean()) if len(sub0) else np.nan}
    # Haemoglobin
    h = fl("HB")
    res["hb"] = {"persons_repeat": int(len(h)), "fell_1g_pct": 100 * float((h["last"] - h["first"] <= -1).mean()) if len(h) else np.nan,
                 "rose_1g_pct": 100 * float((h["last"] - h["first"] >= 1).mean()) if len(h) else np.nan}
    # ALT
    al = fl("ALT")
    res["alt"] = {"persons_repeat": int(len(al)), "normal_to_raised_pct(first<=40,last>40)": 100 * float((al[al["first"] <= 40]["last"] > 40).mean()) if (al["first"] <= 40).any() else np.nan,
                  "raised_persisted_pct": 100 * float((al[al["first"] > 40]["last"] > 40).mean()) if (al["first"] > 40).any() else np.nan}
    return res


def fatty_progression(usg, P):
    u = usg[usg.fatty_liver_grade.notna() & usg.person_id.isin(P[P.adult].index)].sort_values("date")
    u = u[u.fatty_liver_grade.ge(0)]  # graded or none (ungraded -1 excluded from ordering)
    g = u.groupby("person_id")
    d = pd.DataFrame({"first": g.fatty_liver_grade.first(), "last": g.fatty_liver_grade.last(), "d0": g.date.first(), "d1": g.date.last(), "n": g.size()})
    d = d[d.n.ge(2) & (d.d1 - d.d0).dt.days.ge(180)]
    return {"persons_repeat_usg": int(len(d)), "median_gap_years": float(((d.d1 - d.d0).dt.days / 365.25).median()) if len(d) else np.nan,
            "progressed_pct": 100 * float((d["last"] > d["first"]).mean()) if len(d) else np.nan,
            "regressed_pct": 100 * float((d["last"] < d["first"]).mean()) if len(d) else np.nan,
            "new_fatty_liver_pct(first 0, last >=1)": 100 * float((d[d["first"] == 0]["last"] >= 1).mean()) if (d["first"] == 0).any() else np.nan,
            "n_first_normal": int((d["first"] == 0).sum())}


def condition_accrual(P, obs2, usg, car):
    """Conditions present in the first 180 days vs. ever, for people followed >= 1 year with >= 3 tested domains."""
    adults = P[P.adult & P.span_days.ge(365)]
    o = obs2[obs2.person_id.isin(adults.index) & obs2.value.notna()].copy()
    first = adults.first_date
    o["early"] = o.date <= (o.person_id.map(first) + pd.Timedelta(days=180))
    flags = {
        "Diabetes": (o.code.eq("HBA1C") & o.value.ge(6.5)) | (o.code.eq("FBS") & o.value.ge(126)) | (o.code.eq("PPBS") & o.value.ge(200)),
        "CKD (eGFR<60)": o.code.eq("EGFR") & o.value.lt(60),
        "Albuminuria": o.code.eq("UACR") & o.value.ge(30),
        "High TG": o.code.eq("TG") & o.value.ge(150),
        "High LDL": o.code.eq("LDL") & o.value.ge(130),
        "Hypothyroid": o.code.eq("TSH") & o.value.gt(4.5),
        "Anaemia": o.code.eq("HB") & ((o.sex.eq("M") & o.value.lt(13)) | (o.sex.eq("F") & o.value.lt(12))),
        "Transaminitis": o.code.eq("ALT") & o.value.gt(40),
        "Hyperuricaemia": o.code.eq("URIC") & ((o.sex.eq("M") & o.value.gt(7)) | (o.sex.eq("F") & o.value.gt(6))),
    }
    tested = {}
    rows = []
    for name, f in flags.items():
        code_mask = {"Diabetes": o.code.isin(["HBA1C", "FBS", "PPBS"]), "CKD (eGFR<60)": o.code.eq("EGFR"), "Albuminuria": o.code.eq("UACR"), "High TG": o.code.eq("TG"), "High LDL": o.code.eq("LDL"),
                     "Hypothyroid": o.code.eq("TSH"), "Anaemia": o.code.eq("HB"), "Transaminitis": o.code.eq("ALT"), "Hyperuricaemia": o.code.eq("URIC")}[name]
        early_t = set(o[code_mask & o.early].person_id)
        late_t = set(o[code_mask & ~o.early].person_id)
        both = early_t & late_t
        early_pos = set(o[f & o.early].person_id)
        late_pos = set(o[f & ~o.early].person_id)
        new = [p for p in both if p not in early_pos and p in late_pos]
        rows.append({"condition": name, "tested_early_and_late": len(both), "negative_early": len([p for p in both if p not in early_pos]),
                     "new_positive_later": len(new), "new_positive_pct": 100 * len(new) / max(1, len([p for p in both if p not in early_pos]))})
    return pd.DataFrame(rows)


# ---------------------------------------------------------------------------

def main() -> int:
    t0 = time.time()
    RES.mkdir(parents=True, exist_ok=True)
    persons = pd.read_parquet(DS / "persons.parquet")
    bills = pd.read_parquet(DS / "bills.parquet")
    obs = pd.read_parquet(DS / "obs.parquet")
    usg = pd.read_parquet(DS / "usg.parquet")
    car = pd.read_parquet(DS / "cardio.parquet")
    P, obs2 = build_features(persons, bills, obs, usg, car)
    P = add_masks(P)
    print(f"features for {len(P)} persons ({time.time() - t0:.0f}s)")
    P.to_parquet(DS / "features.parquet")

    adults = P[P.adult]
    pop = {"persons_total": int(len(P)), "adults": int(len(adults)), "children_under18": int((~P.adult).sum()), "bills": int(len(bills)),
           "adult_female_pct": 100 * float(adults.sex.eq("F").mean()), "adult_median_age": float(adults.age.median()),
           "adults_by_age_band": {str(k): int(v) for k, v in adults.age_band.value_counts().sort_index().items()},
           "adults_with_2plus_visits": int((adults.n_bills >= 2).sum()), "adults_followed_1yr_plus": int((adults.span_days >= 365).sum()),
           "adults_tested": {k: int(adults[t].astype(bool).sum()) for k, (t, _) in CORE.items()},
           "date_range": [str(bills.date.min().date()), str(bills.date.max().date())],
           "numeric_results": int(obs.value.notna().sum()), "echo_reports": int(car.kind.eq("ECHO").sum()), "usg_reports": int(len(usg))}

    prev, strata = prevalence_tables(P)
    prev.to_csv(RES / "prevalence.csv", index=False)
    strata.to_csv(RES / "prevalence_by_age_sex.csv", index=False)
    print(f"prevalence ({time.time() - t0:.0f}s)")
    yr = by_year_rates(P, bills, obs2)
    yr.to_csv(RES / "rates_by_year.csv", index=False)
    pw = pairwise(P)
    pw.to_csv(RES / "pairwise_associations.csv", index=False)
    print(f"pairwise {len(pw)} ({time.time() - t0:.0f}s)")
    net = network(pw)
    rho, prho, nmat = correlations(P)
    rho.to_csv(RES / "spearman.csv")
    prho.to_csv(RES / "spearman_partial_age_sex.csv")
    nmat.to_csv(RES / "spearman_n.csv")
    ck, stage = ckm(P)
    P["ckm_stage"] = stage
    mm = multimorbidity(P)
    prog = progression(P, obs2)
    fat = fatty_progression(usg, P)
    acc = condition_accrual(P, obs2, usg, car)
    acc.to_csv(RES / "condition_accrual.csv", index=False)
    print(f"progression ({time.time() - t0:.0f}s)")

    # Diabetes control + kidney screening gaps (care-cascade style facts).
    dm = adults[adults.dm_any]
    cascade = {
        "dm_n": int(len(dm)), "dm_with_hba1c_pct": 100 * float(dm.HBA1C_n.fillna(0).gt(0).mean()),
        "dm_hba1c_control_dist_pct": {str(k): 100 * float(v) for k, v in dm.dm_control.value_counts(normalize=True).sort_index().items()},
        "dm_hba1c_ge8_pct": 100 * float(dm.HBA1C_last.ge(8).mean()) if dm.HBA1C_last.notna().any() else np.nan,
        "dm_egfr_tested_pct": 100 * float(dm.egfr_tested.mean()), "dm_acr_tested_pct": 100 * float(dm.acr_tested.mean()),
        "dm_lipid_tested_pct": 100 * float(dm.lip_tested.mean()), "dm_usg_liver_pct": 100 * float(dm.usg_liver_tested.mean()), "dm_echo_pct": 100 * float(dm.echo_tested.mean()),
        "dm_ckd_pct_among_egfr_tested": 100 * float(dm[dm.egfr_tested].ckd_egfr_ever.mean()) if dm.egfr_tested.any() else np.nan,
        "dm_albuminuria_pct_among_acr_tested": 100 * float(dm[dm.acr_tested].albuminuria.mean()) if dm.acr_tested.any() else np.nan,
        "dm_fatty_pct_among_usg": 100 * float(dm[dm.usg_liver_tested].fatty.mean()) if dm.usg_liver_tested.any() else np.nan,
        "dm_ldl_above70_pct": 100 * float(dm.LDL_last.ge(70).mean()) if dm.LDL_last.notna().any() else np.nan,
        "dm_ldl_above100_pct": 100 * float(dm.LDL_last.ge(100).mean()) if dm.LDL_last.notna().any() else np.nan,
        "ckd_n": int(adults.ckd_egfr_ever.sum()), "ckd_with_acr_pct": 100 * float(adults[adults.ckd_egfr_ever].acr_tested.mean()) if adults.ckd_egfr_ever.any() else np.nan,
        "ckd_g_stage_dist": {str(k): int(v) for k, v in adults[adults.ckd_egfr_ever].g_stage.value_counts().items()},
        "ckd_anaemia_pct": 100 * float(adults[adults.ckd_egfr_ever & adults.hb_tested].anaemia.mean()) if (adults.ckd_egfr_ever & adults.hb_tested).any() else np.nan,
        "nonckd_anaemia_pct": 100 * float(adults[adults.egfr_tested & ~adults.ckd_egfr_ever & adults.hb_tested].anaemia.mean()),
        "fatty_n": int(adults.fatty.sum()), "fatty_grade_dist": {str(int(k)): int(v) for k, v in adults[adults.fatty].fatty_grade_max.value_counts().sort_index().items()},
        "fatty_with_lft_pct": 100 * float(adults[adults.fatty].lft_tested.mean()) if adults.fatty.any() else np.nan,
        "fatty_transaminitis_pct": 100 * float(adults[adults.fatty & adults.lft_tested].transaminitis.mean()) if (adults.fatty & adults.lft_tested).any() else np.nan,
        "fatty_fib4_indet_plus_pct": 100 * float(adults[adults.fatty & adults.fib4_tested].fib4_indet_plus.mean()) if (adults.fatty & adults.fib4_tested).any() else np.nan,
        "fatty_dm_pct_among_gly_tested": 100 * float(adults[adults.fatty & adults.gly_tested].dm_any.mean()) if (adults.fatty & adults.gly_tested).any() else np.nan,
        "nonfatty_dm_pct_among_gly_tested": 100 * float(adults[adults.usg_liver_tested & ~adults.fatty & adults.gly_tested].dm_any.mean()),
        "echo_n": int(adults.echo_tested.sum()), "lvef_dist_pct": {k: 100 * float(v) for k, v in pd.cut(adults.lvef_min, [0, 40, 50, 55, 100], labels=["<40", "40-49", "50-54", ">=55"], right=False).value_counts(normalize=True).sort_index().items()},
    }
    summary = {"generated": pd.Timestamp.now().isoformat(timespec="seconds"), "population": pop, "cascade": cascade, "ckm": ck, "multimorbidity": mm,
               "progression": prog, "fatty_liver_progression": fat, "network": net,
               "prevalence_top": prev.sort_values("prevalence_pct", ascending=False).head(60).to_dict(orient="records")}
    (RES / "summary.json").write_text(json.dumps(summary, indent=2, default=lambda x: None if (isinstance(x, float) and np.isnan(x)) else (float(x) if isinstance(x, (np.floating,)) else int(x) if isinstance(x, (np.integer,)) else str(x))), encoding="utf-8")
    print(f"done ({time.time() - t0:.0f}s) -> {RES}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
