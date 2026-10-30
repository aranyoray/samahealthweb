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
import { AKTIV, byCategory, monthYear, pair, prev, sexSplit } from "./lib/aktiv";
import { CONDITION_BENCH, NFHS6, SURVEY_ROWS, WHO_NCD } from "./lib/benchmarks";
import { CONDITIONS, getHub } from "./lib/pipeline";

/** The lab's real figure for each row of the West Bengal / India table. */
const LAB_FOR_BENCH: Record<string, { condition: string; note: string; sex?: Parameters<typeof sexSplit>[0] } | null> = {
  diabetes: { condition: "Diabetes (confirmed)", note: "HbA1c 6.5% or more, or a diabetic-range sugar on two days (ADA)", sex: "Diabetes (confirmed)" },
  bp: null,
  kidney: { condition: "CKD: eGFR < 60 (ever)", note: "eGFR under 60 at any test" },
  heart: { condition: "LDL >= 130", note: "LDL 130 mg/dL or more; total cholesterol was not counted" },
  thyroid: { condition: "Hypothyroidism (any)", note: "TSH over 4.5, overt or subclinical", sex: "Hypothyroidism (any)" },
  liver: { condition: "Fatty liver on USG", note: "any grade on ultrasound", sex: "Fatty liver on USG" },
  anaemia: { condition: "Anaemia (WHO)", note: "WHO haemoglobin cut-offs, all adults", sex: "Anaemia (WHO)" },
};

export const metadata: Metadata = {
  title: "Long-term conditions in West Bengal: one call per person · SamaHealth",
  description:
    "Four years of real results from a Barasat lab, 115,829 people: diabetes, kidney disease, cholesterol, thyroid, fatty liver, anaemia and heart findings, set against West Bengal and all-India survey figures, with the care gaps and progression seen in the same people.",
  alternates: { canonical: "/ncd" },
  openGraph: {
    title: "Long-term conditions, one call per person",
    description: "Real NCD burden and care gaps from one West Bengal lab's records, against state and national figures.",
    url: "/ncd",
    siteName: "SamaHealth",
    type: "website",
    images: [{ url: "/events/anubhav-cmc-001.jpg", width: 1200, height: 630, alt: "SamaHealth community screening" }],
  },
};

