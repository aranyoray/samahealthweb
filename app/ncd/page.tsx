import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "../components/Nav";
import { Footer } from "../components/Footer";
import { RevealOnScroll } from "../components/Reveal";
import { Caption, Card, Heatmap, HBars, Legend, SectionHead, Stat } from "../diabetes/charts";
import { fmtDay } from "../diabetes/lib/rng";
import { STYLES } from "../diabetes/styles";
import { n } from "./ConditionPanel";
import { ConditionTabs } from "./ConditionTabs";
import { HeartPanel } from "./conditions/heart";
import { KidneyPanel } from "./conditions/kidney";
import { LiverPanel } from "./conditions/liver";
import { ThyroidPanel } from "./conditions/thyroid";
import { CONDITION_BENCH, NFHS6, SURVEY_ROWS, WHO_NCD } from "./lib/benchmarks";
import { CONDITIONS, getHub } from "./lib/pipeline";

export const metadata: Metadata = {
  title: "Long-term conditions in West Bengal: one call per person · SamaHealth",
  description:
    "Diabetes, kidney disease, cholesterol, thyroid and fatty liver follow-up from one lab's records, set against West Bengal and all-India survey figures: how the conditions overlap in the same people, and how one ranked call replaces several siloed ones.",
  alternates: { canonical: "/ncd" },
  openGraph: {
    title: "Long-term conditions, one call per person",
    description: "Five NCD follow-up lists from one lab's records, merged into one call per person.",
    url: "/ncd",
    siteName: "SamaHealth",
    type: "website",
    images: [{ url: "/events/anubhav-cmc-001.jpg", width: 1200, height: 630, alt: "SamaHealth community screening" }],
  },
};

