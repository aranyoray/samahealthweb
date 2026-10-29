// generate → resolve identities → timelines (with eGFR and FIB-4 derived) →
// one analysis per condition → cross-condition view. Runs once per server
// process; every page is statically rendered at build time.

import { resolveIdentities, scoreClustering } from "../../diabetes/lib/identity";
import { classify, evaluate as evaluateDm, type Obs as DmObs } from "../../diabetes/lib/rules";
import { analyseDisease, ageBand, AGE_BANDS, hasDiabetes, latest, pct, type DiseaseAnalysis, type DiseaseModule } from "./engine";
import { heart, highRisk } from "./modules/heart";
import { aStage, gStage, kidney } from "./modules/kidney";
import { liver } from "./modules/liver";
import { thyroid } from "./modules/thyroid";
import { AS_OF, generateNcdCohort } from "./synth";
import { buildTimelines, type Timeline } from "./timelines";
import { FIB4_HIGH, FIB4_LOW, type NcdTest } from "./types";

export const MODULES = { kidney, heart, thyroid, liver } as const;
export type ModuleKey = keyof typeof MODULES;

function buildBase() {
  const { bills, truePersons, agents } = generateNcdCohort();
  const res = resolveIdentities(bills);
  const agentLabelOf = new Map(agents.map((a) => [a.phone, a.label]));
  const timelines = buildTimelines(bills, res, agentLabelOf, AS_OF);
  const ours = scoreClustering("ours", res.personOfBill, bills.map((b) => b.truth));
  return {
    asOf: AS_OF,
    timelines,
    identity: {
      bills: bills.length,
      results: bills.reduce((s, b) => s + b.results.length, 0),
      patientKeys: new Set(bills.map((b) => b.patientKey)).size,
      persons: res.persons.length,
      truePersons,
      precision: ours.precision,
      recall: ours.recall,
    },
    billsWith: (tests: NcdTest[]) =>
      bills.filter((b) => b.results.some((r) => tests.includes(r.test) || (tests.includes("EGFR") && r.test === "CREAT"))).length,
  };
}

let base: ReturnType<typeof buildBase> | null = null;
const getBase = () => (base ??= buildBase());

/* ------------------------------------------------------------------ */
/* Condition-specific panels                                            */
/* ------------------------------------------------------------------ */

function kidneyExtras(a: DiseaseAnalysis, tl: Timeline[]) {
  // G × A grid among people in the CKD pathway, latest values; A unknown when ACR never done.
  const grid = Array.from({ length: 6 }, () => [0, 0, 0, 0]);
  for (const e of a.evaluated) {
    if (e.f.firstAbnormalDay === null) continue;
    const eg = latest(e.t.obs, "EGFR");
    if (!eg) continue;
    const acr = latest(e.t.obs, "UACR");
    grid[gStage(eg.value)][acr ? aStage(acr.value) : 3]++;
  }
  const dm = tl.filter((t) => hasDiabetes(t.obs));
  const dmEgfr = dm.filter((t) => t.obs.some((o) => o.test === "EGFR"));
  const dmAcr = dm.filter((t) => t.obs.some((o) => o.test === "UACR"));
  const acrOnly = a.evaluated.filter(
    (e) => e.f.firstAbnormalDay !== null && !e.t.obs.some((o) => o.test === "EGFR" && o.value < 60) && e.t.obs.some((o) => o.test === "UACR" && o.value >= 30),
  ).length;
  const abnormal = a.hero.abnormal;
  return {
    grid,
    dm: dm.length,
    dmEgfrPct: pct(dmEgfr.length, dm.length),
    dmAcrPct: pct(dmAcr.length, dm.length),
    acrOnly,
    acrOnlyPct: pct(acrOnly, abnormal),
    noSexEgfr: tl.filter((t) => !t.sex && t.obs.some((o) => o.test === "CREAT")).length,
  };
}

