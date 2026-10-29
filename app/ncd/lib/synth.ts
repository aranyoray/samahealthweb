// Synthetic stand-in for the AKTIV → Neon mirror once result values are
// synced: everyone tested at the lab, not just people with a sugar test.
// Same front-desk mess as the /diabetes generator (monthly PATIENT_KEY,
// spelling drift, household and agent phone numbers) and the same clock.
//
// Each person carries hidden states for five conditions. Values move toward
// a treatment target while the person keeps coming and back toward their
// untreated level while they are away. Prevalences are shaped like a
// referral lab in North 24 Parganas, not a community survey, and none of
// the numbers here are real patient data.

import {
  AS_OF,
  HINDU_F,
  HINDU_M,
  HINDU_SUR,
  JUNK_PHONES,
  MUSLIM_F,
  MUSLIM_F_SUR,
  MUSLIM_M,
  MUSLIM_SUR,
  REFERRERS,
  WINDOW_START,
  formatPhone,
  mobile,
  typedAge,
  typedName,
  typedSex,
} from "../../diabetes/lib/synth";
import { makeRng, monthIndex, type Rng } from "../../diabetes/lib/rng";
import type { Channel } from "../../diabetes/lib/types";
import { creatForEgfr, fib4, type Bill, type RawTest } from "./types";

export { AS_OF };

const SEED = 20261029;
const HOUSEHOLDS = 7600;

type Thyroid = "normal" | "subhypo" | "hypo" | "hyper";

type Person = {
  id: number;
  sex: "F" | "M";
  birthYear: number;
  prefix: "" | "Md" | "Sk";
  first: string;
  surname: string;
  phone: string | null;
  referrer: string;
  firstDay: number;
  firstChannel: Channel;
  adherence: number;
  dm: boolean;
  a1c0: number;
  a1cTarget: number;
  egfr0: number;
  egfrSlope: number;
  acr0: number;
  ldl0: number;
  hdl0: number;
  tg0: number;
  thyroid: Thyroid;
  tsh0: number;
  /** Subclinical TSH that settles on its own by the next test. */
  transientTsh: boolean;
  masld: boolean;
  fib0: number;
  alt0: number;
  plt0: number;
};

type Condition = "dm" | "kidney" | "lipid" | "thyroid" | "liver";

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
const r1 = (x: number) => Math.round(x * 10) / 10;
const r2 = (x: number) => Math.round(x * 100) / 100;

