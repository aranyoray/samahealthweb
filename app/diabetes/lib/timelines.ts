// Turn resolved persons into per-person timelines: observations in date
// order plus the identity evidence that stitched them together.

import { maskPhone, normalizeName, type BillLink, type LinkMethod, type Resolution } from "./identity";
import type { Obs } from "./rules";
import { yearOf } from "./rng";
import type { Bill, Channel } from "./types";

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
  billKeys: number[];
  links: BillLink[];
  method: LinkMethod;
  firstChannel: Channel;
  referrer: string | null;
  contact: Contact;
  phoneMasked: string | null;
  agentLabel: string | null;
  truth: number[];
};

function mode<T>(xs: T[], tieBreak: (a: T, b: T) => number = () => 0): T {
  const counts = new Map<T, number>();
  for (const x of xs) counts.set(x, (counts.get(x) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || tieBreak(a[0], b[0]))[0][0];
}

/** Longer (more complete) spellings win ties, e.g. "Putul Das" over "Putul". */
const fuller = (a: string, b: string) => b.split(" ").length - a.split(" ").length;

export function buildTimelines(
  bills: Bill[],
  res: Resolution,
  agentLabelOf: Map<string, string>,
  asOf: number,
): Timeline[] {
  return res.persons.map((p) => {
    const bs = p.bills.map((i) => bills[i]);
    const obs: Obs[] = [];
    for (const b of bs) for (const r of b.results) obs.push({ day: b.day, test: r.test, value: r.value });
    obs.sort((a, b) => a.day - b.day);

    const sexes = bs.map((b) => b.sex).filter((s) => s !== "");
    const last = bs[bs.length - 1];
    const displays = bs.map((b) => normalizeName(b.name).display).filter(Boolean);
    const referrers = bs.map((b) => b.referrer).filter((r) => r !== "Self");
    const shared = p.sharedPhones[0];

    return {
      pid: p.pid,
      name: displays.length ? mode(displays, fuller) : "Unnamed",
      typedNames: [...new Set(bs.map((b) => b.name))],
      sex: sexes.length ? mode(sexes) : "",
      ageNow: last.age + (yearOf(asOf) - yearOf(last.day)),
      obs,
      visitDays: [...new Set(bs.map((b) => b.day))],
      patientKeys: [...new Set(bs.map((b) => b.patientKey))],
      billKeys: bs.map((b) => b.billKey),
      links: p.links,
      method: p.method,
      firstChannel: bs[0].channel,
      referrer: referrers.length ? referrers[referrers.length - 1] : null,
      contact: p.ownPhones.length ? "own" : shared ? "shared" : "none",
      phoneMasked: p.ownPhones.length ? maskPhone(p.ownPhones[0]) : null,
      agentLabel: shared ? (agentLabelOf.get(shared) ?? "Collection agent") : null,
      truth: [...new Set(bs.map((b) => b.truth))],
    };
  });
}