function heartExtras(a: DiseaseAnalysis, tl: Timeline[]) {
  const inPath = a.evaluated.filter((e) => e.f.firstAbnormalDay !== null);
  const attain = (sel: typeof inPath) => {
    const n = sel.length;
    const ok = sel.filter((e) => e.f.atGoal).length;
    return { n, ok, pct: pct(ok, n) };
  };
  const high = attain(inPath.filter((e) => highRisk(e.t.obs)));
  const other = attain(inPath.filter((e) => !highRisk(e.t.obs)));

  // Familial hypercholesterolaemia: who shares an own mobile with an LDL 190+ person?
  const byPhone = new Map<string, Timeline[]>();
  for (const t of tl) for (const ph of t.ownPhones) byPhone.set(ph, [...(byPhone.get(ph) ?? []), t]);
  const fh = tl.filter((t) => t.obs.some((o) => o.test === "LDL" && o.value >= 190));
  const relatives = new Set<number>();
  const relativesTested = new Set<number>();
  for (const t of fh)
    for (const ph of t.ownPhones)
      for (const r of byPhone.get(ph) ?? []) {
        if (r.pid === t.pid) continue;
        relatives.add(r.pid);
        if (r.obs.some((o) => o.test === "LDL")) relativesTested.add(r.pid);
      }
  // Diabetes or CKD on file, but never a lipid profile.
  const risky = tl.filter((t) => highRisk(t.obs));
  const riskyNoLipid = risky.filter((t) => !t.obs.some((o) => o.test === "LDL")).length;
  return {
    high,
    other,
    fh: fh.length,
    relatives: relatives.size,
    relativesUntested: relatives.size - relativesTested.size,
    risky: risky.length,
    riskyNoLipid,
    riskyNoLipidPct: pct(riskyNoLipid, risky.length),
    targets: { high: 70, other: 100 },
  };
}

function thyroidExtras(a: DiseaseAnalysis) {
  const scope = a.evaluated.filter((e) => e.f.inScope);
  const inPath = scope.filter((e) => e.f.firstAbnormalDay !== null);
  const bySex = (["F", "M"] as const).map((s) => {
    const g = scope.filter((e) => e.t.sex === s);
    return { sex: s, n: g.length, abnormal: g.filter((e) => e.f.firstAbnormalDay !== null).length, pct: pct(g.filter((e) => e.f.firstAbnormalDay !== null).length, g.length) };
  });
  const repro = inPath.filter((e) => e.t.sex === "F" && e.t.ageNow >= 18 && e.t.ageNow <= 45);
  const firstAbn = inPath.map((e) => e.t.obs.find((o) => o.test === "TSH" && (o.value > 4.5 || o.value < 0.45))!);
  const ft4Same = inPath.filter((e, i) => e.t.obs.some((o) => o.test === "FT4" && o.day === firstAbn[i].day)).length;
  // Single subclinical results that a repeat cleared: confirm-before-treat matters.
  const singles = scope.filter((e) => {
    const tsh = e.t.obs.filter((o) => o.test === "TSH");
    return tsh.length >= 2 && tsh[0].value > 4.5 && tsh[0].value <= 10 && tsh.slice(1).every((o) => o.value <= 4.5 && o.value >= 0.45);
  }).length;
  const firstSub = scope.filter((e) => {
    const tsh = e.t.obs.filter((o) => o.test === "TSH");
    return tsh.length >= 2 && tsh[0].value > 4.5 && tsh[0].value <= 10;
  }).length;
  const reproOverdue = repro.filter((e) => e.f.careState && e.f.careState !== "on-track" && e.f.careState !== "due-soon").length;
  return { bySex, repro: repro.length, reproOverdue, reproOverduePct: pct(reproOverdue, repro.length), ft4SamePct: pct(ft4Same, inPath.length), settled: singles, firstSub, settledPct: pct(singles, firstSub) };
}