function newPerson(
  rng: Rng,
  id: number,
  sex: "F" | "M",
  age: number,
  faith: "hindu" | "muslim",
  surname: string,
  phone: string | null,
  firstDay: number,
  firstChannel: Channel,
): Person {
  const first =
    faith === "hindu" ? rng.pick(sex === "F" ? HINDU_F : HINDU_M) : rng.pick(sex === "F" ? MUSLIM_F : MUSLIM_M);
  const prefix: Person["prefix"] =
    faith === "muslim" && sex === "M" ? rng.weighted([["Md", 45], ["Sk", 20], ["", 35]] as const) : "";

  const pDm = clamp((age < 30 ? 0.05 : age < 40 ? 0.13 : age < 50 ? 0.24 : age < 60 ? 0.32 : 0.36) * (sex === "M" ? 1.08 : 0.94), 0, 0.6);
  const dm = rng.chance(pDm);
  const a1c0 = dm ? clamp(rng.normal(8.4, 1.5), 6.5, 14) : clamp(rng.normal(5.5, 0.35), 4.5, 6.4);

  // Kidney: age-expected eGFR, a CKD subgroup that is lower or leaks albumin.
  const pCkd = clamp(0.03 + Math.max(0, age - 40) * 0.004 + (dm ? 0.12 : 0), 0, 0.5);
  const ckd = rng.chance(pCkd);
  const egfrAge = 118 - 0.9 * (age - 25);
  const egfr0 = ckd
    ? rng.chance(0.65)
      ? clamp(rng.normal(46, 13), 10, 59)
      : clamp(rng.normal(egfrAge, 12), 60, 130)
    : clamp(rng.normal(egfrAge, 12), 62, 135);
  const acr0 = ckd ? (rng.chance(0.5) ? rng.lognormal(110, 0.9) : rng.lognormal(18, 0.6)) : rng.lognormal(8, 0.6);
  const egfrSlope = 0.9 + (ckd ? rng.lognormal(2.2, 0.6) : 0) + (dm ? 0.8 : 0);

  // Lipids: a long right tail plus familial hypercholesterolaemia.
  const fh = rng.chance(0.012);
  const ldl0 = fh ? clamp(rng.normal(218, 28), 190, 330) : clamp(rng.normal(dm ? 122 : 114, 33), 45, 240);
  const tg0 = clamp(rng.lognormal(dm ? 175 : 135, 0.45), 45, 1600);
  const hdl0 = clamp(rng.normal(sex === "F" ? 47 : 40, 9), 22, 85);

  // Thyroid: hypothyroidism is commoner in women and with age.
  const pHypo = clamp((sex === "F" ? 0.15 : 0.05) * (age >= 45 ? 1.25 : 1), 0, 0.4);
  const tr = rng.next();
  const thyroid: Thyroid = tr < pHypo * 0.45 ? "hypo" : tr < pHypo ? "subhypo" : tr < pHypo + 0.018 ? "hyper" : "normal";
  const tsh0 =
    thyroid === "hypo"
      ? clamp(rng.lognormal(19, 0.55), 10.5, 120)
      : thyroid === "subhypo"
        ? clamp(rng.lognormal(6.6, 0.2), 4.6, 9.9)
        : thyroid === "hyper"
          ? clamp(rng.lognormal(0.04, 0.9), 0.005, 0.3)
          : clamp(rng.lognormal(1.9, 0.38), 0.5, 4.4);

  // Liver: fatty liver with slow fibrosis, commoner with diabetes.
  const masld = rng.chance(dm ? 0.55 : 0.24);
  const fib0 = masld ? clamp(rng.weighted([[0, 45], [1, 28], [2, 15], [3, 8], [4, 4]] as const) + (dm ? 0.4 : 0), 0, 4) : 0;
  const alt0 = masld ? clamp(rng.lognormal(54, 0.35), 18, 260) : clamp(rng.lognormal(23, 0.3), 8, 70);
  const plt0 = clamp(rng.normal(255, 50), 140, 450);

  let adherence = 0.76;
  if (age < 40) adherence -= 0.1;
  if (age >= 70) adherence -= 0.06;
  if (sex === "M") adherence -= 0.04;
  if (!phone) adherence -= 0.12;
  if (firstChannel === "camp") adherence -= 0.14;
  if (firstChannel === "home") adherence += 0.06;
  adherence = clamp(adherence + rng.normal(0, 0.07), 0.25, 0.93);

  return {
    id, sex, birthYear: 2026 - age, prefix, first, surname, phone,
    referrer: rng.chance(0.3) ? "Self" : rng.pick(REFERRERS),
    firstDay, firstChannel, adherence,
    dm, a1c0, a1cTarget: clamp(rng.normal(7.0, 0.45), 6.1, 8.2),
    egfr0, egfrSlope, acr0, ldl0, hdl0, tg0,
    thyroid, tsh0, transientTsh: thyroid === "subhypo" && rng.chance(0.3),
    masld, fib0, alt0, plt0,
  };
}

/* ------------------------------------------------------------------ */
/* Visits                                                               */
/* ------------------------------------------------------------------ */

type State = {
  a1c: number;
  ldl: number;
  tsh: number;
  alt: number;
  /** Visits in a row the person has been under follow-up for each condition. */
  treated: Set<Condition>;
};

type Visit = { day: number; person: Person; channel: Channel; results: { test: RawTest; value: number }[] };

