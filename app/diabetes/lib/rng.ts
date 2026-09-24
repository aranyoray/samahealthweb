// Seeded PRNG so the synthetic cohort is identical on every build and on
// server + client. mulberry32: tiny, fast, good enough for simulation.

export type Rng = {
  next: () => number;
  int: (lo: number, hi: number) => number;
  chance: (p: number) => boolean;
  pick: <T>(arr: readonly T[]) => T;
  weighted: <T>(items: readonly (readonly [T, number])[]) => T;
  normal: (mean: number, sd: number) => number;
  lognormal: (medianValue: number, sd: number) => number;
};

export function makeRng(seed: number): Rng {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  let spare: number | null = null;
  const gauss = () => {
    if (spare !== null) {
      const s = spare;
      spare = null;
      return s;
    }
    let u = 0;
    let v = 0;
    while (u === 0) u = next();
    while (v === 0) v = next();
    const r = Math.sqrt(-2 * Math.log(u));
    spare = r * Math.sin(2 * Math.PI * v);
    return r * Math.cos(2 * Math.PI * v);
  };
  return {
    next,
    int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
    chance: (p) => next() < p,
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    weighted: (items) => {
      const total = items.reduce((s, [, w]) => s + w, 0);
      let r = next() * total;
      for (const [v, w] of items) {
        r -= w;
        if (r <= 0) return v;
      }
      return items[items.length - 1][0];
    },
    normal: (mean, sd) => mean + sd * gauss(),
    lognormal: (medianValue, sd) => medianValue * Math.exp(sd * gauss()),
  };
}

/* ------------------------------------------------------------------ */
/* Dates as integer day numbers (days since 1970-01-01, UTC)            */
/* ------------------------------------------------------------------ */

const MS_DAY = 86_400_000;

export function dayOf(iso: string): number {
  return Math.round(Date.parse(iso + "T00:00:00Z") / MS_DAY);
}

export function isoOf(day: number): string {
  return new Date(day * MS_DAY).toISOString().slice(0, 10);
}

export function yearOf(day: number): number {
  return new Date(day * MS_DAY).getUTCFullYear();
}

/** Month index (year*12 + month) used for the monthly PATIENT_KEY refresh. */
export function monthIndex(day: number): number {
  const d = new Date(day * MS_DAY);
  return d.getUTCFullYear() * 12 + d.getUTCMonth();
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function fmtDay(day: number): string {
  const d = new Date(day * MS_DAY);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function fmtMonth(day: number): string {
  const d = new Date(day * MS_DAY);
  return `${MONTHS[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}`;
}