function liverExtras(a: DiseaseAnalysis, tl: Timeline[]) {
  const dm = tl.filter((t) => hasDiabetes(t.obs));
  const dmAge = dm.filter((t) => t.ageNow >= 35);
  const dmLft = dmAge.filter((t) => t.obs.some((o) => o.test === "ALT"));
  const dmFib = dmAge.filter((t) => t.obs.some((o) => o.test === "FIB4"));
  const cats = [0, 0, 0];
  for (const t of dmFib) {
    const f = latest(t.obs, "FIB4")!;
    cats[f.value >= FIB4_HIGH ? 2 : f.value >= FIB4_LOW(t.ageNow) ? 1 : 0]++;
  }
  // Bills where FIB-4 was computable but the report did not show it: all of them.
  const scored = tl.reduce((s, t) => s + t.obs.filter((o) => o.test === "FIB4").length, 0);
  const altNoPlt = a.evaluated.filter((e) => e.f.status === "no-fib4").length;
  return {
    dmAge: dmAge.length,
    dmLftPct: pct(dmLft.length, dmAge.length),
    dmFibPct: pct(dmFib.length, dmAge.length),
    dmFib: dmFib.length,
    dmCats: cats,
    dmAtRiskPct: pct(cats[1] + cats[2], dmFib.length),
    scored,
    altNoPlt,
  };
}

const EXTRAS = {
  kidney: kidneyExtras,
  heart: heartExtras,
  thyroid: (a: DiseaseAnalysis) => thyroidExtras(a),
  liver: liverExtras,
};

/* ------------------------------------------------------------------ */
/* One condition page                                                   */
/* ------------------------------------------------------------------ */

const cache = new Map<ModuleKey, unknown>();

function buildDisease<K extends ModuleKey>(key: K) {
  const b = getBase();
  const m: DiseaseModule = MODULES[key];
  const a = analyseDisease(m, b.timelines, b.asOf);
  const extras = EXTRAS[key](a, b.timelines) as ReturnType<(typeof EXTRAS)[K]>;
  const scope = a.evaluated.filter((e) => e.f.inScope);
  const linking = {
    bills: b.billsWith(m.monitorTests),
    persons: scope.length,
    patientKeys: new Set(scope.flatMap((e) => e.t.patientKeys)).size,
  };
  const { evaluated, ...rest } = a;
  void evaluated;
  return { asOf: b.asOf, identity: b.identity, linking, ...rest, extras };
}

export function getDisease<K extends ModuleKey>(key: K): ReturnType<typeof buildDisease<K>> {
  if (!cache.has(key)) cache.set(key, buildDisease(key));
  return cache.get(key) as ReturnType<typeof buildDisease<K>>;
}

export type DiseaseDashboard = ReturnType<typeof getDisease>;

/* ------------------------------------------------------------------ */
/* Cross-condition view (/ncd)                                          */
/* ------------------------------------------------------------------ */

export const CONDITIONS = [
  { key: "diabetes", label: "Diabetes", route: "/diabetes", tests: ["HbA1c", "fasting glucose"], tube: "blood" },
  { key: "kidney", label: "Kidney disease", route: "/ncd#kidney", tests: ["creatinine", "urine ACR"], tube: "blood + urine" },
  { key: "heart", label: "Cholesterol", route: "/ncd#heart", tests: ["lipid profile"], tube: "blood" },
  { key: "thyroid", label: "Thyroid", route: "/ncd#thyroid", tests: ["TSH"], tube: "blood" },
  { key: "liver", label: "Fatty liver", route: "/ncd#liver", tests: ["LFT", "CBC"], tube: "blood" },
] as const;
export type ConditionKey = (typeof CONDITIONS)[number]["key"];

