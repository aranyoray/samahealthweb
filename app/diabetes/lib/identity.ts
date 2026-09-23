// Identity resolution: stitch AKTIV bills into one timeline per person.
//
// AKTIV re-issues PATIENT_KEY every month, so it cannot link visits. The
// rules below are the clinic's own practice:
//
//   1. The mobile number is the identifier, unless it is junk or it is
//      shared by so many different people that it must be a collection
//      agent's / camp desk's / partner centre's own number.
//   2. Within one number, a fuzzy name match (plus sex and age agreeing)
//      separates the same person from other family members.
//   3. With no usable number, go by name: attach to a phone-linked person
//      if exactly one name/sex/age match exists, else link name-only.
//
// Pure functions over plain rows, so the same code can run on the Neon
// mirror export as well as on the synthetic cohort.

import { yearOf } from "./rng";
import type { Bill, Sex } from "./types";

export const IDENTITY_CONFIG = {
  /** A number carrying more than this many different people is a shared (agent) number. */
  sharedNumberPeople: 15,
  /** Given-name similarity (Jaro-Winkler on a phonetic key) to call it the same name. */
  givenNameMin: 0.88,
  surnameMin: 0.84,
  /** Typed ages drift and get rounded to 5s. Birth years may differ by this much. */
  birthYearTolPhone: 3,
  birthYearTolName: 2,
} as const;

/* ------------------------------------------------------------------ */
/* Phones                                                               */
/* ------------------------------------------------------------------ */

export type PhoneStatus = "valid" | "missing" | "junk";

export function normalizePhone(raw: string): { status: PhoneStatus; phone: string | null } {
  let d = raw.replace(/\D/g, "");
  if (!d) return { status: "missing", phone: null };
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  else if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  if (d.length !== 10 || !/^[6-9]/.test(d)) return { status: "junk", phone: null };
  if (new Set(d).size <= 2) return { status: "junk", phone: null }; // 9999999999, 9000000000
  if (/(\d)\1{6,}/.test(d)) return { status: "junk", phone: null }; // long runs of one digit
  if ("0123456789012".includes(d) || "9876543210987".includes(d)) return { status: "junk", phone: null };
  return { status: "valid", phone: d };
}

export function maskPhone(p: string): string {
  return `${p.slice(0, 2)}xxx xx${p.slice(7)}`;
}

/* ------------------------------------------------------------------ */
/* Names                                                                */
/* ------------------------------------------------------------------ */

const HONORIFICS = new Set([
  "mr", "mrs", "ms", "miss", "smt", "sri", "shri", "shree", "sree", "srimati", "dr", "late", "baby",
  "master", "kumari",
]);
const PREFIX_CANON: Record<string, string> = {
  md: "md", mohd: "md", mohammad: "md", mohammed: "md", muhammad: "md", mohamed: "md",
  sk: "sk", sheikh: "sk", shaikh: "sk", seikh: "sk",
};

/** Bengali-aware phonetic key: folds the spellings a front desk produces. */
export function phonetic(token: string): string {
  let s = token.toLowerCase().replace(/[^a-z]/g, "");
  s = s
    .replace(/ph/g, "f")
    .replace(/ou|au|ow/g, "o")
    .replace(/[vw]/g, "b")
    .replace(/z/g, "j")
    .replace(/q/g, "k")
    .replace(/x/g, "ks")
    .replace(/ck/g, "k")
    .replace(/([bcdgjkpst])h/g, "$1")
    .replace(/ee/g, "i")
    .replace(/oo/g, "u")
    .replace(/ai/g, "e")
    .replace(/y/g, "i")
    .replace(/(.)\1+/g, "$1");
  return s;
}

export type NormName = { given: string; surname: string; prefix: string; display: string };

export function normalizeName(raw: string): NormName {
  const words = raw
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  let prefix = "";
  const rest: string[] = [];
  for (const w of words) {
    if (HONORIFICS.has(w)) continue;
    if (PREFIX_CANON[w] && !rest.length) {
      prefix = PREFIX_CANON[w];
      continue;
    }
    rest.push(w);
  }
  const given = rest.length ? phonetic(rest[0]) : "";
  const surname = rest.length > 1 ? phonetic(rest[rest.length - 1]) : "";
  const display = rest.map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
  return { given, surname, prefix, display: (prefix ? (prefix === "md" ? "Md " : "Sk ") : "") + display };
}

