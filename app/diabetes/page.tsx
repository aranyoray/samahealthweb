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
import { STYLES } from "./styles";
import { NcdSet } from "../ncd/DiseaseDashboard";

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

const bandColorFor = (v: number) =>
  v < 5.7 ? "var(--dx-b0)" : v < 7 ? "var(--dx-in)" : v < 8 ? "var(--dx-b2)" : "var(--dx-b3)";

const signed = (r: number) => (r > 0 ? "+" : "") + r.toFixed(2);

/** Plain-language reading of a Spearman coefficient. */
function corrPhrase(r: number, moreMeans: string): string {
  const a = Math.abs(r);
  const strength = a >= 0.4 ? "a clear" : a >= 0.2 ? "a moderate" : a >= 0.1 ? "a weak" : "no";
  if (strength === "no") return `no consistent link with ${moreMeans}`;
  return `${strength} link: more testing goes with ${moreMeans}`;
}

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
  const { identity: id, hero, snapshot: s, longitudinal: L, frequency: F, worklist: w } = d;
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
              meta={[`${n(hero.diabetes)} people with a diabetic-range result`, "3.5 years of bills"]}
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

        {/* ---------------- 3b. Testing frequency ---------------- */}
        <section className="section" style={{ paddingTop: 96, paddingBottom: 88 }}>
          <div className="container">
            <SectionHead
              id="frequency"
              title="How often people test, and whether it helps"
              blurb={
                <>
                  The cohort you asked about: everyone with{" "}
                  <strong>two or more sugar tests in the last {F.windowYears} years</strong>. Testing rate is
                  tests per year since a person&apos;s first test in the window, so both testing less and dropping out
                  pull it down. The question is whether people who test more often stay in care and do better, or whether
                  frequency just tracks who was already engaged.
                </>
              }
              meta={[
                `${n(F.cohort)} people with 2+ tests`,
                `${F.medianTests} tests each (median)`,
                `${F.medianPerYear} tests / yr (median)`,
              ]}
            />

            <div className="dx-hero-stats" style={{ marginTop: 32 }}>
              <Stat value={n(F.cohort)} label="people with 2+ sugar tests in 3.5 years" />
              <Stat value={`${F.twoPlusOfDiabetes}%`} label="of people with diabetes tested 2+ times" note={`${n(F.dm)} people`} />
              <Stat value={signed(F.spearman.change)} label="testing rate vs HbA1c improvement (Spearman ρ)" note={`higher = frequent testers improve more · n = ${n(F.changeN)}`} />
              <Stat value={signed(F.spearman.due)} label="testing rate vs days overdue (ρ)" note={`lower = frequent testers stay on time · n = ${n(F.dm)}`} />
            </div>

            <div className="dx-grid">
              <Card title="Do frequent testers stay in care?" subtitle="% not yet lost to follow-up, by testing rate">
                <HBars
                  color={COLORS.in}
                  rows={F.bins.map((b) => ({ label: b.label, value: b.inCarePct, note: `n = ${n(b.n)}` }))}
                />
                <Caption>
                  Continuity climbs with testing rate, from {F.bins[0].inCarePct}% still in care in the least
                  frequent group to {F.bins[F.bins.length - 1].inCarePct}% in the most frequent.
                  Much of this is definitional, people who test often are by definition still testing, so read it
                  alongside the retention curve rather than as a separate effect.
                </Caption>
              </Card>

              <Card title="Control by testing frequency" subtitle="median latest HbA1c, people with diabetes">
                <Columns
                  unit=""
                  height={150}
                  bars={F.bins
                    .filter((b) => b.medianA1c !== null)
                    .map((b) => ({ label: b.label, value: b.medianA1c!, color: bandColorFor(b.medianA1c!) }))}
                />
                <Caption>
                  {`Median HbA1c barely moves with testing rate, and the most frequent group is not the best controlled (at goal ${F.bins[0].atGoalPct}% in the least frequent group vs ${F.bins[F.bins.length - 1].atGoalPct}% in the most). Doctors repeat the test when sugar is high, so the sickest test most. The payoff is in the change over time and in staying in care, not in the level, see the improvement column below and the retention chart above.`}
                </Caption>
                <TableView
                  head={["Testing rate", "People (DM)", "Median HbA1c", "% at goal", "Median change (pp)"]}
                  rows={F.bins.map((b) => [
                    b.label,
                    b.dm,
                    b.medianA1c ?? "–",
                    `${b.atGoalPct}%`,
                    b.medianChange === null ? "–" : b.medianChange > 0 ? `+${b.medianChange}` : `${b.medianChange}`,
                  ])}
                />
              </Card>

              <Card title="Full yearly work-up by testing frequency" subtitle="% of people with diabetes with 2+ HbA1c, eGFR and lipids in the last year">
                <HBars
                  color={COLORS.in}
                  rows={F.bins.map((b) => ({ label: b.label, value: b.screenedPct, note: `of ${n(b.dm)}` }))}
                />
                <Caption>
                  Frequent testers are far more likely to get the whole yearly panel, not just a repeat sugar. The
                  kidney and lipid checks ride along with the habit of coming back.
                </Caption>
              </Card>

              <Card title="What testing frequency tracks" subtitle="Spearman ρ, people with diabetes">
                <div style={{ display: "grid", gap: 12 }}>
                  <CorrRow r={F.spearman.hba1c} label="Latest HbA1c" reading={corrPhrase(F.spearman.hba1c, "lower HbA1c")} />
                  <CorrRow r={F.spearman.change} label="HbA1c improvement" reading={corrPhrase(F.spearman.change, "a bigger drop in HbA1c")} />
                  <CorrRow r={F.spearman.due} label="Days past due" reading={corrPhrase(F.spearman.due, "being less overdue")} />
                </div>
                <Caption>
                  Association, not proof. Testing more does not by itself lower sugar; both are downstream of the same
                  engagement, and a doctor orders repeat tests precisely when a patient is being actively managed. The
                  useful read for the care team: the people testing under once a year are the ones to pull back in.
                </Caption>
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

function CorrRow({ r, label, reading }: { r: number; label: string; reading: string }) {
  // Signed bar from a centre line: left for negative ρ, right for positive.
  const w = Math.min(50, Math.abs(r) * 50);
  return (
    <div className="dx-corr">
      <div className="dx-corr-head">
        <span>{label}</span>
        <span className="mono" style={{ fontWeight: 700 }}>
          ρ {r > 0 ? "+" : ""}
          {r.toFixed(2)}
        </span>
      </div>
      <div className="dx-corr-track" aria-hidden>
        <span className="dx-corr-mid" />
        <span
          className="dx-corr-fill"
          style={{
            left: r < 0 ? `${50 - w}%` : "50%",
            width: `${w}%`,
            background: r < 0 ? "var(--dx-in)" : "var(--dx-out)",
          }}
        />
      </div>
      <div className="dx-corr-reading">{reading}</div>
    </div>
  );
}

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
        Synthetic cohort shaped like the AKTIV research mirror · {n(h.cohort)} people · 3.5 years to {fmtDay(d.asOf)} · no
        real patient data. The pipeline reads plain lab rows and runs unchanged on the live mirror.
      </p>
      <p style={{ marginTop: 14, fontSize: 12, lineHeight: 1.5, color: "var(--ink-500)", maxWidth: 780 }}>
        <strong>Demo data notice:</strong> All names, record IDs, dates, phone fragments and clinical values shown on this
        page are fictional and made up for demonstration.
      </p>

      <NcdSet current="/diabetes" />

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
          ["#frequency", "Frequency"],
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
