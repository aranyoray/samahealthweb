// Synthetic stand-in for the AKTIV → Neon research mirror, restricted to
// patients with at least one glycaemic test. It reproduces the mess the
// real front desk produces, because that mess is what the identity
// resolver has to survive:
//
//   - PATIENT_KEY is re-issued every calendar month
//   - names typed with honorifics, case changes, spelling variants, typos
//   - a household shares one mobile number
//   - home-collection agents, camp desks and partner centres type their
//     own number instead of the patient's
//   - blank and junk phone numbers ("9999999999", "12345", "NA")
//
// Clinical trajectories are simple on purpose: HbA1c drifts toward a
// treatment target while a patient keeps coming back and drifts up while
// they are away. No real patient data is used anywhere.

import { makeRng, dayOf, monthIndex, type Rng } from "./rng";
import type { Bill, Channel, Result, Sex, TestCode } from "./types";

export const AS_OF = dayOf("2026-09-23");
export const WINDOW_START = dayOf("2023-03-23"); // 3.5 years before AS_OF

const SEED = 20260923;
const HOUSEHOLDS = 5200;

/* ------------------------------------------------------------------ */
/* Name pools (West Bengal, North 24 Parganas)                          */
/* ------------------------------------------------------------------ */

const HINDU_M = [
  "Anirban", "Subhajit", "Sanjay", "Tapas", "Biswajit", "Prosenjit", "Debasish", "Swapan",
  "Nirmal", "Gopal", "Asit", "Sukumar", "Rajib", "Sujit", "Amit", "Partha", "Samir", "Tarun",
  "Ashok", "Dilip", "Kartik", "Shyamal", "Uttam", "Pintu", "Kamal", "Pradip", "Manas", "Arup",
  "Goutam", "Bikash", "Nitai", "Haripada", "Sankar", "Ranjit", "Nemai", "Kalyan", "Sourav",
  "Arindam", "Indranil", "Tushar",
] as const;
const HINDU_F = [
  "Rina", "Mousumi", "Shampa", "Swati", "Soma", "Anjali", "Rupa", "Mitali", "Mampi", "Tumpa",
  "Chhanda", "Kakali", "Sikha", "Laxmi", "Gita", "Anima", "Minati", "Jharna", "Putul",
  "Sharmistha", "Ruma", "Moumita", "Papiya", "Tanushree", "Arpita", "Sutapa", "Jayanti", "Bani",
  "Chaitali", "Madhumita", "Sumitra", "Aparna", "Dipali", "Kalpana", "Malati", "Pratima",
  "Sabita", "Namita", "Shefali", "Tapati",
] as const;
const MUSLIM_M = [
  "Rafiqul", "Jahangir", "Abdul", "Habibur", "Mofizul", "Nazrul", "Sirajul", "Anwar", "Jamal",
  "Kamrul", "Mizanur", "Saidul", "Ashraf", "Motiur", "Rezaul", "Samsul", "Abul", "Hafizul",
  "Aminul", "Mustafa",
] as const;
const MUSLIM_F = [
  "Sabina", "Rehana", "Nasrin", "Farida", "Salma", "Rokeya", "Jahanara", "Mumtaz", "Nurjahan",
  "Sahanara", "Rahima", "Hasina", "Ayesha", "Firoza", "Mariam", "Sultana", "Ruksana", "Tahmina",
  "Parveen", "Shahnaz",
] as const;
const HINDU_SUR = [
  "Das", "Ghosh", "Mondal", "Sarkar", "Biswas", "Saha", "Dey", "Roy", "Mukherjee", "Banerjee",
  "Chatterjee", "Bose", "Halder", "Paul", "Sen", "Dutta", "Karmakar", "Naskar", "Majumder",
  "Chakraborty", "Bhattacharya", "Pramanik", "Adhikari", "Mitra", "Guha", "Kundu", "Barman",
  "Mistri", "Bag", "Sil",
] as const;
const MUSLIM_SUR = [
  "Islam", "Molla", "Khan", "Ali", "Hossain", "Rahaman", "Gazi", "Mondal", "Sardar", "Mallick",
  "Uddin", "Laskar",
] as const;
const MUSLIM_F_SUR = ["Bibi", "Khatun", "Begum"] as const;

