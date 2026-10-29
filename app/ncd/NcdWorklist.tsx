"use client";

// Call list for one condition. Same behaviour as the diabetes list: two
// queues, priority chips, filters, a per-person timeline, a ready reminder in
// English or Bengali, and a status the coordinator ticks as they go (kept in
// this browser only for the demo).

import { useEffect, useMemo, useState } from "react";
import { LineChart } from "../diabetes/LineChart";
import { TIER_LABEL, type Tier } from "../diabetes/lib/rules";
import { fmtDay, isoOf } from "../diabetes/lib/rng";
import type { Queue, WorkRow } from "./lib/engine";

const STATUSES = ["To contact", "Reminder sent", "No answer", "Test booked", "Declined / unreachable"] as const;
type Status = (typeof STATUSES)[number];
const PAGE = 15;
const TIERS: Tier[] = ["critical", "high", "medium", "routine"];
const OWNER_KINDS = ["Duty doctor", "Care coordinator", "Collection agent", "Referring doctor / outreach"] as const;

function ownerKind(r: WorkRow): (typeof OWNER_KINDS)[number] {
  if (r.tier === "critical") return "Duty doctor";
  if (r.contact === "own") return "Care coordinator";
  if (r.contact === "shared") return "Collection agent";
  return "Referring doctor / outreach";
}

