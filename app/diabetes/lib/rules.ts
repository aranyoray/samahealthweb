// Follow-up rules: given one person's stitched lab timeline, what is due,
// how late is it, and how urgently should someone pick up the phone.
//
// Intervals follow the ADA Standards of Care in Diabetes (2025) and the
// RSSDI clinical practice recommendations: HbA1c every 3 months when above
// goal, every 6 months at goal; kidney (eGFR + urine ACR) and lipids yearly;
// prediabetes rechecked yearly. The scoring weights are ours and are shown
// on the page so the care team can argue with them.

import type { TestCode } from "./types";

export type Obs = { day: number; test: TestCode; value: number };

export const FOLLOW_UP = {
  a1cAboveGoalDays: 90,
  a1cAtGoalDays: 180,
  prediabetesDays: 365,
  confirmDays: 30,
  kidneyDays: 365,
  kidneyAbnormalDays: 180,
  lipidDays: 365,
  firstBaselineDays: 90,
  criticalCallbackDays: 7,
  /** Past due by more than this with no glycaemic test = lost to follow-up. */
  lostAfterDays: 180,
  slippingAfterDays: 90,
  dueSoonDays: 30,
} as const;

export const A1C_GOAL = 7.0;

export type Glycaemic = "normal" | "prediabetes" | "diabetes" | "unconfirmed";

export function isDiabeticRange(o: Obs): boolean {
  switch (o.test) {
    case "HBA1C":
      return o.value >= 6.5;
    case "FBS":
      return o.value >= 126;
    case "PPBS":
    case "RBS":
      return o.value >= 200;
    default:
      return false;
  }
}

export function isPrediabeticRange(o: Obs): boolean {
  switch (o.test) {
    case "HBA1C":
      return o.value >= 5.7 && o.value < 6.5;
    case "FBS":
      return o.value >= 100 && o.value < 126;
    case "PPBS":
      return o.value >= 140 && o.value < 200;
    default:
      return false;
  }
}

const isGly = (o: Obs) => o.test === "HBA1C" || o.test === "FBS" || o.test === "PPBS" || o.test === "RBS";

/** Glycaemic status from lab evidence up to (and including) `asOf`. */
export function classify(obs: Obs[], asOf: number): { status: Glycaemic; firstDiabeticDay: number | null } {
  let firstDiabeticDay: number | null = null;
  const diabeticDays = new Set<number>();
  let a1cDiabetic = false;
  let pre = false;
  for (const o of obs) {
    if (o.day > asOf) break;
    if (isDiabeticRange(o)) {
      if (firstDiabeticDay === null) firstDiabeticDay = o.day;
      diabeticDays.add(o.day);
      if (o.test === "HBA1C") a1cDiabetic = true;
    } else if (isPrediabeticRange(o)) pre = true;
  }
  if (firstDiabeticDay !== null) {
    // One raised glucose on one day, no HbA1c yet: needs a confirmatory test.
    const status = diabeticDays.size >= 2 || a1cDiabetic ? "diabetes" : "unconfirmed";
    return { status, firstDiabeticDay };
  }
  return { status: pre ? "prediabetes" : "normal", firstDiabeticDay: null };
}

/** Days until the next glycaemic test is due after a test with this value. */
export function glycaemicInterval(status: Glycaemic, anchor: Obs | undefined): number | null {
  if (status === "unconfirmed") return FOLLOW_UP.confirmDays;
  if (status === "prediabetes") return FOLLOW_UP.prediabetesDays;
  if (status !== "diabetes") return null;
  if (!anchor) return FOLLOW_UP.a1cAboveGoalDays;
  if (anchor.test === "HBA1C") return anchor.value >= A1C_GOAL ? FOLLOW_UP.a1cAboveGoalDays : FOLLOW_UP.a1cAtGoalDays;
  // No HbA1c: fall back on glucose, treat as above goal unless clearly controlled.
  return anchor.test === "FBS" && anchor.value < 130 ? FOLLOW_UP.a1cAtGoalDays : FOLLOW_UP.a1cAboveGoalDays;
}

export type CareState = "on-track" | "due-soon" | "overdue" | "slipping" | "lost";

export function careStateFor(daysPastDue: number): CareState {
  if (daysPastDue > FOLLOW_UP.lostAfterDays) return "lost";
  if (daysPastDue > FOLLOW_UP.slippingAfterDays) return "slipping";
  if (daysPastDue > 0) return "overdue";
  if (daysPastDue > -FOLLOW_UP.dueSoonDays) return "due-soon";
  return "on-track";
}

export type Reason =
  | "critical"
  | "confirm"
  | "a1c-overdue"
  | "rising"
  | "kidney-due"
  | "kidney-abnormal"
  | "lipids-due"
  | "prediabetes-due"
  | "new-diagnosis";

export const REASON_LABEL: Record<Reason, string> = {
  critical: "Very high sugar, no repeat",
  confirm: "Diagnosis not confirmed",
  "a1c-overdue": "HbA1c overdue",
  rising: "HbA1c rising",
  "kidney-due": "Kidney check due",
  "kidney-abnormal": "Kidney markers abnormal",
  "lipids-due": "Lipids due",
  "prediabetes-due": "Prediabetes recheck due",
  "new-diagnosis": "Diagnosed < 6 months ago",
};