export default function NcdHubPage() {
  const h = getHub();
  const labels = CONDITIONS.map((c) => c.label);
  return (
    <>
      <Nav variant="light" />
      <main id="main" className="dx">
        <header className="container" style={{ paddingTop: 128, paddingBottom: 24 }}>
          <h1 style={{ fontSize: "clamp(34px, 5.2vw, 58px)", maxWidth: 960 }}>Long-term conditions in West Bengal, followed as one person, not five lists</h1>
          <p style={{ marginTop: 22, fontSize: 19, lineHeight: 1.55, color: "var(--ink-500)", maxWidth: 820 }}>
            West Bengal now has more raised blood sugar and blood pressure than India as a whole, and the gap opened in the last
            three years. A neighbourhood lab in Barasat already holds the results that show who has diabetes, failing kidneys, high
            cholesterol, an underactive thyroid or a scarring liver, and who has stopped coming back. This page sets the state
            against the country, then turns the lab&apos;s results into one follow-up call per person across all five conditions.
          </p>
          <p className="mono" style={{ marginTop: 16, fontSize: 12.5, color: "var(--ink-500)", maxWidth: 820 }}>
            West Bengal and India figures: published surveys, cited · lab figures: synthetic cohort shaped like the AKTIV research
            mirror, {n(h.tested)} people, {n(h.identity.results)} results, 3.5 years to {fmtDay(h.asOf)}, no real patient data.
          </p>
          <div className="dx-hero-stats">
            <Stat value={`${h.anyCondPct}%`} label="of people tested are on at least one follow-up pathway" note={`${n(h.anyCond)} of ${n(h.tested)}, simulated`} />
            <Stat value={`${h.multiPctOfAny}%`} label="of them are on two or more" note={`${n(h.multi)} people, simulated`} />
            <Stat value={n(h.calls.single)} label="calls this week, one per person" note={`instead of ${n(h.calls.silo)} across five lists`} />
            <Stat value={`${h.calls.savedPct}%`} label="fewer calls for the same checks" note={`${n(h.calls.saved)} calls saved`} />
          </div>
          <nav className="dx-toc" aria-label="On this page">
            {[
              ["#compare", "West Bengal and India"],
              ["#overlap", "Overlap"],
              ["#one-call", "One call"],
              ["#conditions", "Each condition"],
              ["#method", "Method and real numbers"],
            ].map(([href, label]) => (
              <a key={href} href={href}>
                {label}
              </a>
            ))}
          </nav>
        </header>

        {/* ---------------- West Bengal against India (published) ---------------- */}
        <section className="section dx-band" style={{ paddingTop: 88, paddingBottom: 88 }}>
          <div className="container">
            <SectionHead
              id="compare"
              title="West Bengal against India"
              blurb={
                <>
                  Noncommunicable diseases cause 63% of deaths in India (
                  <a href={WHO_NCD.href} className="dx-a" target="_blank" rel="noreferrer">
                    WHO
                  </a>
                  ). Every figure in this section is published and linked to its source; none is computed from the lab.
                </>
              }
              meta={["NFHS-6 2023-24 vs NFHS-5 2019-21", "adults 15+ unless stated"]}
            />
            <div className="dx-grid">
              <Card span={12} title="Same survey, same method: West Bengal and India" subtitle="% of adults, NFHS-6 2023-24; the dark tick marks NFHS-5 2019-21">
                <div className="ncd-pairs" role="table" aria-label="West Bengal versus India, NFHS-6">
                  {SURVEY_ROWS.map((r) => (
                    <div key={r.label} className="ncd-pair" role="row">
                      <div className="ncd-pair-label" role="rowheader">
                        {r.label}
                      </div>
                      <div className="ncd-pair-bars" role="cell">
                        <PairBar who="West Bengal" v={r.wb} was={r.wb5} max={50} color="var(--brand)" />
                        <PairBar who="India" v={r.india} was={r.india5} max={50} color="var(--ink-300)" />
                      </div>
                    </div>
                  ))}
                </div>
                <Legend
                  items={[
                    { label: "West Bengal", color: "var(--brand)" },
                    { label: "India", color: "var(--ink-300)" },
                  ]}
                />
                <Caption>
                  West Bengal is above India on every blood sugar and blood pressure measure, for women and for men. Raised blood
                  pressure rose in West Bengal (women {SURVEY_ROWS[4].wb5}% to {SURVEY_ROWS[4].wb}%, men {SURVEY_ROWS[5].wb5}% to{" "}
                  {SURVEY_ROWS[5].wb}%) while it fell nationally. Blood sugar over 160 mg/dL, the level that usually means untreated or
                  uncontrolled diabetes, rose by about half in five years. Source:{" "}
                  <a href={NFHS6.href} className="dx-a" target="_blank" rel="noreferrer">
                    {NFHS6.label}
                  </a>
                  .
                </Caption>
              </Card>

              <Card span={12} title="Condition by condition" subtitle="best published estimate for each; studies differ in method, age and year, so read across a row with care">
                <div style={{ overflowX: "auto" }}>
                  <table className="dx-table" style={{ minWidth: 820 }}>
                    <thead>
                      <tr>
                        <th>Condition</th>
                        <th>West Bengal</th>
                        <th>India</th>
                        <th>This lab, simulated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {CONDITION_BENCH.map((c) => {
                        const lab = h.perCondition.find((p) => p.key === c.key);
                        return (
                          <tr key={c.key}>
                            <td>
                              <strong>{c.label}</strong>
                            </td>
                            <td>
                              <span className="ncd-big">{c.wb}</span>
                              <span className="ncd-note">
                                {c.wbNote}
                                {c.wbSrc && (
                                  <>
                                    {" · "}
                                    <a href={c.wbSrc.href} className="dx-a" target="_blank" rel="noreferrer">
                                      {c.wbSrc.label}
                                    </a>
                                  </>
                                )}
                              </span>
                            </td>
                            <td>
                              <span className="ncd-big">{c.india}</span>
                              <span className="ncd-note">
                                {c.indiaNote} ·{" "}
                                <a href={c.indiaSrc.href} className="dx-a" target="_blank" rel="noreferrer">
                                  {c.indiaSrc.label}
                                </a>
                              </span>
                            </td>
                            <td>
                              {lab ? (
                                <>
                                  <span className="ncd-big ncd-sim">{lab.pctOfTested}%</span>
                                  <span className="ncd-note">of people tested at the lab</span>
                                </>
                              ) : (
                                <span className="ncd-note">not a lab test</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <Caption>
                  The lab column is simulated until result values are synced, and even then it is not a prevalence: people come to a
                  lab because a doctor suspected something, so the share on a pathway will run above the survey figure. What the lab
                  adds is the part surveys cannot see: whether the same person came back. Kolkata has twice the eight-city rate of
                  hypothyroidism, which is why thyroid sits beside the metabolic conditions here.
                </Caption>
              </Card>
            </div>
          </div>
        </section>
        {/* ---------------- Overlap ---------------- */}
        <section className="section" style={{ paddingTop: 96, paddingBottom: 88 }}>
          <div className="container">
            <SectionHead
              id="overlap"
              title="The same people, on several lists"
              blurb="A person is on a condition's pathway once a result puts them there (definitions in each condition's tab below). Counts come from one linked timeline per person, so a person is counted once however many visits and PATIENT_KEYs they have."
              meta={[`${n(h.tested)} people`, `${n(h.anyCond)} on a pathway`, `as of ${fmtDay(h.asOf)}`]}
            />
            <div className="dx-grid">
              <Card span={8} title="If someone is on this list, how often are they on that one" subtitle="% of people on the row's pathway also on the column's">
                <Heatmap rows={labels} cols={labels} values={h.overlap} rowLabel="on this pathway" colLabel="also on" hue="13, 148, 136" />
                <Caption>
                  Diabetes sits in the middle of the web: people on the kidney, cholesterol and liver lists often have it too. Thyroid
                  disease overlaps least; it is the condition of younger women, not of the metabolic cluster.
                </Caption>
              </Card>
              <Card span={4} title="Conditions per person" subtitle={`n = ${n(h.tested)} people tested`}>
                <HBars
                  unit=""
                  max={h.tested}
                  rows={[
                    { label: "None", value: h.counts[0] },
                    { label: "One", value: h.counts[1] },
                    { label: "Two", value: h.counts[2] },
                    { label: "Three or more", value: h.counts[3] },
                  ]}
                />
              </Card>
              <Card span={12} title="Multimorbidity climbs with age" subtitle="% of people in each age band on 1, 2, or 3+ pathways">
                <Heatmap
                  rows={["One", "Two", "Three or more"]}
                  cols={["18–29", "30–39", "40–49", "50–59", "60–69", "70+"]}
                  values={[h.multiByAge.map((a) => Math.round(a.one)), h.multiByAge.map((a) => Math.round(a.two)), h.multiByAge.map((a) => Math.round(a.three))]}
                  colLabel="age"
                />
                <Caption>
                  {Math.round(h.multiByAge[4].two + h.multiByAge[4].three)}% of people tested in their sixties are on two or more
                  pathways, against {Math.round(h.multiByAge[0].two + h.multiByAge[0].three)}% under thirty. A programme that follows
                  one disease at a time calls them more than once and still misses the checks nobody owns.
                </Caption>
              </Card>
            </div>
          </div>
        </section>

        {/* ---------------- One call ---------------- */}
        <section className="section dx-band" style={{ paddingTop: 96, paddingBottom: 88 }}>
          <div className="container">
            <SectionHead
              id="one-call"
              title="One call, one sample"
              blurb="Each condition list ranks who is due or overdue this week. Merged by person, the coordinator makes one call, books one home collection, and every overdue test runs from the same blood draw. Only the urine ACR for kidney follow-up needs a second container."
            />
            <div className="dx-grid">
              <Card title="Calls this week" subtitle="keep-in-care queues, all five conditions">
                <HBars
                  unit=""
                  max={h.calls.silo}
                  rows={[
                    { label: "One list per condition", value: h.calls.silo, color: "var(--dx-out)" },
                    { label: "One call per person", value: h.calls.single },
                  ]}
                />
                <Caption>
                  {n(h.calls.saved)} fewer calls ({h.calls.savedPct}%) for exactly the same set of overdue checks. The saving goes to
                  the re-engagement queue, where {n(h.calls.lostPeople)} people have lapsed on at least one condition.
                </Caption>
              </Card>
              <Card title="How many checks each call covers" subtitle={`n = ${n(h.calls.single)} people due this week`}>
                <HBars
                  rows={[
                    { label: "One condition", value: Math.round((h.calls.dueMix[0] / h.calls.single) * 100), note: n(h.calls.dueMix[0]) },
                    { label: "Two conditions", value: Math.round((h.calls.dueMix[1] / h.calls.single) * 100), note: n(h.calls.dueMix[1]) },
                    { label: "Three or more", value: Math.round((h.calls.dueMix[2] / h.calls.single) * 100), note: n(h.calls.dueMix[2]) },
                  ]}
                />
                <Caption>{n(h.calls.urineToo)} of these calls include a kidney check, so the collection agent brings a urine container.</Caption>
              </Card>
              <Card span={12} title="Checks nobody ordered" subtitle={`people with a diabetic-range result, n = ${n(h.neverChecked.dmN)}`}>
                <HBars
                  color="var(--dx-out)"
                  rows={[
                    { label: "No kidney test (creatinine or urine ACR) ever", value: h.neverChecked.dmNoKidney },
                    { label: "No lipid profile ever", value: h.neverChecked.dmNoLipid },
                    { label: "No computable FIB-4 ever", value: h.neverChecked.dmNoLiver },
                  ]}
                />
                <Caption>
                  These people never reach the kidney, cholesterol or liver list because the test that would put them there was
                  never done. The merged call adds the missing test to the same sample.
                </Caption>
              </Card>
            </div>
          </div>
        </section>

        {/* ---------------- Each condition ---------------- */}
        <section className="section" style={{ paddingTop: 96, paddingBottom: 88 }}>
          <div className="container">
            <SectionHead
              id="conditions"
              title="Each condition"
              blurb="The summary row for every condition, then one tab per condition with its cohort, who gets lost, its own call list and the guideline rules behind it."
            />
            <div style={{ overflowX: "auto", marginTop: 28 }}>
              <table className="dx-table dx-table-num" style={{ minWidth: 760, background: "#fff", borderRadius: 12 }}>
                <thead>
                  <tr>
                    <th>Condition</th>
                    <th>On pathway</th>
                    <th>% of tested</th>
                    <th>Also another condition</th>
                    <th>Due this week</th>
                    <th>Lost now</th>
                    <th>Lost within 12 mo</th>
                    <th>Follow-up tests</th>
                  </tr>
                </thead>
                <tbody>
                  {h.perCondition.map((c) => (
                    <tr key={c.key}>
                      <td>
                        {c.key === "diabetes" ? (
                          <Link href={c.route} className="dx-a">
                            {c.label}
                          </Link>
                        ) : (
                          <a href={`#${c.key}`} className="dx-a">
                            {c.label}
                          </a>
                        )}
                      </td>
                      <td className="mono">{n(c.inPathway)}</td>
                      <td className="mono">{c.pctOfTested}%</td>
                      <td className="mono">{c.alsoOther}%</td>
                      <td className="mono">{n(c.dueNow)}</td>
                      <td className="mono">{c.lostPct}%</td>
                      <td className="mono">{c.loss12 === null ? "on /diabetes" : `${c.loss12}%`}</td>
                      <td className="dx-dim">{c.tests.join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Caption>
              Diabetes rules are the ones on the{" "}
              <Link href="/diabetes" className="dx-a">
                diabetes page
              </Link>
              , run on this all-tests cohort, so its counts differ from that page&apos;s sugar-test-only cohort. Hypertension, the
              commonest NCD in West Bengal, is missing because blood pressure is not a lab result; it needs a reading at the camp or
              the collection visit.
            </Caption>

            <div style={{ marginTop: 48 }}>
              <ConditionTabs
                tabs={[
                  { key: "kidney", label: "Kidney disease", panel: <KidneyPanel /> },
                  { key: "heart", label: "Cholesterol", panel: <HeartPanel /> },
                  { key: "thyroid", label: "Thyroid", panel: <ThyroidPanel /> },
                  { key: "liver", label: "Fatty liver", panel: <LiverPanel /> },
                ]}
              />
            </div>
          </div>
        </section>

        {/* ---------------- Method and which numbers are real ---------------- */}
        <section className="section dx-band" style={{ paddingTop: 96, paddingBottom: 120 }}>
          <div className="container" style={{ maxWidth: 880 }}>
            <h2 id="method">How the numbers were made, and which are real</h2>
            <div className="dx-prose">
              <p>
                <strong>Real:</strong> every West Bengal and India figure, each linked to its source; the clinical rules (KDIGO,
                ADA, Lipid Association of India, ATA / ETA, AASLD), applied exactly as written in each condition&apos;s rule table;
                and the code, which reads one row per reported lab parameter, the shape of the planned AKTIV to Neon{" "}
                <span className="mono">lab_results</span> view.
              </p>
              <p>
                <strong>Simulated:</strong> every lab count, percentage and name. The cohort is generated to look like the AKTIV
                mirror once result values are synced: bills with a monthly PATIENT_KEY, names and phone numbers as a busy front desk
                types them, and hidden states for diabetes, kidney disease, cholesterol, thyroid and fatty liver that improve while
                people keep coming and slip while they are away. Its prevalences are set to look like a referral lab, not measured,
                so none of them should be quoted as findings from Anubhav Life Care.
              </p>
              <p>
                <strong>Linking.</strong> The same resolver as the{" "}
                <Link href="/diabetes#linking" className="dx-a">
                  diabetes page
                </Link>
                : mobile number first, then a Bengali-aware fuzzy name match with sex and birth year. On this all-tests cohort it
                keeps {(h.identity.precision * 100).toFixed(1)}% of joins correct and recovers {(h.identity.recall * 100).toFixed(1)}%
                of true repeat visits, scored against the generator&apos;s hidden person id.
              </p>
              <p>
                <strong>What a lab cannot see.</strong> Only tests done at the lab. Someone &ldquo;lost&rdquo; here may be testing
                elsewhere, have moved or have died, which is why the re-engagement queue asks first where they test now.
                Prescriptions, symptoms and clinic visits are not in the mirror. Scoring weights are a starting point for the clinical
                team, not a validated model.
              </p>
              <p>
                <strong>When the mirror carries results,</strong> the same build produces each lab figure from real data: people on
                each pathway, loss to follow-up at 12 months, how many calls merging saves, and the checks nobody ordered. Those,
                set against the West Bengal column above, are the numbers to report.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <RevealOnScroll />
      <style>{STYLES + HUB_STYLES}</style>
    </>
  );
}

/** One survey bar with its NFHS-5 value marked as a tick, so the change is visible. */
function PairBar({ who, v, was, max, color }: { who: string; v: number; was: number; max: number; color: string }) {
  const up = v - was;
  return (
    <div className="ncd-bar" aria-label={`${who} ${v}%, was ${was}% in NFHS-5`}>
      <span className="ncd-bar-who">{who}</span>
      <span className="ncd-bar-track">
        <span className="ncd-bar-fill" style={{ width: `${(v / max) * 100}%`, background: color }} />
        <span className="ncd-bar-was" style={{ left: `${(was / max) * 100}%` }} title={`NFHS-5: ${was}%`} />
      </span>
      <span className="ncd-bar-v mono">
        {v}%{" "}
        <span className="ncd-bar-d">
          {up >= 0 ? "+" : "−"}
          {Math.abs(up).toFixed(1)} since NFHS-5
        </span>
      </span>
    </div>
  );
}

const HUB_STYLES = `
.ncd-pairs { display: grid; gap: 18px; margin-top: 6px; }
.ncd-pair { display: grid; grid-template-columns: minmax(0, 300px) minmax(0, 1fr); gap: 18px; align-items: center; }
.ncd-pair-label { font-size: 14.5px; color: var(--ink-700); line-height: 1.4; }
.ncd-pair-bars { display: grid; gap: 6px; }
.ncd-bar { display: grid; grid-template-columns: 92px minmax(0, 1fr) 190px; gap: 10px; align-items: center; font-size: 13px; }
.ncd-bar-who { color: var(--ink-500); }
.ncd-bar-track { position: relative; height: 14px; background: var(--ink-50); border-radius: 4px; }
.ncd-bar-fill { position: absolute; inset: 0 auto 0 0; border-radius: 4px; }
.ncd-bar-was { position: absolute; top: -3px; bottom: -3px; width: 2px; background: var(--ink); opacity: .55; }
.ncd-bar-v { color: var(--ink); font-size: 13px; }
.ncd-bar-d { color: var(--ink-500); font-size: 12px; }
.ncd-big { display: block; font-size: 20px; font-weight: 600; color: var(--ink); }
.ncd-sim { color: var(--ink-500); }
.ncd-note { display: block; margin-top: 4px; font-size: 13px; color: var(--ink-500); line-height: 1.45; }
.ncd-tablist { display: flex; flex-wrap: wrap; gap: 8px; border-bottom: 1px solid var(--ink-100); padding-bottom: 14px; }
.ncd-tab { font: inherit; font-size: 15px; padding: 10px 18px; border-radius: 999px; border: 1px solid var(--ink-100); background: #fff; color: var(--ink-700); cursor: pointer; }
.ncd-tab:hover { border-color: var(--brand-2); color: var(--brand); }
.ncd-tab[aria-selected="true"] { background: var(--brand); border-color: var(--brand); color: #fff; }
.ncd-panel { padding-top: 32px; }
.ncd-panel-title { font-size: clamp(24px, 3vw, 34px); line-height: 1.2; }
.ncd-panel-intro { margin-top: 14px; font-size: 17px; line-height: 1.6; color: var(--ink-500); }
.ncd-sub { margin-top: 64px; font-size: 22px; }
.ncd-sub-blurb { margin-top: 10px; margin-bottom: 4px; font-size: 16px; line-height: 1.6; color: var(--ink-500); max-width: 880px; }
@media (max-width: 860px) {
  .ncd-pair { grid-template-columns: 1fr; gap: 8px; }
  .ncd-bar { grid-template-columns: 78px minmax(0, 1fr); }
  .ncd-bar-v { grid-column: 2; }
}
`;
