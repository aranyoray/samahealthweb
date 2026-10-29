// Cholesterol and cardiovascular risk. LDL targets follow the Lipid
// Association of India: under 70 mg/dL for people at high risk (diabetes or
// CKD, both visible in the lab record) and under 100 otherwise. A lipid
// profile is repeated 6 to 12 weeks after a statin is started or changed,
// so above-target results are recalled at 90 days; at target, yearly. The
// lab cannot see prescriptions, so "above target" may mean untreated or
// under-treated; either way someone should look.

import { hasDiabetes, latest, previous, testDays, upTo, type Assessment, type DiseaseModule } from "../engine";
import type { Obs } from "../types";
import { BOOK, DUE, HELLO, callbackWindow } from "./msg";

export const LDL_BANDS = ["< 70", "70–99", "100–129", "130–159", "160–189", "≥ 190"] as const;
export const ldlBand = (v: number) => (v < 70 ? 0 : v < 100 ? 1 : v < 130 ? 2 : v < 160 ? 3 : v < 190 ? 4 : 5);

export function highRisk(obs: Obs[], asOf = Infinity) {
  return hasDiabetes(obs, asOf) || obs.some((o) => o.day <= asOf && o.test === "EGFR" && o.value < 60);
}
export const targetFor = (obs: Obs[], asOf = Infinity) => (highRisk(obs, asOf) ? 70 : 100);

/** A lipid result that puts someone on the follow-up list, judged with what was known that day. */
function isAbnormalDay(obs: Obs[], day: number): boolean {
  const ldl = obs.find((o) => o.day === day && o.test === "LDL");
  const tg = obs.find((o) => o.day === day && o.test === "TG");
  if (tg && tg.value >= 500) return true;
  if (!ldl) return false;
  return ldl.value >= 160 || (highRisk(obs, day) && ldl.value >= 100);
}

