import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "../components/Nav";
import { Footer } from "../components/Footer";
import { RevealOnScroll } from "../components/Reveal";
import { Caption, Card, Heatmap, HBars, SectionHead, Stat } from "../diabetes/charts";
import { fmtDay } from "../diabetes/lib/rng";
import { STYLES } from "../diabetes/styles";
import { NcdSet, n } from "./DiseaseDashboard";
import { CONDITIONS, getHub } from "./lib/pipeline";

export const metadata: Metadata = {
  title: "Long-term conditions, one call per person · SamaHealth",
  description:
    "Diabetes, kidney disease, cholesterol, thyroid and fatty liver follow-up from one lab's records: how the conditions overlap in the same people, and how one ranked call replaces several siloed ones.",
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

/** Published estimates. Not computed from this lab's data. */
const BURDEN = [
  {
    value: "63%",
    label: "of all deaths in India are from noncommunicable diseases",
    source: "WHO, Noncommunicable Diseases Country Profiles 2018",
    href: "https://www.who.int/publications/i/item/9789241514620",
  },
  {
    value: "11.4%",
    label: "of adults have diabetes, and another 15.3% have prediabetes",
    source: "Anjana et al., ICMR-INDIAB-17, Lancet Diabetes & Endocrinology 2023 (n = 113,043)",
    href: "https://doi.org/10.1016/S2213-8587(23)00119-5",
  },
  {
    value: "35.5%",
    label: "of adults have hypertension; 24.0% have high cholesterol",
    source: "ICMR-INDIAB-17, same survey",
    href: "https://doi.org/10.1016/S2213-8587(23)00119-5",
  },
  {
    value: "10.95%",
    label: "of adults have hypothyroidism (15.9% of women, 5.0% of men); about a third of cases were undetected",
    source: "Unnikrishnan et al., Indian J Endocrinol Metab 2013, eight-city study",
    href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3743364",
  },
  {
    value: "38.6%",
    label: "of adults have fatty liver disease (pooled estimate)",
    source: "Shalimar et al., J Clin Exp Hepatol 2022, meta-analysis of 50 studies",
    href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9168741",
  },
  {
    value: "3.5–17.2%",
    label: "of adults have chronic kidney disease, depending on method and setting",
    source: "Pooled CKD-EPI estimate (Value in Health 2015) to SEEK-India (BMC Nephrology 2013)",
    href: "https://bmcnephrol.biomedcentral.com/articles/10.1186/1471-2369-14-114",
  },
];

export default function NcdHubPage() {
  const h = getHub();
  const labels = CONDITIONS.map((c) => c.label);
  return (
    <>
      <Nav variant="light" />
      <main id="main" className="dx">
        <header className="container" style={{ paddingTop: 128, paddingBottom: 24 }}>
          <h1 style={{ fontSize: "clamp(34px, 5.2vw, 58px)", maxWidth: 960 }}>Long-term conditions, followed as one person, not five lists</h1>
          <p style={{ marginTop: 22, fontSize: 19, lineHeight: 1.55, color: "var(--ink-500)", maxWidth: 820 }}>
            A neighbourhood lab already holds the results that show who has diabetes, failing kidneys, high cholesterol, an
            underactive thyroid or a scarring liver, and who has stopped coming back. Each condition page turns those results into
            a follow-up list. This page puts the five together: the same people turn up on several lists, so one coordinator call
            and one blood sample can cover every overdue check.
          </p>
          <p className="mono" style={{ marginTop: 16, fontSize: 12.5, color: "var(--ink-500)", maxWidth: 820 }}>
            Synthetic cohort shaped like the AKTIV research mirror · {n(h.tested)} people · {n(h.identity.results)} results · 3.5
            years to {fmtDay(h.asOf)} · no real patient data.
          </p>
          <NcdSet current="/ncd" />
          <div className="dx-hero-stats">
            <Stat value={`${h.anyCondPct}%`} label="of people tested are on at least one follow-up pathway" note={`${n(h.anyCond)} of ${n(h.tested)}`} />
            <Stat value={`${h.multiPctOfAny}%`} label="of them are on two or more" note={`${n(h.multi)} people`} />
            <Stat value={n(h.calls.single)} label="calls this week, one per person" note={`instead of ${n(h.calls.silo)} across five lists`} />
            <Stat value={`${h.calls.savedPct}%`} label="fewer calls for the same checks" note={`${n(h.calls.saved)} calls saved`} />
          </div>
          <nav className="dx-toc" aria-label="On this page">
            {[
              ["#burden", "Burden in India"],
              ["#overlap", "Overlap"],
              ["#one-call", "One call"],
              ["#conditions", "Each condition"],
              ["#real", "Which numbers are real"],
            ].map(([href, label]) => (
              <a key={href} href={href}>
                {label}
              </a>
            ))}
          </nav>
        </header>

        {/* ---------------- Burden (published) ---------------- */}
        <section className="section dx-band" style={{ paddingTop: 88, paddingBottom: 88 }}>
          <div className="container">
            <SectionHead
              id="burden"
              title="How big the problem is in India"
              blurb="Published national estimates, cited to their source. These are the only figures on this page that describe real people; everything below them is computed on a simulated cohort."
            />
            <div className="ncd-burden">
              {BURDEN.map((b) => (
                <article key={b.value} className="card ncd-burden-card">
                  <div className="dx-stat-value">{b.value}</div>
                  <p className="ncd-burden-label">{b.label}</p>
                  <a href={b.href} className="dx-a ncd-burden-src" target="_blank" rel="noreferrer">
                    {b.source}
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- Overlap ---------------- */}
        <section className="section" style={{ paddingTop: 96, paddingBottom: 88 }}>
          <div className="container">
            <SectionHead
              id="overlap"
              title="The same people, on several lists"
              blurb="A person is on a condition's pathway once a result puts them there (definitions on each condition page). Counts come from one linked timeline per person, so a person is counted once however many visits and PATIENT_KEYs they have."
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
            <SectionHead id="conditions" title="Each condition at a glance" blurb="Open a condition for its rules, its cohort, who gets lost and its own call list." />
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
                        <Link href={c.route} className="dx-a">
                          {c.label}
                        </Link>
                      </td>
                      <td className="mono">{n(c.inPathway)}</td>
                      <td className="mono">{c.pctOfTested}%</td>
                      <td className="mono">{c.alsoOther}%</td>
                      <td className="mono">{n(c.dueNow)}</td>
                      <td className="mono">{c.lostPct}%</td>
                      <td className="mono">{c.loss12 === null ? "see page" : `${c.loss12}%`}</td>
                      <td className="dx-dim">{c.tests.join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Caption>
              Diabetes rules here are the ones on the diabetes page, run on this all-tests cohort, so its counts differ from that
              page&apos;s sugar-test-only cohort. Hypertension, the commonest NCD, is missing because blood pressure is not a lab
              result; it needs a reading at the camp or the collection visit.
            </Caption>
          </div>
        </section>

        {/* ---------------- Which numbers are real ---------------- */}
        <section className="section dx-band" style={{ paddingTop: 96, paddingBottom: 120 }}>
          <div className="container" style={{ maxWidth: 880 }}>
            <h2 id="real">Which numbers are real</h2>
            <div className="dx-prose">
              <p>
                <strong>Real:</strong> the national burden figures at the top of this page, each linked to its source; the
                clinical rules (KDIGO, ADA, Lipid Association of India, ATA / ETA, AASLD), which are applied exactly as written in
                each condition&apos;s rule table; and the code, which reads one row per reported lab parameter, the shape of the
                planned AKTIV to Neon <span className="mono">lab_results</span> view.
              </p>
              <p>
                <strong>Simulated:</strong> every count, percentage and name below the burden section. The cohort is generated so the
                pipeline can be built and checked before real result values are synced. Its prevalences are set to look like a
                referral lab, not measured, so none of them should be quoted as findings from Anubhav Life Care.
              </p>
              <p>
                <strong>When the mirror carries results,</strong> the same build produces each of these figures from real data:
                people on each pathway, loss to follow-up at 12 months, how many calls merging saves, and the checks nobody
                ordered. Those are the numbers to report.
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

const HUB_STYLES = `
.ncd-burden { margin-top: 32px; display: grid; gap: 16px; grid-template-columns: repeat(3, minmax(0, 1fr)); }
.ncd-burden-card { padding: 22px; display: flex; flex-direction: column; gap: 10px; }
.ncd-burden-card:hover { transform: none; }
.ncd-burden-label { font-size: 14.5px; color: var(--ink-700); line-height: 1.5; flex: 1; }
.ncd-burden-src { font-size: 12.5px; line-height: 1.45; }
@media (max-width: 980px) { .ncd-burden { grid-template-columns: 1fr 1fr; } }
@media (max-width: 640px) { .ncd-burden { grid-template-columns: 1fr; } }
`;
