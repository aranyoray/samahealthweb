// Chronic kidney disease. Definitions and monitoring frequency follow the
// KDIGO 2024 CKD guideline: CKD needs a raised marker that persists for more
// than 3 months; how often to recheck comes from the eGFR (G) × albuminuria
// (A) heat map. eGFR is computed from creatinine with CKD-EPI 2021, because
// the lab report carries creatinine only.

import { latest, previous, testDays, upTo, type Assessment, type DiseaseModule } from "../engine";
import type { Obs } from "../types";
import { BOOK, DUE, HELLO, callbackWindow } from "./msg";

export const G_LABELS = ["G1 ≥ 90", "G2 60–89", "G3a 45–59", "G3b 30–44", "G4 15–29", "G5 < 15"] as const;
export const A_LABELS = ["A1 < 30", "A2 30–300", "A3 > 300"] as const;

export const gStage = (egfr: number) => (egfr >= 90 ? 0 : egfr >= 60 ? 1 : egfr >= 45 ? 2 : egfr >= 30 ? 3 : egfr >= 15 ? 4 : 5);
export const aStage = (acr: number) => (acr < 30 ? 0 : acr <= 300 ? 1 : 2);

/** KDIGO heat map: tests per year, rows G1..G5, columns A1..A3. */
export const KDIGO_FREQ = [
  [1, 1, 2],
  [1, 1, 2],
  [1, 2, 3],
  [2, 3, 3],
  [3, 3, 4],
  [4, 4, 4],
];
/** KDIGO risk colour: 0 low, 1 moderate, 2 high, 3 very high. */
export const KDIGO_RISK = [
  [0, 1, 2],
  [0, 1, 2],
  [1, 2, 3],
  [2, 3, 3],
  [3, 3, 3],
  [3, 3, 3],
];
export const RISK_LABEL = ["Low", "Moderate", "High", "Very high"] as const;

const isMarker = (o: Obs) => (o.test === "EGFR" && o.value < 60) || (o.test === "UACR" && o.value >= 30);

function state(obs: Obs[]) {
  const markers = obs.filter(isMarker);
  const egfr = latest(obs, "EGFR");
  const acr = latest(obs, "UACR");
  const confirmed = markers.length >= 2 && markers[markers.length - 1].day - markers[0].day >= 90;
  const latestNormal = (!egfr || egfr.value >= 60) && (!acr || acr.value < 30 || acr.day < (egfr?.day ?? 0));
  // One raised marker that a later test cleared never met the 3-month rule.
  const inPathway = markers.length > 0 && (confirmed || !latestNormal || markers[markers.length - 1].day === Math.max(egfr?.day ?? 0, acr?.day ?? 0));
  const g = egfr ? gStage(egfr.value) : null;
  const a = acr ? aStage(acr.value) : null;
  return { markers, egfr, acr, confirmed, inPathway, g, a };
}

function intervalFor(s: ReturnType<typeof state>): number {
  if (!s.confirmed) return 90;
  const freq = KDIGO_FREQ[s.g ?? 1][s.a ?? 0];
  return Math.round(365 / freq);
}

function declinePerYear(obs: Obs[], asOf: number): number | null {
  const e = obs.filter((o) => o.test === "EGFR" && o.day > asOf - 730);
  if (e.length < 2 || e[e.length - 1].day - e[0].day < 180) return null;
  return ((e[0].value - e[e.length - 1].value) / (e[e.length - 1].day - e[0].day)) * 365;
}