export const heart: DiseaseModule = {
  key: "heart",
  name: "Cholesterol and heart risk",
  route: "/heart",
  monitorTests: ["LDL"],
  headlineTest: "LDL",
  detailTests: ["LDL", "HDL", "TG", "HBA1C", "EGFR"],
  bands: LDL_BANDS.map((label, i) => ({ label, color: ["#0d9488", "#5eb8a8", "#dba300", "#e8622a", "#c2410c", "#991b1b"][i] })),
  statusLabel: {
    fh: "LDL 190+ (possible familial)",
    "high-risk": "Diabetes or CKD, above LDL 70",
    "high-ldl": "LDL 160 to 189",
    tg: "Triglycerides 500+",
  },
  reasonLabel: {
    "above-target": "LDL above target",
    fh: "LDL 190+: test the family",
    tg: "Triglycerides 500+",
    rising: "LDL up 30+ since last",
    critical: "Triglycerides 1,000+",
    overdue: "Lipid profile overdue",
  },
  abnormalLabel: "LDL 160+, or 100+ with diabetes or CKD, or TG 500+",
  repeat: { label: "Repeat lipid profile within 4 months", withinDays: 120 },
  goalLabel: "Latest LDL at target",

  assess(obsAll: Obs[], asOf: number): Assessment {
    const obs = upTo(obsAll, asOf);
    const days = testDays(obs, ["LDL"]);
    const ldl = latest(obs, "LDL");
    const base = {
      inScope: !!ldl,
      band: ldl ? ldlBand(ldl.value) : null,
      lastDay: days.length ? days[days.length - 1] : null,
      headline: ldl,
      prevHeadline: previous(obs, "LDL", ldl),
    };
    const firstAbn = days.find((d) => isAbnormalDay(obs, d)) ?? null;
    if (firstAbn === null || !ldl) {
      return { ...base, firstAbnormalDay: null, status: "normal", interval: null, atGoal: null, severity: 0, reasons: [], critical: false, nextStep: "" };
    }
    const target = targetFor(obs);
    const risky = highRisk(obs);
    const maxLdl = Math.max(...obs.filter((o) => o.test === "LDL").map((o) => o.value));
    const tg = latest(obs, "TG");
    const tgMax = Math.max(0, ...obs.filter((o) => o.test === "TG").map((o) => o.value));
    const status = maxLdl >= 190 ? "fh" : risky ? "high-risk" : maxLdl >= 160 ? "high-ldl" : tgMax >= 500 ? "tg" : "high-ldl";
    const above = ldl.value >= target;

    const reasons: string[] = [];
    let severity = ldl.value >= 190 ? 34 : ldl.value >= 160 ? 24 : above && ldl.value >= 130 ? 18 : above ? 14 : 6;
    if (above) reasons.push("above-target");
    if (risky) severity += 6;
    if (status === "fh") reasons.push("fh");
    if (tg && tg.day === ldl.day && tg.value >= 500) {
      reasons.push("tg");
      severity += 8;
    }
    if (base.prevHeadline && ldl.value - base.prevHeadline.value >= 30) {
      reasons.push("rising");
      severity += 6;
    }
    const critical = !!tg && tg.value >= 1000 && callbackWindow(asOf - tg.day);
    if (critical) {
      reasons.unshift("critical");
      severity += 10;
    }
    let nextStep = critical
      ? "Doctor callback within 48 h, repeat fasting lipids"
      : above
        ? "Book lipid profile (6 to 12 weeks after any statin change)"
        : "Book yearly lipid profile";
    if (status === "fh") nextStep += ", offer family a lipid test";
    return {
      ...base,
      firstAbnormalDay: firstAbn,
      status,
      interval: above ? 90 : 365,
      atGoal: !above,
      severity,
      reasons,
      critical,
      nextStep,
    };
  },

  intervalAt(obs: Obs[], day: number) {
    const o = upTo(obs, day);
    const ldl = latest(o, "LDL");
    return ldl && ldl.value >= targetFor(o) ? 90 : 365;
  },

  ruleTable: [
    { trigger: "LDL at or above target", due: "every 90 days", why: "Recheck 6 to 12 weeks after a statin is started or changed" },
    { trigger: "LDL below target", due: "every 365 days", why: "Yearly review once at target" },
    { trigger: "Diabetes or eGFR under 60 on file", due: "target LDL under 70", why: "Lipid Association of India: high risk" },
    { trigger: "No diabetes or CKD on file", due: "target LDL under 100", why: "LAI: low to moderate risk" },
    { trigger: "Any LDL 190 or more", due: "family testing offered", why: "Possible familial hypercholesterolaemia" },
    { trigger: "Triglycerides 1,000 or more", due: "doctor callback within 48 h", why: "Risk of acute pancreatitis" },
    { trigger: "No lipid test > 180 days past due", due: "marked lost to follow-up", why: "Same rule as the diabetes list" },
  ],
  scoreTable: [
    { factor: "Latest LDL ≥ 190 / 160 to 189 / above target ≥ 130 / above target < 130 / at target", points: "34 / 24 / 18 / 14 / 6" },
    { factor: "Diabetes or CKD on file", points: "+6" },
    { factor: "Triglycerides 500+ on the same test", points: "+8" },
    { factor: "LDL up 30+ since the previous test", points: "+6" },
    { factor: "Triglycerides 1,000+ with no repeat", points: "+10, forces Critical" },
  ],

  message(m, lang) {
    const v = m.headline ? Math.round(m.headline.value) : null;
    if (m.reasons.includes("critical")) {
      return lang === "en"
        ? `Doctor call. Triglycerides on ${m.date} were very high, a risk for pancreatitis, with no repeat since. Ask about tummy pain, vomiting, alcohol and sugar control, and which medicines they take. Repeat fasting lipids within 48 hours; ask them to come in the same day if they have tummy pain.`
        : `ডাক্তারের ফোন। ${m.dateBn}-এর রিপোর্টে ট্রাইগ্লিসারাইড অনেক বেশি, প্যানক্রিয়াটাইটিসের ঝুঁকি আছে, তারপর আর পরীক্ষা হয়নি। জিজ্ঞেস করুন: পেটে ব্যথা, বমি, মদ্যপান, সুগার নিয়ন্ত্রণ, আর কী ওষুধ খাচ্ছেন। ৪৮ ঘণ্টার মধ্যে খালি পেটে লিপিড পরীক্ষা করান; পেটে ব্যথা থাকলে আজই আসতে বলুন।`;
    }
    const family = m.reasons.includes("fh");
    const above = m.reasons.includes("above-target");
    return lang === "en"
      ? `${HELLO.en(m.first)} Your cholesterol test on ${m.date}${v ? ` (LDL ${v} mg/dL)` : ""} ${above ? "was above the level your doctor aims for" : "was on target"}. Your next cholesterol check ${DUE.en(m.overdue, m.dueBy)}.${family ? " Cholesterol this high can run in families; parents, brothers, sisters and children can be tested at the same visit." : ""} ${BOOK.en}`
      : `${HELLO.bn(m.first)} ${m.dateBn}-এর কোলেস্টেরল পরীক্ষায়${v ? ` (LDL ${v} mg/dL)` : ""} ${above ? "মান ডাক্তারের লক্ষ্যের চেয়ে বেশি ছিল" : "মান লক্ষ্যের মধ্যে ছিল"}। আবার কোলেস্টেরল পরীক্ষার ${DUE.bn(m.overdue)}।${family ? " এই মাত্রার কোলেস্টেরল পরিবারে চলতে পারে; বাবা-মা, ভাই-বোন ও সন্তানদেরও একই সঙ্গে পরীক্ষা করানো যায়।" : ""} ${BOOK.bn}`;
  },
};