/** Spellings the front desk actually produces for the same name. */
const VARIANTS: Record<string, string[]> = {
  Rafiqul: ["Rafikul", "Rofiqul"],
  Mousumi: ["Moushumi", "Mausumi"],
  Shampa: ["Sampa", "Shompa"],
  Sharmistha: ["Sarmistha", "Sharmista"],
  Tanushree: ["Tanusree", "Tanushri"],
  Laxmi: ["Lakshmi", "Laksmi"],
  Gita: ["Geeta"],
  Rina: ["Reena"],
  Biswajit: ["Bishwajit", "Biswajeet"],
  Debasish: ["Debashis", "Debasis"],
  Prosenjit: ["Prasenjit"],
  Kartik: ["Kartick", "Kartic"],
  Subhajit: ["Suvajit", "Shubhajit", "Subhojit"],
  Chhanda: ["Chanda"],
  Jharna: ["Jharana"],
  Sikha: ["Shikha"],
  Swapan: ["Sapan"],
  Shyamal: ["Shamal"],
  Goutam: ["Gautam", "Gowtam"],
  Nurjahan: ["Noorjahan"],
  Sahanara: ["Shahanara"],
  Mofizul: ["Mofijul", "Mafizul"],
  Habibur: ["Habibar"],
  Mizanur: ["Mijanur"],
  Ruksana: ["Rukshana"],
  Parveen: ["Parvin"],
  Mondal: ["Mandal"],
  Majumder: ["Majumdar", "Mazumder"],
  Chakraborty: ["Chakrabarti", "Chakraborti"],
  Bhattacharya: ["Bhattacharjee", "Bhattacharyya"],
  Mukherjee: ["Mukherji"],
  Banerjee: ["Banerji"],
  Chatterjee: ["Chaterjee", "Chatterji"],
  Hossain: ["Hussain", "Hossen"],
  Rahaman: ["Rahman"],
  Karmakar: ["Karmokar"],
  Pramanik: ["Pramanick"],
  Halder: ["Haldar"],
  Sarkar: ["Sarker"],
  Dutta: ["Datta"],
  Bose: ["Basu"],
  Roy: ["Ray"],
  Paul: ["Pal"],
  Molla: ["Mollah"],
};

const REFERRERS = [
  "Dr. S. Ghosh (Medicine)",
  "Dr. R. Islam (Diabetology)",
  "Dr. P. Saha (Medicine)",
  "Dr. A. Banerjee (Endocrinology)",
  "Dr. M. Hossain (Medicine)",
  "Dr. K. Biswas (Family medicine)",
  "Dr. T. Mondal (Nephrology)",
  "Dr. N. Sarkar (Gynaecology)",
  "Dr. D. Roy (Cardiology)",
  "Dr. J. Das (Medicine)",
] as const;

const JUNK_PHONES = [
  "9999999999", "0000000000", "1234567890", "9876543210", "1111111111", "12345", "0", "NA",
  "N/A", "9000000000", "98", "8888888888", "-",
] as const;

/* ------------------------------------------------------------------ */
/* Generator                                                            */
/* ------------------------------------------------------------------ */

type Faith = "hindu" | "muslim";
type Glyc = "normal" | "pre" | "dm";

type TruePerson = {
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
  glyc: Glyc;
  newDiagnosis: boolean;
  a1c0: number;
  target: number;
  adherence: number;
  egfr0: number;
  uacr0: number;
  ldl0: number;
  hb0: number;
};

function mobile(rng: Rng): string {
  const lead = rng.weighted([["9", 40], ["8", 25], ["7", 25], ["6", 10]] as const);
  let s = lead;
  for (let i = 0; i < 9; i++) s += String(rng.int(0, 9));
  return s;
}

