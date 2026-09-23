// Shapes shared by the synthetic generator, the identity resolver, the
// follow-up rules and the analytics. A "Bill" is one AKTIV registration
// (BILL_HEAD row) with the results hanging off it, flattened.

export type Sex = "F" | "M" | "";

export type TestCode =
  | "HBA1C" // %
  | "FBS" // mg/dL fasting plasma glucose
  | "PPBS" // mg/dL 2-h post-prandial
  | "RBS" // mg/dL random
  | "EGFR" // mL/min/1.73m², from serum creatinine
  | "UACR" // mg/g urine albumin : creatinine
  | "LDL" // mg/dL
  | "HB"; // g/dL

export type Channel = "walk-in" | "home" | "camp" | "partner";

export type Result = { test: TestCode; value: number };

export type Bill = {
  billKey: number;
  /** AKTIV PATIENT_KEY. Re-issued every calendar month, so useless for linkage. */
  patientKey: number;
  day: number;
  /** As typed at the front desk: case, honorifics, spellings all vary. */
  name: string;
  /** As typed: may be blank, junk, or a collection agent's own number. */
  phone: string;
  age: number;
  sex: Sex;
  channel: Channel;
  referrer: string;
  results: Result[];
  /**
   * Ground-truth person id. Exists only because the cohort is synthetic;
   * the resolver never reads it. Used to score linkage accuracy.
   */
  truth: number;
};

export const TEST_CODES: readonly TestCode[] = ["HBA1C", "FBS", "PPBS", "RBS", "EGFR", "UACR", "LDL", "HB"];

export const TEST_LABEL: Record<TestCode, string> = {
  HBA1C: "HbA1c",
  FBS: "Fasting glucose",
  PPBS: "Post-meal glucose",
  RBS: "Random glucose",
  EGFR: "eGFR",
  UACR: "Urine ACR",
  LDL: "LDL cholesterol",
  HB: "Haemoglobin",
};

export const TEST_UNIT: Record<TestCode, string> = {
  HBA1C: "%",
  FBS: "mg/dL",
  PPBS: "mg/dL",
  RBS: "mg/dL",
  EGFR: "mL/min",
  UACR: "mg/g",
  LDL: "mg/dL",
  HB: "g/dL",
};
