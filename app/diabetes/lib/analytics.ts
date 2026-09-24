// Aggregates for the /diabetes page. Everything here reads resolved
// timelines, never the synthetic ground truth, so the same code can run on
// the live mirror. (Only the linkage scorecard looks at ground truth.)

import {
  A1C_GOAL,
  FOLLOW_UP,
  careStateFor,
  classify,
  evaluate,
  glycaemicInterval,
  type CareState,
  type FollowUp,
  type Obs,
  type Reason,
  type Tier,
} from "./rules";
import type { Contact, Timeline } from "./timelines";
import { TEST_CODES, type Channel } from "./types";

/** Rows shipped to the browser per queue; the rest stay server-side. */
export const WORKLIST_ROWS = { keep: 150, reengage: 50 } as const;

const DAY_MONTH = 30.44;

const isGly = (o: Obs) => o.test === "HBA1C" || o.test === "FBS" || o.test === "PPBS" || o.test === "RBS";

/** One glycaemic anchor per test day, HbA1c preferred over glucose. */
function glyDays(obs: Obs[]): Obs[] {
  const out: Obs[] = [];
  for (const o of obs) {
    if (!isGly(o)) continue;
    const last = out[out.length - 1];
    if (last && last.day === o.day) {
      if (o.test === "HBA1C") out[out.length - 1] = o;
    } else out.push(o);
  }
  return out;
}

const a1cs = (obs: Obs[]) => obs.filter((o) => o.test === "HBA1C");

function median(xs: number[]): number {
  if (!xs.length) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0);
const round1 = (x: number) => Math.round(x * 10) / 10;

/** Spearman rank correlation. Robust to the skew in test counts and lab values. */
function spearman(pairs: [number, number][]): number {
  const n = pairs.length;
  if (n < 3) return 0;
  const ranks = (vals: number[]) => {
    const order = vals.map((v, i) => [v, i] as [number, number]).sort((a, b) => a[0] - b[0]);
    const r = new Array<number>(n);
    let i = 0;
    while (i < n) {
      let j = i;
      while (j + 1 < n && order[j + 1][0] === order[i][0]) j++;
      const avg = (i + j) / 2 + 1; // average rank for ties, 1-based
      for (let k = i; k <= j; k++) r[order[k][1]] = avg;
      i = j + 1;
    }
    return r;
  };
  const rx = ranks(pairs.map((p) => p[0]));
  const ry = ranks(pairs.map((p) => p[1]));
  const mean = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;
  const mx = mean(rx);
  const my = mean(ry);
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    const a = rx[i] - mx;
    const b = ry[i] - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  return dx && dy ? Math.round((num / Math.sqrt(dx * dy)) * 100) / 100 : 0;
}

export type Evaluated = { t: Timeline; f: FollowUp };

/* ------------------------------------------------------------------ */
/* Loss to follow-up (the longitudinal event)                           */
/* ------------------------------------------------------------------ */

type Loss = {
  lost: boolean;
  /** Day the person crossed into lost-to-follow-up, or the censor day. */
  day: number;
  a1cBefore: Obs | null;
  a1cOnReturn: Obs | null;
  returnedDay: number | null;
};

/**
 * Walk the glycaemic tests from the first diabetic-range result. A person
 * is lost the first time they go more than `lostAfterDays` past a due date
 * without another glycaemic test.
 */
export function lossEvent(obs: Obs[], t0: number, asOf: number): Loss {
  const days = glyDays(obs).filter((o) => o.day >= t0 && o.day <= asOf);
  for (let i = 0; i < days.length; i++) {
    const interval = glycaemicInterval("diabetes", days[i])!;
    const deadline = days[i].day + interval + FOLLOW_UP.lostAfterDays;
    const next = days[i + 1];
    if (next ? next.day > deadline : asOf > deadline) {
      const before = a1cs(obs).filter((o) => o.day <= days[i].day);
      const after = next ? a1cs(obs).filter((o) => o.day >= next.day) : [];
      return {
        lost: true,
        day: deadline,
        a1cBefore: before.length ? before[before.length - 1] : null,
        a1cOnReturn: after.length && after[0].day - next!.day <= 45 ? after[0] : null,
        returnedDay: next ? next.day : null,
      };
    }
  }
  return { lost: false, day: asOf, a1cBefore: null, a1cOnReturn: null, returnedDay: null };
}

