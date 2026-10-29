// Shapes for the multi-condition NCD follow-up pages. A Bill is one AKTIV
// registration with its reported parameters flattened, the same shape the
// proposed Neon `lab_results` view returns (one row per parameter).

import type { Channel, Sex } from "../../diabetes/lib/types";

/** Parameters the lab reports. */
export type RawTest =
  | "HBA1C" // %
  | "FBS" // mg/dL
  | "CREAT" // serum creatinine, mg/dL
  | "UACR" // urine albumin : creatinine, mg/g
  | "LDL" // mg/dL
  | "HDL" // mg/dL
  | "TG" // triglycerides, mg/dL
  | "TSH" // µIU/mL
  | "FT4" // ng/dL
  | "ALT" // U/L
  | "AST" // U/L
  | "PLT"; // platelets, ×10³/µL

/** Values the pipeline derives because the lab report does not carry them. */
export type DerivedTest = "EGFR" | "FIB4";

export type NcdTest = RawTest | DerivedTest;

export type Bill = {
  billKey: number;
  patientKey: number;
  day: number;
  name: string;
  phone: string;
  age: number;
  sex: Sex;
  channel: Channel;
  referrer: string;
  results: { test: RawTest; value: number }[];
  /** Ground-truth person id; synthetic only, never read by the pipeline. */
  truth: number;
};

export type Obs = { day: number; test: NcdTest; value: number };

export const TEST_LABEL: Record<NcdTest, string> = {
  HBA1C: "HbA1c",
  FBS: "Fasting glucose",
  CREAT: "Creatinine",
  EGFR: "eGFR",
  UACR: "Urine ACR",
  LDL: "LDL cholesterol",
  HDL: "HDL cholesterol",
  TG: "Triglycerides",
  TSH: "TSH",
  FT4: "Free T4",
  ALT: "ALT (SGPT)",
  AST: "AST (SGOT)",
  PLT: "Platelets",
  FIB4: "FIB-4",
};

export const TEST_UNIT: Record<NcdTest, string> = {
  HBA1C: "%",
  FBS: "mg/dL",
  CREAT: "mg/dL",
  EGFR: "mL/min",
  UACR: "mg/g",
  LDL: "mg/dL",
  HDL: "mg/dL",
  TG: "mg/dL",
  TSH: "µIU/mL",
  FT4: "ng/dL",
  ALT: "U/L",
  AST: "U/L",
  PLT: "×10³/µL",
  FIB4: "",
};

/* ------------------------------------------------------------------ */
/* Derived values                                                       */
/* ------------------------------------------------------------------ */

/** CKD-EPI 2021 creatinine equation (race-free), mL/min/1.73m². */
export function ckdEpi2021(creat: number, age: number, sex: "F" | "M" | ""): number {
  const female = sex === "F";
  const k = female ? 0.7 : 0.9;
  const a = female ? -0.241 : -0.302;
  const r = creat / k;
  return 142 * Math.min(r, 1) ** a * Math.max(r, 1) ** -1.2 * 0.9938 ** age * (female ? 1.012 : 1);
}

/** Creatinine that gives this eGFR. Used only by the synthetic generator. */
export function creatForEgfr(egfr: number, age: number, sex: "F" | "M"): number {
  let lo = 0.2;
  let hi = 20;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    if (ckdEpi2021(mid, age, sex) > egfr) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** FIB-4 = age × AST / (platelets × √ALT). Not validated under 35. */
export function fib4(age: number, ast: number, alt: number, plt: number): number | null {
  if (age < 35 || alt <= 0 || plt <= 0) return null;
  return (age * ast) / (plt * Math.sqrt(alt));
}

/** FIB-4 cut-offs (AASLD 2023): the low cut-off rises to 2.0 at 65+. */
export const FIB4_LOW = (age: number) => (age >= 65 ? 2.0 : 1.3);
export const FIB4_HIGH = 2.67;
