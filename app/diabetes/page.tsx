import type { Metadata } from "next";
import { Nav } from "../components/Nav";
import { Footer } from "../components/Footer";
import { RevealOnScroll } from "../components/Reveal";
import {
  Caption,
  Card,
  Columns,
  Donut,
  Heatmap,
  HBars,
  Legend,
  SectionHead,
  StackedColumns,
  Stat,
  TableView,
  WorkflowDiagram,
} from "./charts";
import { LineChart } from "./LineChart";
import { Worklist } from "./Worklist";
import { A1C_BANDS, WORKLIST_ROWS } from "./lib/analytics";
import { IDENTITY_CONFIG } from "./lib/identity";
import { getDashboard } from "./lib/pipeline";
import { fmtDay, fmtMonth } from "./lib/rng";
import { FOLLOW_UP, RULE_TABLE, SCORE_TABLE, TIER_MIN } from "./lib/rules";

export const metadata: Metadata = {
  title: "Diabetes follow-up: who to call before they are lost · SamaHealth",
  description:
    "Longitudinal diabetes analytics on the Anubhav Life Care lab cohort: every sugar test linked into one timeline per person, follow-up rules from ADA and RSSDI guidance, and a ranked call list for the care team.",
  alternates: { canonical: "/diabetes" },
  openGraph: {
    title: "Diabetes follow-up: who to call before they are lost",
    description:
      "Lab visits stitched into one timeline per person, checked against follow-up guidelines, turned into a ranked call list.",
    url: "/diabetes",
    siteName: "SamaHealth",
    type: "website",
    images: [{ url: "/events/anubhav-cmc-001.jpg", width: 1200, height: 630, alt: "SamaHealth community screening" }],
  },
};

const n = (v: number) => v.toLocaleString("en-IN");

const COLORS = {
  in: "var(--dx-in)",
  out: "var(--dx-out)",
  bands: ["var(--dx-b0)", "var(--dx-b1)", "var(--dx-b2)", "var(--dx-b3)"],
};

const LINK_LABEL: Record<string, string> = {
  phone: "Mobile + name",
  "phone-typo": "Mobile (one-digit typo) + name",
  "name-bridge": "Name, sex, age",
  "name-only": "Name, sex, age",
  single: "Not linked",
};
const PHONE_LABEL: Record<string, string> = {
  valid: "patient's own",
  shared: "agent / centre number",
  junk: "junk",
  missing: "blank",
};

