// generate → resolve identities → build timelines → rules → aggregates.
// Runs once per server process (the page is statically rendered at build).

import { analyse, implausibleJump } from "./analytics";
import {
  IDENTITY_CONFIG,
  maskPhone,
  normalizeName,
  normalizePhone,
  resolveIdentities,
  scoreClustering,
} from "./identity";
import { fmtDay } from "./rng";
import { AS_OF, generateCohort } from "./synth";
import { buildTimelines } from "./timelines";

function build() {
  const { bills, truePersons, agents } = generateCohort();
  const res = resolveIdentities(bills);
  const agentLabelOf = new Map(agents.map((a) => [a.phone, a.label]));
  const timelines = buildTimelines(bills, res, agentLabelOf, AS_OF);
  const analysis = analyse(timelines, AS_OF);

  /* ---------- identity summary ---------- */
  const status = { valid: 0, shared: 0, junk: 0, missing: 0 };
  for (const s of res.billPhoneStatus) status[s]++;

  const truth = bills.map((b) => b.truth);
  const scores = [
    scoreClustering(
      "PATIENT_KEY",
      bills.map((b) => b.patientKey),
      truth,
    ),
    scoreClustering(
      "Phone number only",
      bills.map((b, i) => normalizePhone(b.phone).phone ?? `solo-${i}`),
      truth,
    ),
    scoreClustering(
      "Exact name + sex",
      bills.map((b) => `${normalizeName(b.name).display.toLowerCase()}|${b.sex}`),
      truth,
    ),
    scoreClustering("Phone, then fuzzy name (ours)", res.personOfBill, truth),
  ];

  const persons = res.persons;
  const multiVisit = timelines.filter((t) => t.visitDays.length >= 2);
  const linkStats = {
    phonePersons: persons.filter((p) => p.method === "phone").length,
    nameOnlyPersons: persons.filter((p) => p.method === "name-only" && p.bills.length > 1).length,
    singletons: persons.filter((p) => p.method === "name-only" && p.bills.length === 1).length,
    bridgedBills: persons.reduce((s, p) => s + p.links.filter((l) => l === "name-bridge").length, 0),
    familyNumbers: 0,
  };
  const peoplePerOwnNumber = new Map<string, number>();
  for (const p of persons) for (const ph of p.ownPhones) peoplePerOwnNumber.set(ph, (peoplePerOwnNumber.get(ph) ?? 0) + 1);
  linkStats.familyNumbers = [...peoplePerOwnNumber.values()].filter((n) => n >= 2).length;

  // Worked example: one person, several monthly PATIENT_KEYs, real spelling
  // drift (not just case), and a visit joined without a usable number.
  const spellings = (t: (typeof timelines)[number]) =>
    new Set(t.typedNames.map((nm) => nm.toLowerCase().replace(/[^a-z ]/g, "").replace(/\s+/g, " ").trim())).size;
  const example = timelines
    .filter(
      (t) =>
        t.patientKeys.length >= 4 &&
        t.patientKeys.length <= 7 &&
        t.links.includes("name-bridge") &&
        t.contact === "own" &&
        t.truth.length === 1,
    )
    .sort((a, b) => spellings(b) - spellings(a) || b.patientKeys.length - a.patientKeys.length)[0];
  const exampleRows = example
    ? persons[example.pid].bills.map((bi, k) => {
        const b = bills[bi];
        const np = normalizePhone(b.phone);
        const st = res.billPhoneStatus[bi];
        return {
          date: fmtDay(b.day),
          patientKey: b.patientKey,
          name: b.name,
          phone: np.phone ? maskPhone(np.phone) : b.phone.trim() || "(blank)",
          phoneStatus: st,
          link: persons[example.pid].links[k],
        };
      })
    : [];

  // Family example: one number, several different people
  const familyPhone = [...peoplePerOwnNumber.entries()].find(
    ([ph, n]) =>
      n === 3 &&
      timelines
        .filter((t) => persons[t.pid].ownPhones.includes(ph))
        .every((t) => t.visitDays.length >= 2 && t.truth.length === 1 && t.name.includes(" ")),
  )?.[0];
  const familyExample = familyPhone
    ? {
        phone: maskPhone(familyPhone),
        people: timelines
          .filter((t) => persons[t.pid].ownPhones.includes(familyPhone))
          .map((t) => ({ name: t.name, sex: t.sex, age: t.ageNow, visits: t.visitDays.length })),
      }
    : null;

  // Plausibility check on the linked timelines, scored against ground truth.
  const flagged = timelines.filter((t) => implausibleJump(t.obs));
  const plausibility = {
    flagged: flagged.length,
    trulyMerged: flagged.filter((t) => t.truth.length > 1).length,
    mergedTotal: timelines.filter((t) => t.truth.length > 1).length,
  };

  const identity = {
    bills: bills.length,
    patientKeys: new Set(bills.map((b) => b.patientKey)).size,
    persons: persons.length,
    truePersons,
    multiVisit: multiVisit.length,
    keysPerMultiVisit:
      Math.round((multiVisit.reduce((s, t) => s + t.patientKeys.length, 0) / Math.max(1, multiVisit.length)) * 10) / 10,
    status,
    sharedNumbers: res.sharedNumbers.map((s) => ({
      label: agentLabelOf.get(s.phone) ?? "Unknown shared number",
      phone: maskPhone(s.phone),
      people: s.people,
      bills: s.bills,
    })),
    threshold: IDENTITY_CONFIG.sharedNumberPeople,
    linkStats,
    scores,
    example: example ? { name: example.name, rows: exampleRows } : null,
    familyExample,
    plausibility,
  };

  return { asOf: AS_OF, identity, ...analysis };
}

let cached: ReturnType<typeof build> | null = null;

export function getDashboard() {
  if (!cached) cached = build();
  return cached;
}

export type Dashboard = ReturnType<typeof build>;