function buildHub() {
  const b = getBase();
  const asOf = b.asOf;
  const analyses = Object.fromEntries((Object.keys(MODULES) as ModuleKey[]).map((k) => [k, analyseDisease(MODULES[k], b.timelines, asOf)])) as Record<ModuleKey, DiseaseAnalysis>;

  type PersonState = { t: Timeline; inPath: Set<ConditionKey>; due: Set<ConditionKey>; lost: Set<ConditionKey> };
  const people: PersonState[] = b.timelines.map((t, i) => {
    const inPath = new Set<ConditionKey>();
    const due = new Set<ConditionKey>();
    const lost = new Set<ConditionKey>();
    // Diabetes reuses the /diabetes rules unchanged.
    const dmObs = t.obs as unknown as DmObs[];
    const dmf = evaluateDm(dmObs, asOf, t.ageNow);
    if (classify(dmObs, asOf).firstDiabeticDay !== null) {
      inPath.add("diabetes");
      if (dmf.tier !== null) (dmf.careState === "lost" ? lost : due).add("diabetes");
    }
    for (const k of Object.keys(MODULES) as ModuleKey[]) {
      const f = analyses[k].evaluated[i].f;
      if (f.firstAbnormalDay === null) continue;
      inPath.add(k);
      if (f.tier !== null) (f.careState === "lost" ? lost : due).add(k);
    }
    return { t, inPath, due, lost };
  });

  const tested = people.length;
  const anyCond = people.filter((p) => p.inPath.size > 0);
  const counts = [0, 1, 2, 3].map((k) => people.filter((p) => (k === 3 ? p.inPath.size >= 3 : p.inPath.size === k)).length);
  const multiByAge = AGE_BANDS.map((_, bi) => {
    const g = people.filter((p) => ageBand(p.t.ageNow) === bi);
    return {
      n: g.length,
      one: pct(g.filter((p) => p.inPath.size === 1).length, g.length),
      two: pct(g.filter((p) => p.inPath.size === 2).length, g.length),
      three: pct(g.filter((p) => p.inPath.size >= 3).length, g.length),
    };
  });

  const keys = CONDITIONS.map((c) => c.key);
  const overlap = keys.map((r) => {
    const rows = people.filter((p) => p.inPath.has(r));
    return keys.map((c) => (r === c ? 100 : Math.round(pct(rows.filter((p) => p.inPath.has(c)).length, rows.length))));
  });

  // Siloed programmes call per condition; one list calls per person.
  const keepCalls = people.filter((p) => p.due.size > 0);
  const siloCalls = people.reduce((s, p) => s + p.due.size, 0);
  const lostAny = people.filter((p) => p.lost.size > 0);
  const siloLost = people.reduce((s, p) => s + p.lost.size, 0);
  const dueMix = [1, 2, 3].map((k) => keepCalls.filter((p) => (k === 3 ? p.due.size >= 3 : p.due.size === k)).length);
  const urineToo = keepCalls.filter((p) => p.due.has("kidney")).length;

  const dmF = people.filter((p) => p.inPath.has("diabetes"));
  const perCondition = CONDITIONS.map((c) => {
    const inP = people.filter((p) => p.inPath.has(c.key));
    const a = c.key === "diabetes" ? null : analyses[c.key];
    const lostN = inP.filter((p) => p.lost.has(c.key)).length;
    return {
      ...c,
      inPathway: inP.length,
      pctOfTested: pct(inP.length, tested),
      dueNow: inP.filter((p) => p.due.has(c.key)).length,
      lostNow: lostN,
      lostPct: a ? a.hero.lostPct : pct(lostN, inP.length),
      loss12: a ? a.hero.overallLoss12 : null,
      alsoOther: pct(inP.filter((p) => p.inPath.size >= 2).length, inP.length),
    };
  });

  // A person on one list whose other conditions were never even tested.
  const neverChecked = {
    dmNoKidney: pct(dmF.filter((p) => !p.t.obs.some((o) => o.test === "EGFR" || o.test === "UACR")).length, dmF.length),
    dmNoLipid: pct(dmF.filter((p) => !p.t.obs.some((o) => o.test === "LDL")).length, dmF.length),
    dmNoLiver: pct(dmF.filter((p) => !p.t.obs.some((o) => o.test === "FIB4")).length, dmF.length),
    dmN: dmF.length,
  };

  return {
    asOf,
    identity: b.identity,
    tested,
    anyCond: anyCond.length,
    anyCondPct: pct(anyCond.length, tested),
    counts,
    multi: counts[2] + counts[3],
    multiPctOfAny: pct(counts[2] + counts[3], anyCond.length),
    multiByAge,
    overlap,
    calls: {
      silo: siloCalls,
      single: keepCalls.length,
      saved: siloCalls - keepCalls.length,
      savedPct: pct(siloCalls - keepCalls.length, siloCalls),
      dueMix,
      urineToo,
      siloLost,
      lostPeople: lostAny.length,
    },
    perCondition,
    neverChecked,
  };
}

let hub: ReturnType<typeof buildHub> | null = null;
export const getHub = () => (hub ??= buildHub());
export type Hub = ReturnType<typeof buildHub>;
