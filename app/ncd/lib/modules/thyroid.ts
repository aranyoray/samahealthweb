// Thyroid. Reference range 0.45 to 4.5 µIU/mL. A single subclinical result
// is repeated at 6 to 12 weeks before it counts, because many settle on
// their own (ATA / ETA guidance). Once established, TSH is checked 6 to 8
// weeks after any dose change while out of range, and at least yearly once
// in range. Women 18 to 45 are flagged: an untreated high TSH matters before
// and during pregnancy.

import { latest, previous, testDays, upTo, type Assessment, type Ctx, type DiseaseModule } from "../engine";
import type { Obs } from "../types";
import { BOOK, DUE, HELLO, callbackWindow } from "./msg";

export const TSH_BANDS = ["< 0.1", "0.1–0.44", "0.45–4.5", "4.6–10", "> 10"] as const;
export const tshBand = (v: number) => (v < 0.1 ? 0 : v < 0.45 ? 1 : v <= 4.5 ? 2 : v <= 10 ? 3 : 4);
const outOfRange = (v: number) => v > 4.5 || v < 0.45;

function state(obs: Obs[]) {
  const tsh = obs.filter((o) => o.test === "TSH");
  const abn = tsh.filter((o) => outOfRange(o.value));
  const overt = abn.some((o) => o.value > 10 || o.value < 0.1);
  const repeated = abn.length >= 2 && abn[abn.length - 1].day - abn[0].day >= 42;
  const established = overt || repeated;
  const last = tsh[tsh.length - 1] ?? null;
  // A single subclinical result that a repeat cleared was transient.
  const inPathway = abn.length > 0 && (established || (last !== null && outOfRange(last.value)));
  const high = abn.length ? abn[0].value > 4.5 : true;
  const status = !inPathway ? "normal" : !established ? "unconfirmed" : high ? (overt ? "hypo" : "subhypo") : "hyper";
  return { tsh, abn, established, inPathway, last, status, overt };
}

function intervalFor(s: ReturnType<typeof state>): number {
  if (!s.established) return 84;
  if (s.last && outOfRange(s.last.value)) return s.status === "subhypo" ? 180 : 56;
  return 365;
}

