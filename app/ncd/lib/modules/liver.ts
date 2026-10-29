// Fatty liver (MASLD) and liver scarring. FIB-4 is computed from the AST,
// ALT and platelet count already on the same bill; the lab report does not
// print it. Cut-offs follow AASLD 2023: under 1.3 low risk (2.0 from age
// 65), 1.3 to 2.66 indeterminate and sent for elastography, 2.67 or more
// high risk and referred to a liver specialist. People with type 2 diabetes
// are rescreened every 1 to 2 years even when low risk.

import { hasDiabetes, latest, previous, testDays, upTo, type Assessment, type Ctx, type DiseaseModule } from "../engine";
import { FIB4_HIGH, FIB4_LOW, type Obs } from "../types";
import { BOOK, DUE, HELLO, callbackWindow } from "./msg";

export const FIB4_BANDS = ["Low (< 1.3)", "Indeterminate (1.3–2.66)", "High (≥ 2.67)", "Not computable"] as const;

const ALT_ULN = 40;

function state(obs: Obs[], age: number) {
  const fib = latest(obs, "FIB4");
  const alt = latest(obs, "ALT");
  const lowCut = FIB4_LOW(age);
  const fibCat = fib ? (fib.value >= FIB4_HIGH ? 2 : fib.value >= lowCut ? 1 : 0) : null;
  const dm = hasDiabetes(obs);
  const abnDays = obs.filter((o) => (o.test === "ALT" && o.value > ALT_ULN) || (o.test === "FIB4" && o.value >= FIB4_LOW(age)));
  const altHigh = !!alt && alt.value > ALT_ULN;
  let status: string;
  if (fibCat === 2) status = "advanced";
  else if (fibCat === 1) status = "indeterminate";
  else if (altHigh && fibCat === null) status = "no-fib4";
  else if (altHigh) status = "raised-alt";
  else status = "low";
  // Back to low risk with normal ALT: only people with diabetes stay on a recall.
  const inPathway = abnDays.length > 0 && (status !== "low" || dm);
  return { fib, alt, fibCat, dm, abnDays, status, inPathway };
}

const INTERVAL: Record<string, number> = { advanced: 180, indeterminate: 365, "no-fib4": 90, "raised-alt": 180, low: 730 };