export const kidney: DiseaseModule = {
  key: "kidney",
  name: "Chronic kidney disease",
  route: "/ncd#kidney",
  monitorTests: ["EGFR", "UACR"],
  headlineTest: "EGFR",
  detailTests: ["EGFR", "CREAT", "UACR", "HBA1C"],
  bands: G_LABELS.map((label, i) => ({ label, color: ["#0d9488", "#5eb8a8", "#dba300", "#e8622a", "#c2410c", "#991b1b"][i] })),
  statusLabel: {
    unconfirmed: "Raised once, not yet confirmed",
    "ckd-0": "CKD, low risk",
    "ckd-1": "CKD, moderate risk",
    "ckd-2": "CKD, high risk",
    "ckd-3": "CKD, very high risk",
  },
  reasonLabel: {
    confirm: "Needs 3-month repeat",
    refer: "Nephrology referral range",
    decline: "eGFR falling fast",
    "acr-missing": "Urine ACR never done",
    critical: "Very low eGFR or sudden drop",
    overdue: "Kidney check overdue",
  },
  abnormalLabel: "eGFR under 60 or urine ACR 30+",
  repeat: { label: "Repeat within 4 months (confirms CKD)", withinDays: 120 },
  goalLabel: "Both eGFR and urine ACR in the last year",

  assess(obsAll: Obs[], asOf: number): Assessment {
    const obs = upTo(obsAll, asOf);
    const inScope = obs.some((o) => o.test === "EGFR" || o.test === "UACR");
    const s = state(obs);
    const days = testDays(obs, this.monitorTests);
    const lastDay = days.length ? days[days.length - 1] : null;
    const band = s.egfr ? gStage(s.egfr.value) : null;
    const base = { inScope, band, lastDay, headline: s.egfr, prevHeadline: previous(obs, "EGFR", s.egfr) };
    if (!s.inPathway) {
      return { ...base, firstAbnormalDay: null, status: "normal", interval: null, atGoal: null, severity: 0, reasons: [], critical: false, nextStep: "" };
    }
    const risk = KDIGO_RISK[s.g ?? 1][s.a ?? 0];
    const reasons: string[] = [];
    let severity = s.confirmed ? [8, 14, 24, 32][risk] : 20;
    if (!s.confirmed) reasons.push("confirm");
    const refer = (s.egfr && s.egfr.value < 30) || (s.acr && s.acr.value > 300);
    if (refer) {
      reasons.push("refer");
      severity += 8;
    }
    const decline = declinePerYear(obs, asOf);
    if (decline !== null && decline >= 5) {
      reasons.push("decline");
      severity += 10;
    }
    if (s.confirmed && !s.acr) {
      reasons.push("acr-missing");
      severity += 4;
    }
    const prev = base.prevHeadline;
    const suddenDrop = s.egfr && prev && s.egfr.day - prev.day <= 90 && s.egfr.value <= prev.value * 0.7;
    const critical = !!s.egfr && callbackWindow(asOf - s.egfr.day) && (s.egfr.value < 15 || !!suddenDrop);
    if (critical) {
      reasons.unshift("critical");
      severity += 10;
    }
    const kidneyYear = (t: "EGFR" | "UACR") => obs.some((o) => o.test === t && o.day > asOf - 365);
    let nextStep: string;
    if (critical) nextStep = "Doctor callback within 48 h, repeat creatinine + electrolytes";
    else if (!s.confirmed) nextStep = "Repeat creatinine + urine ACR at 3 months";
    else nextStep = `Book creatinine + urine ACR${refer ? ", refer to nephrology" : ""}`;
    return {
      ...base,
      firstAbnormalDay: s.markers[0].day,
      status: s.confirmed ? `ckd-${risk}` : "unconfirmed",
      interval: intervalFor(s),
      atGoal: kidneyYear("EGFR") && kidneyYear("UACR"),
      severity,
      reasons,
      critical,
      nextStep,
    };
  },

  intervalAt(obs: Obs[], day: number) {
    return intervalFor(state(upTo(obs, day)));
  },

  ruleTable: [
    { trigger: "First eGFR under 60 or urine ACR 30+", due: "repeat at 90 days", why: "KDIGO: CKD needs more than 3 months of abnormality" },
    { trigger: "Confirmed CKD, KDIGO low or moderate risk", due: "every 365 days", why: "KDIGO heat map: once a year" },
    { trigger: "KDIGO high risk (e.g. G3a A2, G3b A1)", due: "every 183 days", why: "KDIGO heat map: twice a year" },
    { trigger: "KDIGO very high risk (G3b A2+, G4)", due: "every 122 days", why: "KDIGO heat map: three times a year" },
    { trigger: "G4 A3 or G5", due: "every 91 days", why: "KDIGO heat map: four or more times a year" },
    { trigger: "eGFR under 30 or ACR over 300", due: "nephrology referral", why: "KDIGO referral criteria" },
    { trigger: "eGFR falling 5+ mL/min a year", due: "flagged on the list", why: "KDIGO: rapid progression" },
    { trigger: "No kidney test > 180 days past due", due: "marked lost to follow-up", why: "Same rule as the diabetes list" },
  ],
  scoreTable: [
    { factor: "KDIGO risk low / moderate / high / very high", points: "8 / 14 / 24 / 32" },
    { factor: "Raised once, not yet confirmed", points: "20" },
    { factor: "In nephrology referral range", points: "+8" },
    { factor: "eGFR falling 5+ a year", points: "+10" },
    { factor: "Urine ACR never done", points: "+4" },
    { factor: "eGFR under 15, or down 30% within 90 days", points: "+10, forces Critical" },
  ],

  message(m, lang) {
    const v = m.headline ? Math.round(m.headline.value) : null;
    if (m.reasons.includes("critical")) {
      return lang === "en"
        ? `Doctor call. The kidney result on ${m.date} was very low${v ? ` (eGFR ${v})` : ""} with no repeat since. Ask about passing less urine, swelling of the feet or face, breathlessness, vomiting, and which medicines they take, especially painkillers. Repeat creatinine and electrolytes within 48 hours; ask them to come in the same day if unwell.`
        : `ডাক্তারের ফোন। ${m.dateBn}-এর রিপোর্টে কিডনির কার্যক্ষমতা অনেক কম${v ? ` (eGFR ${v})` : ""}, তারপর আর পরীক্ষা হয়নি। জিজ্ঞেস করুন: প্রস্রাব কমে গেছে কি না, পা বা মুখ ফোলা, শ্বাসকষ্ট, বমিভাব আছে কি না, কী ওষুধ খাচ্ছেন, বিশেষ করে ব্যথার ওষুধ। ৪৮ ঘণ্টার মধ্যে ক্রিয়েটিনিন ও ইলেক্ট্রোলাইট পরীক্ষা করান; শরীর খারাপ থাকলে আজই আসতে বলুন।`;
    }
    if (m.status === "unconfirmed") {
      return lang === "en"
        ? `${HELLO.en(m.first)} A kidney value on ${m.date} was outside the normal range. One repeat test three months later tells us whether it is lasting. It needs one blood and one urine sample. ${BOOK.en}`
        : `${HELLO.bn(m.first)} ${m.dateBn}-এর পরীক্ষায় কিডনির একটি মান স্বাভাবিকের বাইরে ছিল। এটি স্থায়ী কি না বুঝতে তিন মাস পরে আর একবার পরীক্ষা দরকার। একটি রক্তের ও একটি প্রস্রাবের নমুনা লাগবে। ${BOOK.bn}`;
    }
    return lang === "en"
      ? `${HELLO.en(m.first)} Your last kidney test was on ${m.date}${v ? ` (eGFR ${v})` : ""}. Your next kidney check ${DUE.en(m.overdue, m.dueBy)}. It needs one blood and one urine sample. ${BOOK.en}`
      : `${HELLO.bn(m.first)} আপনার শেষ কিডনির পরীক্ষা হয়েছিল ${m.dateBn}-এ${v ? ` (eGFR ${v})` : ""}। আবার কিডনি পরীক্ষার ${DUE.bn(m.overdue)}। একটি রক্তের ও একটি প্রস্রাবের নমুনা লাগবে। ${BOOK.bn}`;
  },
};
