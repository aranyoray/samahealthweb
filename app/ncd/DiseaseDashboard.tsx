// One condition's follow-up dashboard. Same sections and visual language as
// /diabetes; what differs per condition comes from its module (rules,
// bands, labels) and from the copy and extra cards each route passes in.

import type { ReactNode } from "react";
import Link from "next/link";
import { Nav } from "../components/Nav";
import { Footer } from "../components/Footer";
import { RevealOnScroll } from "../components/Reveal";
import { Caption, Card, Columns, Donut, Heatmap, HBars, Legend, SectionHead, StackedColumns, Stat, TableView, WorkflowDiagram } from "../diabetes/charts";
import { LineChart } from "../diabetes/LineChart";
import { FOLLOW_UP, TIER_MIN } from "../diabetes/lib/rules";
import { fmtDay, fmtMonth } from "../diabetes/lib/rng";
import { STYLES } from "../diabetes/styles";
import { NcdWorklist } from "./NcdWorklist";
import { LATENESS_ROWS, WORKLIST_ROWS, type DiseaseModule } from "./lib/engine";
import type { DiseaseDashboard as Dash } from "./lib/pipeline";

export const n = (v: number) => v.toLocaleString("en-IN");

export const NCD_LINKS = [
  { href: "/diabetes", label: "Diabetes" },
  { href: "/kidney", label: "Kidney" },
  { href: "/heart", label: "Cholesterol" },
  { href: "/thyroid", label: "Thyroid" },
  { href: "/liver", label: "Fatty liver" },
  { href: "/ncd", label: "All conditions together" },
] as const;

export function NcdSet({ current }: { current: string }) {
  return (
    <p style={{ marginTop: 14, fontSize: 14, color: "var(--ink-500)", lineHeight: 1.6, maxWidth: 820 }}>
      One of a set of follow-up pages for the lab&apos;s main long-term conditions:{" "}
      {NCD_LINKS.map((l, i) => (
        <span key={l.href}>
          {l.href === current ? (
            <strong style={{ color: "var(--ink)" }}>{l.label}</strong>
          ) : (
            <Link href={l.href} className="dx-a">
              {l.label}
            </Link>
          )}
          {i < NCD_LINKS.length - 1 ? " · " : ""}
        </span>
      ))}
    </p>
  );
}

export type DashboardCopy = {
  title: string;
  intro: ReactNode;
  /** Caption under the sex × age heat map. */
  prevalenceCaption: ReactNode;
  definitions: ReactNode;
  cannotSee: ReactNode;
  headlineLabel: string;
  goalLine: { value: number; label: string } | null;
};

const COLORS = { in: "var(--dx-in)", out: "var(--dx-out)" };

function kmPoints(km: { month: number; s: number; atRisk: number }[]) {
  return km.map((k) => ({ x: k.month, y: k.atRisk >= 20 ? Math.round(k.s * 1000) / 10 : null }));
}