function simulatePerson(p: Person, rng: Rng, out: Visit[]) {
  let day = p.firstDay;
  let channel = p.firstChannel;
  let adherence = p.adherence;
  let inCare = false;
  const known = new Set<Condition>();
  const s: State = { a1c: p.a1c0, ldl: p.ldl0, tsh: p.tsh0, alt: p.alt0, treated: new Set() };
  let index = 0;

  while (day <= AS_OF) {
    const years = (day - p.firstDay) / 365;
    const age = Math.floor(day / 365.25 + 1970 - p.birthYear - 0.5);

    // ---- where the hidden values are today ----
    const egfr = clamp(p.egfr0 - p.egfrSlope * years - (inCare ? 0 : 0.6 * years) + rng.normal(0, 3.5), 5, 140);
    const acr = Math.max(2, p.acr0 * Math.exp(0.12 * years) * (inCare && known.has("kidney") ? 0.7 : 1) * rng.lognormal(1, 0.25));
    const fib = clamp(p.fib0 + (p.masld ? 0.12 * years : 0), 0, 4);

    // ---- what gets ordered ----
    const first = index === 0;
    const screen = (pFirst: number) => rng.chance(first ? pFirst : pFirst * 0.45);
    const monitor = (c: Condition, pFirst: number) => (known.has(c) ? rng.chance(0.86) : screen(pFirst));
    const results: Visit["results"] = [];
    const add = (test: RawTest, value: number) => results.push({ test, value });

    let ordered = false;
    if (monitor("dm", age >= 30 ? 0.5 : 0.2)) {
      if (rng.chance(known.has("dm") ? 0.85 : 0.55)) add("HBA1C", r1(s.a1c + rng.normal(0, 0.08)));
      add("FBS", Math.max(62, Math.round((28.7 * s.a1c - 46.7) * 0.88 + rng.normal(0, 10))));
      ordered = true;
    }
    if (monitor("kidney", p.dm ? 0.6 : 0.42)) {
      add("CREAT", r2(creatForEgfr(egfr, age, p.sex) * rng.lognormal(1, 0.03)));
      ordered = true;
    }
    if (known.has("kidney") ? rng.chance(0.42) : screen(p.dm ? 0.14 : 0.04)) add("UACR", Math.round(acr));
    if (monitor("lipid", p.dm || age >= 40 ? 0.45 : 0.3)) {
      add("LDL", Math.round(clamp(s.ldl + rng.normal(0, 8), 35, 340)));
      add("HDL", Math.round(clamp(p.hdl0 + rng.normal(0, 3), 18, 95)));
      add("TG", Math.round(clamp(p.tg0 * (s.treated.has("lipid") && inCare ? 0.82 : 1) * rng.lognormal(1, 0.15), 40, 2200)));
      ordered = true;
    }
    if (monitor("thyroid", p.sex === "F" ? 0.42 : 0.18)) {
      add("TSH", r2(clamp(s.tsh * rng.lognormal(1, 0.08), 0.005, 150)));
      if (rng.chance(0.4)) {
        const ft4 = s.tsh > 10 ? rng.normal(0.62, 0.12) : s.tsh < 0.1 ? rng.normal(2.5, 0.4) : rng.normal(1.2, 0.18);
        add("FT4", r2(clamp(ft4, 0.2, 5)));
      }
      ordered = true;
    }
    const lft = monitor("liver", p.dm ? 0.42 : 0.3);
    if (lft) {
      const alt = Math.round(clamp(s.alt * rng.lognormal(1, 0.12), 6, 400));
      add("ALT", alt);
      add("AST", Math.round(clamp(alt * (0.62 + 0.18 * fib) * rng.lognormal(1, 0.1), 8, 400)));
      ordered = true;
    }
    if (lft ? rng.chance(0.62) : screen(0.4)) add("PLT", Math.round(clamp(p.plt0 - 26 * fib + rng.normal(0, 14), 40, 520)));
    if (!ordered && !results.length) add("FBS", Math.max(62, Math.round((28.7 * s.a1c - 46.7) * 0.88 + rng.normal(0, 10))));

    out.push({ day, person: p, channel, results });

    // ---- what the doctor learns from it ----
    const val = (t: RawTest) => results.find((r) => r.test === t)?.value;
    if ((val("HBA1C") ?? 0) >= 6.5 || (val("FBS") ?? 0) >= 126) known.add("dm");
    if (val("CREAT") !== undefined && egfr < 60) known.add("kidney");
    if ((val("UACR") ?? 0) >= 30) known.add("kidney");
    const ldl = val("LDL");
    if (ldl !== undefined && (ldl >= 160 || (known.has("dm") && ldl >= 100) || (val("TG") ?? 0) >= 500)) known.add("lipid");
    const tsh = val("TSH");
    if (tsh !== undefined && (tsh > 4.5 || tsh < 0.45)) known.add("thyroid");
    const f4 = val("ALT") && val("AST") && val("PLT") ? fib4(age, val("AST")!, val("ALT")!, val("PLT")!) : null;
    if ((val("ALT") ?? 0) > 40 || (f4 ?? 0) >= 1.3) known.add("liver");
    index++;

    // ---- when they come back ----
    let interval: number;
    if (known.size) {
      const guide = Math.min(
        known.has("dm") ? (s.a1c >= 7 ? 90 : 180) : 999,
        known.has("kidney") ? 180 : 999,
        known.has("lipid") ? 90 : 999,
        known.has("thyroid") ? (s.tsh > 4.5 || s.tsh < 0.45 ? 60 : 180) : 999,
        known.has("liver") ? 180 : 999,
      );
      if (rng.chance(adherence)) {
        interval = Math.max(20, Math.round(guide * rng.lognormal(1.15, 0.32)));
        inCare = true;
        for (const c of known) s.treated.add(c);
      } else if (rng.chance(0.35)) {
        interval = rng.int(290, 720);
        inCare = false;
        adherence = clamp(adherence * 0.92, 0.2, 0.9);
      } else break;
    } else {
      if (!rng.chance(0.2)) break;
      interval = rng.int(300, 900);
      inCare = false;
    }

    // ---- values at the next visit ----
    const months = interval / 30;
    if (p.dm) {
      s.a1c = inCare
        ? s.a1c + (p.a1cTarget - s.a1c) * Math.min(0.6, 0.3 * (interval / 90)) + rng.normal(0, 0.35)
        : s.a1c + (0.04 + rng.next() * 0.06) * months + rng.normal(0.2, 0.45);
      s.a1c = clamp(s.a1c, 6.0, 15);
    } else s.a1c = clamp(s.a1c + rng.normal(0.02, 0.1), 4.5, 6.4);
    // Statin while in care, off it after a lapse.
    s.ldl = s.treated.has("lipid") && inCare ? p.ldl0 * clamp(rng.normal(0.66, 0.1), 0.42, 0.95) : p.ldl0;
    // Thyroxine pulls TSH toward range; stopping it lets TSH climb back.
    if (p.thyroid === "hypo" || p.thyroid === "hyper") {
      if (s.treated.has("thyroid") && inCare) {
        const target = Math.log(rng.lognormal(2.2, 0.55));
        s.tsh = Math.exp(Math.log(s.tsh) * 0.4 + target * 0.6);
      } else s.tsh = Math.exp(Math.log(s.tsh) * 0.3 + Math.log(p.tsh0) * 0.7);
    } else if (p.thyroid === "subhypo") {
      s.tsh = p.transientTsh ? clamp(rng.lognormal(3.0, 0.3), 0.6, 4.4) : clamp(s.tsh * rng.lognormal(1.03, 0.15), 3.5, 14);
    } else s.tsh = clamp(p.tsh0 * rng.lognormal(1, 0.15), 0.45, 4.6);
    s.alt = p.masld ? p.alt0 * (inCare && s.treated.has("liver") ? 0.82 : 1) : p.alt0;

    day += interval;
    channel =
      p.firstChannel === "camp"
        ? rng.weighted([["walk-in", 60], ["home", 25], ["partner", 15]] as const)
        : rng.chance(0.75)
          ? p.firstChannel
          : rng.weighted([["walk-in", 55], ["home", 30], ["partner", 15]] as const);
  }
}