export type Tier = "critical" | "high" | "medium" | "routine";

export const TIER_LABEL: Record<Tier, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  routine: "Routine",
};

/** Score cut-offs. Calibrated so Critical + High is a week's calls for two coordinators. */
export const TIER_MIN = { critical: 70, high: 55, medium: 38 } as const;

export type FollowUp = {
  status: Glycaemic;
  firstDiabeticDay: number | null;
  lastGly: Obs | null;
  lastA1c: Obs | null;
  prevA1c: Obs | null;
  dueDay: number | null;
  daysPastDue: number | null;
  careState: CareState | null;
  reasons: Reason[];
  score: number;
  tier: Tier | null;
  nextStep: string;
};

function latest(obs: Obs[], test: TestCode, asOf: number): Obs | null {
  for (let i = obs.length - 1; i >= 0; i--) if (obs[i].test === test && obs[i].day <= asOf) return obs[i];
  return null;
}

export function evaluate(obs: Obs[], asOf: number, age: number): FollowUp {
  const { status, firstDiabeticDay } = classify(obs, asOf);
  let lastGly: Obs | null = null;
  let lastA1c: Obs | null = null;
  let prevA1c: Obs | null = null;
  for (const o of obs) {
    if (o.day > asOf) break;
    if (isGly(o)) {
      // Prefer HbA1c as the anchor when several glycaemic tests share a day.
      if (!lastGly || o.day > lastGly.day || o.test === "HBA1C") lastGly = o;
    }
    if (o.test === "HBA1C") {
      if (lastA1c && lastA1c.day !== o.day) prevA1c = lastA1c;
      lastA1c = o;
    }
  }
  const empty: FollowUp = {
    status, firstDiabeticDay, lastGly, lastA1c, prevA1c,
    dueDay: null, daysPastDue: null, careState: null, reasons: [], score: 0, tier: null, nextStep: "",
  };
  if (!lastGly || status === "normal") return empty;

  const lastGlyDay = lastGly.day;
  const anchor = lastA1c && lastA1c.day === lastGlyDay ? lastA1c : lastGly;
  const interval = glycaemicInterval(status, anchor)!;
  const dueDay = lastGlyDay + interval;
  const daysPastDue = asOf - dueDay;
  const careState = careStateFor(daysPastDue);

  const reasons: Reason[] = [];
  let score = 0;

  // Severity (0-40)
  const a1c = lastA1c?.value ?? null;
  const lastFbs = latest(obs, "FBS", asOf);
  const lastPp = latest(obs, "PPBS", asOf) ?? latest(obs, "RBS", asOf);
  const veryHigh =
    (lastA1c !== null && lastA1c.day === lastGlyDay && lastA1c.value >= 10) ||
    (lastFbs !== null && lastFbs.day === lastGlyDay && lastFbs.value >= 250) ||
    (lastPp !== null && lastPp.day === lastGlyDay && lastPp.value >= 300);
  if (status === "diabetes") {
    score += a1c === null ? 16 : a1c >= 10 ? 40 : a1c >= 9 ? 32 : a1c >= 8 ? 24 : a1c >= 7 ? 16 : 8;
  } else if (status === "unconfirmed") {
    score += 24;
    reasons.push("confirm");
  } else {
    score += 4;
  }
  // Only while the result is recent enough that a callback still makes sense.
  const sinceLast = asOf - lastGlyDay;
  if (veryHigh && sinceLast > FOLLOW_UP.criticalCallbackDays && sinceLast <= FOLLOW_UP.lostAfterDays) {
    reasons.unshift("critical");
    score += 10;
  }

  // Lateness (0-25). Recently overdue scores highest: they are the ones still recoverable.
  if (daysPastDue > 0) {
    if (status === "prediabetes") reasons.push("prediabetes-due");
    else if (status === "diabetes") reasons.push("a1c-overdue");
    score += daysPastDue <= 180 ? Math.min(25, 8 + daysPastDue / 8) : Math.max(6, 25 - (daysPastDue - 180) / 20);
  } else if (daysPastDue > -FOLLOW_UP.dueSoonDays) {
    score += 4;
  }

  // Trend (0-10)
  if (lastA1c && prevA1c) {
    const delta = lastA1c.value - prevA1c.value;
    if (delta >= 1.0) {
      score += 10;
      reasons.push("rising");
    } else if (delta >= 0.5) {
      score += 5;
      reasons.push("rising");
    }
  }

  // Complication screening (diabetes only, 0-13)
  if (status === "diabetes" && firstDiabeticDay !== null) {
    const egfr = latest(obs, "EGFR", asOf);
    const uacr = latest(obs, "UACR", asOf);
    const abnormal = (egfr !== null && egfr.value < 60) || (uacr !== null && uacr.value >= 30);
    const kidneyEvery = abnormal ? FOLLOW_UP.kidneyAbnormalDays : FOLLOW_UP.kidneyDays;
    const kidneyLast = Math.min(egfr?.day ?? -Infinity, uacr?.day ?? -Infinity);
    const kidneyDue = Number.isFinite(kidneyLast)
      ? kidneyLast + kidneyEvery
      : firstDiabeticDay + FOLLOW_UP.firstBaselineDays;
    if (abnormal) {
      score += 10;
      reasons.push("kidney-abnormal");
    } else if (asOf > kidneyDue) {
      score += 5;
      reasons.push("kidney-due");
    }
    const ldl = latest(obs, "LDL", asOf);
    const lipidDue = ldl ? ldl.day + FOLLOW_UP.lipidDays : firstDiabeticDay + FOLLOW_UP.firstBaselineDays;
    if (asOf > lipidDue) {
      score += 3;
      reasons.push("lipids-due");
    }
    if (asOf - firstDiabeticDay <= 183) {
      score += 5;
      reasons.push("new-diagnosis");
    }
  }
  if (age >= 65) score += 5;
  score = Math.round(Math.min(100, score));

  let tier: Tier | null = null;
  const actionable = daysPastDue > -FOLLOW_UP.dueSoonDays || reasons.includes("critical") || reasons.includes("confirm");
  if (actionable) {
    if (reasons.includes("critical") || score >= TIER_MIN.critical) tier = "critical";
    else if (score >= TIER_MIN.high) tier = "high";
    else if (score >= TIER_MIN.medium) tier = "medium";
    else tier = "routine";
  }

  let nextStep: string;
  if (reasons.includes("critical")) nextStep = "Doctor callback within 48 h, repeat HbA1c + FBS";
  else if (status === "unconfirmed") nextStep = "Book confirmatory HbA1c";
  else if (status === "prediabetes") nextStep = "Book yearly HbA1c + FBS";
  else {
    const extras: string[] = [];
    if (reasons.includes("kidney-due") || reasons.includes("kidney-abnormal")) extras.push("eGFR + urine ACR");
    if (reasons.includes("lipids-due")) extras.push("lipid profile");
    nextStep = `Book HbA1c${extras.length ? " + " + extras.join(" + ") : ""}`;
  }
  if (tier === "critical" && !reasons.includes("critical")) nextStep = `Doctor call first. ${nextStep}`;

  return { status, firstDiabeticDay, lastGly, lastA1c, prevA1c, dueDay, daysPastDue, careState, reasons, score, tier, nextStep };
}