export const thyroid: DiseaseModule = {
  key: "thyroid",
  name: "Thyroid disorders",
  route: "/thyroid",
  monitorTests: ["TSH"],
  headlineTest: "TSH",
  detailTests: ["TSH", "FT4"],
  bands: TSH_BANDS.map((label, i) => ({ label, color: ["#991b1b", "#e8622a", "#0d9488", "#dba300", "#c2410c"][i] })),
  statusLabel: {
    unconfirmed: "Abnormal once, repeat pending",
    hypo: "Hypothyroid (TSH over 10 at some point)",
    subhypo: "Subclinical hypothyroid",
    hyper: "Hyperthyroid (low TSH)",
  },
  reasonLabel: {
    confirm: "Needs 6 to 12 week repeat",
    "out-of-range": "TSH still out of range",
    reproductive: "Woman 18 to 45",
    critical: "TSH 50+ or fully suppressed",
    overdue: "TSH overdue",
  },
  abnormalLabel: "TSH outside 0.45 to 4.5",
  repeat: { label: "Repeat TSH within 4 months", withinDays: 120 },
  goalLabel: "Latest TSH back in range",

  assess(obsAll: Obs[], asOf: number, ctx: Ctx): Assessment {
    const obs = upTo(obsAll, asOf);
    const s = state(obs);
    const days = testDays(obs, ["TSH"]);
    const base = {
      inScope: s.tsh.length > 0,
      band: s.last ? tshBand(s.last.value) : null,
      lastDay: days.length ? days[days.length - 1] : null,
      headline: s.last,
      prevHeadline: previous(obs, "TSH", s.last),
    };
    if (!s.inPathway || !s.last) {
      return { ...base, firstAbnormalDay: null, status: "normal", interval: null, atGoal: null, severity: 0, reasons: [], critical: false, nextStep: "" };
    }
    const v = s.last.value;
    const out = outOfRange(v);
    const reasons: string[] = [];
    let severity: number;
    if (!s.established) {
      severity = 18;
      reasons.push("confirm");
    } else if (out) {
      severity = v > 10 || v < 0.1 ? 30 : 16;
      reasons.push("out-of-range");
    } else severity = 6;
    const reproductive = ctx.sex === "F" && ctx.age >= 18 && ctx.age <= 45 && (s.status === "hypo" || s.status === "subhypo" || s.status === "unconfirmed") && v > 2.5;
    if (reproductive) {
      reasons.push("reproductive");
      severity += 8;
    }
    const ft4 = latest(obs, "FT4");
    const critical = callbackWindow(asOf - s.last.day) && (v >= 50 || (v < 0.01 && !!ft4 && ft4.day === s.last.day && ft4.value > 2.5));
    if (critical) {
      reasons.unshift("critical");
      severity += 10;
    }
    let nextStep = critical
      ? "Doctor callback within 48 h, repeat TSH + free T4"
      : !s.established
        ? "Repeat TSH + free T4 at 6 to 12 weeks"
        : out
          ? "Book TSH (6 to 8 weeks after any dose change)"
          : "Book yearly TSH";
    if (reproductive) nextStep += ", ask about pregnancy plans";
    return {
      ...base,
      firstAbnormalDay: s.abn[0].day,
      status: s.status,
      interval: intervalFor(s),
      atGoal: !out,
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
    { trigger: "First TSH outside 0.45 to 4.5, under 10 and over 0.1", due: "repeat at 84 days", why: "Subclinical results often settle; confirm first" },
    { trigger: "TSH over 10, under 0.1, or abnormal twice", due: "diagnosis established", why: "ATA / ETA thresholds" },
    { trigger: "Established, TSH out of range", due: "every 56 days", why: "Recheck 6 to 8 weeks after a dose change" },
    { trigger: "Subclinical hypothyroid, still raised", due: "every 180 days", why: "ETA: 6-monthly while untreated" },
    { trigger: "Established, TSH in range", due: "every 365 days", why: "At least yearly once stable" },
    { trigger: "Woman 18 to 45 with TSH over 2.5", due: "pregnancy plans asked", why: "Untreated hypothyroidism harms pregnancy" },
    { trigger: "No TSH > 180 days past due", due: "marked lost to follow-up", why: "Same rule as the diabetes list" },
  ],
  scoreTable: [
    { factor: "Unconfirmed abnormal TSH", points: "18" },
    { factor: "Established, latest TSH over 10 or under 0.1 / mildly out / in range", points: "30 / 16 / 6" },
    { factor: "Woman 18 to 45, TSH over 2.5", points: "+8" },
    { factor: "TSH 50+, or under 0.01 with high free T4", points: "+10, forces Critical" },
  ],

  message(m, lang) {
    const v = m.headline ? m.headline.value : null;
    if (m.reasons.includes("critical")) {
      return lang === "en"
        ? `Doctor call. TSH on ${m.date} was far outside the normal range${v !== null ? ` (${v})` : ""} with no repeat since. Ask about tiredness, weight change, palpitations, swelling, pregnancy, and whether they are taking thyroid tablets every day. Repeat TSH and free T4 within 48 hours.`
        : `ডাক্তারের ফোন। ${m.dateBn}-এর রিপোর্টে TSH স্বাভাবিকের থেকে অনেক দূরে${v !== null ? ` (${v})` : ""}, তারপর আর পরীক্ষা হয়নি। জিজ্ঞেস করুন: ক্লান্তি, ওজনের পরিবর্তন, বুক ধড়ফড়, শরীর ফোলা, গর্ভাবস্থা, আর থাইরয়েডের ওষুধ রোজ খাচ্ছেন কি না। ৪৮ ঘণ্টার মধ্যে TSH ও free T4 পরীক্ষা করান।`;
    }
    if (m.status === "unconfirmed") {
      return lang === "en"
        ? `${HELLO.en(m.first)} Your thyroid test (TSH) on ${m.date} was outside the normal range. This often settles by itself, so one repeat test is needed before any treatment decision. ${BOOK.en}`
        : `${HELLO.bn(m.first)} ${m.dateBn}-এর থাইরয়েড পরীক্ষায় (TSH) মান স্বাভাবিকের বাইরে ছিল। অনেক সময় এটা নিজে থেকেই ঠিক হয়ে যায়, তাই চিকিৎসার আগে আর একবার পরীক্ষা দরকার। ${BOOK.bn}`;
    }
    const preg = m.reasons.includes("reproductive");
    return lang === "en"
      ? `${HELLO.en(m.first)} Your last thyroid test was on ${m.date}${v !== null ? ` (TSH ${v})` : ""}. Your next thyroid check ${DUE.en(m.overdue, m.dueBy)}. Please keep taking your tablets as prescribed until then.${preg ? " If you are planning a pregnancy, tell us; the dose often needs to change." : ""} ${BOOK.en}`
      : `${HELLO.bn(m.first)} আপনার শেষ থাইরয়েড পরীক্ষা হয়েছিল ${m.dateBn}-এ${v !== null ? ` (TSH ${v})` : ""}। আবার পরীক্ষার ${DUE.bn(m.overdue)}। ততদিন ডাক্তারের দেওয়া ওষুধ নিয়মিত খেয়ে যান।${preg ? " সন্তান নেওয়ার পরিকল্পনা থাকলে আমাদের জানান; প্রায়ই ওষুধের মাত্রা বদলাতে হয়।" : ""} ${BOOK.bn}`;
  },
};