function dueText(r: WorkRow): string {
  const d = r.daysPastDue;
  if (d > 180) return `Lost (${d} days)`;
  if (d > 0) return `Overdue ${d} day${d === 1 ? "" : "s"}`;
  if (d === 0) return "Due today";
  return `Due in ${-d} day${d === -1 ? "" : "s"}`;
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

const fmtVal = (v: number) => (Math.abs(v) >= 100 ? Math.round(v).toString() : Math.abs(v) >= 10 ? v.toFixed(1).replace(/\.0$/, "") : v.toFixed(2).replace(/0$/, ""));

export function NcdWorklist({
  rows,
  asOf,
  storeKey,
  headlineLabel,
  csvName,
  goalLine,
  totals,
}: {
  rows: WorkRow[];
  asOf: number;
  storeKey: string;
  headlineLabel: string;
  csvName: string;
  goalLine: { value: number; label: string } | null;
  totals: { keep: number; reengage: number; tiers: Record<Queue, Record<Tier, number>> };
}) {
  const [queue, setQueue] = useState<Queue>("keep");
  const [tier, setTier] = useState<Tier | "all">("all");
  const [reason, setReason] = useState<string>("all");
  const [owner, setOwner] = useState<(typeof OWNER_KINDS)[number] | "all">("all");
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE);
  const [open, setOpen] = useState<string | null>(null);
  const [status, setStatus] = useState<Record<string, Status>>({});

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storeKey);
      // Storage only exists in the browser; reading it during render would break hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setStatus(JSON.parse(raw));
    } catch {
      /* private mode or blocked storage: statuses just won't persist */
    }
  }, [storeKey]);

  const setRowStatus = (pid: string, s: Status) => {
    setStatus((prev) => {
      const next = { ...prev, [pid]: s };
      try {
        window.localStorage.setItem(storeKey, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const inQueue = useMemo(() => rows.filter((r) => r.queue === queue), [rows, queue]);
  const reasonsHere = useMemo(() => [...new Set(inQueue.flatMap((r) => r.reasons))], [inQueue]);
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
    const head = ["patient_id", "name", "sex", "age", "priority", "score", "status", "last_value", "last_test", "due", "days_past_due", "why", "next_step", "who", "contact", "call_status"];
    const esc = (v: string | number) => {
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = filtered.map((r) =>
      [
        r.pid, r.name, r.sex, r.age, TIER_LABEL[r.tier], r.score, r.status,
        r.headline ? `${r.headline.label} ${r.headline.value}` : "", isoOf(r.lastDay), isoOf(r.dueDay), r.daysPastDue,
        r.reasons.join("; "), r.nextStep, r.owner, r.phoneMasked ?? (r.contact === "shared" ? "via agent" : "none"),
        status[r.pid] ?? "To contact",
      ].map(esc).join(","),
    );
    const blob = new Blob([[head.join(","), ...lines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${csvName}-${queue}-${isoOf(asOf)}.csv`;
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
              setReason(e.target.value);
              resetPaging();
            }}
          >
            <option value="all">Any reason</option>
            {reasonsHere.map((r) => (
              <option key={r} value={r}>
                {r}
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
        <span>{headlineLabel}</span>
        <span>When</span>
        <span>Why</span>
        <span>Next step</span>
        <span>Status</span>
      </div>

      <ul className="dx-wl-list">
        {filtered.slice(0, shown).map((r) => {
          const isOpen = open === r.pid;
          const trend = r.headline && r.prev !== null ? r.headline.value - r.prev : null;
          return (
            <li key={r.pid} className={`dx-wl-row ${isOpen ? "is-open" : ""}`}>
              <div className="dx-wl-cells">
                <div className="dx-cell-tier">
                  <span className="dx-tier">
                    <TierIcon tier={r.tier} />
                    {TIER_LABEL[r.tier]}
                  </span>
                  <span className="mono dx-dim" title="Priority score out of 100">
                    {r.score}
                  </span>
                </div>
                <div>
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
                <div>
                  {r.headline ? (
                    <>
                      <span className="dx-a1c">
                        <strong>
                          {fmtVal(r.headline.value)} <span className="dx-dim" style={{ fontWeight: 400 }}>{r.headline.unit}</span>
                        </strong>
                        {trend !== null && Math.abs(trend) >= Math.abs(r.prev ?? 0) * 0.1 && trend !== 0 && (
                          <span className="mono dx-dim">
                            {trend > 0 ? "↑" : "↓"}
                            {fmtVal(Math.abs(trend))}
                          </span>
                        )}
                      </span>
                      <span className="mono dx-dim">
                        {r.headline.label} · {fmtDay(r.headline.day)}
                      </span>
                    </>
                  ) : (
                    <span className="dx-dim">not on file</span>
                  )}
                </div>
                <div>
                  <span className={`dx-state dx-state-${r.careState}`}>{dueText(r)}</span>
                  <span className="mono dx-dim">last test {fmtDay(r.lastDay)}</span>
                </div>
                <div className="dx-cell-why">
                  {r.reasons.slice(0, 2).map((x) => (
                    <span key={x} className="dx-reason">
                      {x}
                    </span>
                  ))}
                  {r.reasons.length > 2 && (
                    <span className="dx-reason dx-dim" title={r.reasons.slice(2).join(", ")}>
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
              {isOpen && <Detail r={r} asOf={asOf} goalLine={goalLine} onStatus={(s) => setRowStatus(r.pid, s)} />}
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

function Detail({
  r,
  asOf,
  goalLine,
  onStatus,
}: {
  r: WorkRow;
  asOf: number;
  goalLine: { value: number; label: string } | null;
  onStatus: (s: Status) => void;
}) {
  const [lang, setLang] = useState<"en" | "bn">("en");
  const [copied, setCopied] = useState(false);
  const text = lang === "en" ? r.msgEn : r.msgBn;

  const series = r.headline ? r.recent.filter((o) => o.label === r.headline!.label) : [];
  const first = Math.min(...r.recent.map((o) => o.day), asOf - 365);
  const vals = series.map((o) => o.value);
  const lo0 = Math.min(...vals, goalLine?.value ?? Infinity);
  const hi0 = Math.max(...vals, goalLine?.value ?? -Infinity);
  const pad = Math.max((hi0 - lo0) * 0.2, hi0 * 0.1, 0.5);
  const lo = Math.max(0, lo0 - pad);
  const hi = hi0 + pad;
  const yTicks = [lo, (lo + hi) / 2, hi].map((v) => ({ value: v, label: fmtVal(v) }));
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

  return (
    <div className="dx-detail">
      <div>
        <h4>{r.headline ? `${r.headline.label} over time` : "Results over time"}</h4>
        {series.length ? (
          <LineChart
            series={[{ name: r.headline!.label, color: "var(--dx-in)", markers: true, points: series.map((o) => ({ x: o.day, y: o.value })) }]}
            xDomain={[first - 10, asOf + 10]}
            yDomain={[lo, hi]}
            xTicks={xTicks}
            yTicks={yTicks}
            xKind="day"
            yKind="num"
            height={190}
            refLines={[...(goalLine ? [{ axis: "y" as const, ...goalLine }] : []), { axis: "x", value: asOf, label: "today" }]}
            ariaLabel={`${r.headline!.label} results for ${r.name}`}
          />
        ) : (
          <p className="dx-dim">No value to chart yet.</p>
        )}
        <h4 style={{ marginTop: 18 }}>How this timeline was linked</h4>
        <p className="dx-detail-p">
          {r.identity.visits} visit{r.identity.visits === 1 ? "" : "s"} under {r.identity.patientKeys} different PATIENT_KEY
          {r.identity.patientKeys === 1 ? "" : "s"}, joined on the mobile number and a fuzzy name match, the same resolver as the
          diabetes list. Current status: {r.status.toLowerCase()}.
        </p>
        <div className="dx-names">
          {r.identity.names.map((n) => (
            <span key={n} className="mono">
              {n}
            </span>
          ))}
        </div>
      </div>

      <div>
        <h4>Recent results</h4>
        <table className="dx-results">
          <tbody>
            {[...r.recent].reverse().slice(0, 9).map((o, i) => (
              <tr key={i}>
                <td className="mono">{fmtDay(o.day)}</td>
                <td>{o.label}</td>
                <td className="mono">
                  <strong>{fmtVal(o.value)}</strong> {o.unit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="dx-msg">
          <div className="dx-msg-head">
            <h4>{r.tier === "critical" && r.msgEn.startsWith("Doctor call") ? "Call script" : "Reminder message"}</h4>
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