/**
 * HbA1c moves slowly. A jump of 2.5+ points within 6 months, or a first
 * result under 5.7 followed later by 8+, is worth a human look: often two
 * namesakes joined into one timeline.
 */
export function implausibleJump(obs: Obs[]): boolean {
  const a = a1cs(obs);
  for (let i = 1; i < a.length; i++) {
    if (Math.abs(a[i].value - a[i - 1].value) >= 2.5 && a[i].day - a[i - 1].day <= 180) return true;
  }
  return a.length >= 2 && a[0].value < 5.7 && a[a.length - 1].value >= 8;
}

/** Kaplan-Meier "still in care" curve, sampled at whole months. */
function kaplanMeier(items: { time: number; event: boolean }[], months: number[]) {
  const sorted = [...items].sort((a, b) => a.time - b.time);
  let atRisk = sorted.length;
  let s = 1;
  let i = 0;
  const out: { month: number; s: number; atRisk: number }[] = [];
  for (const m of months) {
    const limit = m * DAY_MONTH;
    while (i < sorted.length && sorted[i].time <= limit) {
      const t = sorted[i].time;
      let d = 0;
      let c = 0;
      while (i < sorted.length && sorted[i].time === t) {
        if (sorted[i].event) d++;
        else c++;
        i++;
      }
      if (atRisk > 0) s *= 1 - d / atRisk;
      atRisk -= d + c;
    }
    out.push({ month: m, s, atRisk });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Bands                                                                */
/* ------------------------------------------------------------------ */

export const A1C_BANDS = ["< 5.7", "5.7 to 6.4", "6.5 to 7.9", "≥ 8.0"] as const;
export function a1cBand(v: number): number {
  return v < 5.7 ? 0 : v < 6.5 ? 1 : v < 8 ? 2 : 3;
}

const AGE_BANDS = ["18–29", "30–39", "40–49", "50–59", "60–69", "70+"] as const;
function ageBand(a: number): number {
  return a < 30 ? 0 : a < 40 ? 1 : a < 50 ? 2 : a < 60 ? 3 : a < 70 ? 4 : 5;
}

/* ------------------------------------------------------------------ */
/* Main                                                                 */
/* ------------------------------------------------------------------ */

export type Queue = "keep" | "reengage";

export type WorkRow = {
  pid: string;
  queue: Queue;
  name: string;
  sex: "F" | "M" | "";
  age: number;
  tier: Tier;
  score: number;
  reasons: Reason[];
  status: FollowUp["status"];
  careState: CareState;
  daysPastDue: number;
  dueDay: number;
  lastGlyDay: number;
  lastA1c: { day: number; value: number } | null;
  prevA1c: number | null;
  contact: Contact;
  phoneMasked: string | null;
  owner: string;
  nextStep: string;
  /** [day, index into TEST_CODES, value] */
  obs: [number, number, number][];
  identity: { patientKeys: number; visits: number; names: string[]; method: string; bridged: number; checkLink: boolean };
};

export function analyse(timelines: Timeline[], asOf: number) {
  const ev: Evaluated[] = timelines.map((t) => ({ t, f: evaluate(t.obs, asOf, t.ageNow) }));
  const dm = ev.filter((e) => e.f.firstDiabeticDay !== null);

  /* ---------- snapshot ---------- */
  const withSex = ev.filter((e) => e.t.sex);
  const female = withSex.filter((e) => e.t.sex === "F").length;
  const ageCounts = AGE_BANDS.map(() => 0);
  for (const e of ev) ageCounts[ageBand(e.t.ageNow)]++;

  const bandCounts = [0, 0, 0, 0];
  for (const e of ev) if (e.f.lastA1c) bandCounts[a1cBand(e.f.lastA1c.value)]++;

  const prevalence = (["F", "M"] as const).map((sex) =>
    AGE_BANDS.map((_, bi) => {
      const g = ev.filter((e) => e.t.sex === sex && ageBand(e.t.ageNow) === bi);
      return Math.round(pct(g.filter((e) => e.f.firstDiabeticDay !== null).length, g.length));
    }),
  );

  const controlBins = [
    { label: "under 7 (at goal)", test: (v: number) => v < 7 },
    { label: "7 to 7.9", test: (v: number) => v >= 7 && v < 8 },
    { label: "8 to 8.9", test: (v: number) => v >= 8 && v < 9 },
    { label: "9 to 9.9", test: (v: number) => v >= 9 && v < 10 },
    { label: "10 and over", test: (v: number) => v >= 10 },
  ];
  const dmWithA1c = dm.filter((e) => e.f.lastA1c);
  const control = controlBins.map((b) => {
    const n = dmWithA1c.filter((e) => b.test(e.f.lastA1c!.value)).length;
    return { label: b.label, n, pct: pct(n, dmWithA1c.length) };
  });

  const latestOf = (e: Evaluated, test: Obs["test"]) => {
    for (let i = e.t.obs.length - 1; i >= 0; i--) if (e.t.obs[i].test === test) return e.t.obs[i];
    return null;
  };
  const comorb = (label: string, test: Obs["test"], bad: (v: number, e: Evaluated) => boolean) => {
    const tested = dm.map((e) => ({ e, o: latestOf(e, test) })).filter((x) => x.o);
    const n = tested.filter((x) => bad(x.o!.value, x.e)).length;
    return { label, n, denom: tested.length, pct: pct(n, tested.length) };
  };
  const comorbidity = [
    comorb("eGFR under 60", "EGFR", (v) => v < 60),
    comorb("Urine ACR 30 or more", "UACR", (v) => v >= 30),
    comorb("LDL 100 or more", "LDL", (v) => v >= 100),
    comorb("Anaemia (Hb < 12 F, < 13 M)", "HB", (v, e) => v < (e.t.sex === "M" ? 13 : 12)),
  ];

  /* ---------- losses ---------- */
  const losses = dm.map((e) => ({ e, t0: e.f.firstDiabeticDay!, loss: lossEvent(e.t.obs, e.f.firstDiabeticDay!, asOf) }));
  const months = Array.from({ length: 31 }, (_, i) => i);
  const kmOf = (sel: typeof losses) =>
    kaplanMeier(
      sel.map((x) => ({ time: x.loss.day - x.t0, event: x.loss.lost })),
      months,
    );
  const kmOwn = kmOf(losses.filter((x) => x.e.t.contact === "own"));
  const kmOther = kmOf(losses.filter((x) => x.e.t.contact !== "own"));
  const kmAll = kmOf(losses);

  // Cascade among people diagnosed at least 12 months ago
  const eligible = losses.filter((x) => x.t0 <= asOf - 365);
  const step1 = eligible;
  const step2 = step1.filter((x) => glyDays(x.e.t.obs).some((o) => o.day > x.t0));
  const step3 = step2.filter((x) => a1cs(x.e.t.obs).some((o) => o.day > x.t0 && o.day - x.t0 <= 183));
  const step4 = step3.filter((x) => glyDays(x.e.t.obs).some((o) => o.day > asOf - 365));
  const step5 = step4.filter((x) => x.e.f.lastA1c && x.e.f.lastA1c.value < A1C_GOAL);
  const cascade = [
    { label: "Diabetic-range result", n: step1.length },
    { label: "Came back for any sugar test", n: step2.length },
    { label: "Repeat HbA1c within 6 months", n: step3.length },
    { label: "Still testing in the last 12 months", n: step4.length },
    { label: "Latest HbA1c under 7", n: step5.length },
  ].map((s) => ({ ...s, pct: pct(s.n, step1.length) }));

  // Retest gaps between consecutive HbA1c (people with diabetes)
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
  for (const e of dm) {
    const a = a1cs(e.t.obs);
    for (let i = 1; i < a.length; i++) {
      const g = a[i].day - a[i - 1].day;
      if (g <= 0) continue;
      gaps++;
      gapCounts[gapBins.findIndex((b) => g <= b.max)]++;
    }
  }
  const retestGaps = gapBins.map((b, i) => ({ label: b.label, n: gapCounts[i], pct: pct(gapCounts[i], gaps) }));

  // Lapsed and came back: HbA1c before vs on return
  const returned = losses.filter((x) => x.loss.lost && x.loss.a1cBefore && x.loss.a1cOnReturn);
  const lapseReturn = {
    n: returned.length,
    before: median(returned.map((x) => x.loss.a1cBefore!.value)),
    after: median(returned.map((x) => x.loss.a1cOnReturn!.value)),
    gapMonths: median(returned.map((x) => (x.loss.returnedDay! - x.loss.a1cBefore!.day) / DAY_MONTH)),
    worse: pct(returned.filter((x) => x.loss.a1cOnReturn!.value - x.loss.a1cBefore!.value >= 0.5).length, returned.length),
  };

  // Median HbA1c by quarter since diagnosis: never lapsed vs. after a lapse
  const quarters = Array.from({ length: 12 }, (_, q) => q);
  const byQ = (pick: (x: (typeof losses)[number]) => Obs[]) =>
    quarters.map((q) => {
      const vals: number[] = [];
      for (const x of losses) {
        for (const o of pick(x)) {
          const qq = Math.floor((o.day - x.t0) / (DAY_MONTH * 3));
          if (qq === q) vals.push(o.value);
        }
      }
      return { q, n: vals.length, median: vals.length >= 15 ? Math.round(median(vals) * 10) / 10 : null };
    });
  const trajectory = {
    stayed: byQ((x) => (x.loss.lost ? [] : a1cs(x.e.t.obs).filter((o) => o.day >= x.t0))),
    returned: byQ((x) =>
      x.loss.lost && x.loss.returnedDay ? a1cs(x.e.t.obs).filter((o) => o.day >= x.loss.returnedDay!) : [],
    ),
  };

  // First vs latest HbA1c band
  const transition = [0, 1, 2, 3].map(() => [0, 0, 0, 0]);
  let transitionN = 0;
  for (const e of ev) {
    const a = a1cs(e.t.obs);
    if (a.length < 2 || a[a.length - 1].day - a[0].day < 180) continue;
    transition[a1cBand(a[0].value)][a1cBand(a[a.length - 1].value)]++;
    transitionN++;
  }
  const transitionPct = transition.map((row) => {
    const s = row.reduce((x, y) => x + y, 0);
    return row.map((v) => Math.round(pct(v, s)));
  });
  const transitionRowN = transition.map((row) => row.reduce((x, y) => x + y, 0));

  // Prediabetes: were they rechecked, and did they progress?
  const preFirst = ev.filter((e) => {
    const c = classify(e.t.obs, e.t.obs[0].day);
    return c.status === "prediabetes" && e.t.obs[0].day <= asOf - 455;
  });
  const preRechecked = preFirst.filter((e) => glyDays(e.t.obs).some((o) => o.day > e.t.obs[0].day && o.day - e.t.obs[0].day <= 455));
  const preProgressed = preFirst.filter((e) => e.f.firstDiabeticDay !== null);
  const prediabetes = {
    n: preFirst.length,
    rechecked: preRechecked.length,
    progressed: preProgressed.length,
    progressedOfRechecked: pct(preProgressed.filter((e) => preRechecked.includes(e)).length, preRechecked.length),
  };

  // Complication screening among people with diabetes seen in the last 12 months
  const active = losses.filter((x) => x.t0 <= asOf - 365 && glyDays(x.e.t.obs).some((o) => o.day > asOf - 365));
  const hadIn12 = (x: (typeof losses)[number], test: Obs["test"], k = 1) =>
    x.e.t.obs.filter((o) => o.test === test && o.day > asOf - 365).length >= k;
  const screening = [
    { label: "2+ HbA1c in the year", n: active.filter((x) => hadIn12(x, "HBA1C", 2)).length },
    { label: "eGFR (creatinine)", n: active.filter((x) => hadIn12(x, "EGFR")).length },
    { label: "Urine ACR", n: active.filter((x) => hadIn12(x, "UACR")).length },
    { label: "Lipid profile", n: active.filter((x) => hadIn12(x, "LDL")).length },
  ].map((s) => ({ ...s, denom: active.length, pct: pct(s.n, active.length) }));

  // Who gets lost: 12-month loss by segment
  const seg12 = losses.filter((x) => x.t0 <= asOf - 365);
  const lostIn12 = (x: (typeof seg12)[number]) => x.loss.lost && x.loss.day - x.t0 <= 365;
  const segRate = (label: string, sel: (x: (typeof seg12)[number]) => boolean) => {
    const g = seg12.filter(sel);
    return { label, n: g.length, pct: pct(g.filter(lostIn12).length, g.length) };
  };
  const baselineA1c = (x: (typeof seg12)[number]) => a1cs(x.e.t.obs).find((o) => o.day >= x.t0 && o.day - x.t0 <= 45)?.value;
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
      group: "HbA1c at diagnosis",
      rows: [
        segRate("6.5 to 7.9", (x) => (baselineA1c(x) ?? 0) >= 6.5 && (baselineA1c(x) ?? 0) < 8),
        segRate("8.0 to 9.9", (x) => (baselineA1c(x) ?? 0) >= 8 && (baselineA1c(x) ?? 0) < 10),
        segRate("10 and over", (x) => (baselineA1c(x) ?? 0) >= 10),
      ],
    },
  ];
  const overallLoss12 = pct(seg12.filter(lostIn12).length, seg12.length);

  // Month-end status of everyone diagnosed so far, last 24 months
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
      const g = glyDays(x.e.t.obs).filter((o) => o.day <= day);
      const lastG = g[g.length - 1];
      const due = lastG.day + glycaemicInterval("diabetes", lastG)!;
      const st = careStateFor(day - due);
      if (st === "lost") lost++;
      else if (st === "overdue" || st === "slipping") overdue++;
      else onTrack++;
    }
    flow.push({ day, onTrack, overdue, lost });
  }

  /* ---------- testing frequency vs continuity of care (last 3.5 years) ---------- */
  // Cohort the user asked for: people with 2+ sugar tests in the window. Then
  // relate how often they test to whether they stay in care and how their
  // numbers move. Testing rate is tests per year since a person's first test
  // in the window, so both intensity and dropping-off pull it down.
  const WINDOW_YEARS = 3.5;
  const winStart = asOf - Math.round(WINDOW_YEARS * 365);
  type Freq = { e: Evaluated; g: Obs[]; perYear: number; dm: boolean };
  const freqPeople: Freq[] = ev
    .map((e) => {
      const g = glyDays(e.t.obs).filter((o) => o.day >= winStart);
      return { e, g, perYear: 0, dm: e.f.firstDiabeticDay !== null };
    })
    .filter((x) => x.g.length >= 2);
  for (const x of freqPeople) x.perYear = x.g.length / Math.max(0.5, (asOf - x.g[0].day) / 365);

  const freqBins = [
    { label: "Under 1 / yr", lo: 0, hi: 1 },
    { label: "1 to 2 / yr", lo: 1, hi: 2 },
    { label: "2 to 3 / yr", lo: 2, hi: 3 },
    { label: "3+ / yr", lo: 3, hi: Infinity },
  ];
  const binOf = (r: number) => freqBins.findIndex((b) => r >= b.lo && r < b.hi);
  const a1cChange = (x: Freq) => {
    const a = a1cs(x.e.t.obs);
    return a.length >= 2 ? a[0].value - a[a.length - 1].value : null; // + = improved
  };
  const fullyScreened = (x: Freq) =>
    x.e.t.obs.some((o) => o.test === "EGFR" && o.day > asOf - 365) &&
    x.e.t.obs.some((o) => o.test === "LDL" && o.day > asOf - 365) &&
    x.e.t.obs.filter((o) => o.test === "HBA1C" && o.day > asOf - 365).length >= 2;

  const freqRows = freqBins.map((b, bi) => {
    const grp = freqPeople.filter((x) => binOf(x.perYear) === bi);
    const withState = grp.filter((x) => x.e.f.careState !== null);
    const dmGrp = grp.filter((x) => x.dm);
    const withA1c = dmGrp.filter((x) => x.e.f.lastA1c);
    const changes = dmGrp.map(a1cChange).filter((v): v is number => v !== null);
    return {
      label: b.label,
      n: grp.length,
      inCarePct: pct(withState.filter((x) => x.e.f.careState !== "lost").length, withState.length),
      medianA1c: withA1c.length >= 10 ? round1(median(withA1c.map((x) => x.e.f.lastA1c!.value))) : null,
      atGoalPct: withA1c.length ? pct(withA1c.filter((x) => x.e.f.lastA1c!.value < A1C_GOAL).length, withA1c.length) : 0,
      medianChange: changes.length >= 10 ? round1(median(changes)) : null,
      screenedPct: dmGrp.length ? pct(dmGrp.filter(fullyScreened).length, dmGrp.length) : 0,
      dm: dmGrp.length,
      withA1c: withA1c.length,
    };
  });

  const dmFreq = freqPeople.filter((x) => x.dm);
  const dmFreqA1c = dmFreq.filter((x) => x.e.f.lastA1c);
  const dmFreqChange = dmFreq.map((x) => ({ x, c: a1cChange(x) })).filter((o): o is { x: Freq; c: number } => o.c !== null);
  const frequency = {
    windowYears: WINDOW_YEARS,
    cohort: freqPeople.length,
    dm: dmFreq.length,
    twoPlusOfDiabetes: pct(dmFreq.length, dm.length),
    medianTests: median(freqPeople.map((x) => x.g.length)),
    medianPerYear: round1(median(freqPeople.map((x) => x.perYear))),
    bins: freqRows,
    a1cN: dmFreqA1c.length,
    changeN: dmFreqChange.length,
    spearman: {
      // more testing vs lower latest HbA1c (negative expected)
      hba1c: spearman(dmFreqA1c.map((x) => [x.perYear, x.e.f.lastA1c!.value])),
      // more testing vs bigger HbA1c improvement (positive expected)
      change: spearman(dmFreqChange.map((o) => [o.x.perYear, o.c])),
      // more testing vs less past due (negative expected)
      due: spearman(dmFreq.filter((x) => x.e.f.daysPastDue !== null).map((x) => [x.perYear, x.e.f.daysPastDue!])),
    },
  };

  /* ---------- hero ---------- */
  const states = dm.map((e) => e.f.careState);
  const lostNow = states.filter((s) => s === "lost").length;
  const recoverable = states.filter((s) => s === "overdue" || s === "slipping").length;

  /* ---------- worklist ---------- */
  // Two queues: people who can still be kept (due soon, overdue, slipping,
  // or flagged critical / unconfirmed) and people already lost, who need a
  // re-engagement effort rather than a routine recall.
  const inList = ev.filter((e) => e.f.tier !== null);
  const queueOf = (e: Evaluated): Queue => (e.f.careState === "lost" ? "reengage" : "keep");
  const tierTotals: Record<Queue, Record<Tier, number>> = {
    keep: { critical: 0, high: 0, medium: 0, routine: 0 },
    reengage: { critical: 0, high: 0, medium: 0, routine: 0 },
  };
  const reasonTotals: Partial<Record<Reason, number>> = {};
  const ownerKind = (e: Evaluated) =>
    e.f.tier === "critical"
      ? "Duty doctor"
      : e.t.contact === "own"
        ? "Care coordinator"
        : e.t.contact === "shared"
          ? "Collection agent"
          : "Referring doctor / outreach";
  const ownerTotals = new Map<string, number>();
  for (const e of inList) {
    tierTotals[queueOf(e)][e.f.tier!]++;
    if (queueOf(e) === "keep") {
      for (const r of e.f.reasons) reasonTotals[r] = (reasonTotals[r] ?? 0) + 1;
      ownerTotals.set(ownerKind(e), (ownerTotals.get(ownerKind(e)) ?? 0) + 1);
    }
  }
  const ownerOf = (e: Evaluated) => {
    if (e.f.tier === "critical") return "Duty doctor";
    if (e.t.contact === "own") return "Care coordinator";
    if (e.t.contact === "shared") return e.t.agentLabel ?? "Collection agent";
    return e.t.referrer ?? "Camp outreach";
  };
  const rank = (a: Evaluated, b: Evaluated) => b.f.score - a.f.score || (b.f.daysPastDue ?? 0) - (a.f.daysPastDue ?? 0);
  const keep = inList.filter((e) => queueOf(e) === "keep").sort(rank);
  const reengage = inList.filter((e) => queueOf(e) === "reengage").sort(rank);

  // Someone already lost may simply be testing elsewhere: ask first.
  const nextStepOf = (e: Evaluated) => {
    if (queueOf(e) === "keep") return e.f.nextStep;
    const base = e.f.nextStep.replace(/^Doctor call first\. /, "");
    return `Ask where they test now, then ${base[0].toLowerCase()}${base.slice(1)}`;
  };
  const toRow = (e: Evaluated): WorkRow => ({
    pid: `P-${String(e.t.pid + 1).padStart(5, "0")}`,
    queue: queueOf(e),
    name: e.t.name,
    sex: e.t.sex,
    age: e.t.ageNow,
    tier: e.f.tier!,
    score: e.f.score,
    reasons: e.f.reasons,
    status: e.f.status,
    careState: e.f.careState!,
    daysPastDue: e.f.daysPastDue!,
    dueDay: e.f.dueDay!,
    lastGlyDay: e.f.lastGly!.day,
    lastA1c: e.f.lastA1c ? { day: e.f.lastA1c.day, value: e.f.lastA1c.value } : null,
    prevA1c: e.f.prevA1c?.value ?? null,
    contact: e.t.contact,
    phoneMasked: e.t.phoneMasked,
    owner: ownerOf(e),
    nextStep: nextStepOf(e),
    // Last 16 results keep the payload small; the chart only needs recent history.
    obs: e.t.obs.slice(-16).map((o) => [o.day, TEST_CODES.indexOf(o.test), o.value] as [number, number, number]),
    identity: {
      patientKeys: e.t.patientKeys.length,
      visits: e.t.visitDays.length,
      names: e.t.typedNames.slice(0, 5),
      method: e.t.method,
      bridged: e.t.links.filter((l) => l === "name-bridge").length,
      checkLink: implausibleJump(e.t.obs),
    },
  });
  const rows: WorkRow[] = [...keep.slice(0, WORKLIST_ROWS.keep).map(toRow), ...reengage.slice(0, WORKLIST_ROWS.reengage).map(toRow)];

  return {
    evaluated: ev,
    hero: {
      cohort: ev.length,
      diabetes: dm.length,
      lostNow,
      lostPct: pct(lostNow, dm.length),
      recoverable,
      urgent: tierTotals.keep.critical + tierTotals.keep.high,
      overallLoss12,
    },
    snapshot: {
      total: ev.length,
      female,
      male: withSex.length - female,
      ageBuckets: AGE_BANDS.map((label, i) => ({ label, v: ageCounts[i] })),
      bandCounts,
      prevalence,
      ageLabels: [...AGE_BANDS],
      control,
      dmWithA1c: dmWithA1c.length,
      comorbidity,
    },
    longitudinal: {
      cascade,
      eligible: step1.length,
      km: { own: kmOwn, other: kmOther, all: kmAll, nOwn: losses.filter((x) => x.e.t.contact === "own").length, nOther: losses.filter((x) => x.e.t.contact !== "own").length },
      retestGaps,
      gaps,
      lapseReturn,
      trajectory,
      transitionPct,
      transitionRowN,
      transitionN,
      prediabetes,
      screening,
      activeN: active.length,
      lossSegments,
      flow,
    },
    frequency,
    worklist: {
      rows,
      keepTotal: keep.length,
      reengageTotal: reengage.length,
      tierTotals,
      reasonTotals,
      ownerTotals: [...ownerTotals.entries()].map(([owner, n]) => ({ owner, n })).sort((a, b) => b.n - a.n),
      keepScores: keep.map((e) => e.f.score),
    },
  };
}

export type Analysis = ReturnType<typeof analyse>;