export function jaroWinkler(a: string, b: string): number {
  if (a === b) return 1;
  const la = a.length;
  const lb = b.length;
  if (!la || !lb) return 0;
  const range = Math.max(0, Math.floor(Math.max(la, lb) / 2) - 1);
  const ma = new Array<boolean>(la).fill(false);
  const mb = new Array<boolean>(lb).fill(false);
  let matches = 0;
  for (let i = 0; i < la; i++) {
    const lo = Math.max(0, i - range);
    const hi = Math.min(lb - 1, i + range);
    for (let j = lo; j <= hi; j++) {
      if (mb[j] || a[i] !== b[j]) continue;
      ma[i] = mb[j] = true;
      matches++;
      break;
    }
  }
  if (!matches) return 0;
  let t = 0;
  let k = 0;
  for (let i = 0; i < la; i++) {
    if (!ma[i]) continue;
    while (!mb[k]) k++;
    if (a[i] !== b[k]) t++;
    k++;
  }
  const m = matches;
  const jaro = (m / la + m / lb + (m - t / 2) / m) / 3;
  let prefix = 0;
  while (prefix < 4 && prefix < la && prefix < lb && a[prefix] === b[prefix]) prefix++;
  return jaro + prefix * 0.1 * (1 - jaro);
}

/** Jaro-Winkler over-rewards short strings contained in longer ones
 * ("ali" vs "malik" scores 0.87), so the first sound must also agree. */
function similar(a: string, b: string, min: number): boolean {
  return a[0] === b[0] && jaroWinkler(a, b) >= min;
}

export function sameName(a: NormName, b: NormName): boolean {
  if (!a.given || !b.given) return false;
  if (!similar(a.given, b.given, IDENTITY_CONFIG.givenNameMin)) return false;
  if (a.surname && b.surname && !similar(a.surname, b.surname, IDENTITY_CONFIG.surnameMin)) return false;
  return true;
}

/* ------------------------------------------------------------------ */
/* Resolver                                                             */
/* ------------------------------------------------------------------ */

export type LinkMethod = "phone" | "name-only";
export type BillLink = "phone" | "phone-typo" | "name-bridge" | "name-only" | "single";

type Rec = {
  idx: number;
  name: NormName;
  sex: Sex;
  birthYear: number;
  phoneStatus: PhoneStatus | "shared";
  phone: string | null;
};

export type Person = {
  pid: number;
  bills: number[]; // indices into the bills array, day order
  links: BillLink[]; // how each bill joined the person
  method: LinkMethod;
  ownPhones: string[];
  sharedPhones: string[];
};

export type Resolution = {
  persons: Person[];
  personOfBill: Int32Array;
  billPhoneStatus: (PhoneStatus | "shared")[];
  sharedNumbers: { phone: string; people: number; bills: number }[];
};

function compatible(a: Rec, b: Rec, tol: number): boolean {
  if (a.sex && b.sex && a.sex !== b.sex) return false;
  if (Math.abs(a.birthYear - b.birthYear) > tol) return false;
  return sameName(a.name, b.name);
}

/** Greedy single-link clustering; fine because groups are small. */
function cluster(recs: Rec[], tol: number): Rec[][] {
  const groups: Rec[][] = [];
  for (const r of recs) {
    const hits: number[] = [];
    for (let g = 0; g < groups.length; g++) {
      if (groups[g].some((o) => compatible(r, o, tol))) hits.push(g);
    }
    if (!hits.length) {
      groups.push([r]);
    } else {
      const into = groups[hits[0]];
      into.push(r);
      for (let h = hits.length - 1; h >= 1; h--) {
        into.push(...groups[hits[h]]);
        groups.splice(hits[h], 1);
      }
    }
  }
  return groups;
}

/** Candidate block: first three sounds of the given name. Sex is checked
 * pairwise so a blank sex field does not hide a record. */
function blockKey(r: Rec): string {
  return r.name.given.slice(0, 3);
}