function formatPhone(p: string, rng: Rng): string {
  return rng.weighted([
    [p, 70],
    [`+91 ${p.slice(0, 5)} ${p.slice(5)}`, 10],
    [`0${p.slice(0, 5)}-${p.slice(5)}`, 8],
    [`91${p}`, 7],
    [`${p.slice(0, 5)} ${p.slice(5)}`, 5],
  ] as const);
}

function clamp(x: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, x));
}

function round1(x: number) {
  return Math.round(x * 10) / 10;
}

function dmProbability(age: number, sex: "F" | "M"): number {
  const base =
    age < 30 ? 0.08 : age < 40 ? 0.2 : age < 50 ? 0.34 : age < 60 ? 0.44 : age < 70 ? 0.5 : 0.46;
  return clamp(base * (sex === "M" ? 1.08 : 0.94), 0, 0.9);
}

function newPerson(
  rng: Rng,
  id: number,
  sex: "F" | "M",
  birthYear: number,
  faith: Faith,
  surname: string,
  phone: string | null,
  firstDay: number,
  firstChannel: Channel,
): TruePerson {
  const first =
    faith === "hindu"
      ? rng.pick(sex === "F" ? HINDU_F : HINDU_M)
      : rng.pick(sex === "F" ? MUSLIM_F : MUSLIM_M);
  const prefix: TruePerson["prefix"] =
    faith === "muslim" && sex === "M" ? rng.weighted([["Md", 45], ["Sk", 20], ["", 35]] as const) : "";
  const ageAtStart = 2026 - birthYear;
  const pDm = dmProbability(ageAtStart, sex);
  const r = rng.next();
  const glyc: Glyc = r < pDm ? "dm" : r < pDm + 0.27 ? "pre" : "normal";
  const newDiagnosis = glyc === "dm" && rng.chance(0.4);

  let a1c0: number;
  if (glyc === "dm") {
    a1c0 = newDiagnosis ? clamp(rng.normal(8.9, 1.8), 6.5, 14.5) : clamp(rng.normal(8.3, 1.4), 6.5, 13.5);
  } else if (glyc === "pre") {
    a1c0 = clamp(rng.normal(6.0, 0.2), 5.7, 6.4);
  } else {
    a1c0 = clamp(rng.normal(5.25, 0.22), 4.4, 5.6);
  }

  // Probability of coming back for each scheduled review.
  let adherence = 0.78;
  if (ageAtStart < 40) adherence -= 0.1;
  if (ageAtStart >= 70) adherence -= 0.06;
  if (sex === "M") adherence -= 0.04;
  if (!phone) adherence -= 0.12;
  if (firstChannel === "camp") adherence -= 0.14;
  if (firstChannel === "home") adherence += 0.06;
  if (a1c0 >= 9) adherence -= 0.04;
  adherence = clamp(adherence + rng.normal(0, 0.07), 0.25, 0.93);

  const ageNow = 2026 - birthYear;
  return {
    id,
    sex,
    birthYear,
    prefix,
    first,
    surname,
    phone,
    referrer: rng.chance(0.3) ? "Self" : rng.pick(REFERRERS),
    firstDay,
    firstChannel,
    glyc,
    newDiagnosis,
    a1c0,
    target: clamp(rng.normal(6.9, 0.45), 6.0, 8.2),
    adherence,
    egfr0: clamp(rng.normal(118 - 0.9 * (ageNow - 25), 13), 18, 135),
    uacr0: glyc === "dm" ? rng.lognormal(16, 1.0) : rng.lognormal(7, 0.7),
    ldl0: clamp(rng.normal(glyc === "dm" ? 116 : 108, 32), 45, 260),
    hb0: sex === "F" ? clamp(rng.normal(11.8, 1.4), 6.5, 15.5) : clamp(rng.normal(13.5, 1.5), 7.5, 17.5),
  };
}

