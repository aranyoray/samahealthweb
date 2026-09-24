"use client";

// The call list. Ranked people who need a diabetes follow-up, filters the
// care team actually uses, a per-person timeline, a ready-to-send reminder
// (English / Bengali) and a status the coordinator ticks as they go.
// Statuses live in this browser only (localStorage), which is enough for a
// demo; the production version writes them back next to the AKTIV mirror.

import { useEffect, useMemo, useState } from "react";
import type { Queue, WorkRow } from "./lib/analytics";
import { REASON_LABEL, TIER_LABEL, type Reason, type Tier } from "./lib/rules";
import { fmtDay, isoOf } from "./lib/rng";
import { TEST_CODES, TEST_LABEL, TEST_UNIT } from "./lib/types";
import { LineChart } from "./LineChart";

const STATUSES = ["To contact", "Reminder sent", "No answer", "Test booked", "Declined / unreachable"] as const;
type Status = (typeof STATUSES)[number];
const STORE_KEY = "dx-call-status-v1";
const PAGE = 15;

const TIERS: Tier[] = ["critical", "high", "medium", "routine"];
const OWNER_KINDS = ["Duty doctor", "Care coordinator", "Collection agent", "Referring doctor / outreach"] as const;

function ownerKind(r: WorkRow): (typeof OWNER_KINDS)[number] {
  if (r.tier === "critical") return "Duty doctor";
  if (r.contact === "own") return "Care coordinator";
  if (r.contact === "shared") return "Collection agent";
  return "Referring doctor / outreach";
}

function firstName(name: string): string {
  return name.split(" ").filter((t) => t !== "Md" && t !== "Sk")[0] ?? name;
}

function dmy(day: number): string {
  const [y, m, d] = isoOf(day).split("-");
  return `${d}/${m}/${y}`;
}

function dueText(r: WorkRow): string {
  const d = r.daysPastDue;
  if (d > 180) return `Lost (${d} days)`;
  if (d > 0) return `Overdue ${d} day${d === 1 ? "" : "s"}`;
  if (d === 0) return "Due today";
  return `Due in ${-d} day${d === -1 ? "" : "s"}`;
}

function message(r: WorkRow, lang: "en" | "bn"): string {
  const first = firstName(r.name);
  const date = lang === "en" ? fmtDay(r.lastGlyDay) : dmy(r.lastGlyDay);
  const a1c = r.lastA1c && r.lastA1c.day === r.lastGlyDay ? r.lastA1c.value : null;
  const extras = r.reasons.includes("kidney-due") || r.reasons.includes("kidney-abnormal") || r.reasons.includes("lipids-due");

  if (r.reasons.includes("critical")) {
    return lang === "en"
      ? `Doctor call. Last result on ${date} was very high${a1c ? ` (HbA1c ${a1c}%)` : ""} with no repeat since. Ask about thirst, passing urine often, weight loss, infections or foot wounds, and which medicines they are taking. Book HbA1c and fasting glucose within 48 hours; ask them to come in the same day if unwell.`
      : `ডাক্তারের ফোন। ${date}-এর রিপোর্টে সুগার অনেক বেশি${a1c ? ` (HbA1c ${a1c}%)` : ""}, তারপর আর পরীক্ষা হয়নি। জিজ্ঞেস করুন: খুব তেষ্টা পায় কি না, বারবার প্রস্রাব, ওজন কমে যাওয়া, কোনো সংক্রমণ বা পায়ে ঘা আছে কি না, কী ওষুধ খাচ্ছেন। ৪৮ ঘণ্টার মধ্যে HbA1c ও খালি পেটে সুগার পরীক্ষা বুক করুন; শরীর খারাপ থাকলে আজই আসতে বলুন।`;
  }
  if (r.status === "unconfirmed") {
    return lang === "en"
      ? `Hello ${first}, this is Anubhav Life Care, Barasat. Your blood sugar on ${date} was high. One more test (HbA1c) is needed to confirm it. Reply 1 and we will collect the sample at home, or walk in to our Barasat centre.`
      : `প্রিয় ${first}, অনুভব লাইফ কেয়ার, বারাসাত থেকে বলছি। ${date}-এর পরীক্ষায় আপনার রক্তে শর্করা বেশি এসেছে। নিশ্চিত হতে আর একটি পরীক্ষা (HbA1c) দরকার। বাড়ি থেকে নমুনা নেওয়ার জন্য ১ লিখে উত্তর দিন, অথবা বারাসাত সেন্টারে চলে আসুন।`;
  }
  if (r.status === "prediabetes") {
    return lang === "en"
      ? `Hello ${first}, this is Anubhav Life Care, Barasat. Your sugar test on ${date} was in the borderline range, and your yearly recheck is now due. Reply 1 to book a home collection.`
      : `প্রিয় ${first}, অনুভব লাইফ কেয়ার, বারাসাত থেকে বলছি। ${date}-এর পরীক্ষায় আপনার সুগার সীমারেখায় ছিল। বছরে একবার আবার পরীক্ষা করানো দরকার, সেই সময় হয়েছে। বুক করতে ১ লিখে উত্তর দিন।`;
  }
  const last = a1c ? (lang === "en" ? `Your last HbA1c was ${a1c}% on ${date}.` : `আপনার শেষ HbA1c ছিল ${a1c}% (${date})।`) : lang === "en" ? `Your last sugar test was on ${date}.` : `আপনার শেষ সুগার পরীক্ষা হয়েছিল ${date}-এ।`;
  return lang === "en"
    ? `Hello ${first}, this is Anubhav Life Care, Barasat. ${last} Your next diabetes check is ${r.daysPastDue > 0 ? "now due" : `due by ${fmtDay(r.dueDay)}`}.${extras ? " Kidney and cholesterol tests can be done from the same sample." : ""} Reply 1 and we will collect the sample at home, or walk in to our Barasat centre.`
    : `প্রিয় ${first}, অনুভব লাইফ কেয়ার, বারাসাত থেকে বলছি। ${last} আবার সুগার পরীক্ষার সময় হয়েছে।${extras ? " একই নমুনা থেকে কিডনি ও কোলেস্টেরলের পরীক্ষাও হয়ে যাবে।" : ""} বাড়ি থেকে রক্তের নমুনা নেওয়ার জন্য ১ লিখে উত্তর দিন, অথবা বারাসাত সেন্টারে চলে আসুন।`;
}