export function resolveIdentities(bills: Bill[]): Resolution {
  const cfg = IDENTITY_CONFIG;
  const recs: Rec[] = bills.map((b, idx) => {
    const np = normalizePhone(b.phone);
    return {
      idx,
      name: normalizeName(b.name),
      sex: b.sex,
      birthYear: yearOf(b.day) - b.age,
      phoneStatus: np.status,
      phone: np.phone,
    };
  });

  // 1. Group by valid number; flag numbers carrying too many people.
  const byPhone = new Map<string, Rec[]>();
  for (const r of recs) {
    if (r.phone) {
      const arr = byPhone.get(r.phone);
      if (arr) arr.push(r);
      else byPhone.set(r.phone, [r]);
    }
  }

  type Cluster = { recs: Rec[]; links: BillLink[]; method: LinkMethod; phones: string[] };
  let clusters: Cluster[] = [];
  const sharedNumbers: Resolution["sharedNumbers"] = [];

  for (const [phone, group] of byPhone) {
    const distinctGiven = new Set(group.map((r) => `${r.sex}:${r.name.given}`)).size;
    let people: Rec[][] | null = null;
    let peopleCount = distinctGiven;
    if (distinctGiven <= cfg.sharedNumberPeople * 2) {
      people = cluster(group, cfg.birthYearTolPhone);
      peopleCount = people.length;
    }
    if (peopleCount > cfg.sharedNumberPeople) {
      for (const r of group) r.phoneStatus = "shared";
      sharedNumbers.push({ phone, people: peopleCount, bills: group.length });
      continue;
    }
    for (const c of people!) {
      clusters.push({ recs: c, links: c.map(() => "phone"), method: "phone", phones: [phone] });
    }
  }

  // 1b. One-digit typos: two numbers differing in a single digit, same name,
  //     sex and age, are one person whose number was mistyped once.
  const typoIndex = new Map<string, number[]>();
  clusters.forEach((c, ci) => {
    const p = c.phones[0];
    for (let i = 0; i < 10; i++) {
      const k = `${p.slice(0, i)}_${p.slice(i + 1)}`;
      const arr = typoIndex.get(k);
      if (arr) arr.push(ci);
      else typoIndex.set(k, [ci]);
    }
  });
  const merged = new Set<number>();
  for (const ids of typoIndex.values()) {
    for (let a = 0; a < ids.length; a++) {
      for (let b = a + 1; b < ids.length; b++) {
        if (merged.has(ids[a]) || merged.has(ids[b])) continue;
        let keep = clusters[ids[a]];
        let drop = clusters[ids[b]];
        if (keep.phones[0] === drop.phones[0]) continue; // same number: family members
        if (!keep.recs.some((r) => drop.recs.some((o) => compatible(r, o, cfg.birthYearTolPhone)))) continue;
        let dropId = ids[b];
        if (drop.recs.length > keep.recs.length) {
          [keep, drop] = [drop, keep];
          dropId = ids[a];
        }
        keep.recs.push(...drop.recs);
        keep.links.push(...drop.recs.map((): BillLink => "phone-typo"));
        keep.phones.push(...drop.phones);
        merged.add(dropId);
      }
    }
  }
  clusters = clusters.filter((_, ci) => !merged.has(ci));

  // 2. Bills without a usable number: bridge to a phone person by name, if unambiguous.
  const phoneIndex = new Map<string, number[]>(); // block -> cluster ids
  clusters.forEach((c, ci) => {
    const seen = new Set<string>();
    for (const r of c.recs) {
      const k = blockKey(r);
      if (seen.has(k)) continue;
      seen.add(k);
      const arr = phoneIndex.get(k);
      if (arr) arr.push(ci);
      else phoneIndex.set(k, [ci]);
    }
  });

  const orphans: Rec[] = [];
  for (const r of recs) {
    if (r.phoneStatus === "valid") continue;
    if (!r.name.given || !r.name.surname) {
      orphans.push(r);
      continue;
    }
    const candidates = new Set<number>();
    for (const ci of phoneIndex.get(blockKey(r)) ?? []) {
      if (clusters[ci].recs.some((o) => o.name.surname && compatible(r, o, cfg.birthYearTolName))) candidates.add(ci);
    }
    if (candidates.size === 1) {
      const ci = [...candidates][0];
      clusters[ci].recs.push(r);
      clusters[ci].links.push("name-bridge");
    } else {
      orphans.push(r);
    }
  }

  // 3. The rest link on name alone (needs a surname), within sex + 3-letter blocks.
  const orphanBlocks = new Map<string, Rec[]>();
  for (const r of orphans) {
    if (!r.name.given || !r.name.surname) {
      clusters.push({ recs: [r], links: ["single"], method: "name-only", phones: [] });
      continue;
    }
    const k = blockKey(r);
    const arr = orphanBlocks.get(k);
    if (arr) arr.push(r);
    else orphanBlocks.set(k, [r]);
  }
  for (const group of orphanBlocks.values()) {
    for (const c of cluster(group, cfg.birthYearTolName)) {
      clusters.push({
        recs: c,
        links: c.map(() => (c.length > 1 ? "name-only" : "single")),
        method: "name-only",
        phones: [],
      });
    }
  }

  // 4. Materialise persons in order of first appearance.
  const built = clusters.map((c) => {
    const order = c.recs.map((r, i) => ({ r, link: c.links[i] })).sort((a, b) => a.r.idx - b.r.idx);
    const shared = new Set<string>();
    for (const { r } of order) if (r.phoneStatus === "shared" && r.phone) shared.add(r.phone);
    return {
      bills: order.map((o) => o.r.idx),
      links: order.map((o) => o.link),
      method: c.method,
      ownPhones: c.phones,
      sharedPhones: [...shared],
    };
  });
  built.sort((a, b) => a.bills[0] - b.bills[0]);

  const personOfBill = new Int32Array(bills.length).fill(-1);
  const persons: Person[] = built.map((b, pid) => {
    for (const i of b.bills) personOfBill[i] = pid;
    return { pid, ...b };
  });

  sharedNumbers.sort((a, b) => b.people - a.people);
  return { persons, personOfBill, billPhoneStatus: recs.map((r) => r.phoneStatus), sharedNumbers };
}