function typedName(p: TruePerson, rng: Rng): string {
  const tokens: string[] = [];
  if (p.sex === "F") {
    const h = rng.weighted([["", 84], ["Smt", 11], ["Mrs", 5]] as const);
    if (h) tokens.push(h);
  } else {
    const h = rng.weighted([["", 88], ["Sri", 6], ["Mr", 6]] as const);
    if (h) tokens.push(h);
  }
  if (p.prefix === "Md") {
    const v = rng.weighted([["Md", 40], ["Md.", 20], ["Mohammad", 12], ["Mohd", 8], ["", 20]] as const);
    if (v) tokens.push(v);
  } else if (p.prefix === "Sk") {
    const v = rng.weighted([["Sk", 50], ["Sk.", 15], ["Sheikh", 15], ["", 20]] as const);
    if (v) tokens.push(v);
  }
  let first = p.first;
  if (VARIANTS[first] && rng.chance(0.25)) first = rng.pick(VARIANTS[first]);
  if (rng.chance(0.015) && first.length > 4) {
    // adjacent-letter swap typo
    const i = rng.int(1, first.length - 3);
    first = first.slice(0, i) + first[i + 1] + first[i] + first.slice(i + 2);
  }
  tokens.push(first);
  if (!rng.chance(0.05)) {
    let sur = p.surname;
    if (VARIANTS[sur] && rng.chance(0.2)) sur = rng.pick(VARIANTS[sur]);
    tokens.push(sur);
  }
  const joined = tokens.join(rng.chance(0.06) ? "  " : " ");
  return rng.weighted([
    [joined.toUpperCase(), 55],
    [joined, 35],
    [joined.toLowerCase(), 10],
  ] as const);
}

function typedAge(trueAge: number, rng: Rng): number {
  const r = rng.next();
  if (r < 0.7) return trueAge;
  if (r < 0.9) return trueAge + (rng.chance(0.5) ? 1 : -1);
  return Math.round(trueAge / 5) * 5;
}

function typedSex(sex: "F" | "M", rng: Rng): Sex {
  const r = rng.next();
  if (r < 0.975) return sex;
  if (r < 0.995) return "";
  return sex === "F" ? "M" : "F";
}

export type SynthOutput = {
  bills: Bill[];
  truePersons: number;
  agents: { phone: string; label: string }[];
};