/* ------------------------------------------------------------------ */
/* Cohort                                                               */
/* ------------------------------------------------------------------ */

export type SynthOutput = { bills: Bill[]; truePersons: number; agents: { phone: string; label: string }[] };

export function generateNcdCohort(): SynthOutput {
  const rng = makeRng(SEED);

  const agents: { phone: string; label: string; channel: Channel }[] = [];
  for (let i = 1; i <= 8; i++) agents.push({ phone: mobile(rng), label: `Home-collection agent ${String(i).padStart(2, "0")}`, channel: "home" });
  for (let i = 1; i <= 3; i++) agents.push({ phone: mobile(rng), label: `Camp desk ${i}`, channel: "camp" });
  for (let i = 1; i <= 4; i++) agents.push({ phone: mobile(rng), label: `Partner centre ${i}`, channel: "partner" });
  const agentsFor = (c: Channel) => agents.filter((a) => a.channel === c);

  const persons: Person[] = [];
  let nextId = 1;
  const span = AS_OF - 3 - WINDOW_START;
  for (let h = 0; h < HOUSEHOLDS; h++) {
    const faith = rng.chance(0.27) ? "muslim" : "hindu";
    const size = rng.weighted([[1, 60], [2, 31], [3, 9]] as const);
    const phone = rng.chance(0.92) ? mobile(rng) : null;
    const headSex: "F" | "M" = rng.chance(0.52) ? "F" : "M";
    const headAge = Math.round(clamp(rng.normal(47, 14), 18, 86));
    const surname = rng.pick(faith === "hindu" ? HINDU_SUR : MUSLIM_SUR);
    const firstDay = WINDOW_START + Math.floor(rng.next() * span);
    const firstChannel = rng.weighted([["walk-in", 52], ["home", 22], ["partner", 12], ["camp", 14]] as const);
    const members: { sex: "F" | "M"; age: number }[] = [{ sex: headSex, age: headAge }];
    if (size >= 2) {
      const spouseSex = headSex === "F" ? "M" : "F";
      const gap = rng.int(2, 8);
      members.push({ sex: spouseSex, age: Math.round(clamp(headAge + (spouseSex === "M" ? gap : -gap), 18, 90)) });
    }
    if (size >= 3) members.push({ sex: rng.chance(0.6) ? "F" : "M", age: Math.round(clamp(headAge + rng.int(22, 30), 45, 92)) });
    for (const m of members) {
      const sur = faith === "muslim" && m.sex === "F" && rng.chance(0.7) ? rng.pick(MUSLIM_F_SUR) : surname;
      const fd = rng.chance(0.5) ? firstDay : clamp(firstDay + rng.int(-300, 300), WINDOW_START, AS_OF - 3);
      persons.push(newPerson(rng, nextId++, m.sex, m.age, faith, sur, phone, fd, firstChannel));
    }
  }

  const visits: Visit[] = [];
  for (const p of persons) simulatePerson(p, rng, visits);
  visits.sort((a, b) => a.day - b.day || a.person.id - b.person.id);

  const bills: Bill[] = [];
  const pkByPersonMonth = new Map<string, number>();
  let nextPk = 520_000;
  let nextBill = 2_140_000;
  for (const v of visits) {
    const p = v.person;
    const mKey = `${p.id}:${monthIndex(v.day)}`;
    let patientKey = pkByPersonMonth.get(mKey);
    if (patientKey === undefined) {
      patientKey = nextPk++;
      pkByPersonMonth.set(mKey, patientKey);
    }
    let phone: string;
    const agentPool = agentsFor(v.channel);
    const agentRate = v.channel === "home" ? 0.35 : v.channel === "camp" ? 0.5 : v.channel === "partner" ? 0.25 : 0;
    if (agentPool.length && rng.chance(agentRate)) phone = formatPhone(rng.pick(agentPool).phone, rng);
    else if (!p.phone) phone = rng.weighted([["", 60], [rng.pick(JUNK_PHONES), 40]] as const);
    else {
      const r = rng.next();
      if (r < 0.9) phone = formatPhone(p.phone, rng);
      else if (r < 0.945) phone = "";
      else if (r < 0.975) phone = rng.pick(JUNK_PHONES);
      else {
        const i = rng.int(3, 9);
        phone = p.phone.slice(0, i) + String((Number(p.phone[i]) + rng.int(1, 9)) % 10) + p.phone.slice(i + 1);
      }
    }
    const ageAtVisit = Math.floor(v.day / 365.25 + 1970 - p.birthYear - 0.5);
    bills.push({
      billKey: nextBill++,
      patientKey,
      day: v.day,
      name: typedName(p, rng),
      phone,
      age: typedAge(ageAtVisit, rng),
      sex: typedSex(p.sex, rng),
      channel: v.channel,
      referrer: rng.chance(0.8) ? p.referrer : rng.pick(REFERRERS),
      results: v.results,
      truth: p.id,
    });
  }
  return { bills, truePersons: persons.length, agents: agents.map(({ phone, label }) => ({ phone, label })) };
}