export function DiseaseDashboard({ d, m, copy, extras }: { d: Dash; m: DiseaseModule; copy: DashboardCopy; extras: ReactNode }) {
  const { hero, snapshot: s, longitudinal: L, worklist: w, linking } = d;
  const own12 = L.km.own[12];
  const other12 = L.km.other[12];
  const contact = L.lossSegments[0].rows;
  return (
    <>
      <Nav variant="light" />
      <main id="main" className="dx">
        <header className="container" style={{ paddingTop: 128, paddingBottom: 24 }}>
          <h1 style={{ fontSize: "clamp(34px, 5.2vw, 58px)", maxWidth: 940 }}>{copy.title}</h1>
          <p style={{ marginTop: 22, fontSize: 19, lineHeight: 1.55, color: "var(--ink-500)", maxWidth: 800 }}>{copy.intro}</p>
          <p className="mono" style={{ marginTop: 16, fontSize: 12.5, color: "var(--ink-500)", maxWidth: 800 }}>
            Synthetic cohort shaped like the AKTIV research mirror once result values are synced · {n(d.identity.persons)} people ·{" "}
            {n(d.identity.results)} results · 3.5 years to {fmtDay(d.asOf)} · no real patient data.
          </p>
          <p style={{ marginTop: 14, fontSize: 12.5, lineHeight: 1.5, color: "var(--ink-500)", maxWidth: 800 }}>
            <strong>Demo data notice:</strong> All names, record IDs, dates, phone fragments and clinical values shown on this page
            are fictional and made up for demonstration. The rules and the code are real; the counts are what they produce on
            simulated data.
          </p>
          <NcdSet current={m.route} />

          <div className="dx-hero-stats">
            <Stat value={n(hero.abnormal)} label={`people on the follow-up pathway`} note={`of ${n(hero.tested)} tested`} />
            <Stat value={`${hero.lostPct}%`} label="of them lost to follow-up now" note={`${n(hero.lostNow)} people, 180+ days past due`} />
            <Stat value={n(hero.recoverable)} label="overdue, still reachable" note="0 to 180 days past due" />
            <Stat value={n(hero.urgent)} label="critical + high this week" note="the top of the call list" />
          </div>

          <nav className="dx-toc" aria-label="On this page">
            {[
              ["#snapshot", "Snapshot"],
              ["#over-time", "Over time"],
              ["#who", "Who gets lost"],
              ["#call-list", "Call list"],
              ["#rules", "Rules"],
              ["#method", "Method"],
            ].map(([href, label]) => (
              <a key={href} href={href}>
                {label}
              </a>
            ))}
          </nav>
        </header>

        {/* ---------------- Snapshot ---------------- */}
        <section className="section dx-band" style={{ paddingTop: 88, paddingBottom: 88 }}>
          <div className="container">
            <SectionHead
              id="snapshot"
              title="Where the cohort stands today"
              blurb={`Everyone with at least one ${m.monitorTests.length > 1 ? "of the relevant tests" : "relevant test"}, using each person's latest results after visits were linked into one timeline.`}
              meta={[`${n(linking.bills)} bills`, `${n(linking.patientKeys)} PATIENT_KEYs`, `${n(linking.persons)} people after linking`, `as of ${fmtDay(d.asOf)}`]}
            />
            <div className="dx-grid">
              <Card title="Who was tested" subtitle="sex as recorded; age at latest visit">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <Stat value={n(s.total)} label="people" />
                  <Stat value={`${Math.round((s.female / (s.female + s.male)) * 100)} : ${Math.round((s.male / (s.female + s.male)) * 100)}`} label="female : male" />
                </div>
                <div style={{ marginTop: 18 }}>
                  <Columns unit="" height={120} bars={s.ageBuckets.map((b) => ({ label: b.label, value: b.v, color: COLORS.in }))} />
                </div>
              </Card>

              <Card title={`Latest ${copy.headlineLabel}`} subtitle={`${n(s.bandCounts.reduce((a, b) => a + b, 0))} people`}>
                <Donut centre="people" segments={m.bands.map((b, i) => ({ label: b.label, v: s.bandCounts[i], color: b.color }))} />
              </Card>

              <Card title="On the pathway, by sex and age" subtitle={`% of people tested with ${m.abnormalLabel.toLowerCase()}`}>
                <Heatmap rows={["Female", "Male"]} cols={["18–29", "30–39", "40–49", "50–59", "60–69", "70+"]} values={s.prevalence} colLabel="age" />
                <Caption>{copy.prevalenceCaption}</Caption>
              </Card>

              <Card title="Where people on the pathway sit now" subtitle={`n = ${n(hero.abnormal)}; ${s.withDmPct}% also have a diabetic-range result`}>
                <HBars rows={s.statuses.map((x) => ({ label: x.label, value: x.pct, note: n(x.n) }))} />
              </Card>

              {extras}
            </div>
          </div>
        </section>

        {/* ---------------- Over time ---------------- */}
        <section className="section" style={{ paddingTop: 96, paddingBottom: 96 }}>
          <div className="container">
            <SectionHead
              id="over-time"
              title="Following the same people over time"
              blurb={
                <>
                  Only possible once visits are linked. The clock starts at each person&apos;s first result that put them on the
                  pathway. Someone is <strong>lost to follow-up</strong> once they are more than {FOLLOW_UP.lostAfterDays} days past
                  their due date with no follow-up test here.
                </>
              }
              meta={[`${n(hero.abnormal)} people on the pathway`, "3.5 years of bills"]}
            />
            <div className="dx-grid">
              <Card
                span={12}
                title="The follow-up cascade"
                subtitle={`people who joined the pathway at least 12 months ago, n = ${n(L.eligible)}; each step counts people who also passed every step above`}
              >
                <HBars rows={L.cascade.map((c) => ({ label: c.label, value: c.pct, note: n(c.n) }))} />
                <TableView head={["Step", "People", "% of start"]} rows={L.cascade.map((c) => [c.label, c.n, `${c.pct}%`])} />
              </Card>

              <Card title="Still in care, months after the first abnormal result" subtitle={`Kaplan-Meier, censored at ${fmtDay(d.asOf)}`}>
                <LineChart
                  step
                  ariaLabel="Share of people still in follow-up by months since first abnormal result, own mobile versus no own number"
                  xKind="since"
                  yKind="pct"
                  xDomain={[0, 30]}
                  yDomain={[0, 100]}
                  xTicks={[0, 6, 12, 18, 24, 30].map((mo) => ({ value: mo, label: `${mo} mo` }))}
                  yTicks={[0, 25, 50, 75, 100].map((v) => ({ value: v, label: `${v}%` }))}
                  series={[
                    { name: "Own mobile", color: COLORS.in, endLabel: true, points: kmPoints(L.km.own) },
                    { name: "No own number", color: COLORS.out, endLabel: true, points: kmPoints(L.km.other) },
                  ]}
                />
                <Legend
                  shape="line"
                  items={[
                    { label: `Own mobile on file (n = ${n(L.km.nOwn)})`, color: COLORS.in },
                    { label: `Agent's number or none (n = ${n(L.km.nOther)})`, color: COLORS.out },
                  ]}
                />
                <Caption>
                  At 12 months {Math.round(own12.s * 100)}% of people with their own number are still in care, against{" "}
                  {Math.round(other12.s * 100)}% without one
                  {other12.atRisk < 20 ? ` (only ${other12.atRisk} still at risk in that group by then, so the line stops early)` : ""}.
                </Caption>
                <TableView
                  head={["Month", "Own mobile: in care", "at risk", "No own number: in care", "at risk"]}
                  rows={[0, 6, 9, 12, 18, 24].map((mo) => [mo, `${Math.round(L.km.own[mo].s * 100)}%`, L.km.own[mo].atRisk, `${Math.round(L.km.other[mo].s * 100)}%`, L.km.other[mo].atRisk])}
                />
              </Card>

              <Card title={`Gap between consecutive ${copy.headlineLabel} tests`} subtitle={`${n(L.gaps)} repeat tests in people on the pathway`}>
                <Columns height={170} bars={L.retestGaps.map((g, i) => ({ label: g.label, value: Math.round(g.pct), color: i < 2 ? COLORS.in : COLORS.out, note: `${n(g.n)} tests` }))} />
                <Legend
                  items={[
                    { label: "Within 6 months", color: COLORS.in },
                    { label: "Longer", color: COLORS.out },
                  ]}
                />
                <Caption>
                  {Math.round(L.retestGaps.slice(2).reduce((a, g) => a + g.pct, 0))}% of repeat tests arrive more than 6 months after
                  the previous one, even among people who do come back.
                </Caption>
              </Card>

              <Card span={12} title="Month-end status of everyone on the pathway so far" subtitle="last 24 months">
                <StackedColumns
                  keys={[
                    { label: "On track or due soon", color: "var(--dx-ok)" },
                    { label: "Overdue, still reachable (0 to 180 days)", color: "var(--dx-medium)" },
                    { label: "Lost (over 180 days past due)", color: "var(--dx-critical)" },
                  ]}
                  columns={L.flow.map((f) => ({ label: fmtMonth(f.day), values: [f.onTrack, f.overdue, f.lost] }))}
                />
                <Legend
                  items={[
                    { label: "On track or due soon", color: "var(--dx-ok)" },
                    { label: "Overdue, still reachable (0 to 180 days)", color: "var(--dx-medium)" },
                    { label: "Lost (over 180 days past due)", color: "var(--dx-critical)" },
                  ]}
                />
                <Caption>
                  The lost pool grows from {n(L.flow[0].lost)} to {n(L.flow[L.flow.length - 1].lost)}. The overdue-but-reachable band
                  averages {n(Math.round(L.flow.slice(-6).reduce((a, f) => a + f.overdue, 0) / 6))} over the last six months: that
                  middle band is where a call list pays off.
                </Caption>
                <TableView head={["Month end", "On track", "Overdue", "Lost"]} rows={L.flow.map((f) => [fmtDay(f.day), f.onTrack, f.overdue, f.lost])} />
              </Card>
            </div>
          </div>
        </section>

        {/* ---------------- Who gets lost ---------------- */}
        <section className="section dx-band" style={{ paddingTop: 96, paddingBottom: 88 }}>
          <div className="container">
            <SectionHead
              id="who"
              title="Who gets lost"
              blurb={
                <>
                  Share of people lost within 12 months of joining the pathway, among those who joined at least a year ago.
                  Overall: <strong>{hero.overallLoss12}%</strong>.
                </>
              }
            />
            <div className="dx-grid">
              {L.lossSegments.map((g) => (
                <Card key={g.group} title={g.group} subtitle="% lost within 12 months">
                  <HBars max={100} color={COLORS.out} rows={g.rows.map((r) => ({ label: r.label, value: Math.round(r.pct), note: `n = ${n(r.n)}` }))} />
                </Card>
              ))}
            </div>
            <div className="dx-callout">
              The same lever as on the diabetes page: people without their own mobile on file are lost at {Math.round(contact[1].pct)}%
              and {Math.round(contact[2].pct)}%, against {Math.round(contact[0].pct)}% for people with one. Recording the
              patient&apos;s own number at every registration costs nothing.
            </div>
          </div>
        </section>

        {/* ---------------- Call list ---------------- */}
        <section className="section" style={{ paddingTop: 96, paddingBottom: 96 }}>
          <div className="container">
            <SectionHead
              id="call-list"
              title="This week's call list"
              blurb="The rules below run on the linked timelines. People who can still be kept are ranked by how sick and how late they are; people already lost go to a slower re-engagement queue. Each row carries the next step, who should act and a ready reminder in English or Bengali. Open a name to see the timeline."
              meta={[`${n(w.keepTotal)} to keep in care`, `${n(w.reengageTotal)} to re-engage`, `top ${WORKLIST_ROWS.keep} + ${WORKLIST_ROWS.reengage} loaded here`]}
            />
            <div className="dx-owners">
              <span className="dx-owners-label">Keep-in-care queue by who acts</span>
              {w.ownerTotals.map((o) => (
                <div key={o.owner}>
                  <strong>{n(o.n)}</strong>
                  <span>{o.owner}</span>
                </div>
              ))}
            </div>
            <NcdWorklist
              rows={w.rows}
              asOf={d.asOf}
              storeKey={`ncd-${m.key}-call-status-v1`}
              csvName={`${m.key}-call-list`}
              headlineLabel={`Last ${copy.headlineLabel}`}
              goalLine={copy.goalLine}
              totals={{ keep: w.keepTotal, reengage: w.reengageTotal, tiers: w.tierTotals }}
            />
          </div>
        </section>

        {/* ---------------- Rules ---------------- */}
        <section className="section dx-band" style={{ paddingTop: 96, paddingBottom: 88 }}>
          <div className="container">
            <SectionHead
              id="rules"
              title="The rules behind the list"
              blurb="Intervals come from the guideline named on each row. The weights are ours, written down so doctors can argue with them and change them in one place. Lateness and tiers are the same as the diabetes list, so the lists can be merged into one call per person."
            />
            <div className="dx-grid">
              <Card title="What is due, and when">
                <table className="dx-table">
                  <thead>
                    <tr>
                      <th>Trigger</th>
                      <th>Next step</th>
                      <th>Basis</th>
                    </tr>
                  </thead>
                  <tbody>
                    {m.ruleTable.map((r) => (
                      <tr key={r.trigger}>
                        <td>{r.trigger}</td>
                        <td>{r.due}</td>
                        <td className="dx-dim">{r.why}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
              <Card title="How the priority score is built" subtitle="0 to 100">
                <table className="dx-table">
                  <thead>
                    <tr>
                      <th>Factor</th>
                      <th>Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...m.scoreTable, ...LATENESS_ROWS].map((r) => (
                      <tr key={r.factor}>
                        <td>{r.factor}</td>
                        <td className="mono">{r.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Caption>
                  Critical {TIER_MIN.critical}+ (or a result that forces it), High {TIER_MIN.high} to {TIER_MIN.critical - 1}, Medium{" "}
                  {TIER_MIN.medium} to {TIER_MIN.high - 1}, Routine below {TIER_MIN.medium}.
                </Caption>
              </Card>
              <Card span={12} title="Where it sits in the clinic's day" subtitle="no new app for patients, no new data entry for staff">
                <WorkflowDiagram />
              </Card>
            </div>
          </div>
        </section>

        {/* ---------------- Method ---------------- */}
        <section className="section" style={{ paddingTop: 96, paddingBottom: 120 }}>
          <div className="container" style={{ maxWidth: 880 }}>
            <h2 id="method">How the numbers were made</h2>
            <div className="dx-prose">
              <p>
                <strong>Data.</strong> Everything on this page is computed at build time from a synthetic cohort generated to look
                like the AKTIV to Neon mirror once lab result values are synced: one row per reported parameter, bills with a
                monthly PATIENT_KEY, names and phone numbers as a busy front desk types them. Each simulated person carries hidden
                states for diabetes, kidney disease, cholesterol, thyroid and fatty liver; values move toward target while they keep
                coming and back while they are away. No real patient appears here, and the counts on this page must not be quoted
                as results from the lab.
              </p>
              <p>
                <strong>Linking.</strong> The same resolver as the <Link href="/diabetes#linking" className="dx-a">diabetes page</Link>:
                mobile number first, then a Bengali-aware fuzzy name match with sex and birth year. On this larger, all-tests cohort
                it keeps {(d.identity.precision * 100).toFixed(1)}% of joins correct and recovers {(d.identity.recall * 100).toFixed(1)}%
                of true repeat visits, scored against the generator&apos;s hidden person id.
              </p>
              <p>
                <strong>Definitions.</strong> {copy.definitions}
              </p>
              <p>
                <strong>What this cannot see.</strong> A lab only sees tests done at the lab. Someone &ldquo;lost&rdquo; here may be
                testing elsewhere, have moved or have died, which is why the re-engagement queue asks first where they test now.
                Prescriptions, symptoms and clinic visits are not in the mirror. {copy.cannotSee} Scoring weights are a starting point
                for the clinical team, not a validated model.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <RevealOnScroll />
      <style>{STYLES}</style>
    </>
  );
}