export function generateCohort(): SynthOutput {
  const rng = makeRng(SEED);

  // Numbers that get typed in place of the patient's own.
  const agents: { phone: string; label: string; channel: Channel }[] = [];
  for (let i = 1; i <= 8; i++)
    agents.push({ phone: mobile(rng), label: `Home-collection agent ${String(i).padStart(2, "0")}`, channel: "home" });
  for (let i = 1; i <= 3; i++)
    agents.push({ phone: mobile(rng), label: `Camp desk ${i}`, channel: "camp" });
  for (let i = 1; i <= 4; i++)
    agents.push({ phone: mobile(rng), label: `Partner centre ${i}`, channel: "partner" });
  const agentsFor = (c: Channel) => agents.filter((a) => a.channel === c);

  const persons: TruePerson[] = [];
  let nextId = 1;
  const span = AS_OF - 3 - WINDOW_START;

  for (let h = 0; h < HOUSEHOLDS; h++) {
    const faith: Faith = rng.chance(0.27) ? "muslim" : "hindu";
    const size = rng.weighted([[1, 62], [2, 30], [3, 8]] as const);
    const phone = rng.chance(0.92) ? mobile(rng) : null;
    const headSex: "F" | "M" = rng.chance(0.5) ? "F" : "M";
    const headAge = Math.round(clamp(rng.normal(51, 13), 20, 86));
    const surname = rng.pick(faith === "hindu" ? HINDU_SUR : MUSLIM_SUR);
    const firstDay = WINDOW_START + Math.floor(rng.next() * span);
    const firstChannel = rng.weighted([["walk-in", 52], ["home", 22], ["partner", 12], ["camp", 14]] as const);

    const members: { sex: "F" | "M"; age: number }[] = [{ sex: headSex, age: headAge }];
    if (size >= 2) {
      const spouseSex = headSex === "F" ? "M" : "F";
      const gap = rng.int(2, 8);
      members.push({ sex: spouseSex, age: Math.round(clamp(headAge + (spouseSex === "M" ? gap : -gap), 19, 90)) });
    }
    if (size >= 3) {
      members.push({ sex: rng.chance(0.6) ? "F" : "M", age: Math.round(clamp(headAge + rng.int(22, 30), 45, 92)) });
    }

    for (const m of members) {
      const sur =
        faith === "muslim" && m.sex === "F" && rng.chance(0.7) ? rng.pick(MUSLIM_F_SUR) : surname;
      // Family members often come together, sometimes months apart.
      const fd = rng.chance(0.5)
        ? firstDay
        : clamp(firstDay + rng.int(-300, 300), WINDOW_START, AS_OF - 3);
      persons.push(newPerson(rng, nextId++, m.sex, 2026 - m.age, faith, sur, phone, fd, firstChannel));
    }
  }

  type Visit = { day: number; a1c: number; glyc: Glyc; person: TruePerson; channel: Channel; index: number; confirmOnly: boolean };
  const visits: Visit[] = [];

  for (const p of persons) {
    let day = p.firstDay;
    let a1c = p.a1c0;
    let glyc: Glyc = p.glyc;
    let adherence = p.adherence;
    let channel = p.firstChannel;
    let index = 0;
    let pendingConfirm = p.newDiagnosis && rng.chance(0.4);

    while (day <= AS_OF) {
      visits.push({ day, a1c, glyc, person: p, channel, index, confirmOnly: false });
      if (index === 0 && pendingConfirm) visits[visits.length - 1].confirmOnly = true;
      index++;

      let interval: number;
      if (glyc === "dm") {
        if (pendingConfirm) {
          pendingConfirm = false;
          if (!rng.chance(adherence * 0.85)) break;
          interval = rng.int(6, 45);
        } else {
          const guide = a1c >= 7 ? 90 : 180;
          if (rng.chance(adherence)) {
            interval = Math.max(20, Math.round(guide * rng.lognormal(1.18, 0.32)));
            const pull = Math.min(0.6, 0.3 * (interval / 90));
            a1c = a1c + (p.target - a1c) * pull + rng.normal(0, 0.35);
          } else if (rng.chance(0.35)) {
            interval = rng.int(290, 720);
            const months = interval / 30;
            a1c = a1c + (0.04 + rng.next() * 0.06) * months + rng.normal(0.2, 0.45);
            adherence = clamp(adherence * 0.92, 0.2, 0.9);
          } else {
            break;
          }
        }
      } else if (glyc === "pre") {
        if (!rng.chance(0.42 * (0.6 + adherence * 0.6))) break;
        interval = Math.round(365 * rng.lognormal(1.05, 0.3));
        a1c = a1c + 0.08 * (interval / 365) + rng.normal(0, 0.12);
        if (a1c >= 6.5) glyc = "dm";
      } else {
        if (!rng.chance(0.2)) break;
        interval = rng.int(300, 900);
        a1c = a1c + rng.normal(0.06, 0.12) * (interval / 365);
        if (a1c >= 5.7) glyc = "pre";
      }
      a1c = clamp(a1c, 4.4, 15.5);
      day += interval;
      channel =
        p.firstChannel === "camp"
          ? rng.weighted([["walk-in", 60], ["home", 25], ["partner", 15]] as const)
          : rng.chance(0.75)
            ? p.firstChannel
            : rng.weighted([["walk-in", 55], ["home", 30], ["partner", 15]] as const);
    }
  }

  visits.sort((a, b) => a.day - b.day || a.person.id - b.person.id);

  const bills: Bill[] = [];
  const pkByPersonMonth = new Map<string, number>();
  let nextPk = 410_000;
  let nextBill = 1_880_000;

  for (const v of visits) {
    const p = v.person;
    const mKey = `${p.id}:${monthIndex(v.day)}`;
    let patientKey = pkByPersonMonth.get(mKey);
    if (patientKey === undefined) {
      patientKey = nextPk++;
      pkByPersonMonth.set(mKey, patientKey);
    }

    // Which number ends up in the phone field on this bill.
    let phone: string;
    const agentPool = agentsFor(v.channel);
    const agentRate = v.channel === "home" ? 0.35 : v.channel === "camp" ? 0.5 : v.channel === "partner" ? 0.25 : 0;
    if (agentPool.length && rng.chance(agentRate)) {
      phone = formatPhone(rng.pick(agentPool).phone, rng);
    } else if (!p.phone) {
      phone = rng.weighted([["", 60], [rng.pick(JUNK_PHONES), 40]] as const);
    } else {
      const r = rng.next();
      if (r < 0.9) phone = formatPhone(p.phone, rng);
      else if (r < 0.945) phone = "";
      else if (r < 0.975) phone = rng.pick(JUNK_PHONES);
      else {
        // one-digit typo: a different, valid-looking number
        const i = rng.int(3, 9);
        phone = p.phone.slice(0, i) + String((Number(p.phone[i]) + rng.int(1, 9)) % 10) + p.phone.slice(i + 1);
      }
    }

    const yearsIn = (v.day - WINDOW_START) / 365;
    const ageAtVisit = Math.floor((v.day / 365.25 + 1970) - p.birthYear - 0.5);
    const results = orderTests(v, p, rng, yearsIn);

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
      results,
      truth: p.id,
    });
  }

  return {
    bills,
    truePersons: persons.length,
    agents: agents.map(({ phone, label }) => ({ phone, label })),
  };
}

