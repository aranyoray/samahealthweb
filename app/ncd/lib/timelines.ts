// Resolved persons → one timeline each, with the values the lab report does
// not carry derived on the way: eGFR from creatinine (CKD-EPI 2021) and
// FIB-4 from same-day AST, ALT and platelets.

import { maskPhone, normalizeName, type BillLink, type LinkMethod, type Resolution } from "../../diabetes/lib/identity";
import { yearOf } from "../../diabetes/lib/rng";
import type { Channel } from "../../diabetes/lib/types";
import { ckdEpi2021, fib4, type Bill, type Obs } from "./types";

export type Contact = "own" | "shared" | "none";

export type Timeline = {
  pid: number;
  name: string;
  typedNames: string[];
  sex: "F" | "M" | "";
  ageNow: number;
  obs: Obs[];
  visitDays: number[];
  patientKeys: number[];
  links: BillLink[];
  method: LinkMethod;
  firstChannel: Channel;
  referrer: string | null;
  contact: Contact;
  phoneMasked: string | null;
  /** Own mobile numbers, kept server-side to find household members. */
  ownPhones: string[];
  agentLabel: string | null;
  truth: number[];
};

function mode<T>(xs: T[], tieBreak: (a: T, b: T) => number = () => 0): T {
  const counts = new Map<T, number>();
  for (const x of xs) counts.set(x, (counts.get(x) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || tieBreak(a[0], b[0]))[0][0];
}
const fuller = (a: string, b: string) => b.split(" ").length - a.split(" ").length;

export function buildTimelines(bills: Bill[], res: Resolution, agentLabelOf: Map<string, string>, asOf: number): Timeline[] {
  return res.persons.map((p) => {
    const bs = p.bills.map((i) => bills[i]);
    const sexes = bs.map((b) => b.sex).filter((s) => s !== "");
    const sex = sexes.length ? mode(sexes) : "";

    const obs: Obs[] = [];
    for (const b of bs) {
      const v = (t: string) => b.results.find((r) => r.test === t)?.value;
      for (const r of b.results) obs.push({ day: b.day, test: r.test, value: r.value });
      const creat = v("CREAT");
      // eGFR needs a sex; with none recorded it is left out rather than guessed.
      if (creat !== undefined && sex) obs.push({ day: b.day, test: "EGFR", value: Math.round(ckdEpi2021(creat, b.age, sex)) });
      const ast = v("AST");
      const alt = v("ALT");
      const plt = v("PLT");
      if (ast !== undefined && alt !== undefined && plt !== undefined) {
        const f = fib4(b.age, ast, alt, plt);
        if (f !== null) obs.push({ day: b.day, test: "FIB4", value: Math.round(f * 100) / 100 });
      }
    }
    obs.sort((a, b) => a.day - b.day);

    const last = bs[bs.length - 1];
    const displays = bs.map((b) => normalizeName(b.name).display).filter(Boolean);
    const referrers = bs.map((b) => b.referrer).filter((r) => r !== "Self");
    const shared = p.sharedPhones[0];
    return {
      pid: p.pid,
      name: displays.length ? mode(displays, fuller) : "Unnamed",
      typedNames: [...new Set(bs.map((b) => b.name))],
      sex,
      ageNow: last.age + (yearOf(asOf) - yearOf(last.day)),
      obs,
      visitDays: [...new Set(bs.map((b) => b.day))],
      patientKeys: [...new Set(bs.map((b) => b.patientKey))],
      links: p.links,
      method: p.method,
      firstChannel: bs[0].channel,
      referrer: referrers.length ? referrers[referrers.length - 1] : null,
      contact: p.ownPhones.length ? "own" : shared ? "shared" : "none",
      phoneMasked: p.ownPhones.length ? maskPhone(p.ownPhones[0]) : null,
      ownPhones: p.ownPhones,
      agentLabel: shared ? (agentLabelOf.get(shared) ?? "Collection agent") : null,
      truth: [...new Set(bs.map((b) => b.truth))],
    };
  });
}