/** Rows for the rules table on the page. Single source of truth with the code above. */
export const RULE_TABLE: { trigger: string; due: string; why: string }[] = [
  { trigger: "HbA1c 7% or higher (above goal)", due: `every ${FOLLOW_UP.a1cAboveGoalDays} days`, why: "ADA: quarterly until at goal" },
  { trigger: "HbA1c under 7% (at goal)", due: `every ${FOLLOW_UP.a1cAtGoalDays} days`, why: "ADA: at least twice a year when stable" },
  { trigger: "One raised glucose, no HbA1c yet", due: `within ${FOLLOW_UP.confirmDays} days`, why: "Diagnosis needs a second abnormal result" },
  { trigger: "HbA1c 10%+, FBS 250+ or PP 300+", due: `doctor callback after ${FOLLOW_UP.criticalCallbackDays} days with no repeat`, why: "Symptomatic range, treatment change likely" },
  { trigger: "Diabetes: eGFR + urine ACR", due: `yearly, ${FOLLOW_UP.kidneyAbnormalDays} days if eGFR < 60 or ACR ≥ 30`, why: "ADA / KDIGO kidney screening" },
  { trigger: "Diabetes: lipid profile", due: `yearly (baseline within ${FOLLOW_UP.firstBaselineDays} days)`, why: "ADA cardiovascular risk review" },
  { trigger: "Prediabetes (5.7 to 6.4%)", due: `every ${FOLLOW_UP.prediabetesDays} days`, why: "ADA: yearly recheck" },
  { trigger: "No glycaemic test > 180 days past due", due: "marked lost to follow-up", why: "Moves to re-engagement, not routine recall" },
];

export const SCORE_TABLE: { factor: string; points: string }[] = [
  { factor: "Latest HbA1c ≥ 10 / 9 to 9.9 / 8 to 8.9 / 7 to 7.9 / < 7", points: "40 / 32 / 24 / 16 / 8" },
  { factor: "Unconfirmed diabetic-range result", points: "24" },
  { factor: "Very high sugar and no repeat within 7 days", points: "+10, forces Critical" },
  { factor: "Days past due (peaks at 180, then decays)", points: "up to 25" },
  { factor: "HbA1c up ≥ 1.0 / ≥ 0.5 since previous", points: "10 / 5" },
  { factor: "Kidney markers abnormal / kidney check overdue", points: "10 / 5" },
  { factor: "Lipid profile overdue", points: "3" },
  { factor: "Diagnosed in the last 6 months", points: "5" },
  { factor: "Age 65+", points: "5" },
];