/* ------------------------------------------------------------------ */
/* Scoring against ground truth (synthetic cohort only)                 */
/* ------------------------------------------------------------------ */

export type LinkageScore = {
  method: string;
  clusters: number;
  precision: number;
  recall: number;
  /** Share of true multi-visit people whose whole timeline came out exactly right. */
  exact: number;
};

/** Pairwise precision / recall of a clustering against the true person ids. */
export function scoreClustering(method: string, predicted: ArrayLike<number | string>, truth: ArrayLike<number>): LinkageScore {
  const pairs = (n: number) => (n * (n - 1)) / 2;
  const predSize = new Map<string, number>();
  const trueSize = new Map<number, number>();
  const joint = new Map<string, number>();
  for (let i = 0; i < truth.length; i++) {
    const p = String(predicted[i]);
    const t = truth[i];
    predSize.set(p, (predSize.get(p) ?? 0) + 1);
    trueSize.set(t, (trueSize.get(t) ?? 0) + 1);
    const k = `${p}|${t}`;
    joint.set(k, (joint.get(k) ?? 0) + 1);
  }
  let tp = 0;
  for (const n of joint.values()) tp += pairs(n);
  let pp = 0;
  for (const n of predSize.values()) pp += pairs(n);
  let tpairs = 0;
  for (const n of trueSize.values()) tpairs += pairs(n);
  // Exact timelines: every visit in one predicted person, and nobody else's in it.
  const firstPred = new Map<number, string>();
  const split = new Set<number>();
  for (let i = 0; i < truth.length; i++) {
    const p = String(predicted[i]);
    const seen = firstPred.get(truth[i]);
    if (seen === undefined) firstPred.set(truth[i], p);
    else if (seen !== p) split.add(truth[i]);
  }
  let multi = 0;
  let exact = 0;
  for (const [t, n] of trueSize) {
    if (n < 2) continue;
    multi++;
    if (!split.has(t) && predSize.get(firstPred.get(t)!) === n) exact++;
  }
  return {
    method,
    clusters: predSize.size,
    precision: pp ? tp / pp : 1,
    recall: tpairs ? tp / tpairs : 1,
    exact: multi ? exact / multi : 1,
  };
}
