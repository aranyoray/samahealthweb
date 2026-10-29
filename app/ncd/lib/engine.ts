// The part every condition shares. A condition module says what is abnormal,
// how often the next test is due and how sick the latest result is; this
// file turns that into care states, a priority score, loss-to-follow-up
// events and the aggregates on each page. Lateness, tiers and the 180-day
// lost rule are the same as /diabetes so the queues can be merged.

import { FOLLOW_UP, TIER_MIN, careStateFor, type CareState, type Tier } from "../../diabetes/lib/rules";
import { fmtDay, isoOf } from "../../diabetes/lib/rng";
import type { Channel } from "../../diabetes/lib/types";
import type { Contact, Timeline } from "./timelines";
import { TEST_LABEL, TEST_UNIT, type NcdTest, type Obs } from "./types";

export type { CareState, Tier };

export type Ctx = { sex: "F" | "M" | ""; age: number; obs: Obs[] };

export type Headline = { test: NcdTest; value: number; day: number };

/** What a condition module reports about one person on one day. */
export type Assessment = {
  inScope: boolean;
  firstAbnormalDay: number | null;
  status: string;
  band: number | null;
  lastDay: number | null;
  headline: Headline | null;
  prevHeadline: Headline | null;
  /** Days from `lastDay` to the next monitoring test; null = no follow-up needed. */
  interval: number | null;
  atGoal: boolean | null;
  /** Clinical severity points, 0 to about 50. */
  severity: number;
  reasons: string[];
  critical: boolean;
  nextStep: string;
};

export type MessageInput = {
  first: string;
  date: string;
  dateBn: string;
  headline: Headline | null;
  status: string;
  reasons: string[];
  overdue: boolean;
  dueBy: string;
};

export type DiseaseModule = {
  key: "kidney" | "heart" | "thyroid" | "liver";
  name: string;
  route: string;
  /** Tests whose presence on a day counts as a monitoring visit. */
  monitorTests: NcdTest[];
  headlineTest: NcdTest;
  detailTests: NcdTest[];
  bands: { label: string; color: string }[];
  statusLabel: Record<string, string>;
  reasonLabel: Record<string, string>;
  abnormalLabel: string;
  repeat: { label: string; withinDays: number };
  goalLabel: string;
  assess: (obs: Obs[], asOf: number, ctx: Ctx) => Assessment;
  /** Interval after the monitoring test on `day`, judged on results up to then. */
  intervalAt: (obs: Obs[], day: number, ctx: Ctx) => number;
  ruleTable: { trigger: string; due: string; why: string }[];
  scoreTable: { factor: string; points: string }[];
  message: (m: MessageInput, lang: "en" | "bn") => string;
};

/* ------------------------------------------------------------------ */
/* Helpers modules use                                                  */
/* ------------------------------------------------------------------ */

export function latest(obs: Obs[], test: NcdTest, asOf = Infinity): Obs | null {
  for (let i = obs.length - 1; i >= 0; i--) if (obs[i].test === test && obs[i].day <= asOf) return obs[i];
  return null;
}

export function previous(obs: Obs[], test: NcdTest, before: Obs | null): Obs | null {
  if (!before) return null;
  for (let i = obs.length - 1; i >= 0; i--) if (obs[i].test === test && obs[i].day < before.day) return obs[i];
  return null;
}

export const upTo = (obs: Obs[], day: number) => obs.filter((o) => o.day <= day);

export function hasDiabetes(obs: Obs[], asOf = Infinity): boolean {
  return obs.some((o) => o.day <= asOf && ((o.test === "HBA1C" && o.value >= 6.5) || (o.test === "FBS" && o.value >= 126)));
}

/** Days on which any of these tests was done, in order. */
export function testDays(obs: Obs[], tests: NcdTest[], asOf = Infinity): number[] {
  const out: number[] = [];
  for (const o of obs) if (o.day <= asOf && tests.includes(o.test) && out[out.length - 1] !== o.day) out.push(o.day);
  return out;
}

/* ------------------------------------------------------------------ */
/* Scoring shared by every condition                                    */
/* ------------------------------------------------------------------ */

export type FollowUp = Assessment & {
  dueDay: number | null;
  daysPastDue: number | null;
  careState: CareState | null;
  score: number;
  tier: Tier | null;
};