export default function NcdHubPage() {
  const h = getHub();
  const labels = CONDITIONS.map((c) => c.label);
  const P = AKTIV.population;
  const dm = prev("Diabetes (confirmed)");
  const dmSex = sexSplit("Diabetes (confirmed)");
  const anyCond = 100 - AKTIV.multimorbidity.anyTested.pct["0"];
  const C = AKTIV.cascade;
  return (
    <>
      <Nav variant="light" />
      <main id="main" className="dx">
        <header className="container" style={{ paddingTop: 128, paddingBottom: 24 }}>
          <h1 style={{ fontSize: "clamp(34px, 5.2vw, 58px)", maxWidth: 960 }}>Long-term conditions in West Bengal, followed as one person, not five lists</h1>
          <p style={{ marginTop: 22, fontSize: 19, lineHeight: 1.55, color: "var(--ink-500)", maxWidth: 820 }}>
            West Bengal now has more raised blood sugar and blood pressure than India as a whole, and the gap opened in the last
            three years. Anubhav Life Care, a neighbourhood lab in Barasat, holds four years of results for {n(P.persons)} people.
            This page sets the state against the country, then shows what those results say: how common each condition is among the
            people tested, how often they come together, which follow-up checks never happen, and what changes in the same person
            over time.
          </p>
          <p className="mono" style={{ marginTop: 16, fontSize: 12.5, color: "var(--ink-500)", maxWidth: 820 }}>
            Lab figures: real, from the lab&apos;s AKTIV records, {monthYear(P.from)} to {monthYear(P.to)}, {n(P.bills)} visits
            linked into {n(P.persons)} people, {n(P.results)} numeric results, {n(P.usg)} ultrasound and {n(P.echo)} echo reports;
            published as counts only · West Bengal and India figures: published surveys, cited.
          </p>
          <div className="dx-hero-stats">
            <Stat value={`${anyCond.toFixed(0)}%`} label="of adults tested have at least one chronic condition" note={`of ${n(AKTIV.multimorbidity.anyTested.persons)} tested in at least one of nine areas`} />
            <Stat value={`${dm.pct}%`} label="of adults tested for sugar have diabetes" note={`women ${dmSex.F.pct.toFixed(1)}%, men ${dmSex.M.pct.toFixed(1)}%; n ${n(dm.tested)}`} />
            <Stat value={`${C.hba1c}%`} label="of people with diabetes ever had an HbA1c" note={`${n(C.dmN)} people; ${C.acr}% ever had a urine ACR`} />
            <Stat value={`${AKTIV.multimorbidity.tested3.twoPlusByAge["60-74"]}%`} label="of people aged 60-74 have two or more conditions" note="among those tested in three or more areas" />
          </div>
          <nav className="dx-toc" aria-label="On this page">
            {[
              ["#compare", "West Bengal and India"],
              ["#burden", "What the lab found"],
              ["#overlap", "Overlap"],
              ["#gaps", "Checks that never happen"],
              ["#progression", "Change over time"],
              ["#tool", "The follow-up tool"],
              ["#method", "Method"],
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
                  ). Every West Bengal and India figure is published and linked to its source; the last column of the condition
                  table is the lab&apos;s own.
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
                        <th>This lab, adults tested</th>
                      </tr>
                    </thead>
                    <tbody>
                      {CONDITION_BENCH.map((c) => {
                        const map = LAB_FOR_BENCH[c.key];
                        const lab = map ? prev(map.condition) : null;
                        const sx = map?.sex ? sexSplit(map.sex) : null;
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
                              {lab && map ? (
                                <>
                                  <span className="ncd-big">{lab.pct}%</span>
                                  <span className="ncd-note">
                                    {sx && (
                                      <>
                                        women {sx.F.pct.toFixed(1)}% / men {sx.M.pct.toFixed(1)}% ·{" "}
                                      </>
                                    )}
                                    {map.note}; n {n(lab.tested)}
                                  </span>
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
                  The lab column is not a prevalence. People come to a lab because a doctor suspected something, so it runs above a
                  household survey wherever testing is selective: fatty liver and kidney disease most of all, because scans and
                  creatinine are ordered for people with symptoms or diabetes. Where testing is routine the lab sits close to the
                  survey: diabetes among women {dmSex.F.pct}% against NFHS-6&apos;s {SURVEY_ROWS[0].wb}% for West Bengal, anaemia among
                  women {sexSplit("Anaemia (WHO)").F.pct}% against NFHS-5&apos;s 71.4%, hypothyroidism {prev("Hypothyroidism (any)").pct}%
                  against Kolkata&apos;s 21.7%. All three sit above India.
                </Caption>
              </Card>
            </div>
          </div>
        </section>
        {/* ---------------- What the lab found (real) ---------------- */}
        <section className="section" style={{ paddingTop: 96, paddingBottom: 88 }}>
          <div className="container">
            <SectionHead
              id="burden"
              title="What the lab found"
              blurb={
                <>
                  Every condition the lab&apos;s results can define, among adults who had the test that defines it. Definitions follow
                  ADA, KDIGO, NCEP, ATA and WHO; ultrasound and echo findings are read from the report text by rule-based extractors on
                  the clinic PC, which send back flags, never text. The standardised column reweights each rate to the age and sex mix
                  of all {n(P.adults)} adults seen, so conditions tested mostly in older people can be compared with the rest.
                </>
              }
              meta={[`${monthYear(P.from)} to ${monthYear(P.to)}`, `${n(P.adults)} adults`, `${P.femalePct}% women`, `median age ${P.medianAge}`]}
            />
            <div style={{ overflowX: "auto", marginTop: 28 }}>
              <table className="dx-table dx-table-num" style={{ minWidth: 760, background: "#fff", borderRadius: 12 }}>
                <thead>
                  <tr>
                    <th>Condition</th>
                    <th>Adults tested</th>
                    <th>With the condition</th>
                    <th>% (95% CI)</th>
                    <th>Age-sex standardised %</th>
                  </tr>
                </thead>
                <tbody>
                  {byCategory().map((g) => [
                    <tr key={g.category} className="ncd-cat">
                      <td colSpan={5}>{g.category}</td>
                    </tr>,
                    ...g.rows.map((r) => (
                      <tr key={r.condition}>
                        <td>{r.condition}</td>
                        <td className="mono">{n(r.tested)}</td>
                        <td className="mono">{n(r.positive)}</td>
                        <td className="mono">
                          {r.pct} <span className="dx-dim">({r.lo}–{r.hi})</span>
                        </td>
                        <td className="mono">{r.std ?? "–"}</td>
                      </tr>
                    )),
                  ])}
                </tbody>
              </table>
            </div>
            <Caption>
              Read each row as &ldquo;of the adults who had this test&rdquo;. Fatty liver on {prev("Fatty liver on USG").pct}% of scans
              is a referral rate, not a state rate; the 2010 rural West Bengal survey found 8.7%. eGFR under 60 at any test (
              {prev("CKD: eGFR < 60 (ever)").pct}%) overstates kidney disease because most people had one creatinine; only{" "}
              {prev("CKD: eGFR < 60 persistent >= 90 d").pct}% were confirmed 90 days apart. Breathing tests (
              {n(prev("Obstructive ventilatory defect (PFT)").tested)}) and PSA ({n(prev("PSA > 4 ng/mL (men)").tested)}) are too few to
              quote.
            </Caption>

            <div className="dx-grid">
              <Card span={12} title="Per 1,000 adults tested, by year" subtitle="same definitions each year; 2022 covers November and December only">
                <div style={{ overflowX: "auto" }}>
                  <table className="dx-table dx-table-num" style={{ minWidth: 720 }}>
                    <thead>
                      <tr>
                        <th>Year</th>
                        <th>Adults seen</th>
                        {Object.keys(AKTIV.byYear[0].rates).map((k) => (
                          <th key={k}>{k}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {AKTIV.byYear.map((y) => (
                        <tr key={y.year}>
                          <td>{y.year}</td>
                          <td className="mono">{n(y.adults)}</td>
                          {Object.entries(y.rates).map(([k, v]) => (
                            <td key={k} className="mono">
                              {v.per1000}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Caption>
                  Diabetes per 1,000 adults tested rose from {AKTIV.byYear[1].rates.Diabetes.per1000} in 2023 to{" "}
                  {AKTIV.byYear[3].rates.Diabetes.per1000} in 2025, in the same direction as NFHS-6. Who gets tested also changes
                  from year to year, so treat this as agreement, not a trend estimate.
                </Caption>
              </Card>
            </div>
          </div>
        </section>

        {/* ---------------- Overlap (real) ---------------- */}
        <section className="section dx-band" style={{ paddingTop: 96, paddingBottom: 88 }}>
          <div className="container">
            <SectionHead
              id="overlap"
              title="The same people, with several conditions"
              blurb="Visits are linked into one person by phone number, name, sex and age, so each person is counted once however often they came. Nine areas are counted: diabetes, dyslipidaemia, kidney disease, fatty liver, hypothyroidism, anaemia, raised uric acid, structural heart disease and raised liver enzymes."
              meta={[`${n(AKTIV.multimorbidity.tested3.persons)} adults tested in 3+ areas`, `CKM: ${n(AKTIV.ckm.n)} adults staged`]}
            />
            <div className="dx-grid">
              <Card span={6} title="Conditions per person" subtitle={`adults tested in three or more of the nine areas, n = ${n(AKTIV.multimorbidity.tested3.persons)}`}>
                <HBars
                  rows={[
                    { label: "None", value: AKTIV.multimorbidity.tested3.pct["0"] },
                    { label: "One", value: AKTIV.multimorbidity.tested3.pct["1"] },
                    { label: "Two", value: AKTIV.multimorbidity.tested3.pct["2"] },
                    { label: "Three", value: AKTIV.multimorbidity.tested3.pct["3"] },
                    { label: "Four or more", value: AKTIV.multimorbidity.tested3.pct["4"] },
                  ]}
                />
                <Caption>
                  Nearly half the people tested broadly ({(AKTIV.multimorbidity.tested3.pct["2"] + AKTIV.multimorbidity.tested3.pct["3"] + AKTIV.multimorbidity.tested3.pct["4"]).toFixed(1)}%)
                  have two or more conditions. Restricting to people tested in three areas leans toward the sicker; among everyone
                  tested in at least one area the figure is{" "}
                  {(AKTIV.multimorbidity.anyTested.pct["2"] + AKTIV.multimorbidity.anyTested.pct["3"] + AKTIV.multimorbidity.anyTested.pct["4"]).toFixed(1)}%.
                </Caption>
              </Card>
              <Card span={6} title="Two or more conditions, by age" subtitle="same people">
                <HBars rows={Object.entries(AKTIV.multimorbidity.tested3.twoPlusByAge).map(([age, v]) => ({ label: age, value: v }))} />
                <Caption>
                  A quarter of people under 30 tested this broadly already have two conditions. From 45 on it is more than half.
                </Caption>
              </Card>
              <Card span={6} title="Commonest combinations" subtitle="people with exactly this set of conditions, tested in 3+ areas">
                <HBars
                  unit=""
                  max={AKTIV.multimorbidity.topCombos[0][1] as number}
                  rows={AKTIV.multimorbidity.topCombos.map(([label, v]) => ({ label: String(label), value: Number(v) }))}
                />
              </Card>
              <Card span={6} title="What one condition says about another" subtitle="adults tested for both; odds ratio adjusted for age and sex">
                <div style={{ overflowX: "auto" }}>
                  <table className="dx-table dx-table-num">
                    <thead>
                      <tr>
                        <th>If a person has</th>
                        <th>they also have</th>
                        <th>vs without</th>
                        <th>aOR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        pair("CKD (eGFR<60)", "Anaemia"),
                        pair("Diabetes", "Fatty liver"),
                        pair("Hyperuricaemia", "CKD (eGFR<60)"),
                        pair("CKD (eGFR<60)", "Structural heart dis."),
                        pair("Diabetes", "Proteinuria (dipstick)"),
                        pair("Diabetes", "CKD (eGFR<60)"),
                        pair("Fatty liver", "LVH"),
                        pair("High TG", "Low HDL"),
                      ].map((p) => (
                        <tr key={p.a + p.b}>
                          <td>{p.a}</td>
                          <td className="mono">
                            {p.pba}% <span className="dx-dim">{p.b}</span>
                          </td>
                          <td className="mono">{p.pbna}%</td>
                          <td className="mono">
                            {p.aor.toFixed(1)} <span className="dx-dim">({p.lo.toFixed(1)}–{p.hi.toFixed(1)})</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Caption>Kidney disease is the hub: it links to anaemia, the heart, uric acid and diabetes.</Caption>
              </Card>
              <Card span={12} title="Cardiovascular-kidney-metabolic stage" subtitle={`adapted from AHA 2023 staging to what lab results can show; adults with a metabolic or kidney test, n = ${n(AKTIV.ckm.n)}`}>
                <HBars
                  rows={[
                    { label: "Stage 0: no risk factors found", value: AKTIV.ckm.pct["0"] },
                    { label: "Stage 1: prediabetes or fatty liver", value: AKTIV.ckm.pct["1"] },
                    { label: "Stage 2: diabetes, triglycerides 135+ or kidney disease", value: AKTIV.ckm.pct["2"] },
                    { label: "Stage 3: advanced kidney disease or early heart change on echo", value: AKTIV.ckm.pct["3"] },
                    { label: "Stage 4: heart disease on echo or ECG", value: AKTIV.ckm.pct["4"] },
                  ]}
                />
                <Caption>
                  Stage 2 or above: {AKTIV.ckm.twoPlusByAge["18-29"]}% at 18-29, {AKTIV.ckm.twoPlusByAge["45-59"]}% at 45-59,{" "}
                  {AKTIV.ckm.twoPlusByAge["75+"]}% at 75 and over. Blood pressure and weight are not in lab records, so stages 1 and 2
                  are undercounted.
                </Caption>
              </Card>
            </div>
          </div>
        </section>

        {/* ---------------- Care gaps (real) ---------------- */}
        <section className="section" style={{ paddingTop: 96, paddingBottom: 88 }}>
          <div className="container">
            <SectionHead
              id="gaps"
              title="Checks that never happen"
              blurb="Guidelines ask for an HbA1c, a kidney check (creatinine and urine ACR) and a lipid profile at least once a year in diabetes, and a urine ACR in anyone with low eGFR. These are the shares who ever had each test at this lab in four years."
              meta={[`diabetes n = ${n(C.dmN)}`, `eGFR < 60 n = ${n(C.ckdN)}`, `fatty liver n = ${n(C.fattyN)}`]}
            />
            <div className="dx-grid">
              <Card span={6} title="People with diabetes: ever tested" subtitle={`one diabetic-range result or more, n = ${n(C.dmN)}`}>
                <HBars
                  color="var(--dx-out)"
                  rows={[
                    { label: "Creatinine", value: C.creat },
                    { label: "HbA1c", value: C.hba1c },
                    { label: "Lipid profile", value: C.lipid },
                    { label: "Liver ultrasound", value: C.usg },
                    { label: "Echocardiogram", value: C.echo },
                    { label: "Urine ACR", value: C.acr },
                  ]}
                />
                <Caption>
                  Where the missing tests were done they found a lot: eGFR under 60 in {C.dmCkd}%, albuminuria in {C.dmAlb}% and fatty
                  liver in {C.dmFatty}%. Fewer than one in thirteen people with diabetes ever had the urine test that catches kidney
                  damage early.
                </Caption>
              </Card>
              <Card span={6} title="Latest HbA1c in people with diabetes" subtitle="among those who had one">
                <HBars
                  rows={[
                    { label: "Under 7%", value: C.control["<7"], color: "var(--dx-in)" },
                    { label: "7 to 7.9%", value: C.control["7-7.9"] },
                    { label: "8 to 8.9%", value: C.control["8-8.9"], color: "var(--dx-out)" },
                    { label: "9 to 9.9%", value: C.control["9-9.9"], color: "var(--dx-out)" },
                    { label: "10% or more", value: C.control[">=10"], color: "var(--dx-out)" },
                  ]}
                />
                <Caption>
                  {(C.control["8-8.9"] + C.control["9-9.9"] + C.control[">=10"]).toFixed(1)}% are at 8% or above, and{" "}
                  {AKTIV.progression.a1cStillHigh}% of those who started there were still there at their latest test.
                </Caption>
              </Card>
              <Card span={6} title="Kidney disease" subtitle={`eGFR under 60 at any test, n = ${n(C.ckdN)}`}>
                <HBars
                  rows={[
                    { label: "Ever had a urine ACR", value: C.ckdAcr, color: "var(--dx-out)" },
                    { label: "Anaemic, with eGFR under 60", value: C.ckdAnaemia },
                    { label: "Anaemic, with eGFR 60 or more", value: C.nonCkdAnaemia },
                  ]}
                />
                <Caption>
                  Stages: {Object.entries(C.ckdStages).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k} ${n(v)}`).join(", ")}.{" "}
                  {n(C.ckdStages.G4 + C.ckdStages.G5)} people reached G4 or G5, the range where a nephrologist should already be
                  involved.
                </Caption>
              </Card>
              <Card span={6} title="Fatty liver" subtitle={`fatty liver on ultrasound, n = ${n(C.fattyN)}`}>
                <HBars
                  rows={[
                    { label: "Ever had liver enzymes (LFT)", value: C.fattyLft, color: "var(--dx-out)" },
                    { label: "Raised enzymes, where tested", value: C.fattyTrans },
                    { label: "FIB-4 not low, where computable", value: C.fattyFib4 },
                  ]}
                />
                <Caption>
                  Grades: {n(C.fattyGrades["1"])} grade I, {n(C.fattyGrades["2"])} grade II, {n(C.fattyGrades["3"])} grade III. FIB-4
                  is the blood score that decides who needs a fibrosis scan; it needs ALT, AST and platelets, which most scanned
                  people never had.
                </Caption>
              </Card>
            </div>
          </div>
        </section>

        {/* ---------------- Progression (real) ---------------- */}
        <section className="section dx-band" style={{ paddingTop: 96, paddingBottom: 88 }}>
          <div className="container">
            <SectionHead
              id="progression"
              title="What changes in the same person"
              blurb={`${n(P.repeat)} adults came more than once and ${n(P.followed1y)} were followed for a year or more. Their first and latest results show how fast conditions start and worsen when nobody is following them up.`}
            />
            <div className="dx-hero-stats" style={{ marginTop: 32 }}>
              <Stat value={`${AKTIV.progression.preToDm}%`} label="of people with prediabetic fasting sugar reached the diabetic range" note={`${AKTIV.progression.preToDmPer100py} per 100 person-years; n ${n(AKTIV.progression.preN)}; ${AKTIV.progression.preReverted}% returned to normal`} />
              <Stat value={`${AKTIV.progression.egfrSlope}`} label="mL/min per year, median eGFR change" note={`n ${n(AKTIV.progression.egfrN)}; ${AKTIV.progression.egfrRapid}% lost 5 or more a year`} />
              <Stat value={`${AKTIV.progression.usgNewFatty}%`} label="of normal livers were fatty at the next scan" note={`n ${n(AKTIV.progression.usgNormalN)}, scans 6 months or more apart`} />
              <Stat value={AKTIV.progression.ckdIncidence.diabetes.per100py.toFixed(1)} label="new eGFR under 60 per 100 person-years with diabetes" note={`vs ${AKTIV.progression.ckdIncidence["no diabetes (tested)"].per100py} without; ${AKTIV.progression.ckdIncidence.diabetes.events} and ${AKTIV.progression.ckdIncidence["no diabetes (tested)"].events} events`} />
            </div>
            <div className="dx-grid">
              <Card span={12} title="New conditions during follow-up" subtitle="negative in the first 180 days, retested later, followed a year or more">
                <HBars
                  color="var(--dx-out)"
                  rows={AKTIV.accrual
                    .filter((a) => a.negEarly >= 100)
                    .map((a) => ({ label: a.condition, value: a.pct ?? 0, note: `${n(a.newLater)} of ${n(a.negEarly)}` }))}
                />
                <Caption>
                  One in four people whose sugar or thyroid was normal at first had crossed over by a later test. People who come back
                  are not a random sample: many return because something felt wrong, so these rates are high for the population.
                  Subclinical hypothyroidism mostly settled: {AKTIV.progression.subNormalised}% normalised and{" "}
                  {AKTIV.progression.subOvert}% became overt (n {n(AKTIV.progression.subN)}).
                </Caption>
              </Card>
            </div>
          </div>
        </section>

        {/* ---------------- The follow-up tool (simulated) ---------------- */}
        <section className="section" style={{ paddingTop: 96, paddingBottom: 88 }}>
          <div className="container">
            <SectionHead
              id="tool"
              title="The follow-up tool, on demo patients"
              blurb="Real names and phone numbers cannot go on a public page, so this section runs the follow-up tool on a simulated cohort shaped like the lab's records. It shows how condition lists merge into one call per person; none of its counts are findings."
              meta={[`${n(h.tested)} simulated people`, `as of ${fmtDay(h.asOf)}`]}
            />
            <div className="dx-grid">
              <Card span={6} title="Calls this week" subtitle="keep-in-care queues, all five conditions, simulated">
                <HBars
                  unit=""
                  max={h.calls.silo}
                  rows={[
                    { label: "One list per condition", value: h.calls.silo, color: "var(--dx-out)" },
                    { label: "One call per person", value: h.calls.single },
                  ]}
                />
                <Caption>
                  {h.calls.savedPct}% fewer calls for the same overdue checks. Each call books one home collection, and every overdue
                  test runs from the same blood draw; only the urine ACR needs a second container.
                </Caption>
              </Card>
              <Card span={6} title="If someone is on this list, how often are they on that one" subtitle="% on the row's pathway also on the column's, simulated">
                <Heatmap rows={labels} cols={labels} values={h.overlap} rowLabel="on this pathway" colLabel="also on" hue="13, 148, 136" />
              </Card>
            </div>
            <div style={{ overflowX: "auto", marginTop: 32 }}>
              <table className="dx-table dx-table-num" style={{ minWidth: 760, background: "#fff", borderRadius: 12 }}>
                <thead>
                  <tr>
                    <th>Condition</th>
                    <th>On pathway</th>
                    <th>Due this week</th>
                    <th>Lost now</th>
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
                      <td className="mono">{n(c.dueNow)}</td>
                      <td className="mono">{c.lostPct}%</td>
                      <td className="dx-dim">{c.tests.join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Caption>
              Diabetes has its own page,{" "}
              <Link href="/diabetes" className="dx-a">
                /diabetes
              </Link>
              . Each tab below holds a condition&apos;s simulated cohort, who gets lost, its call list and the guideline rules behind it.
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
            <h2 id="method">How the numbers were made</h2>
            <div className="dx-prose">
              <p>
                <strong>Real, from the lab:</strong> every figure from the top of the page through &ldquo;What changes in the same
                person&rdquo;. A read-only script on the clinic PC pulled structured results, bills and imaging report headers from
                AKTIV after clinic hours ({n(P.bills)} visits, {monthYear(P.from)} to {monthYear(P.to)}). Visits were linked into
                people by phone number, name, sex and age with the resolver from the{" "}
                <Link href="/diabetes#linking" className="dx-a">
                  diabetes page
                </Link>
                . Ultrasound and echo reports were turned into yes/no findings by rule-based extractors that ran on the same PC.
                Names, phone numbers and report text never left it; this page reads only counts and percentages from{" "}
                <span className="mono">etl-ncd/analysis/results</span>.
              </p>
              <p>
                <strong>Real, published:</strong> every West Bengal and India figure, each linked to its source.
              </p>
              <p>
                <strong>Simulated:</strong> the follow-up tool section and its condition tabs. They run the same rules on a generated
                cohort, because a working call list needs names and phone numbers.
              </p>
              <p>
                <strong>Limits.</strong> These are people a doctor sent for testing, not a sample of West Bengal, so rates run above
                survey rates wherever testing is selective. Someone with one test here may test elsewhere. The ultrasound findings
                come from keyword rules that have not yet been checked against a hand-read sample. Linking by name and phone can merge
                two people or split one. Blood pressure, weight and prescriptions are not in lab records.
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
.ncd-cat td { padding-top: 18px; font-weight: 600; color: var(--ink); font-size: 13px; }
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