export const liver: DiseaseModule = {
  key: "liver",
  name: "Fatty liver and liver scarring",
  route: "/ncd#liver",
  monitorTests: ["ALT"],
  headlineTest: "FIB4",
  detailTests: ["FIB4", "ALT", "AST", "PLT", "HBA1C"],
  bands: FIB4_BANDS.map((label, i) => ({ label, color: ["#0d9488", "#dba300", "#b91c1c", "#94a3b8"][i] })),
  statusLabel: {
    advanced: "FIB-4 high: likely advanced scarring",
    indeterminate: "FIB-4 indeterminate",
    "no-fib4": "ALT raised, FIB-4 not computable",
    "raised-alt": "ALT raised, FIB-4 low",
    low: "Diabetes, FIB-4 now low",
  },
  reasonLabel: {
    "refer-hep": "Refer to liver specialist",
    elastography: "Needs elastography",
    "add-cbc": "Order CBC with the LFT",
    critical: "ALT 200+",
    overdue: "Liver check overdue",
  },
  abnormalLabel: "ALT over 40 or FIB-4 at or above the low cut-off",
  repeat: { label: "Repeat LFT within 6 months", withinDays: 183 },
  goalLabel: "FIB-4 scored in the last 2 years",

  assess(obsAll: Obs[], asOf: number, ctx: Ctx): Assessment {
    const obs = upTo(obsAll, asOf);
    const s = state(obs, ctx.age);
    const days = testDays(obs, ["ALT"]);
    const base = {
      inScope: !!s.alt,
      band: s.alt ? (s.fibCat ?? 3) : null,
      lastDay: days.length ? days[days.length - 1] : null,
      headline: s.fib ?? s.alt,
      prevHeadline: s.fib ? previous(obs, "FIB4", s.fib) : previous(obs, "ALT", s.alt),
    };
    if (!s.inPathway || !s.alt) {
      return { ...base, firstAbnormalDay: null, status: "normal", interval: null, atGoal: null, severity: 0, reasons: [], critical: false, nextStep: "" };
    }
    const reasons: string[] = [];
    let severity = { advanced: 32, indeterminate: 20, "no-fib4": 14, "raised-alt": 12, low: 4 }[s.status] ?? 4;
    if (s.dm) severity += 6;
    if (s.status === "advanced") reasons.push("refer-hep");
    if (s.status === "indeterminate") reasons.push("elastography");
    if (s.status === "no-fib4") reasons.push("add-cbc");
    const critical = s.alt.value >= 200 && callbackWindow(asOf - s.alt.day);
    if (critical) {
      reasons.unshift("critical");
      severity += 10;
    }
    const nextStep = critical
      ? "Doctor callback within 48 h, repeat LFT"
      : s.status === "advanced"
        ? "Refer to hepatology, book LFT + CBC"
        : s.status === "indeterminate"
          ? "Refer for liver elastography (FibroScan)"
          : s.status === "low"
            ? "Book LFT + CBC (FIB-4 every 2 years with diabetes)"
            : "Book LFT + CBC together so FIB-4 can be scored";
    return {
      ...base,
      firstAbnormalDay: s.abnDays[0].day,
      status: s.status,
      interval: INTERVAL[s.status],
      atGoal: obs.some((o) => o.test === "FIB4" && o.day > asOf - 730),
      severity,
      reasons,
      critical,
      nextStep,
    };
  },

  intervalAt(obs: Obs[], day: number, ctx: Ctx) {
    return INTERVAL[state(upTo(obs, day), ctx.age).status];
  },

  ruleTable: [
    { trigger: "AST, ALT and platelets on the same bill, age 35+", due: "FIB-4 computed", why: "Lab report does not print it" },
    { trigger: "FIB-4 2.67 or more", due: "hepatology referral, LFT every 180 days", why: "AASLD 2023: high risk of advanced fibrosis" },
    { trigger: "FIB-4 1.3 to 2.66 (2.0 to 2.66 at 65+)", due: "elastography, recheck yearly", why: "AASLD 2023: indeterminate" },
    { trigger: "ALT over 40, no platelets that day", due: "LFT + CBC within 90 days", why: "So FIB-4 can be scored" },
    { trigger: "ALT over 40, FIB-4 low", due: "every 180 days", why: "Persistent raised ALT needs review" },
    { trigger: "Diabetes, FIB-4 low", due: "every 730 days", why: "AASLD / ADA: rescreen every 1 to 2 years" },
    { trigger: "No LFT > 180 days past due", due: "marked lost to follow-up", why: "Same rule as the diabetes list" },
  ],
  scoreTable: [
    { factor: "FIB-4 high / indeterminate / not computable / ALT raised, FIB-4 low / low", points: "32 / 20 / 14 / 12 / 4" },
    { factor: "Diabetes on file", points: "+6" },
    { factor: "ALT 200 or more with no repeat", points: "+10, forces Critical" },
  ],

  message(m, lang) {
    if (m.reasons.includes("critical")) {
      return lang === "en"
        ? `Doctor call. The liver test on ${m.date} showed a very high ALT with no repeat since. Ask about yellow eyes, dark urine, tummy pain, alcohol, and any new medicines or herbal remedies. Repeat the liver function test within 48 hours; same day if jaundiced.`
        : `ডাক্তারের ফোন। ${m.dateBn}-এর লিভার পরীক্ষায় ALT অনেক বেশি, তারপর আর পরীক্ষা হয়নি। জিজ্ঞেস করুন: চোখ হলুদ, প্রস্রাব গাঢ়, পেটে ব্যথা, মদ্যপান, আর নতুন কোনো ওষুধ বা কবিরাজি ওষুধ খাচ্ছেন কি না। ৪৮ ঘণ্টার মধ্যে লিভার ফাংশন টেস্ট করান; জন্ডিস থাকলে আজই আসতে বলুন।`;
    }
    if (m.reasons.includes("refer-hep") || m.reasons.includes("elastography")) {
      return lang === "en"
        ? `${HELLO.en(m.first)} Your liver tests on ${m.date} suggest the liver needs a closer look. Your doctor can arrange a painless liver scan (FibroScan). Your next liver blood test ${DUE.en(m.overdue, m.dueBy)}. ${BOOK.en}`
        : `${HELLO.bn(m.first)} ${m.dateBn}-এর লিভার পরীক্ষা থেকে মনে হচ্ছে লিভার আরও ভালো করে দেখা দরকার। ডাক্তার একটি ব্যথাহীন লিভার স্ক্যান (ফাইব্রোস্ক্যান) করাতে পারেন। আবার লিভারের রক্ত পরীক্ষার ${DUE.bn(m.overdue)}। ${BOOK.bn}`;
    }
    return lang === "en"
      ? `${HELLO.en(m.first)} Your last liver test was on ${m.date}. Your next liver check ${DUE.en(m.overdue, m.dueBy)}; it is one blood sample for the liver test and blood count together. ${BOOK.en}`
      : `${HELLO.bn(m.first)} আপনার শেষ লিভার পরীক্ষা হয়েছিল ${m.dateBn}-এ। আবার পরীক্ষার ${DUE.bn(m.overdue)}; একটি রক্তের নমুনা থেকেই লিভার পরীক্ষা ও ব্লাড কাউন্ট দুটোই হবে। ${BOOK.bn}`;
  },
};