export function evaluate(m: DiseaseModule, t: Timeline, asOf: number): FollowUp {
  const ctx: Ctx = { sex: t.sex, age: t.ageNow, obs: t.obs };
  const a = m.assess(t.obs, asOf, ctx);
  if (a.firstAbnormalDay === null || a.interval === null || a.lastDay === null) {
    return { ...a, dueDay: null, daysPastDue: null, careState: null, score: 0, tier: null };
  }
  const dueDay = a.lastDay + a.interval;
  const daysPastDue = asOf - dueDay;
  const careState = careStateFor(daysPastDue);
  const reasons = [...a.reasons];
  let score = a.severity;
  if (daysPastDue > 0) {
    reasons.push("overdue");
    score += daysPastDue <= 180 ? Math.min(25, 8 + daysPastDue / 8) : Math.max(6, 25 - (daysPastDue - 180) / 20);
  } else if (daysPastDue > -FOLLOW_UP.dueSoonDays) score += 4;
  if (t.ageNow >= 65) score += 5;
  score = Math.round(Math.min(100, score));

  let tier: Tier | null = null;
  const actionable = daysPastDue > -FOLLOW_UP.dueSoonDays || a.critical || reasons.includes("confirm");
  if (actionable) {
    if (a.critical || score >= TIER_MIN.critical) tier = "critical";
    else if (score >= TIER_MIN.high) tier = "high";
    else if (score >= TIER_MIN.medium) tier = "medium";
    else tier = "routine";
  }
  const nextStep = tier === "critical" && !a.critical ? `Doctor call first. ${a.nextStep}` : a.nextStep;
  return { ...a, reasons, score, tier, dueDay, daysPastDue, careState, nextStep };
}

export const LATENESS_ROWS = [
  { factor: "Days past due (peaks at 180, then decays)", points: "up to 25" },
  { factor: "Due within the next 30 days", points: "4" },
  { factor: "Age 65+", points: "5" },
];

/* ------------------------------------------------------------------ */
/* Loss to follow-up                                                    */
/* ------------------------------------------------------------------ */

export type Loss = { lost: boolean; day: number; returnedDay: number | null };

export function lossEvent(m: DiseaseModule, t: Timeline, t0: number, asOf: number): Loss {
  const ctx: Ctx = { sex: t.sex, age: t.ageNow, obs: t.obs };
  const days = testDays(t.obs, m.monitorTests, asOf).filter((d) => d >= t0);
  for (let i = 0; i < days.length; i++) {
    const deadline = days[i] + m.intervalAt(t.obs, days[i], ctx) + FOLLOW_UP.lostAfterDays;
    const next = days[i + 1];
    if (next ? next > deadline : asOf > deadline) return { lost: true, day: deadline, returnedDay: next ?? null };
  }
  return { lost: false, day: asOf, returnedDay: null };
}

const DAY_MONTH = 30.44;