function TierBadge({ tier }: { tier: Tier }) {
  return (
    <span className={`dx-tier dx-tier-${tier}`}>
      <TierIcon tier={tier} />
      {TIER_LABEL[tier]}
    </span>
  );
}

function TierIcon({ tier }: { tier: Tier }) {
  const c = `var(--dx-${tier})`;
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
      {tier === "critical" && (
        <>
          <circle cx="6" cy="6" r="6" fill={c} />
          <rect x="5.1" y="2.4" width="1.8" height="4.6" rx="0.9" fill="#fff" />
          <circle cx="6" cy="9" r="1" fill="#fff" />
        </>
      )}
      {tier === "high" && <path d="M6 0.8 L11.4 11 H0.6 Z" fill={c} />}
      {tier === "medium" && <rect x="1" y="1" width="10" height="10" rx="2" fill={c} />}
      {tier === "routine" && <circle cx="6" cy="6" r="4.6" fill="none" stroke={c} strokeWidth="2" />}
    </svg>
  );
}

function bandColor(v: number): string {
  return v < 5.7 ? "var(--dx-b0)" : v < 6.5 ? "var(--dx-b1)" : v < 8 ? "var(--dx-b2)" : "var(--dx-b3)";
}

export function Worklist({
  rows,
  asOf,
  totals,
}: {
  rows: WorkRow[];
  asOf: number;
  totals: { keep: number; reengage: number; tiers: Record<Queue, Record<Tier, number>> };
}) {
  const [queue, setQueue] = useState<Queue>("keep");
  const [tier, setTier] = useState<Tier | "all">("all");
  const [reason, setReason] = useState<Reason | "all">("all");
  const [owner, setOwner] = useState<(typeof OWNER_KINDS)[number] | "all">("all");
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE);
  const [open, setOpen] = useState<string | null>(null);
  const [status, setStatus] = useState<Record<string, Status>>({});

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORE_KEY);
      if (raw) setStatus(JSON.parse(raw));
    } catch {
      /* private mode or blocked storage: statuses just won't persist */
    }
  }, []);

  const setRowStatus = (pid: string, s: Status) => {
    setStatus((prev) => {
      const next = { ...prev, [pid]: s };
      try {
        window.localStorage.setItem(STORE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const inQueue = useMemo(() => rows.filter((r) => r.queue === queue), [rows, queue]);
  const reasonsHere = useMemo(() => {
    const set = new Set<Reason>();
    for (const r of inQueue) for (const x of r.reasons) set.add(x);
    return [...set];
  }, [inQueue]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return inQueue.filter(
      (r) =>
        (tier === "all" || r.tier === tier) &&
        (reason === "all" || r.reasons.includes(reason)) &&
        (owner === "all" || ownerKind(r) === owner) &&
        (!q || r.name.toLowerCase().includes(q) || r.pid.toLowerCase().includes(q)),
    );
  }, [inQueue, tier, reason, owner, query]);

  const actioned = inQueue.filter((r) => status[r.pid] && status[r.pid] !== "To contact").length;
  const booked = inQueue.filter((r) => status[r.pid] === "Test booked").length;
  const queueTotal = queue === "keep" ? totals.keep : totals.reengage;

  const resetPaging = () => {
    setShown(PAGE);
    setOpen(null);
  };

  const exportCsv = () => {
    const head = ["patient_id", "name", "sex", "age", "priority", "score", "last_hba1c", "last_test", "due", "days_past_due", "why", "next_step", "who", "contact", "status"];
    const esc = (v: string | number) => {
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = filtered.map((r) =>
      [
        r.pid, r.name, r.sex, r.age, TIER_LABEL[r.tier], r.score, r.lastA1c?.value ?? "", isoOf(r.lastGlyDay), isoOf(r.dueDay),
        r.daysPastDue, r.reasons.map((x) => REASON_LABEL[x]).join("; "), r.nextStep, r.owner,
        r.phoneMasked ?? (r.contact === "shared" ? "via agent" : "none"), status[r.pid] ?? "To contact",
      ].map(esc).join(","),
    );
    const blob = new Blob([[head.join(","), ...lines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `diabetes-call-list-${queue}-${isoOf(asOf)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="dx-wl">
      <div className="dx-wl-queues" role="tablist" aria-label="Queue">
        {(
          [
            ["keep", "Keep in care", totals.keep, "due soon, overdue or slipping"],
            ["reengage", "Re-engage", totals.reengage, "already lost, over 180 days past due"],
          ] as const
        ).map(([k, label, n, hint]) => (
          <button
            key={k}
            role="tab"
            aria-selected={queue === k}
            className={`dx-queue ${queue === k ? "is-on" : ""}`}
            onClick={() => {
              setQueue(k);
              setTier("all");
              setReason("all");
              resetPaging();
            }}
          >
            <span className="dx-queue-n">{n.toLocaleString("en-IN")}</span>
            <span className="dx-queue-label">{label}</span>
            <span className="dx-queue-hint">{hint}</span>
          </button>
        ))}
      </div>

      <div className="dx-wl-tiers" aria-label="Filter by priority">
        {TIERS.map((t) => (
          <button
            key={t}
            className={`dx-chip ${tier === t ? "is-on" : ""}`}
            aria-pressed={tier === t}
            onClick={() => {
              setTier(tier === t ? "all" : t);
              resetPaging();
            }}
          >
            <TierIcon tier={t} />
            {TIER_LABEL[t]}
            <span className="mono dx-dim">{totals.tiers[queue][t].toLocaleString("en-IN")}</span>
          </button>
        ))}
      </div>

      <div className="dx-wl-filters">
        <label>
          <span>Why</span>
          <select
            value={reason}
            onChange={(e) => {
              setReason(e.target.value as Reason | "all");
              resetPaging();
            }}
          >
            <option value="all">Any reason</option>
            {reasonsHere.map((r) => (
              <option key={r} value={r}>
                {REASON_LABEL[r]}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Who acts</span>
          <select
            value={owner}
            onChange={(e) => {
              setOwner(e.target.value as (typeof OWNER_KINDS)[number] | "all");
              resetPaging();
            }}
          >
            <option value="all">Anyone</option>
            {OWNER_KINDS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
        <label className="dx-search">
          <span>Find</span>
          <input
            type="search"
            placeholder="Name or P-number"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              resetPaging();
            }}
          />
        </label>
        <button className="dx-btn" onClick={exportCsv}>
          Export CSV
        </button>
      </div>

      <p className="mono dx-wl-summary" aria-live="polite">
        {filtered.length.toLocaleString("en-IN")} match · top {inQueue.length} of {queueTotal.toLocaleString("en-IN")} in this queue
        loaded · {actioned} actioned · {booked} booked
      </p>

      <div className="dx-wl-head" aria-hidden>
        <span>Priority</span>
        <span>Patient</span>
        <span>Last HbA1c</span>
        <span>When</span>
        <span>Why</span>
        <span>Next step</span>
        <span>Status</span>
      </div>

      <ul className="dx-wl-list">
        {filtered.slice(0, shown).map((r) => {
          const isOpen = open === r.pid;
          const trend = r.lastA1c && r.prevA1c !== null ? Math.round((r.lastA1c.value - r.prevA1c) * 10) / 10 : null;
          return (
            <li key={r.pid} className={`dx-wl-row ${isOpen ? "is-open" : ""}`}>
              <div className="dx-wl-cells">
                <div className="dx-cell-tier">
                  <TierBadge tier={r.tier} />
                  <span className="mono dx-dim" title="Priority score out of 100">
                    {r.score}
                  </span>
                </div>
                <div className="dx-cell-patient">
                  <button className="dx-name" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : r.pid)}>
                    {r.name}
                    <span aria-hidden className="dx-caret">
                      {isOpen ? "▴" : "▾"}
                    </span>
                  </button>
                  <span className="mono dx-dim">
                    {r.pid} · {r.sex || "?"} · {r.age}y
                  </span>
                  <span className="dx-contact">
                    {r.contact === "own" ? r.phoneMasked : r.contact === "shared" ? "agent's number only" : "no usable number"}
                  </span>
                </div>
                <div className="dx-cell-a1c">
                  {r.lastA1c ? (
                    <>
                      <span className="dx-a1c">
                        <span aria-hidden className="dx-dot" style={{ background: bandColor(r.lastA1c.value) }} />
                        <strong>{r.lastA1c.value.toFixed(1)}%</strong>
                        {trend !== null && Math.abs(trend) >= 0.3 && (
                          <span className={`mono ${trend > 0 ? "dx-up" : "dx-down"}`}>
                            {trend > 0 ? "↑" : "↓"}
                            {Math.abs(trend).toFixed(1)}
                          </span>
                        )}
                      </span>
                      <span className="mono dx-dim">{fmtDay(r.lastA1c.day)}</span>
                    </>
                  ) : (
                    <span className="dx-dim">no HbA1c yet</span>
                  )}
                </div>
                <div className="dx-cell-due">
                  <span className={`dx-state dx-state-${r.careState}`}>{dueText(r)}</span>
                  <span className="mono dx-dim">last test {fmtDay(r.lastGlyDay)}</span>
                </div>
                <div className="dx-cell-why">
                  {r.reasons.slice(0, 2).map((x) => (
                    <span key={x} className="dx-reason">
                      {REASON_LABEL[x]}
                    </span>
                  ))}
                  {r.reasons.length > 2 && (
                    <span className="dx-reason dx-dim" title={r.reasons.slice(2).map((x) => REASON_LABEL[x]).join(", ")}>
                      +{r.reasons.length - 2}
                    </span>
                  )}
                </div>
                <div className="dx-cell-next">
                  <span>{r.nextStep}</span>
                  <span className="dx-dim">{r.owner}</span>
                </div>
                <div className="dx-cell-status">
                  <select
                    aria-label={`Status for ${r.name}`}
                    value={status[r.pid] ?? "To contact"}
                    onChange={(e) => setRowStatus(r.pid, e.target.value as Status)}
                    className={status[r.pid] && status[r.pid] !== "To contact" ? "is-set" : ""}
                  >
                    {STATUSES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              {isOpen && <Detail r={r} asOf={asOf} onStatus={(s) => setRowStatus(r.pid, s)} />}
            </li>
          );
        })}
      </ul>

      {filtered.length > shown && (
        <button className="dx-btn dx-more" onClick={() => setShown((n) => n + PAGE)}>
          Show {Math.min(PAGE, filtered.length - shown)} more
        </button>
      )}
      {!filtered.length && <p className="dx-dim" style={{ padding: "24px 0" }}>Nobody matches these filters.</p>}
    </div>
  );
}

function Detail({ r, asOf, onStatus }: { r: WorkRow; asOf: number; onStatus: (s: Status) => void }) {
  const [lang, setLang] = useState<"en" | "bn">("en");
  const [copied, setCopied] = useState(false);
  const text = message(r, lang);

  const obs = r.obs.map(([day, ti, value]) => ({ day, test: TEST_CODES[ti], value }));
  const a1c = obs.filter((o) => o.test === "HBA1C");
  const first = Math.min(...obs.map((o) => o.day), asOf - 365);
  const lo = Math.min(5, ...a1c.map((o) => Math.floor(o.value)));
  const hi = Math.max(10, ...a1c.map((o) => Math.ceil(o.value)));
  const yTicks = [];
  for (let v = lo; v <= hi; v += hi - lo > 6 ? 2 : 1) yTicks.push({ value: v, label: `${v}` });
  const span = asOf - first;
  const xTicks = [0, 0.5, 1].map((f) => {
    const d = Math.round(first + f * span);
    return { value: d, label: fmtDay(d).split(" ").slice(1).join(" ") };
  });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const flag = (test: string, v: number) => {
    if (test === "HBA1C") return v >= 6.5 ? "high" : v >= 5.7 ? "borderline" : "";
    if (test === "FBS") return v >= 126 ? "high" : v >= 100 ? "borderline" : "";
    if (test === "PPBS" || test === "RBS") return v >= 200 ? "high" : v >= 140 ? "borderline" : "";
    if (test === "EGFR") return v < 60 ? "low" : "";
    if (test === "UACR") return v >= 30 ? "high" : "";
    if (test === "LDL") return v >= 100 ? "above target" : "";
    return "";
  };

  return (
    <div className="dx-detail">
      <div className="dx-detail-chart">
        <h4>HbA1c over time</h4>
        {a1c.length ? (
          <LineChart
            series={[{ name: "HbA1c", color: "var(--dx-in)", markers: true, points: a1c.map((o) => ({ x: o.day, y: o.value })) }]}
            xDomain={[first - 10, asOf + 10]}
            yDomain={[lo, hi]}
            xTicks={xTicks}
            yTicks={yTicks}
            xKind="day"
            yKind="a1c"
            height={190}
            refLines={[
              { axis: "y", value: 7, label: "goal 7%" },
              { axis: "x", value: asOf, label: "today" },
            ]}
            ariaLabel={`HbA1c results for ${r.name}`}
          />
        ) : (
          <p className="dx-dim">No HbA1c on record yet, only glucose. The next step is a confirmatory HbA1c.</p>
        )}
        <h4 style={{ marginTop: 18 }}>How this timeline was linked</h4>
        <p className="dx-detail-p">
          {r.identity.visits} visit{r.identity.visits === 1 ? "" : "s"} under {r.identity.patientKeys} different PATIENT_KEY
          {r.identity.patientKeys === 1 ? "" : "s"}, joined{" "}
          {r.identity.method === "phone" ? "on the mobile number, then name" : "on name, sex and age (no usable number)"}
          {r.identity.bridged ? `; ${r.identity.bridged} visit${r.identity.bridged === 1 ? "" : "s"} with no usable number attached by name` : ""}.
        </p>
        <div className="dx-names">
          {r.identity.names.map((n) => (
            <span key={n} className="mono">
              {n}
            </span>
          ))}
        </div>
        {r.identity.checkLink && (
          <p className="dx-check">
            Check identity on the call: this timeline has an HbA1c jump that usually means two people with the same
            name were joined.
          </p>
        )}
      </div>

      <div className="dx-detail-side">
        <h4>Recent results</h4>
        <table className="dx-results">
          <tbody>
            {[...obs].reverse().slice(0, 8).map((o, i) => (
              <tr key={i}>
                <td className="mono">{fmtDay(o.day)}</td>
                <td>{TEST_LABEL[o.test]}</td>
                <td className="mono">
                  <strong>{o.value}</strong> {TEST_UNIT[o.test]}
                </td>
                <td className="dx-flag">{flag(o.test, o.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="dx-msg">
          <div className="dx-msg-head">
            <h4>{r.reasons.includes("critical") ? "Call script" : "Reminder message"}</h4>
            <div role="group" aria-label="Language" className="dx-seg">
              <button aria-pressed={lang === "en"} onClick={() => setLang("en")}>
                English
              </button>
              <button aria-pressed={lang === "bn"} onClick={() => setLang("bn")} lang="bn">
                বাংলা
              </button>
            </div>
          </div>
          <p className="dx-msg-text" lang={lang === "bn" ? "bn" : "en"}>
            {text}
          </p>
          <div className="dx-msg-actions">
            <button className="dx-btn" onClick={copy}>
              {copied ? "Copied" : "Copy text"}
            </button>
            <button className="dx-btn" onClick={() => onStatus("Reminder sent")}>
              Mark reminder sent
            </button>
            <button className="dx-btn" onClick={() => onStatus("Test booked")}>
              Mark booked
            </button>
          </div>
          <p className="dx-dim" style={{ fontSize: 12, marginTop: 8 }}>
            Goes to: {r.owner}
            {r.contact === "shared" ? ". The patient registered under this agent's number, so the agent is the fastest way to reach them." : ""}
            {r.contact === "none" ? ". No usable number on any visit; ask the referring doctor or the next camp to reach them." : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
