// Real aggregates from Anubhav Life Care's AKTIV records, for /ncd. The JSON is
// written by etl-ncd/analysis/web_export.py from etl-ncd/analysis/results,
// which the clinic PC produces; it holds counts and percentages only, no
// patient-level rows. Rerun the export after a fresh pull to update the page.

import data from "../data/aktiv.json";

export const AKTIV = data;

export type Prev = (typeof data.prevalence)[number];

/** One row of the prevalence table by its exact condition label; throws on a typo so the build fails loudly. */
export function prev(condition: string): Prev {
  const p = data.prevalence.find((r) => r.condition === condition);
  if (!p) throw new Error(`aktiv.json has no prevalence row "${condition}"`);
  return p;
}

export function sexSplit(condition: keyof typeof data.bySex) {
  return data.bySex[condition];
}

export type Pair = (typeof data.pairs)[number];

/** An association between two conditions, in either direction as stored. */
export function pair(a: string, b: string): Pair {
  const p = data.pairs.find((r) => r.a === a && r.b === b);
  if (!p) throw new Error(`aktiv.json has no pair "${a}" -> "${b}"`);
  return p;
}

/** Prevalence rows grouped by category, in the order the analysis lists them. */
export function byCategory(): { category: string; rows: Prev[] }[] {
  const out: { category: string; rows: Prev[] }[] = [];
  for (const r of data.prevalence) {
    const g = out.find((x) => x.category === r.category);
    if (g) g.rows.push(r);
    else out.push({ category: r.category, rows: [r] });
  }
  return out;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const monthYear = (iso: string) => `${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;