export default function DiabetesPage() {
  const d = getDashboard();
  const { identity: id, hero, snapshot: s, longitudinal: L, worklist: w } = d;
  const ours = id.scores[id.scores.length - 1];

  return (
    <>
      <Nav variant="light" />
      <main id="main" className="dx">
        <Hero d={d} />

        {/* ---------------- 1. Linking visits ---------------- */}
        <section className="section dx-band" style={{ paddingTop: 88, paddingBottom: 88 }}>
          <div className="container">
            <SectionHead
              id="linking"
              title="One person, many PATIENT_KEYs"
              blurb={
                <>
                  AKTIV issues a fresh PATIENT_KEY every month, so a patient tested in January, April and August looks
                  like three strangers. Before any follow-up can be tracked, visits have to be joined back into one
                  person. The mobile number does most of the work; names settle the rest.
                </>
              }
              meta={[`${n(id.bills)} bills`, `${n(id.patientKeys)} PATIENT_KEYs`, `${n(id.persons)} people after linking`]}
            />

            <div className="dx-funnel">
              <Stat value={n(id.bills)} label="bills with a sugar test" />
              <span aria-hidden className="dx-arrow">→</span>
              <Stat value={n(id.patientKeys)} label="PATIENT_KEYs" note="almost one per bill" />
              <span aria-hidden className="dx-arrow">→</span>
              <Stat value={n(id.persons)} label="people" note={`${n(id.multiVisit)} with 2+ visits, ${id.keysPerMultiVisit} keys each on average`} />
            </div>

            <div className="dx-grid">
              {id.example && (
                <Card
                  span={12}
                  title={`Worked example: ${id.example.name}`}
                  subtitle={`${id.example.rows.length} visits · ${new Set(id.example.rows.map((r) => r.patientKey)).size} PATIENT_KEYs · ${new Set(id.example.rows.map((r) => r.name)).size} spellings · one person`}
                >
                  <div style={{ overflowX: "auto" }}>
                    <table className="dx-table">
                      <thead>
                        <tr>
                          <th>Visit</th>
                          <th>PATIENT_KEY</th>
                          <th>Name as typed</th>
                          <th>Phone as typed</th>
                          <th>Joined by</th>
                        </tr>
                      </thead>
                      <tbody>
                        {id.example.rows.map((r) => (
                          <tr key={r.patientKey + r.date}>
                            <td className="mono">{r.date}</td>
                            <td className="mono">{r.patientKey}</td>
                            <td className="mono">{r.name}</td>
                            <td className="mono">
                              {r.phone} <span className="dx-dim">({PHONE_LABEL[r.phoneStatus]})</span>
                            </td>
                            <td>
                              <span className={`dx-link dx-link-${r.link}`}>{LINK_LABEL[r.link]}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Caption>
                    Visits where the phone field held an agent’s or centre’s number, junk, or nothing at all
                    could not be joined on phone. They were attached because exactly one phone-linked person had a matching name,
                    the same sex and a birth year within {IDENTITY_CONFIG.birthYearTolName} years.
                  </Caption>
                </Card>
              )}

              <Card title="The rules, in order" subtitle="as practised at the front desk, now automated">
                <ol className="dx-steps">
                  <li>
                    <strong>Clean the number.</strong> Strip +91 and leading zeros. Blank, too short, or junk such as
                    9999999999 and 1234567890 counts as no number.
                  </li>
                  <li>
                    <strong>Spot shared numbers.</strong> A number carrying more than {id.threshold} different people
                    is a collection agent’s, camp desk’s or partner centre’s own phone, not the
                    patient’s. Found {id.sharedNumbers.length}, each with {Math.min(...id.sharedNumbers.map((x) => x.people))} to{" "}
                    {Math.max(...id.sharedNumbers.map((x) => x.people))} people.
                  </li>
                  <li>
                    <strong>Same number, then fuzzy name.</strong> On one number, visits join when the names sound
                    alike (Mousumi / Moushumi, Mondal / Mandal, Md / Mohammad), sex agrees and birth years are within{" "}
                    {IDENTITY_CONFIG.birthYearTolPhone}.
                    A different name on the same number is a family member. A one-digit phone typo with the same name
                    also joins.
                  </li>
                  <li>
                    <strong>No usable number: go by name.</strong> Attach to a phone-linked person only if exactly one
                    matches on name, sex and age; otherwise link on name alone, and never on a first name alone.
                  </li>
                </ol>
              </Card>

              <Card title="What is in the phone field" subtitle={`${n(id.bills)} bills`}>
                <HBars
                  rows={[
                    { label: "Patient's own mobile", value: pctOf(id.status.valid, id.bills), note: `${n(id.status.valid)} bills` },
                    { label: "Agent, camp or centre number", value: pctOf(id.status.shared, id.bills), note: `${n(id.status.shared)}` },
                    { label: "Blank", value: pctOf(id.status.missing, id.bills), note: `${n(id.status.missing)}` },
                    { label: "Junk (9999999999, 12345, NA)", value: pctOf(id.status.junk, id.bills), note: `${n(id.status.junk)}` },
                  ]}
                />
                <Caption>
                  The {id.sharedNumbers.length} shared numbers matched the collection roster:{" "}
                  {summariseShared(id.sharedNumbers.map((x) => x.label))}. They are useless for linking, but useful for
                  reaching people: the agent who typed their own number knows the patient.
                </Caption>
              </Card>

              {id.familyExample && (
                <Card title="One number, three people" subtitle={`household mobile ${id.familyExample.phone}`}>
                  <ul className="dx-family">
                    {id.familyExample.people.map((p) => (
                      <li key={p.name}>
                        <strong>{p.name}</strong>
                        <span className="mono dx-dim">
                          {p.sex} · {p.age}y · {p.visits} visits
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Caption>
                    {n(id.linkStats.familyNumbers)} numbers are shared by a household. Treating the number as the
                    patient would give these three people one blended HbA1c history.
                  </Caption>
                </Card>
              )}

              <Card title="How people were linked" subtitle={`${n(id.persons)} people`}>
                <HBars
                  unit=""
                  max={id.persons}
                  rows={[
                    { label: "Linked on mobile + name", value: id.linkStats.phonePersons },
                    { label: "Linked on name, sex, age only", value: id.linkStats.nameOnlyPersons },
                    { label: "Single visit, no usable number", value: id.linkStats.singletons },
                  ]}
                />
                <Caption>
                  {n(id.linkStats.bridgedBills)} visits with no usable number were attached to a phone-linked person by
                  name. Single-visit records stay separate until a later visit gives them a number.
                </Caption>
              </Card>
              <Card title="Is the linking right?" subtitle="scored against the generator's hidden person id">
                <div style={{ overflowX: "auto" }}>
                  <table className="dx-table dx-table-num">
                    <thead>
                      <tr>
                        <th>Join visits on</th>
                        <th>People</th>
                        <th title="Of visit pairs joined, share that really are one person">Precision</th>
                        <th title="Of visit pairs that are one person, share joined">Recall</th>
                        <th title="People with 2+ visits whose whole timeline came out exactly right">Timelines exact</th>
                      </tr>
                    </thead>
                    <tbody>
                      {id.scores.map((sc) => (
                        <tr key={sc.method} className={sc === ours ? "is-ours" : ""}>
                          <td>{sc.method}</td>
                          <td className="mono">{n(sc.clusters)}</td>
                          <td className="mono">{pct1(sc.precision)}</td>
                          <td className="mono">{pct1(sc.recall)}</td>
                          <td className="mono">{pct1(sc.exact)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Caption>
                  PATIENT_KEY almost never joins two visits. Phone alone merges everyone a camp desk registered into one
                  “patient”. Phone then fuzzy name keeps {pct1(ours.precision)} of joins correct while
                  recovering {pct1(ours.recall)} of true repeat visits. The misses are mostly namesakes with no number,
                  which the resolver refuses to guess.
                </Caption>
              </Card>

              <Card title="Plausibility check" subtitle="HbA1c jumps that biology does not allow">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <Stat value={n(id.plausibility.flagged)} label="timelines flagged for a human to check" />
                  <Stat
                    value={`${Math.round((id.plausibility.trulyMerged / Math.max(1, id.plausibility.flagged)) * 100)}%`}
                    label="of flagged were really two people"
                  />
                </div>
                <Caption>
                  HbA1c reflects three months of sugar, so it cannot swing 2.5 points in a few weeks or go from normal
                  to 8+ without a middle step. When a linked timeline does that, the link is the likely culprit, usually
                  two namesakes with no number. The call list marks these rows so the coordinator confirms identity
                  on the call.
                </Caption>
              </Card>
            </div>
          </div>
        </section>

        {/* ---------------- 2. Snapshot ---------------- */}
        <section className="section" style={{ paddingTop: 96, paddingBottom: 88 }}>
          <div className="container">
            <SectionHead
              id="snapshot"
              title="Where the cohort stands today"
              blurb="Everyone with at least one sugar test (HbA1c, fasting, post-meal or random glucose), using each person's latest results after linking."
              meta={[`${n(s.total)} people`, `as of ${fmtDay(d.asOf)}`]}
            />
            <div className="dx-grid">
              <Card title="Who is in the cohort" subtitle="sex as recorded; age at latest visit">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <Stat value={n(s.total)} label="people" />
                  <Stat value={`${Math.round((s.female / (s.female + s.male)) * 100)} : ${Math.round((s.male / (s.female + s.male)) * 100)}`} label="female : male" />
                </div>
                <div style={{ marginTop: 18 }}>
                  <Columns
                    unit=""
                    height={120}
                    bars={s.ageBuckets.map((b) => ({ label: b.label, value: b.v, color: COLORS.in }))}
                  />
                </div>
              </Card>

              <Card title="Latest HbA1c" subtitle={`${n(s.bandCounts.reduce((a, b) => a + b, 0))} people with an HbA1c on file`}>
                <Donut
                  centre="people"
                  segments={A1C_BANDS.map((label, i) => ({
                    label: ["Normal", "Prediabetes", "Diabetes", "Diabetes, high"][i] + ` (${label})`,
                    v: s.bandCounts[i],
                    color: COLORS.bands[i],
                  }))}
                />
              </Card>

              <Card title="Diabetic-range result, by sex and age" subtitle="% of people with any HbA1c ≥ 6.5, FBS ≥ 126 or PP/random ≥ 200">
                <Heatmap rows={["Female", "Male"]} cols={s.ageLabels} values={s.prevalence} colLabel="age" />
                <Caption>
                  This is a lab cohort, not a population survey: people come here because a doctor suspected diabetes,
                  so prevalence runs far above community figures. The age gradient is the useful part: by the fifties,
                  more than half of those tested are in the diabetic range.
                </Caption>
              </Card>

              <Card title="Control among people with diabetes" subtitle={`latest HbA1c, n = ${n(s.dmWithA1c)}`}>
                <HBars
                  rows={s.control.map((c, i) => ({
                    label: c.label,
                    value: c.pct,
                    note: n(c.n),
                    color: i === 0 ? COLORS.in : `rgba(185, 28, 28, ${0.35 + i * 0.16})`,
                  }))}
                  max={40}
                />
              </Card>

              <Card title="Complications already showing" subtitle="people with diabetes, latest result where tested">
                <HBars rows={s.comorbidity.map((c) => ({ label: c.label, value: c.pct, note: `${n(c.n)} / ${n(c.denom)}` }))} color={COLORS.out} />
                <Caption>Denominators differ because not everyone was tested, which is its own finding: see the next chart.</Caption>
              </Card>

              <Card title="Yearly checks actually done" subtitle={`people with diabetes seen in the last 12 months, n = ${n(L.activeN)}`}>
                <HBars rows={L.screening.map((c) => ({ label: c.label, value: c.pct, note: `${n(c.n)}` }))} />
                <Caption>
                  Guidelines ask for all four every year. Even among people who are still coming in, urine ACR, the
                  earliest kidney warning, is done for about one in four.
                </Caption>
              </Card>
            </div>
          </div>
        </section>

        {/* ---------------- 3. Over time ---------------- */}
        <section className="section dx-band" style={{ paddingTop: 96, paddingBottom: 96 }}>
          <div className="container">
            <SectionHead
              id="over-time"
              title="Following the same people over time"
              blurb={
                <>
                  Only possible once visits are linked. Clock starts at each person’s first diabetic-range result.
                  Someone is <strong>lost to follow-up</strong> once they are more than {FOLLOW_UP.lostAfterDays} days
                  past their due date with no sugar test here.
                </>
              }
              meta={[`${n(hero.diabetes)} people with a diabetic-range result`, "36 months of bills"]}
            />
            <div className="dx-grid">
              <Card span={12} title="The follow-up cascade" subtitle={`people whose first diabetic-range result was at least 12 months ago, n = ${n(L.eligible)}; each step counts people who also passed every step above`}>
                <HBars rows={L.cascade.map((c) => ({ label: c.label, value: c.pct, note: n(c.n) }))} />
                <TableView head={["Step", "People", "% of start"]} rows={L.cascade.map((c) => [c.label, c.n, `${c.pct}%`])} />
              </Card>

              <Card title="Still in care, months after diagnosis" subtitle={`Kaplan-Meier, censored at ${fmtDay(d.asOf)}`}>
                <LineChart
                  step
                  ariaLabel="Share of people still in follow-up by months since first diabetic result, own mobile versus no own number"
                  xKind="month"
                  yKind="pct"
                  xDomain={[0, 30]}
                  yDomain={[0, 100]}
                  xTicks={[0, 6, 12, 18, 24, 30].map((m) => ({ value: m, label: `${m} mo` }))}
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
                  Nobody can count as lost before month 9: a 3-month recall plus the 6-month grace. After that the two
                  groups split fast. At 12 months {Math.round(L.km.own[12].s * 100)}% of people with their own number
                  are still in care, against {Math.round(L.km.other[12].s * 100)}% without one.
                </Caption>
                <TableView
                  head={["Month", "Own mobile: in care", "at risk", "No own number: in care", "at risk"]}
                  rows={[0, 6, 9, 12, 18, 24].map((m) => [m, `${Math.round(L.km.own[m].s * 100)}%`, L.km.own[m].atRisk, `${Math.round(L.km.other[m].s * 100)}%`, L.km.other[m].atRisk])}
                />
              </Card>

              <Card title="Gap between consecutive HbA1c tests" subtitle={`${n(L.gaps)} repeat tests in people with diabetes`}>
                <Columns
                  height={170}
                  bars={L.retestGaps.map((g, i) => ({ label: g.label, value: Math.round(g.pct), color: i < 2 ? COLORS.in : COLORS.out, note: `${n(g.n)} tests` }))}
                />
                <Legend
                  items={[
                    { label: "On schedule (every 3 to 6 months)", color: COLORS.in },
                    { label: "Late", color: COLORS.out },
                  ]}
                />
                <Caption>
                  Even among people who do come back, {Math.round(L.retestGaps.slice(2).reduce((a, g) => a + g.pct, 0))}% of
                  repeat HbA1c tests arrive more than 6 months after the last one.
                </Caption>
              </Card>

              <Card title="HbA1c after a lapse" subtitle="median HbA1c by months since first diabetic result">
                <LineChart
                  ariaLabel="Median HbA1c by quarter since diagnosis, for people who stayed in care versus people who came back after a lapse"
                  xKind="quarter"
                  yKind="a1c"
                  xDomain={[0, 11]}
                  yDomain={[6.5, 9]}
                  xTicks={[0, 2, 4, 6, 8, 10].map((q) => ({ value: q, label: `${q * 3} mo` }))}
                  yTicks={[7, 8, 9].map((v) => ({ value: v, label: `${v}%` }))}
                  refLines={[{ axis: "y", value: 7, label: "goal 7%" }]}
                  series={[
                    { name: "Stayed in care", color: COLORS.in, markers: true, endLabel: true, points: L.trajectory.stayed.map((p) => ({ x: p.q, y: p.median })) },
                    { name: "Came back", color: COLORS.out, markers: true, endLabel: true, points: L.trajectory.returned.map((p) => ({ x: p.q, y: p.median })) },
                  ]}
                />
                <Legend
                  shape="line"
                  items={[
                    { label: "Never lapsed", color: COLORS.in },
                    { label: "Lapsed, then came back (results after return)", color: COLORS.out },
                  ]}
                />
                <TableView
                  head={["Months since diagnosis", "Stayed: median", "n", "Came back: median", "n"]}
                  rows={L.trajectory.stayed.map((p, i) => [`${p.q * 3} to ${p.q * 3 + 3}`, p.median ?? "–", p.n, L.trajectory.returned[i].median ?? "–", L.trajectory.returned[i].n])}
                />
              </Card>

              <Card title="People who came back after a lapse" subtitle={`n = ${n(L.lapseReturn.n)} with an HbA1c before and on return`}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <Stat value={`${L.lapseReturn.before.toFixed(1)}%`} label="median HbA1c before" />
                  <Stat value={`${L.lapseReturn.after.toFixed(1)}%`} label="median HbA1c on return" />
                  <Stat value={`${Math.round(L.lapseReturn.gapMonths)} mo`} label="median time away" />
                  <Stat value={`${Math.round(L.lapseReturn.worse)}%`} label="came back 0.5+ points worse" />
                </div>
                <Caption>
                  The people the lab eventually sees again return worse off. Every month shaved off the gap is a month
                  less of uncontrolled sugar.
                </Caption>
              </Card>

              <Card title="First HbA1c band to latest" subtitle={`people with 2+ HbA1c at least 6 months apart, n = ${n(L.transitionN)}; row %`}>
                <Heatmap
                  rows={[...A1C_BANDS]}
                  cols={[...A1C_BANDS]}
                  values={L.transitionPct}
                  rowLabel="first HbA1c (%)"
                  colLabel="latest HbA1c (%)"
                  hue="13, 148, 136"
                />
                <Caption>
                  Most people stay in their band. The odd corner, a normal first HbA1c and a latest of 8 or more, is
                  almost always a linking error rather than biology; see the plausibility check above.
                </Caption>
              </Card>

              <Card title="Prediabetes: rechecked, and progressing" subtitle={`first result in the prediabetes range at least 15 months ago, n = ${n(L.prediabetes.n)}`}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <Stat value={`${Math.round((L.prediabetes.rechecked / L.prediabetes.n) * 100)}%`} label="rechecked within 15 months" note={`${n(L.prediabetes.rechecked)} people`} />
                  <Stat value={`${Math.round(L.prediabetes.progressedOfRechecked)}%`} label="of those rechecked, now diabetic range" />
                </div>
                <Caption>
                  Prediabetes is where diabetes is cheapest to prevent, and most people with it never get the yearly
                  recheck. They sit in the Routine tier of the call list, batched for a monthly SMS.
                </Caption>
              </Card>

              <Card span={12} title="Month-end status of everyone diagnosed so far" subtitle="people with a diabetic-range result, last 24 months">
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
                  The lost pool grows every month ({n(L.flow[0].lost)} → {n(L.flow[L.flow.length - 1].lost)}), while the
                  overdue-but-reachable band stays around {n(Math.round(L.flow.slice(-6).reduce((a, f) => a + f.overdue, 0) / 6))}.
                  That middle band is where a call list pays off.
                </Caption>
                <TableView
                  head={["Month end", "On track", "Overdue", "Lost"]}
                  rows={L.flow.map((f) => [fmtDay(f.day), f.onTrack, f.overdue, f.lost])}
                />
              </Card>
            </div>
          </div>
        </section>

        {/* ---------------- 4. Who gets lost ---------------- */}
        <section className="section" style={{ paddingTop: 96, paddingBottom: 88 }}>
          <div className="container">
            <SectionHead
              id="who"
              title="Who gets lost"
              blurb={
                <>
                  Share of people lost within 12 months of their first diabetic-range result, among those diagnosed at
                  least a year ago. Overall: <strong>{hero.overallLoss12}%</strong>.
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
              <strong>The cheapest fix on this page:</strong> record the patient’s own mobile at every registration,
              including home collections and camps. People without one are lost at{" "}
              {Math.round(L.lossSegments[0].rows[1].pct)}% and {Math.round(L.lossSegments[0].rows[2].pct)}%, against{" "}
              {Math.round(L.lossSegments[0].rows[0].pct)}% for people with their own number. Until then, the call list
              routes them through the agent or referring doctor who can still reach them.
            </div>
          </div>
        </section>

        {/* ---------------- 5. Call list ---------------- */}
        <section className="section dx-band" style={{ paddingTop: 96, paddingBottom: 96 }}>
          <div className="container">
            <SectionHead
              id="call-list"
              title="This week's call list"
              blurb={
                <>
                  The rules below run every night on the linked timelines. The result is two queues: people who can
                  still be kept, ranked by how sick and how late they are, and people already lost, for a slower
                  re-engagement round. Each row carries the next step, who should act, and a ready-to-send reminder in
                  English or Bengali. Open a name to see the timeline.
                </>
              }
              meta={[
                `${n(w.keepTotal)} to keep in care`,
                `${n(w.reengageTotal)} to re-engage`,
                `top ${WORKLIST_ROWS.keep} + ${WORKLIST_ROWS.reengage} loaded here`,
              ]}
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
            <Worklist
              rows={w.rows}
              asOf={d.asOf}
              totals={{ keep: w.keepTotal, reengage: w.reengageTotal, tiers: w.tierTotals }}
            />
          </div>
        </section>

        {/* ---------------- 6. Rules ---------------- */}
        <section className="section" style={{ paddingTop: 96, paddingBottom: 88 }}>
          <div className="container">
            <SectionHead
              id="rules"
              title="The rules behind the list"
              blurb="Intervals follow the ADA Standards of Care in Diabetes and RSSDI guidance. The weights are ours, written down so doctors can argue with them and change them in one place."
            />
            <div className="dx-grid">
              <Card title="What is due, and when">
                <table className="dx-table">
                  <thead>
                    <tr>
                      <th>Trigger</th>
                      <th>Next test</th>
                      <th>Basis</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RULE_TABLE.map((r) => (
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
                    {SCORE_TABLE.map((r) => (
                      <tr key={r.factor}>
                        <td>{r.factor}</td>
                        <td className="mono">{r.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Caption>
                  Critical {TIER_MIN.critical}+ (or very high sugar with no repeat), High {TIER_MIN.high} to {TIER_MIN.critical - 1},
                  Medium {TIER_MIN.medium} to {TIER_MIN.high - 1}, Routine below {TIER_MIN.medium}. Lateness peaks at 180 days
                  and then decays: someone 3 months late is more recoverable than someone 3 years late.
                </Caption>
              </Card>
              <Card span={12} title="Where it sits in the clinic's day" subtitle="no new app for patients, no new data entry for staff">
                <WorkflowDiagram />
              </Card>
            </div>
          </div>
        </section>

        <Methods />
      </main>
      <Footer />
      <RevealOnScroll />
      <style>{STYLES}</style>
    </>
  );
}

/* ------------------------------------------------------------------ */

function Hero({ d }: { d: ReturnType<typeof getDashboard> }) {
  const h = d.hero;
  return (
    <header className="container" style={{ paddingTop: 128, paddingBottom: 24 }}>
      <h1 style={{ fontSize: "clamp(34px, 5.2vw, 58px)", maxWidth: 900 }}>Diabetes follow-up, before patients are lost</h1>
      <p style={{ marginTop: 22, fontSize: 19, lineHeight: 1.55, color: "var(--ink-500)", maxWidth: 780 }}>
        Every sugar test done at <strong style={{ color: "var(--ink)" }}>Anubhav Life Care, Barasat</strong>, joined into
        one timeline per person, checked against follow-up guidelines, and turned into a ranked call list for the care
        team. Companion to the <a href="/data" className="dx-a">anaemia and TB dashboards</a>, but longitudinal: the same
        person, followed across months.
      </p>
      <p className="mono" style={{ marginTop: 16, fontSize: 12.5, color: "var(--ink-400)", maxWidth: 780 }}>
        Synthetic cohort shaped like the AKTIV research mirror · {n(h.cohort)} people · 36 months to {fmtDay(d.asOf)} · no
        real patient data. The pipeline reads plain lab rows and runs unchanged on the live mirror.
      </p>

      <div className="dx-hero-stats">
        <Stat value={n(h.diabetes)} label="people with a diabetic-range result" />
        <Stat value={`${h.lostPct}%`} label="of them lost to follow-up now" note={`${n(h.lostNow)} people, 180+ days past due`} />
        <Stat value={n(h.recoverable)} label="overdue, still reachable" note="0 to 180 days past due" />
        <Stat value={n(h.urgent)} label="critical + high this week" note="the top of the call list" />
      </div>

      <nav className="dx-toc" aria-label="On this page">
        {[
          ["#linking", "Linking visits"],
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
  );
}

function Methods() {
  return (
    <section className="section dx-band" style={{ paddingTop: 96, paddingBottom: 120 }}>
      <div className="container" style={{ maxWidth: 880 }}>
        <h2 id="method">How the numbers were made</h2>
        <div className="dx-prose">
          <p>
            <strong>Data.</strong> Everything on this page is computed at build time from a synthetic cohort generated
            to look like the AKTIV to Neon research mirror: bills with a monthly PATIENT_KEY, names and phone numbers as
            a busy front desk types them, households sharing a mobile, and collection agents, camp desks and partner
            centres typing their own number. HbA1c drifts toward a treatment target while people keep coming and upward
            while they are away. No real patient appears here. The generator, the linker, the rules and the charts are
            separate modules, so the same code can be pointed at the mirror.
          </p>
          <p>
            <strong>Linking.</strong> PATIENT_KEY is ignored for linking because it is reissued monthly. The mobile
            number is the identifier after cleaning; numbers with more than 15 different people are treated as shared
            (agent, camp or centre) numbers. Within a number, names are compared on a Bengali-aware phonetic key
            (Jaro-Winkler, first sound must agree), with sex and a birth-year tolerance. Visits with no usable number
            attach to a phone-linked person only when exactly one candidate matches, otherwise they link on full name,
            sex and age. Accuracy is scored against the generator’s hidden person id.
          </p>
          <p>
            <strong>Definitions.</strong> Diabetic range: HbA1c ≥ 6.5%, fasting glucose ≥ 126 mg/dL, or post-meal /
            random ≥ 200 mg/dL. A single raised glucose with no HbA1c is “unconfirmed” and gets a
            confirmatory test. Prediabetes: HbA1c 5.7 to 6.4%, fasting 100 to 125, post-meal 140 to 199. Next HbA1c is
            due 90 days after a result ≥ 7% and 180 days after a result under 7%. Lost to follow-up: more than 180 days
            past due with no sugar test.
          </p>
          <p>
            <strong>What this cannot see.</strong> A lab only sees tests done at the lab. Someone “lost” here
            may be testing elsewhere, have moved, or have died, which is why the re-engagement queue is kept separate and
            its first question is “where are you getting tested now?”. Medicines, symptoms and clinic visits are
            not in the mirror. Scoring weights are a starting point for the clinical team, not a validated model.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function pctOf(a: number, b: number) {
  return Math.round((a / b) * 1000) / 10;
}

function pct1(x: number) {
  return `${(x * 100).toFixed(1)}%`;
}

function kmPoints(km: { month: number; s: number; atRisk: number }[]) {
  return km.map((k) => ({ x: k.month, y: k.atRisk >= 20 ? Math.round(k.s * 1000) / 10 : null }));
}

function summariseShared(labels: string[]) {
  const counts = new Map<string, number>();
  for (const l of labels) {
    const kind = l.replace(/\s+\d+$/, "");
    counts.set(kind, (counts.get(kind) ?? 0) + 1);
  }
  return [...counts.entries()].map(([k, c]) => `${c} ${k.toLowerCase()}${c > 1 ? "s" : ""}`).join(", ");
}

const STYLES = `
.dx {
  --dx-in: #0d9488;
  --dx-out: #eb6834;
  --dx-b0: #0d9488;
  --dx-b1: #dba300;
  --dx-b2: #e8622a;
  --dx-b3: #b91c1c;
  --dx-critical: #d03b3b;
  --dx-high: #ec835a;
  --dx-medium: #fab219;
  --dx-routine: #94a3b8;
  --dx-ok: #0d9488;
}
.dx-band { background: var(--paper-2); }
.dx-a { color: var(--brand); text-decoration: underline; text-underline-offset: 2px; }
.dx-dim { color: var(--ink-400); }
.dx-tnum { font-variant-numeric: tabular-nums; }
.dx-meta { margin-top: 16px; display: flex; flex-wrap: wrap; gap: 18px; font-size: 12px; color: var(--ink-400); }

.dx-hero-stats { margin-top: 36px; display: grid; gap: 14px; grid-template-columns: repeat(4, minmax(0, 1fr)); }
.dx-toc { margin-top: 28px; display: flex; flex-wrap: wrap; gap: 8px; }
.dx-toc a { font-size: 13px; padding: 8px 14px; border-radius: 999px; border: 1px solid var(--ink-100); color: var(--ink-700); background: #fff; }
.dx-toc a:hover { border-color: var(--brand-2); color: var(--brand); }

.dx-stat { background: var(--paper-2); border-radius: 12px; padding: 14px 16px; min-width: 0; }
.dx-band .dx-stat { background: #fff; border: 1px solid var(--ink-100); }
.dx-card .dx-stat { background: var(--paper-2); border: 0; }
.dx-stat-value { font-size: 30px; font-weight: 600; letter-spacing: -0.02em; color: var(--ink); line-height: 1.05; }
.dx-stat-label { margin-top: 6px; font-size: 12.5px; color: var(--ink-500); line-height: 1.35; }
.dx-stat-note { margin-top: 4px; font-size: 11.5px; color: var(--ink-400); font-family: var(--font-mono); }

.dx-funnel { margin-top: 32px; display: grid; grid-template-columns: 1fr auto 1fr auto 1.3fr; align-items: stretch; gap: 12px; max-width: 900px; }
.dx-arrow { align-self: center; color: var(--ink-300); font-size: 22px; }

.dx-grid { margin-top: 32px; display: grid; gap: 18px; grid-template-columns: repeat(12, minmax(0, 1fr)); }
.dx-card { display: flex; flex-direction: column; gap: 14px; padding: 24px; min-width: 0; }
.dx-card:hover { transform: none; }
.dx-span-4 { grid-column: span 4; }
.dx-span-6 { grid-column: span 6; }
.dx-span-8 { grid-column: span 8; }
.dx-span-12 { grid-column: span 12; }

.dx-legend { list-style: none; padding: 0; margin: 10px 0 0; display: flex; flex-wrap: wrap; gap: 8px 16px; font-size: 12px; color: var(--ink-500); }
.dx-legend li { display: flex; align-items: center; gap: 7px; }
.dx-axis-label { font-size: 10.5px; color: var(--ink-400); margin-bottom: 6px; }

.dx-hbars { list-style: none; padding: 0; margin: 0; display: grid; gap: 11px; }
.dx-hbar-top { display: flex; justify-content: space-between; gap: 12px; font-size: 12.5px; color: var(--ink-700); margin-bottom: 5px; }
.dx-hbar-top .mono { font-size: 11.5px; color: var(--ink-700); white-space: nowrap; }
.dx-hbar-track { height: 12px; background: var(--ink-50); border-radius: 4px; overflow: hidden; }
.dx-hbar-fill { height: 100%; border-radius: 0 4px 4px 0; }

.dx-donut { display: grid; grid-template-columns: auto 1fr; gap: 18px; align-items: center; }
.dx-donut-legend { list-style: none; padding: 0; margin: 0; display: grid; gap: 7px; }
.dx-donut-legend li { display: grid; grid-template-columns: 10px 1fr auto auto; gap: 8px; align-items: center; font-size: 12.5px; color: var(--ink-700); }
.dx-donut-legend .mono { font-size: 11.5px; }

.dx-heat { display: grid; gap: 3px; align-items: center; }
.dx-heat-col { font-size: 10.5px; color: var(--ink-400); text-align: center; }
.dx-heat-row { font-size: 10.5px; color: var(--ink-500); text-align: right; padding-right: 6px; }
.dx-heat-cell { border-radius: 4px; padding: 10px 0; text-align: center; font-size: 12px; font-weight: 600; font-variant-numeric: tabular-nums; }

.dx-cols { display: grid; gap: 6px; align-items: end; }
.dx-col { display: flex; flex-direction: column; align-items: center; gap: 6px; min-width: 0; }
.dx-col-plot { width: 100%; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; border-bottom: 1px solid var(--ink-200); }
.dx-col-value { font-size: 10.5px; color: var(--ink-700); margin-bottom: 4px; }
.dx-col-bar { width: 100%; max-width: 24px; border-radius: 4px 4px 0 0; }
.dx-col-label { font-size: 10px; color: var(--ink-400); text-align: center; white-space: nowrap; }

.dx-stack-plot { position: relative; margin-left: 44px; }
.dx-stack-grid { position: absolute; left: 0; right: 0; height: 0; border-top: 1px solid var(--ink-100); }
.dx-stack-grid span { position: absolute; left: -44px; width: 38px; text-align: right; transform: translateY(-50%); font-size: 10.5px; color: var(--ink-400); font-variant-numeric: tabular-nums; }
.dx-stack-cols { position: absolute; inset: 0; display: grid; gap: 4px; align-items: end; border-bottom: 1px solid var(--ink-200); }
.dx-stack-col { height: 100%; display: flex; align-items: flex-end; justify-content: center; }
.dx-stack-bar { width: 100%; max-width: 24px; display: flex; flex-direction: column; gap: 2px; border-radius: 4px 4px 0 0; overflow: hidden; }
.dx-stack-bar > div { min-height: 0; }
.dx-stack-x { margin: 6px 0 0 44px; display: grid; gap: 4px; }
.dx-stack-x span { font-size: 10.5px; color: var(--ink-400); white-space: nowrap; }
.dx-line svg:focus-visible { outline: 2px solid var(--brand); outline-offset: 4px; border-radius: 6px; }
.dx-tip { position: absolute; top: 4px; pointer-events: none; background: #fff; border: 1px solid var(--ink-100); box-shadow: 0 8px 24px -12px rgba(11,18,32,0.25); border-radius: 8px; padding: 8px 10px; font-size: 12px; min-width: 160px; z-index: 2; }
.dx-tip-head { font-size: 11px; color: var(--ink-400); margin-bottom: 4px; }
.dx-tip-row { display: flex; align-items: center; gap: 8px; color: var(--ink-500); }
.dx-tip-row strong { color: var(--ink); font-variant-numeric: tabular-nums; }

.dx-table-view { margin-top: 12px; font-size: 12.5px; }
.dx-table-view summary { cursor: pointer; color: var(--ink-500); font-size: 12px; }
.dx-table-view table, .dx-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.dx-table-view table { margin-top: 10px; }
.dx-table-view th, .dx-table-view td, .dx-table th, .dx-table td { text-align: left; padding: 7px 8px; border-bottom: 1px solid var(--ink-100); vertical-align: top; }
.dx-table-view th, .dx-table th { font-weight: 600; color: var(--ink-500); font-size: 11.5px; }
.dx-table-view td, .dx-table td { color: var(--ink-700); font-variant-numeric: tabular-nums; }
.dx-table-num td:not(:first-child), .dx-table-num th:not(:first-child) { text-align: right; }
.dx-table tr.is-ours td { background: var(--paper-3); font-weight: 600; }

.dx-link { display: inline-block; font-size: 11.5px; padding: 3px 8px; border-radius: 999px; background: var(--paper-3); color: var(--brand-deep); white-space: nowrap; }
.dx-link-name-bridge, .dx-link-name-only { background: #fff4e5; color: #8a4b00; }
.dx-link-single { background: var(--ink-50); color: var(--ink-500); }
.dx-check { margin-top: 8px; font-size: 12.5px; color: #8a4b00; background: #fff4e5; border-radius: 8px; padding: 8px 10px; }

.dx-steps { margin: 0; padding-left: 20px; display: grid; gap: 10px; font-size: 13.5px; color: var(--ink-700); line-height: 1.5; }
.dx-steps strong { color: var(--ink); }
.dx-family { list-style: none; padding: 0; margin: 0; display: grid; gap: 8px; }
.dx-family li { display: flex; justify-content: space-between; gap: 10px; padding: 10px 12px; border-radius: 10px; background: var(--paper-2); font-size: 14px; }
.dx-family .mono { font-size: 12px; }

.dx-callout { margin-top: 24px; padding: 18px 20px; border-left: 3px solid var(--dx-out); background: #fff7f2; border-radius: 0 12px 12px 0; font-size: 15px; color: var(--ink-700); line-height: 1.55; max-width: 900px; }

.dx-flow ol { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; counter-reset: none; }
.dx-flow li { position: relative; display: flex; flex-direction: column; gap: 4px; padding: 14px; border-radius: 12px; background: var(--paper-2); font-size: 12.5px; color: var(--ink-500); }
.dx-flow li strong { font-size: 14px; color: var(--ink); }
.dx-flow li:not(:last-child)::after { content: "→"; position: absolute; right: -5px; top: 50%; transform: translate(50%, -50%); color: var(--ink-400); font-size: 18px; line-height: 1; z-index: 1; }
.dx-flow-n { font-size: 11px; color: var(--brand); }
.dx-flow-loop { margin-top: 12px; font-size: 12px; color: var(--ink-500); }

.dx-prose { margin-top: 24px; display: grid; gap: 18px; font-size: 15.5px; color: var(--ink-500); line-height: 1.65; }
.dx-prose strong { color: var(--ink); }

/* ---------- call list ---------- */
.dx-owners { margin-top: 24px; display: flex; flex-wrap: wrap; gap: 10px; }
.dx-owners-label { flex-basis: 100%; font-size: 12px; color: var(--ink-400); }
.dx-owners div { display: flex; align-items: baseline; gap: 8px; padding: 8px 14px; border-radius: 10px; background: #fff; border: 1px solid var(--ink-100); font-size: 13px; color: var(--ink-500); }
.dx-owners strong { font-size: 16px; color: var(--ink); }
.dx-wl { margin-top: 20px; background: #fff; border: 1px solid var(--ink-100); border-radius: 18px; padding: 20px; }
.dx-wl-queues { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.dx-queue { text-align: left; display: grid; grid-template-columns: auto 1fr; column-gap: 12px; align-items: baseline; padding: 14px 16px; border-radius: 12px; border: 1.5px solid var(--ink-100); background: var(--paper-2); color: var(--ink-700); }
.dx-queue.is-on { border-color: var(--brand); background: var(--paper-3); }
.dx-queue-n { grid-row: span 2; font-size: 26px; font-weight: 600; color: var(--ink); letter-spacing: -0.02em; }
.dx-queue-label { font-weight: 600; font-size: 14px; }
.dx-queue-hint { font-size: 12px; color: var(--ink-400); }
.dx-wl-tiers { margin-top: 14px; display: flex; flex-wrap: wrap; gap: 8px; }
.dx-chip { display: inline-flex; align-items: center; gap: 7px; min-height: 36px; padding: 6px 12px; border-radius: 999px; border: 1px solid var(--ink-100); background: #fff; font-size: 13px; color: var(--ink-700); }
.dx-chip.is-on { border-color: var(--ink); background: var(--ink-50); font-weight: 600; }
.dx-chip .mono { font-size: 12px; }
.dx-wl-filters { margin-top: 14px; display: flex; flex-wrap: wrap; gap: 10px; align-items: end; }
.dx-wl-filters label { display: grid; gap: 4px; font-size: 11.5px; color: var(--ink-400); }
.dx-wl-filters select, .dx-wl-filters input, .dx-cell-status select { font: inherit; font-size: 13px; min-height: 36px; padding: 6px 10px; border-radius: 8px; border: 1px solid var(--ink-200); background: #fff; color: var(--ink); }
.dx-search input { width: 200px; }
.dx-btn { font: inherit; font-size: 13px; min-height: 36px; padding: 6px 14px; border-radius: 8px; border: 1px solid var(--ink-200); background: #fff; color: var(--ink); font-weight: 500; }
.dx-btn:hover { border-color: var(--ink-400); }
.dx-more { margin-top: 14px; }
.dx-wl-summary { margin-top: 14px; font-size: 11.5px; color: var(--ink-400); }

.dx-wl-head, .dx-wl-cells { display: grid; grid-template-columns: 110px minmax(150px, 1.3fr) 110px 150px minmax(150px, 1.3fr) minmax(170px, 1.4fr) 150px; gap: 12px; align-items: start; }
.dx-wl-head { margin-top: 10px; padding: 8px 10px; font-size: 11px; font-weight: 600; color: var(--ink-400); border-bottom: 1px solid var(--ink-100); }
.dx-wl-list { list-style: none; padding: 0; margin: 0; }
.dx-wl-row { border-bottom: 1px solid var(--ink-100); }
.dx-wl-row.is-open { background: var(--paper-2); }
.dx-wl-cells { padding: 12px 10px; font-size: 13px; }
.dx-wl-cells > div { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.dx-wl-cells .mono { font-size: 11px; }
.dx-cell-tier { flex-direction: row !important; align-items: center; gap: 8px !important; }
.dx-tier { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: var(--ink); }
.dx-name { all: unset; cursor: pointer; font-weight: 600; color: var(--ink); display: inline-flex; gap: 6px; align-items: baseline; }
.dx-name:hover { color: var(--brand); }
.dx-name:focus-visible { outline: 2px solid var(--brand); outline-offset: 2px; border-radius: 4px; }
.dx-caret { font-size: 10px; color: var(--ink-400); }
.dx-contact { font-size: 11.5px; color: var(--ink-500); }
.dx-a1c { display: inline-flex; align-items: center; gap: 6px; }
.dx-dot { width: 8px; height: 8px; border-radius: 50%; }
.dx-up { color: var(--dx-critical); }
.dx-down { color: var(--dx-in); }
.dx-state { font-weight: 600; font-size: 12.5px; }
.dx-state-lost, .dx-state-slipping { color: #a12a2a; }
.dx-state-overdue { color: #8a4b00; }
.dx-state-due-soon, .dx-state-on-track { color: var(--ink-700); }
.dx-cell-why { flex-direction: row !important; flex-wrap: wrap; gap: 4px !important; }
.dx-reason { font-size: 11px; padding: 2px 7px; border-radius: 999px; background: var(--ink-50); color: var(--ink-700); white-space: nowrap; }
.dx-cell-next span:first-child { color: var(--ink-700); }
.dx-cell-next .dx-dim { font-size: 11.5px; }
.dx-cell-status select { width: 100%; }
.dx-cell-status select.is-set { border-color: var(--brand); background: var(--paper-3); }

.dx-detail { display: grid; grid-template-columns: 1.2fr 1fr; gap: 24px; padding: 6px 10px 22px; }
.dx-detail h4 { font-size: 13px; margin: 0 0 8px; color: var(--ink-700); }
.dx-detail-p { font-size: 13px; color: var(--ink-500); }
.dx-names { margin-top: 8px; display: flex; flex-wrap: wrap; gap: 6px; }
.dx-names span { font-size: 11px; padding: 3px 8px; border-radius: 6px; background: #fff; border: 1px solid var(--ink-100); }
.dx-results { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.dx-results td { padding: 5px 6px; border-bottom: 1px solid var(--ink-100); color: var(--ink-700); }
.dx-results td.mono { font-size: 11.5px; white-space: nowrap; }
.dx-flag { color: #a12a2a; font-size: 11.5px; }
.dx-msg { margin-top: 16px; padding: 14px; border-radius: 12px; background: #fff; border: 1px solid var(--ink-100); }
.dx-msg-head { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
.dx-msg-head h4 { margin: 0; }
.dx-seg { display: inline-flex; border: 1px solid var(--ink-200); border-radius: 8px; overflow: hidden; }
.dx-seg button { font: inherit; font-size: 12px; padding: 5px 10px; border: 0; background: #fff; color: var(--ink-500); min-height: 30px; }
.dx-seg button[aria-pressed="true"] { background: var(--ink); color: #fff; }
.dx-msg-text { margin-top: 10px; font-size: 13.5px; color: var(--ink-700); line-height: 1.55; white-space: pre-wrap; }
.dx-msg-actions { margin-top: 12px; display: flex; flex-wrap: wrap; gap: 8px; }

@media (max-width: 1100px) {
  .dx-wl-head { display: none; }
  .dx-wl-cells { grid-template-columns: 1fr 1fr; }
  .dx-cell-tier { grid-column: 1 / -1; }
  .dx-cell-why, .dx-cell-next, .dx-cell-status { grid-column: 1 / -1; }
}
@media (max-width: 980px) {
  .dx-span-4, .dx-span-6, .dx-span-8, .dx-span-12 { grid-column: span 12; }
  .dx-hero-stats { grid-template-columns: 1fr 1fr; }
  .dx-detail { grid-template-columns: 1fr; }
  .dx-flow ol { grid-template-columns: 1fr; }
  .dx-flow li:not(:last-child)::after { content: "↓"; right: 50%; top: auto; bottom: -5px; transform: translate(50%, 50%); }
}
@media (max-width: 640px) {
  .dx-funnel { grid-template-columns: 1fr; }
  .dx-arrow { transform: rotate(90deg); justify-self: center; }
  .dx-wl { padding: 14px; }
  .dx-wl-queues { grid-template-columns: 1fr; }
  .dx-search input { width: 100%; }
  .dx-search { flex: 1 1 100%; }
  .dx-donut { grid-template-columns: 1fr; justify-items: center; }
  .dx-donut-legend { width: 100%; }
  .dx-stat-value { font-size: 24px; }
}
`;