function kaplanMeier(items: { time: number; event: boolean }[], months: number[]) {
  const sorted = [...items].sort((a, b) => a.time - b.time);
  let atRisk = sorted.length;
  let s = 1;
  let i = 0;
  const out: { month: number; s: number; atRisk: number }[] = [];
  for (const mo of months) {
    const limit = mo * DAY_MONTH;
    while (i < sorted.length && sorted[i].time <= limit) {
      const tm = sorted[i].time;
      let d = 0;
      let c = 0;
      while (i < sorted.length && sorted[i].time === tm) {
        if (sorted[i].event) d++;
        else c++;
        i++;
      }
      if (atRisk > 0) s *= 1 - d / atRisk;
      atRisk -= d + c;
    }
    out.push({ month: mo, s, atRisk });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Aggregates for a condition page                                      */
/* ------------------------------------------------------------------ */

export const WORKLIST_ROWS = { keep: 120, reengage: 40 } as const;

export const AGE_BANDS = ["18–29", "30–39", "40–49", "50–59", "60–69", "70+"] as const;
export const ageBand = (a: number) => (a < 30 ? 0 : a < 40 ? 1 : a < 50 ? 2 : a < 60 ? 3 : a < 70 ? 4 : 5);

export const pct = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0);

export type Queue = "keep" | "reengage";

export type WorkRow = {
  pid: string;
  queue: Queue;
  name: string;
  sex: "F" | "M" | "";
  age: number;
  tier: Tier;
  score: number;
  reasons: string[];
  status: string;
  careState: CareState;
  daysPastDue: number;
  dueDay: number;
  lastDay: number;
  headline: { label: string; value: number; unit: string; day: number } | null;
  prev: number | null;
  contact: Contact;
  phoneMasked: string | null;
  owner: string;
  nextStep: string;
  msgEn: string;
  msgBn: string;
  recent: { day: number; label: string; value: number; unit: string }[];
  identity: { patientKeys: number; visits: number; names: string[] };
};

export type Evaluated = { t: Timeline; f: FollowUp };

function firstName(name: string): string {
  return name.split(" ").filter((x) => x !== "Md" && x !== "Sk")[0] ?? name;
}

function dmy(day: number): string {
  const [y, mo, d] = isoOf(day).split("-");
  return `${d}/${mo}/${y}`;
}

export function analyseDisease(m: DiseaseModule, timelines: Timeline[], asOf: number) {
  const ev: Evaluated[] = timelines.map((t) => ({ t, f: evaluate(m, t, asOf) }));
  const scope = ev.filter((e) => e.f.inScope);
  const abn = scope.filter((e) => e.f.firstAbnormalDay !== null);

  /* ---------- snapshot ---------- */
  const withSex = scope.filter((e) => e.t.sex);
  const female = withSex.filter((e) => e.t.sex === "F").length;
  const ageCounts = AGE_BANDS.map(() => 0);
  for (const e of scope) ageCounts[ageBand(e.t.ageNow)]++;
  const bandCounts = m.bands.map(() => 0);
  for (const e of scope) if (e.f.band !== null) bandCounts[e.f.band]++;
  const prevalence = (["F", "M"] as const).map((sex) =>
    AGE_BANDS.map((_, bi) => {
      const g = scope.filter((e) => e.t.sex === sex && ageBand(e.t.ageNow) === bi);
      return Math.round(pct(g.filter((e) => e.f.firstAbnormalDay !== null).length, g.length));
    }),
  );
  const statusCounts = new Map<string, number>();
  for (const e of abn) statusCounts.set(e.f.status, (statusCounts.get(e.f.status) ?? 0) + 1);
  const statuses = [...statusCounts.entries()]
    .map(([k, n]) => ({ key: k, label: m.statusLabel[k] ?? k, n, pct: pct(n, abn.length) }))
    .sort((a, b) => b.n - a.n);
  const withDm = abn.filter((e) => hasDiabetes(e.t.obs, asOf)).length;

  /* ---------- losses ---------- */
  const losses = abn.map((e) => ({ e, t0: e.f.firstAbnormalDay!, loss: lossEvent(m, e.t, e.f.firstAbnormalDay!, asOf) }));
  const months = Array.from({ length: 31 }, (_, i) => i);
  const kmOf = (sel: typeof losses) => kaplanMeier(sel.map((x) => ({ time: x.loss.day - x.t0, event: x.loss.lost })), months);
  const ownL = losses.filter((x) => x.e.t.contact === "own");
  const otherL = losses.filter((x) => x.e.t.contact !== "own");
  const km = { own: kmOf(ownL), other: kmOf(otherL), nOwn: ownL.length, nOther: otherL.length };

  const mDays = (x: (typeof losses)[number]) => testDays(x.e.t.obs, m.monitorTests, asOf);
  const eligible = losses.filter((x) => x.t0 <= asOf - 365);
  const s2 = eligible.filter((x) => mDays(x).some((d) => d > x.t0));
  const s3 = s2.filter((x) => mDays(x).some((d) => d > x.t0 && d - x.t0 <= m.repeat.withinDays));
  const s4 = s3.filter((x) => mDays(x).some((d) => d > asOf - 365));
  const s5 = s4.filter((x) => x.e.f.atGoal === true);
  const cascade = [
    { label: m.abnormalLabel, n: eligible.length },
    { label: "Came back for any follow-up test", n: s2.length },
    { label: m.repeat.label, n: s3.length },
    { label: "Still testing in the last 12 months", n: s4.length },
    { label: m.goalLabel, n: s5.length },
  ].map((s) => ({ ...s, pct: pct(s.n, eligible.length) }));

  const gapBins = [
    { label: "≤ 3 mo", max: 105 },
    { label: "3–6 mo", max: 195 },
    { label: "6–9 mo", max: 285 },
    { label: "9–12 mo", max: 380 },
    { label: "12–18 mo", max: 548 },
    { label: "> 18 mo", max: Infinity },
  ];
  const gapCounts = gapBins.map(() => 0);
  let gaps = 0;
  for (const x of losses) {
    const d = testDays(x.e.t.obs, [m.headlineTest], asOf).filter((v) => v >= x.t0);
    for (let i = 1; i < d.length; i++) {
      gaps++;
      gapCounts[gapBins.findIndex((b) => d[i] - d[i - 1] <= b.max)]++;
    }
  }
  const retestGaps = gapBins.map((b, i) => ({ label: b.label, n: gapCounts[i], pct: pct(gapCounts[i], gaps) }));

  const seg12 = eligible;
  const lostIn12 = (x: (typeof seg12)[number]) => x.loss.lost && x.loss.day - x.t0 <= 365;
  const segRate = (label: string, sel: (x: (typeof seg12)[number]) => boolean) => {
    const g = seg12.filter(sel);
    return { label, n: g.length, pct: pct(g.filter(lostIn12).length, g.length) };
  };
  const entry = (c: Channel) => (x: (typeof seg12)[number]) => x.e.t.firstChannel === c;
  const lossSegments = [
    {
      group: "Contact on file",
      rows: [
        segRate("Own mobile", (x) => x.e.t.contact === "own"),
        segRate("Agent's number only", (x) => x.e.t.contact === "shared"),
        segRate("No usable number", (x) => x.e.t.contact === "none"),
      ],
    },
    {
      group: "First came through",
      rows: [
        segRate("Walk-in, Barasat", entry("walk-in")),
        segRate("Home collection", entry("home")),
        segRate("Partner centre", entry("partner")),
        segRate("Screening camp", entry("camp")),
      ],
    },
    {
      group: "Age",
      rows: [
        segRate("Under 40", (x) => x.e.t.ageNow < 40),
        segRate("40 to 59", (x) => x.e.t.ageNow >= 40 && x.e.t.ageNow < 60),
        segRate("60 and over", (x) => x.e.t.ageNow >= 60),
      ],
    },
    {
      group: "Also has diabetes",
      rows: [
        segRate("Diabetic-range result on file", (x) => hasDiabetes(x.e.t.obs, asOf)),
        segRate("No diabetic-range result", (x) => !hasDiabetes(x.e.t.obs, asOf)),
      ],
    },
  ];
  const overallLoss12 = pct(seg12.filter(lostIn12).length, seg12.length);

  const flow: { day: number; onTrack: number; overdue: number; lost: number }[] = [];
  const asOfDate = new Date(asOf * 86_400_000);
  for (let k = 23; k >= 0; k--) {
    const endDate = new Date(Date.UTC(asOfDate.getUTCFullYear(), asOfDate.getUTCMonth() - k + 1, 0));
    const day = Math.min(asOf, Math.round(endDate.getTime() / 86_400_000));
    let onTrack = 0;
    let overdue = 0;
    let lost = 0;
    for (const x of losses) {
      if (x.t0 > day) continue;
      const d = testDays(x.e.t.obs, m.monitorTests, day);
      const last = d[d.length - 1];
      const st = careStateFor(day - (last + m.intervalAt(x.e.t.obs, last, { sex: x.e.t.sex, age: x.e.t.ageNow, obs: x.e.t.obs })));
      if (st === "lost") lost++;
      else if (st === "overdue" || st === "slipping") overdue++;
      else onTrack++;
    }
    flow.push({ day, onTrack, overdue, lost });
  }

  /* ---------- hero ---------- */
  const lostNow = abn.filter((e) => e.f.careState === "lost").length;
  const recoverable = abn.filter((e) => e.f.careState === "overdue" || e.f.careState === "slipping").length;

  /* ---------- worklist ---------- */
  const inList = abn.filter((e) => e.f.tier !== null);
  const queueOf = (e: Evaluated): Queue => (e.f.careState === "lost" ? "reengage" : "keep");
  const tierTotals: Record<Queue, Record<Tier, number>> = {
    keep: { critical: 0, high: 0, medium: 0, routine: 0 },
    reengage: { critical: 0, high: 0, medium: 0, routine: 0 },
  };
  const ownerKind = (e: Evaluated) =>
    e.f.tier === "critical" ? "Duty doctor" : e.t.contact === "own" ? "Care coordinator" : e.t.contact === "shared" ? "Collection agent" : "Referring doctor / outreach";
  const ownerTotals = new Map<string, number>();
  for (const e of inList) {
    tierTotals[queueOf(e)][e.f.tier!]++;
    if (queueOf(e) === "keep") ownerTotals.set(ownerKind(e), (ownerTotals.get(ownerKind(e)) ?? 0) + 1);
  }
  const ownerOf = (e: Evaluated) =>
    e.f.tier === "critical"
      ? "Duty doctor"
      : e.t.contact === "own"
        ? "Care coordinator"
        : e.t.contact === "shared"
          ? (e.t.agentLabel ?? "Collection agent")
          : (e.t.referrer ?? "Camp outreach");
  const rank = (a: Evaluated, b: Evaluated) => b.f.score - a.f.score || (b.f.daysPastDue ?? 0) - (a.f.daysPastDue ?? 0);
  const keep = inList.filter((e) => queueOf(e) === "keep").sort(rank);
  const reengage = inList.filter((e) => queueOf(e) === "reengage").sort(rank);

  const toRow = (e: Evaluated): WorkRow => {
    const f = e.f;
    const reengaging = queueOf(e) === "reengage";
    const base = f.nextStep.replace(/^Doctor call first\. /, "");
    const msg: MessageInput = {
      first: firstName(e.t.name),
      date: fmtDay(f.lastDay!),
      dateBn: dmy(f.lastDay!),
      headline: f.headline,
      status: f.status,
      reasons: f.reasons,
      overdue: f.daysPastDue! > 0,
      dueBy: fmtDay(f.dueDay!),
    };
    return {
      pid: `P-${String(e.t.pid + 1).padStart(5, "0")}`,
      queue: queueOf(e),
      name: e.t.name,
      sex: e.t.sex,
      age: e.t.ageNow,
      tier: f.tier!,
      score: f.score,
      reasons: f.reasons.map((r) => m.reasonLabel[r] ?? r),
      status: m.statusLabel[f.status] ?? f.status,
      careState: f.careState!,
      daysPastDue: f.daysPastDue!,
      dueDay: f.dueDay!,
      lastDay: f.lastDay!,
      headline: f.headline ? { label: TEST_LABEL[f.headline.test], value: f.headline.value, unit: TEST_UNIT[f.headline.test], day: f.headline.day } : null,
      prev: f.prevHeadline?.value ?? null,
      contact: e.t.contact,
      phoneMasked: e.t.phoneMasked,
      owner: ownerOf(e),
      nextStep: reengaging ? `Ask where they test now, then ${base[0].toLowerCase()}${base.slice(1)}` : f.nextStep,
      msgEn: m.message(msg, "en"),
      msgBn: m.message(msg, "bn"),
      recent: e.t.obs
        .filter((o) => m.detailTests.includes(o.test))
        .slice(-14)
        .map((o) => ({ day: o.day, label: TEST_LABEL[o.test], value: o.value, unit: TEST_UNIT[o.test] })),
      identity: { patientKeys: e.t.patientKeys.length, visits: e.t.visitDays.length, names: e.t.typedNames.slice(0, 5) },
    };
  };
  const rows = [...keep.slice(0, WORKLIST_ROWS.keep).map(toRow), ...reengage.slice(0, WORKLIST_ROWS.reengage).map(toRow)];

  return {
    module: m.key,
    evaluated: ev,
    hero: {
      tested: scope.length,
      abnormal: abn.length,
      lostNow,
      lostPct: pct(lostNow, abn.length),
      recoverable,
      urgent: tierTotals.keep.critical + tierTotals.keep.high,
      overallLoss12,
    },
    snapshot: {
      total: scope.length,
      female,
      male: withSex.length - female,
      ageBuckets: AGE_BANDS.map((label, i) => ({ label, v: ageCounts[i] })),
      bandCounts,
      prevalence,
      statuses,
      withDm,
      withDmPct: pct(withDm, abn.length),
    },
    longitudinal: { cascade, eligible: eligible.length, km, retestGaps, gaps, lossSegments, flow },
    worklist: {
      rows,
      keepTotal: keep.length,
      reengageTotal: reengage.length,
      tierTotals,
      ownerTotals: [...ownerTotals.entries()].map(([owner, n]) => ({ owner, n })).sort((a, b) => b.n - a.n),
    },
  };
}

export type DiseaseAnalysis = ReturnType<typeof analyseDisease>;