function orderTests(
  v: { a1c: number; glyc: Glyc; confirmOnly: boolean },
  p: TruePerson,
  rng: Rng,
  yearsIn: number,
): Result[] {
  const out: Result[] = [];
  const dm = v.glyc === "dm";
  const eAG = 28.7 * v.a1c - 46.7;
  const add = (test: TestCode, value: number) => out.push({ test, value });

  const pA1c = v.confirmOnly ? 0 : dm ? 0.86 : 0.5;
  if (rng.chance(pA1c)) add("HBA1C", round1(v.a1c + rng.normal(0, 0.08)));
  if (rng.chance(dm ? 0.72 : 0.82) || v.confirmOnly) add("FBS", Math.max(62, Math.round(eAG * 0.88 + rng.normal(0, 10))));
  if (rng.chance(dm ? 0.45 : 0.33)) add("PPBS", Math.max(78, Math.round(eAG * 1.32 + rng.normal(0, 22))));
  if (!dm && rng.chance(0.05)) add("RBS", Math.max(70, Math.round(eAG * 1.1 + rng.normal(0, 18))));
  if (!out.length) add("FBS", Math.max(62, Math.round(eAG * 0.88 + rng.normal(0, 10))));

  const decline = dm ? 1.8 + Math.max(0, v.a1c - 7) * 0.7 : 0.9;
  const egfr = clamp(p.egfr0 - decline * yearsIn + rng.normal(0, 4), 8, 140);
  if (rng.chance(dm ? 0.4 : 0.16)) add("EGFR", Math.round(egfr));
  if (rng.chance(dm ? 0.16 : 0.03))
    add("UACR", Math.max(2, Math.round(p.uacr0 * Math.exp(0.2 * (v.a1c - 7)) * rng.lognormal(1, 0.25))));
  if (rng.chance(dm ? 0.32 : 0.24)) add("LDL", Math.round(clamp(p.ldl0 + rng.normal(0, 9), 40, 280)));
  if (rng.chance(dm ? 0.3 : 0.36)) add("HB", round1(clamp(p.hb0 + rng.normal(0, 0.4), 5, 18)));
  return out;
}
