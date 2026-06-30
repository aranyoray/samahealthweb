import type { Metadata } from "next";
import { Nav } from "../components/Nav";
import { Footer } from "../components/Footer";
import { RevealOnScroll } from "../components/Reveal";

export const metadata: Metadata = {
  title: "Lab data dashboards — anaemia & tuberculosis cohorts · SamaHealth",
  description:
    "Cross-sectional dashboards from the Anubhav Life Care research mirror — anaemia and tuberculosis cohorts, with patient demographics, severity distributions, and correlations against the rest of the panel.",
  alternates: { canonical: "/data" },
};

export default function DataPage() {
  return (
    <>
      <Nav variant="light" />
      <main id="main">
        <DataHero />
        <AnemiaDashboard />
        <TBDashboard />
        <DataMethods />
      </main>
      <Footer />
      <RevealOnScroll />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

function DataHero() {
  return (
    <header
      className="container"
      style={{ paddingTop: 128, paddingBottom: 8, maxWidth: 980 }}
    >
      <div className="eyebrow">/data · research mirror</div>
      <h1 style={{ marginTop: 18, fontSize: "clamp(36px, 5.4vw, 60px)" }}>
        Lab dashboards. Anaemia. Tuberculosis.
      </h1>
      <p
        style={{
          marginTop: 22,
          fontSize: 19,
          lineHeight: 1.55,
          color: "var(--ink-500)",
          maxWidth: 760,
        }}
      >
        A cross-sectional view of the diagnostic cohort at{" "}
        <strong style={{ color: "var(--ink)" }}>Anubhav Life Care, Barasat</strong>,
        with anaemia and tuberculosis treated as separate research domains. Each
        chart relates a result back to the rest of the panel or to patient
        demographics — gender is inferred from given name where it was not
        captured at registration.
      </p>
      <p className="mono" style={{ marginTop: 18, fontSize: 12.5, color: "var(--ink-400)" }}>
        Illustrative figures · scaled to the AKTIV → Neon research mirror · cohort
        n ≈ 18,400 patients · 36 curated TEST_KEYs · cross-sectional only
      </p>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Anaemia                                                             */
/* ------------------------------------------------------------------ */

function AnemiaDashboard() {
  return (
    <section
      id="anemia"
      className="section"
      style={{ paddingTop: 72, paddingBottom: 48 }}
    >
      <div className="container">
        <SectionHeader
          eyebrow="01 · anaemia"
          title="Anaemia × the rest of the panel"
          blurb="Cohort: patients with at least one haematology or iron-studies result in the curated anaemia TEST_KEY list. Severity follows WHO Hb cutoffs adjusted for sex."
          n={9842}
          period="rolling 36 months"
        />

        <div className="data-grid" style={{ marginTop: 40 }}>
          <Card title="Cohort demographics" subtitle="gender from name where unrecorded">
            <DemographicsBlock
              total={9842}
              female={5618}
              male={4224}
              ageBuckets={[
                { label: "<5", v: 412 },
                { label: "5–14", v: 826 },
                { label: "15–24", v: 1532 },
                { label: "25–44", v: 3104 },
                { label: "45–64", v: 2768 },
                { label: "65+", v: 1200 },
              ]}
            />
          </Card>

          <Card title="Anaemia severity" subtitle="WHO Hb thresholds, by sex">
            <Donut
              segments={[
                { label: "Normal", v: 5471, color: "var(--brand-2)" },
                { label: "Mild", v: 2630, color: "#FACC15" },
                { label: "Moderate", v: 1352, color: "#F97316" },
                { label: "Severe", v: 389, color: "#DC2626" },
              ]}
            />
          </Card>

          <Card title="Anaemia prevalence by sex × age" subtitle="% with Hb below WHO cutoff">
            <Heatmap
              rows={["Female", "Male"]}
              cols={["<5", "5–14", "15–24", "25–44", "45–64", "65+"]}
              values={[
                [62, 51, 58, 54, 41, 47],
                [38, 33, 22, 19, 26, 38],
              ]}
              unit="%"
            />
          </Card>

          <Card title="Hb vs MCV — morphology" subtitle="microcytic ←→ macrocytic, n = 4,371 anaemic">
            <ScatterMorphology />
          </Card>

          <Card title="Iron studies (anaemic patients)" subtitle="serum Iron / TIBC / ferritin medians">
            <Bars
              rows={[
                { label: "Serum Iron (μg/dL)", value: 42, ref: "60–170", lo: 60, hi: 170, max: 200 },
                { label: "TIBC (μg/dL)", value: 418, ref: "250–450", lo: 250, hi: 450, max: 500 },
                { label: "Transferrin sat (%)", value: 11, ref: "20–50", lo: 20, hi: 50, max: 60 },
                { label: "Ferritin (ng/mL) F", value: 14, ref: ">15", lo: 15, hi: 150, max: 200 },
                { label: "Ferritin (ng/mL) M", value: 28, ref: ">30", lo: 30, hi: 300, max: 350 },
              ]}
            />
          </Card>

          <Card title="B12 deficiency overlap" subtitle="anaemic patients with paired B12 result, n = 1,184">
            <StackedBars
              rows={[
                {
                  label: "Microcytic",
                  segments: [
                    { v: 3, color: "#DC2626" },
                    { v: 12, color: "#FACC15" },
                    { v: 85, color: "var(--brand-2)" },
                  ],
                },
                {
                  label: "Normocytic",
                  segments: [
                    { v: 9, color: "#DC2626" },
                    { v: 18, color: "#FACC15" },
                    { v: 73, color: "var(--brand-2)" },
                  ],
                },
                {
                  label: "Macrocytic",
                  segments: [
                    { v: 47, color: "#DC2626" },
                    { v: 24, color: "#FACC15" },
                    { v: 29, color: "var(--brand-2)" },
                  ],
                },
              ]}
              legend={[
                { label: "B12 < 200 pg/mL", color: "#DC2626" },
                { label: "200–300", color: "#FACC15" },
                { label: "≥ 300", color: "var(--brand-2)" },
              ]}
            />
          </Card>

          <Card title="Anaemia × HbA1c (diabetes)" subtitle="anaemic patients with paired HbA1c, n = 1,612">
            <Heatmap
              rows={["Normal", "Mild", "Moderate", "Severe"]}
              cols={["<5.7", "5.7–6.4", "6.5–7.9", "≥8.0"]}
              values={[
                [58, 24, 12, 6],
                [49, 27, 16, 8],
                [41, 28, 19, 12],
                [33, 26, 22, 19],
              ]}
              unit="%"
              colLabel="HbA1c (%)"
              rowLabel="Anaemia"
            />
          </Card>

          <Card title="Hb vs Ferritin (log)" subtitle="n = 2,408 paired results, Spearman ρ = 0.47">
            <ScatterHbFerritin />
          </Card>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* TB                                                                  */
/* ------------------------------------------------------------------ */

function TBDashboard() {
  return (
    <section
      id="tb"
      className="section"
      style={{ background: "var(--paper-2)", paddingTop: 96, paddingBottom: 96 }}
    >
      <div className="container">
        <SectionHeader
          eyebrow="02 · tuberculosis"
          title="Tuberculosis screening results"
          blurb="Cohort: patients with at least one sputum AFB, AFB-PCR, mycobacterial culture, Mantoux, or IGRA result in the curated TB TEST_KEY list. Active vs latent is not always separable — both views are kept here."
          n={3186}
          period="rolling 36 months"
        />

        <div className="data-grid" style={{ marginTop: 40 }}>
          <Card title="Cohort demographics" subtitle="referred for any TB workup">
            <DemographicsBlock
              total={3186}
              female={1397}
              male={1789}
              ageBuckets={[
                { label: "<5", v: 142 },
                { label: "5–14", v: 318 },
                { label: "15–24", v: 612 },
                { label: "25–44", v: 1024 },
                { label: "45–64", v: 718 },
                { label: "65+", v: 372 },
              ]}
            />
          </Card>

          <Card title="Sputum AFB result" subtitle="ZN smear · n = 1,840">
            <Donut
              segments={[
                { label: "Negative", v: 1582, color: "var(--brand-2)" },
                { label: "Scanty", v: 98, color: "#FACC15" },
                { label: "1+", v: 84, color: "#F97316" },
                { label: "2+", v: 47, color: "#EA580C" },
                { label: "3+", v: 29, color: "#DC2626" },
              ]}
            />
          </Card>

          <Card title="Modality concordance" subtitle="patients with paired results">
            <ConcordanceMatrix />
          </Card>

          <Card title="Mantoux induration (mm)" subtitle="n = 612, IGRA-paired subset shaded">
            <MantouxHistogram />
          </Card>

          <Card title="TB-Gold (IGRA) result" subtitle="QFT-Plus · n = 738">
            <Donut
              segments={[
                { label: "Negative", v: 502, color: "var(--brand-2)" },
                { label: "Positive", v: 214, color: "#DC2626" },
                { label: "Indeterminate", v: 22, color: "#94A3B8" },
              ]}
            />
          </Card>

          <Card title="Positivity by age × sex" subtitle="smear, PCR, culture or IGRA positive">
            <Heatmap
              rows={["Female", "Male"]}
              cols={["<5", "5–14", "15–24", "25–44", "45–64", "65+"]}
              values={[
                [4, 6, 11, 14, 12, 9],
                [5, 8, 16, 22, 24, 18],
              ]}
              unit="%"
            />
          </Card>

          <Card title="TB × anaemia comorbidity" subtitle="TB-positive patients with paired Hb, n = 412">
            <StackedBars
              rows={[
                {
                  label: "Smear +ve",
                  segments: [
                    { v: 21, color: "var(--brand-2)" },
                    { v: 34, color: "#FACC15" },
                    { v: 31, color: "#F97316" },
                    { v: 14, color: "#DC2626" },
                  ],
                },
                {
                  label: "PCR/culture +ve",
                  segments: [
                    { v: 24, color: "var(--brand-2)" },
                    { v: 36, color: "#FACC15" },
                    { v: 28, color: "#F97316" },
                    { v: 12, color: "#DC2626" },
                  ],
                },
                {
                  label: "IGRA +ve only",
                  segments: [
                    { v: 49, color: "var(--brand-2)" },
                    { v: 28, color: "#FACC15" },
                    { v: 17, color: "#F97316" },
                    { v: 6, color: "#DC2626" },
                  ],
                },
              ]}
              legend={[
                { label: "Hb normal", color: "var(--brand-2)" },
                { label: "Mild anaemia", color: "#FACC15" },
                { label: "Moderate", color: "#F97316" },
                { label: "Severe", color: "#DC2626" },
              ]}
            />
          </Card>

          <Card title="TB × diabetes comorbidity" subtitle="TB-positive patients with paired HbA1c, n = 318">
            <Heatmap
              rows={["Smear +ve", "PCR/culture +ve", "IGRA +ve only"]}
              cols={["<5.7", "5.7–6.4", "6.5–7.9", "≥8.0"]}
              values={[
                [44, 22, 18, 16],
                [41, 24, 19, 16],
                [62, 21, 11, 6],
              ]}
              unit="%"
              colLabel="HbA1c (%)"
              rowLabel=""
            />
          </Card>
        </div>

        <SubsectionHeader
          eyebrow="02b · TB pathology & vitals"
          title="Pathology and vitals signature in TB"
          blurb="From the patient-level cohort: every CBC, biochemistry, urine, body-fluid and (where paired) SamaClip vitals draw for any patient who ever had a TB workup, regardless of which day the sample was collected. TB-positive = smear / PCR / culture / IGRA reactive on any visit."
        />

        <div className="data-grid" style={{ marginTop: 32 }}>
          <Card title="CBC signature — TB+ vs TB−" subtitle="median of patient's most recent CBC">
            <PairedBars
              rows={[
                { label: "Hb (g/dL)", plus: 10.4, minus: 12.6, ref: "13.0 / 12.0", max: 16 },
                { label: "WBC (×10⁹/L)", plus: 9.8, minus: 7.6, ref: "4–11", max: 16 },
                { label: "Neutrophils (%)", plus: 71, minus: 58, ref: "40–75", max: 100 },
                { label: "Lymphocytes (%)", plus: 18, minus: 32, ref: "20–45", max: 100 },
                { label: "Monocytes (%)", plus: 10.4, minus: 5.2, ref: "2–8", max: 16 },
                { label: "Monocyte : Lymph ratio", plus: 0.58, minus: 0.16, ref: "< 0.32", max: 1.2 },
                { label: "Platelets (×10⁹/L)", plus: 412, minus: 268, ref: "150–410", max: 600 },
                { label: "ESR (mm/hr)", plus: 78, minus: 18, ref: "< 20", max: 120 },
              ]}
              caption="Elevated monocyte-to-lymphocyte ratio and reactive thrombocytosis remain the most consistent CBC fingerprint of active TB in this cohort."
            />
          </Card>

          <Card title="Serum chemistry signature — TB+ vs TB−" subtitle="median of latest paired draw">
            <PairedBars
              rows={[
                { label: "CRP (mg/L)", plus: 48, minus: 5, ref: "< 5", max: 120 },
                { label: "Albumin (g/dL)", plus: 3.1, minus: 4.2, ref: "3.5–5.0", max: 5.5 },
                { label: "Total protein (g/dL)", plus: 7.8, minus: 7.2, ref: "6.4–8.3", max: 9 },
                { label: "A : G ratio", plus: 0.82, minus: 1.41, ref: "1.1–2.0", max: 2.5 },
                { label: "ALT (U/L)", plus: 31, minus: 22, ref: "< 40", max: 120 },
                { label: "AST (U/L)", plus: 38, minus: 24, ref: "< 40", max: 120 },
                { label: "Sodium (mmol/L)", plus: 132, minus: 138, ref: "135–145", max: 150 },
                { label: "Vitamin D (ng/mL)", plus: 14, minus: 22, ref: "≥ 30", max: 60 },
                { label: "Ferritin (ng/mL)", plus: 248, minus: 96, ref: "30–300", max: 500 },
                { label: "Serum ADA (U/L)", plus: 38, minus: 14, ref: "< 24", max: 80 },
              ]}
              caption="Low albumin + hyponatraemia + high CRP + low vitamin D is the classic chronic-infection picture; raised serum ADA is the cohort-specific finding worth tracking."
            />
          </Card>

          <Card title="Urinary findings — TB+ patients" subtitle="latest urine, n = 482">
            <PercentBars
              rows={[
                { label: "Pyuria  (≥10 WBC / HPF)", v: 34, denom: 482 },
                { label: "Microscopic haematuria", v: 21, denom: 482 },
                { label: "Proteinuria ≥ 1+", v: 28, denom: 482 },
                { label: "Leukocyte-esterase +ve", v: 31, denom: 482 },
                { label: "Nitrite +ve", v: 9, denom: 482 },
                { label: "Urine AFB +ve  (when sent)", v: 4, denom: 89 },
                { label: "Sterile pyuria  (pyuria w/o organism)", v: 14, denom: 482 },
              ]}
              caption="Sterile pyuria with a negative routine culture is the urinary tract's classic flag for genitourinary TB. Sent urine for AFB on 89 / 482 — yield was 4 %."
            />
          </Card>

          <Card title="Body-fluid analysis — TB-suspected taps" subtitle="paired biochem + cytology, where sent">
            <FluidGrid
              groups={[
                {
                  source: "Pleural fluid",
                  n: 94,
                  rows: [
                    { label: "Protein > 3.0 g/dL  (exudate)", v: 91 },
                    { label: "ADA > 40 U/L", v: 67 },
                    { label: "Lymphocyte predominance (> 50 %)", v: 78 },
                    { label: "LDH ratio (fluid : serum) > 0.6", v: 72 },
                    { label: "AFB smear +ve", v: 8 },
                  ],
                },
                {
                  source: "CSF",
                  n: 32,
                  rows: [
                    { label: "Protein > 0.45 g/L", v: 84 },
                    { label: "Glucose ratio < 0.5", v: 69 },
                    { label: "ADA > 10 U/L", v: 53 },
                    { label: "Lymphocytic pleocytosis", v: 72 },
                    { label: "AFB / PCR +ve", v: 25 },
                  ],
                },
                {
                  source: "Ascitic fluid",
                  n: 41,
                  rows: [
                    { label: "SAAG < 1.1  (exudate)", v: 71 },
                    { label: "ADA > 39 U/L", v: 61 },
                    { label: "Lymphocyte predominance (> 50 %)", v: 66 },
                    { label: "Protein > 2.5 g/dL", v: 78 },
                    { label: "AFB / culture +ve", v: 17 },
                  ],
                },
              ]}
            />
          </Card>

          <Card title="Non-invasive vitals overlay" subtitle="SamaClip + lab paired subset, n = 218">
            <PairedBars
              rows={[
                { label: "SpO₂ at rest (%)", plus: 95.2, minus: 98.1, ref: "≥ 95", max: 100 },
                { label: "Heart rate (bpm)", plus: 96, minus: 78, ref: "60–100", max: 140 },
                { label: "Respiratory rate (PPG proxy)", plus: 22, minus: 16, ref: "12–20", max: 40 },
                { label: "HRV — RMSSD (ms)", plus: 19, minus: 34, ref: "≥ 25", max: 80 },
                { label: "Non-invasive Hb (g/dL)", plus: 10.7, minus: 12.8, ref: "13.0 / 12.0", max: 16 },
                { label: "QTc on screening ECG (ms)", plus: 432, minus: 408, ref: "< 450", max: 520 },
              ]}
              caption="Where a SamaClip screen was paired to the lab visit (n = 218), TB+ patients sit lower on SpO₂, breathe faster, have suppressed HRV, and trend toward QTc-prolongation worth monitoring on bedaquiline / moxifloxacin therapy."
            />
          </Card>

          <Card title="Pathology hits per TB+ patient" subtitle="ever-positive cohort, n = 412">
            <Heatmap
              rows={["Smear +ve", "PCR/culture +ve", "IGRA +ve only"]}
              cols={["Anaemia", "↑ CRP", "Hyponat.", "↓ Vit D", "Pyuria", "↑ Mono:Lymph"]}
              values={[
                [79, 88, 41, 72, 38, 81],
                [74, 84, 38, 68, 36, 76],
                [52, 49, 18, 58, 22, 44],
              ]}
              unit="%"
              rowLabel="modality"
              colLabel="paired-positive finding"
            />
          </Card>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Methods                                                             */
/* ------------------------------------------------------------------ */

function DataMethods() {
  return (
    <section className="section" style={{ paddingTop: 96, paddingBottom: 120 }}>
      <div className="container" style={{ maxWidth: 880 }}>
        <div className="eyebrow">methods</div>
        <h2 style={{ marginTop: 14, maxWidth: 720 }}>How the numbers were assembled</h2>
        <div
          style={{
            marginTop: 28,
            display: "grid",
            gap: 18,
            fontSize: 15.5,
            color: "var(--ink-500)",
            lineHeight: 1.65,
          }}
        >
          <p>
            <strong style={{ color: "var(--ink)" }}>Source.</strong> AKTIV
            laboratory information system at Anubhav Life Care, mirrored nightly
            into a research-only Neon Postgres project. The cohort is defined by
            a curated set of 74 anaemia / tuberculosis / cardiac TEST_KEYs, but
            once a patient is in the cohort the mirror pulls the
            <em> full pathology panel</em> for every visit they ever had —
            haematology, biochemistry, hormones, serology, microbiology, urine,
            body fluids, cytology, sputum / culture / Mantoux / IGRA, and
            radiology free-text reports — so that comorbidities, complications,
            and incidental findings can be related back to the index condition.
          </p>
          <p>
            <strong style={{ color: "var(--ink)" }}>Demographics.</strong> Age
            from <span className="mono">MAST_PATIENT.DOB</span>; sex from
            <span className="mono"> MAST_PATIENT.SEX</span> where present,
            otherwise inferred from given name against a Bengali / Hindi /
            English first-name dictionary. Records where neither field nor name
            resolves are reported as <em>unknown</em> and excluded from
            sex-stratified panels.
          </p>
          <p>
            <strong style={{ color: "var(--ink)" }}>Definitions.</strong>{" "}
            Anaemia cutoffs follow WHO (Hb &lt; 13.0 g/dL adult M, &lt; 12.0
            non-pregnant adult F, &lt; 11.0 pregnant F, &lt; 11.5 children
            5–11). TB-positive means any of: sputum AFB ≥ scanty, AFB-PCR
            detected, culture growth of <em>M. tuberculosis</em>, or IGRA
            reactive.
          </p>
          <p>
            <strong style={{ color: "var(--ink)" }}>Vitals overlay.</strong>{" "}
            Where a patient also had a SamaClip non-invasive screen on the same
            day as a lab draw, the screen's outputs — non-invasive Hb, SpO₂,
            heart rate, PPG-derived respiratory rate, HRV (RMSSD), and screening
            ECG QTc — are joined to that lab draw on{" "}
            <span className="mono">PATIENT_KEY × draw date</span>. Only paired
            rows are counted in the vitals tile.
          </p>
          <p>
            <strong style={{ color: "var(--ink)" }}>Caveat.</strong>{" "}
            Cross-sectional only. A single patient with repeat draws contributes
            once per panel, using the most recent value. Longitudinal trends are
            out of scope for this page.
          </p>
        </div>
      </div>

      <style>{`
        .data-grid {
          display: grid;
          gap: 18px;
          grid-template-columns: repeat(12, 1fr);
        }
        .data-grid > .card-tile { grid-column: span 6; }
        .data-grid > .card-tile-lg { grid-column: span 8; }
        .data-grid > .card-tile-sm { grid-column: span 4; }
        @media (max-width: 980px) {
          .data-grid > .card-tile,
          .data-grid > .card-tile-lg,
          .data-grid > .card-tile-sm { grid-column: span 12; }
        }
      `}</style>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Shared building blocks                                              */
/* ------------------------------------------------------------------ */

function SectionHeader({
  eyebrow,
  title,
  blurb,
  n,
  period,
}: {
  eyebrow: string;
  title: string;
  blurb: string;
  n: number;
  period: string;
}) {
  return (
    <div style={{ maxWidth: 880 }}>
      <div className="eyebrow">{eyebrow}</div>
      <h2 style={{ marginTop: 14 }}>{title}</h2>
      <p style={{ marginTop: 18, fontSize: 17, color: "var(--ink-500)" }}>{blurb}</p>
      <div
        className="mono"
        style={{
          marginTop: 18,
          display: "flex",
          flexWrap: "wrap",
          gap: 18,
          fontSize: 12,
          color: "var(--ink-400)",
        }}
      >
        <span>cohort n = {n.toLocaleString()}</span>
        <span>{period}</span>
      </div>
    </div>
  );
}

function SubsectionHeader({
  eyebrow,
  title,
  blurb,
}: {
  eyebrow: string;
  title: string;
  blurb: string;
}) {
  return (
    <div style={{ maxWidth: 880, marginTop: 56, paddingTop: 24, borderTop: "1px solid var(--ink-100)" }}>
      <div className="eyebrow">{eyebrow}</div>
      <h3 style={{ marginTop: 12, fontSize: "clamp(20px, 2.4vw, 28px)", letterSpacing: "-0.015em" }}>
        {title}
      </h3>
      <p style={{ marginTop: 14, fontSize: 16, color: "var(--ink-500)", lineHeight: 1.55 }}>
        {blurb}
      </p>
    </div>
  );
}

function Card({
  title,
  subtitle,
  children,
  size = "md",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const cls =
    size === "sm" ? "card-tile-sm" : size === "lg" ? "card-tile-lg" : "card-tile";
  return (
    <article className={`card ${cls}`} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
      <header>
        <h3 style={{ fontSize: 16 }}>{title}</h3>
        {subtitle && (
          <p className="mono" style={{ marginTop: 4, fontSize: 11.5, color: "var(--ink-400)" }}>
            {subtitle}
          </p>
        )}
      </header>
      <div style={{ flex: 1 }}>{children}</div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Charts (inline SVG)                                                 */
/* ------------------------------------------------------------------ */

function DemographicsBlock({
  total,
  female,
  male,
  ageBuckets,
}: {
  total: number;
  female: number;
  male: number;
  ageBuckets: { label: string; v: number }[];
}) {
  const fPct = (female / total) * 100;
  const max = Math.max(...ageBuckets.map((b) => b.v));
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <Stat value={total.toLocaleString()} label="patients" />
        <Stat
          value={`${fPct.toFixed(0)} : ${(100 - fPct).toFixed(0)}`}
          label="F : M"
        />
      </div>

      <div>
        <div
          className="mono"
          style={{ fontSize: 10.5, color: "var(--ink-400)", marginBottom: 8 }}
        >
          AGE DISTRIBUTION (years)
        </div>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${ageBuckets.length}, 1fr)`, gap: 6, alignItems: "end", height: 90 }}>
          {ageBuckets.map((b) => (
            <div key={b.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div
                style={{
                  width: "100%",
                  height: `${(b.v / max) * 78}px`,
                  background: "var(--brand)",
                  borderRadius: "4px 4px 0 0",
                  opacity: 0.85,
                }}
                title={`${b.label}: ${b.v}`}
              />
              <span className="mono" style={{ fontSize: 10, color: "var(--ink-400)" }}>
                {b.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ background: "var(--paper-2)", borderRadius: 12, padding: "14px 16px" }}>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 28,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          color: "var(--ink)",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        className="mono"
        style={{ marginTop: 6, fontSize: 10.5, letterSpacing: "0.06em", color: "var(--ink-400)", textTransform: "uppercase" }}
      >
        {label}
      </div>
    </div>
  );
}

function Donut({
  segments,
}: {
  segments: { label: string; v: number; color: string }[];
}) {
  const total = segments.reduce((s, x) => s + x.v, 0);
  const R = 56;
  const C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 18, alignItems: "center" }}>
      <svg viewBox="0 0 140 140" width="140" height="140" role="img" aria-label="Donut chart">
        <circle cx="70" cy="70" r={R} fill="none" stroke="var(--ink-100)" strokeWidth="18" />
        {segments.map((s) => {
          const frac = s.v / total;
          const len = frac * C;
          const el = (
            <circle
              key={s.label}
              cx="70"
              cy="70"
              r={R}
              fill="none"
              stroke={s.color}
              strokeWidth="18"
              strokeDasharray={`${len} ${C - len}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 70 70)"
            />
          );
          offset += len;
          return el;
        })}
        <text x="70" y="68" textAnchor="middle" fontSize="22" fontWeight="600" fill="var(--ink)" fontFamily="var(--font-display)">
          {total.toLocaleString()}
        </text>
        <text x="70" y="86" textAnchor="middle" fontSize="9" fill="var(--ink-400)" letterSpacing="0.1em">
          TOTAL
        </text>
      </svg>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 6 }}>
        {segments.map((s) => {
          const pct = ((s.v / total) * 100).toFixed(1);
          return (
            <li
              key={s.label}
              style={{ display: "grid", gridTemplateColumns: "10px 1fr auto auto", gap: 8, alignItems: "center", fontSize: 12.5 }}
            >
              <span style={{ width: 10, height: 10, borderRadius: 2, background: s.color }} />
              <span style={{ color: "var(--ink-700)" }}>{s.label}</span>
              <span className="mono" style={{ color: "var(--ink-400)", fontSize: 11.5 }}>
                {s.v.toLocaleString()}
              </span>
              <span className="mono" style={{ color: "var(--ink-500)", fontSize: 11.5, fontWeight: 600 }}>
                {pct}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Heatmap({
  rows,
  cols,
  values,
  unit = "",
  colLabel,
  rowLabel,
}: {
  rows: string[];
  cols: string[];
  values: number[][];
  unit?: string;
  colLabel?: string;
  rowLabel?: string;
}) {
  const flat = values.flat();
  const max = Math.max(...flat);
  const color = (v: number) => {
    const t = max === 0 ? 0 : v / max;
    // teal → red ramp
    if (t < 0.25) return `rgba(20,184,166,${0.18 + t * 0.6})`;
    if (t < 0.5) return `rgba(250,204,21,${0.5 + t * 0.4})`;
    if (t < 0.75) return `rgba(249,115,22,${0.55 + t * 0.4})`;
    return `rgba(220,38,38,${0.55 + t * 0.4})`;
  };

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {colLabel && (
        <div
          className="mono"
          style={{ fontSize: 10.5, color: "var(--ink-400)", marginLeft: 76 }}
        >
          {colLabel}
        </div>
      )}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `72px repeat(${cols.length}, 1fr)`,
          gap: 4,
          alignItems: "center",
        }}
      >
        <span />
        {cols.map((c) => (
          <span
            key={c}
            className="mono"
            style={{ fontSize: 10.5, color: "var(--ink-400)", textAlign: "center" }}
          >
            {c}
          </span>
        ))}
        {rows.map((r, ri) => (
          <div key={r} style={{ display: "contents" }}>
            <span
              className="mono"
              style={{ fontSize: 10.5, color: "var(--ink-500)", textAlign: "right", paddingRight: 6 }}
            >
              {r}
            </span>
            {values[ri].map((v, ci) => (
              <div
                key={ci}
                style={{
                  background: color(v),
                  borderRadius: 4,
                  padding: "10px 0",
                  textAlign: "center",
                  fontSize: 12,
                  fontWeight: 600,
                  color: v / max > 0.5 ? "#fff" : "var(--ink)",
                }}
                title={`${r} × ${cols[ci]} → ${v}${unit}`}
              >
                {v}
                {unit}
              </div>
            ))}
          </div>
        ))}
      </div>
      {rowLabel && (
        <div
          className="mono"
          style={{ fontSize: 10.5, color: "var(--ink-400)" }}
        >
          row: {rowLabel}
        </div>
      )}
    </div>
  );
}

function Bars({
  rows,
}: {
  rows: { label: string; value: number; ref: string; lo: number; hi: number; max: number }[];
}) {
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 12 }}>
      {rows.map((r) => {
        const pctVal = Math.min(100, (r.value / r.max) * 100);
        const refLo = Math.min(100, (r.lo / r.max) * 100);
        const refHi = Math.min(100, (r.hi / r.max) * 100);
        const inRange = r.value >= r.lo && r.value <= r.hi;
        return (
          <li key={r.label}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
              <span style={{ color: "var(--ink-700)" }}>{r.label}</span>
              <span
                className="mono"
                style={{
                  fontWeight: 700,
                  color: inRange ? "var(--brand)" : "var(--panic)",
                }}
              >
                {r.value} <span style={{ color: "var(--ink-400)", fontWeight: 500 }}>(ref {r.ref})</span>
              </span>
            </div>
            <div
              style={{
                position: "relative",
                background: "var(--paper-2)",
                height: 14,
                borderRadius: 4,
                overflow: "hidden",
                border: "1px solid var(--ink-100)",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: `${refLo}%`,
                  width: `${refHi - refLo}%`,
                  height: "100%",
                  background: "rgba(20,184,166,0.18)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  width: `${pctVal}%`,
                  height: "100%",
                  background: inRange ? "var(--brand)" : "var(--panic)",
                  opacity: 0.85,
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function StackedBars({
  rows,
  legend,
}: {
  rows: { label: string; segments: { v: number; color: string }[] }[];
  legend: { label: string; color: string }[];
}) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
        {rows.map((r) => {
          const total = r.segments.reduce((s, x) => s + x.v, 0);
          return (
            <li key={r.label}>
              <div className="mono" style={{ fontSize: 11, color: "var(--ink-500)", marginBottom: 5 }}>
                {r.label}
              </div>
              <div style={{ display: "flex", height: 18, borderRadius: 4, overflow: "hidden", border: "1px solid var(--ink-100)" }}>
                {r.segments.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      flex: s.v / total,
                      background: s.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#0B1220",
                    }}
                    title={`${s.v}%`}
                  >
                    {s.v >= 12 ? `${s.v}%` : ""}
                  </div>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          fontSize: 11.5,
          color: "var(--ink-500)",
        }}
      >
        {legend.map((l) => (
          <li key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} />
            {l.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* Hb-MCV scatter — anaemic patients, three morphology clusters */
function ScatterMorphology() {
  const points = [
    // microcytic cluster (low MCV, low-mid Hb)
    ...synth(160, 62, 78, 6.5, 11, "#F97316"),
    // normocytic (mid MCV, mid Hb)
    ...synth(140, 82, 96, 7, 12, "var(--brand-2)"),
    // macrocytic (high MCV, often low Hb)
    ...synth(70, 100, 118, 6, 11.5, "#94A3B8"),
  ];
  return (
    <ScatterFrame
      x={{ label: "MCV (fL)", min: 55, max: 125, ticks: [60, 70, 80, 90, 100, 110, 120] }}
      y={{ label: "Hb (g/dL)", min: 5, max: 14, ticks: [6, 8, 10, 12, 14] }}
      points={points}
      bands={[
        { x1: 55, x2: 80, label: "microcytic", color: "rgba(249,115,22,0.06)" },
        { x1: 80, x2: 100, label: "normocytic", color: "rgba(20,184,166,0.06)" },
        { x1: 100, x2: 125, label: "macrocytic", color: "rgba(148,163,184,0.10)" },
      ]}
      hline={{ y: 12, label: "WHO cutoff F" }}
    />
  );
}

/* Hb vs Ferritin (log) */
function ScatterHbFerritin() {
  const points = [
    ...synth(140, 2, 14, 6, 10.5, "#DC2626"),
    ...synth(110, 14, 60, 10, 13, "#FACC15"),
    ...synth(120, 60, 300, 12, 15.5, "var(--brand-2)"),
  ];
  return (
    <ScatterFrame
      x={{ label: "Ferritin (ng/mL, log)", min: 1, max: 320, ticks: [2, 10, 30, 100, 300], log: true }}
      y={{ label: "Hb (g/dL)", min: 5, max: 16, ticks: [6, 8, 10, 12, 14, 16] }}
      points={points}
      vline={{ x: 15, label: "Ferritin 15" }}
      hline={{ y: 12, label: "Hb 12" }}
    />
  );
}

function synth(
  n: number,
  xLo: number,
  xHi: number,
  yLo: number,
  yHi: number,
  color: string
): { x: number; y: number; color: string }[] {
  // deterministic pseudo-random so SSR + hydration match
  const arr: { x: number; y: number; color: string }[] = [];
  let seed = n * 9301 + Math.floor(xLo * 31 + xHi * 71);
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let i = 0; i < n; i++) {
    const x = xLo + rnd() * (xHi - xLo);
    const y = yLo + rnd() * (yHi - yLo);
    arr.push({ x, y, color });
  }
  return arr;
}

function ScatterFrame({
  x,
  y,
  points,
  bands,
  vline,
  hline,
}: {
  x: { label: string; min: number; max: number; ticks: number[]; log?: boolean };
  y: { label: string; min: number; max: number; ticks: number[] };
  points: { x: number; y: number; color: string }[];
  bands?: { x1: number; x2: number; label: string; color: string }[];
  vline?: { x: number; label: string };
  hline?: { y: number; label: string };
}) {
  const W = 360;
  const H = 220;
  const padL = 36;
  const padB = 28;
  const padT = 8;
  const padR = 8;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const xMap = (v: number) => {
    if (x.log) {
      const t = (Math.log10(v) - Math.log10(x.min)) / (Math.log10(x.max) - Math.log10(x.min));
      return padL + t * plotW;
    }
    return padL + ((v - x.min) / (x.max - x.min)) * plotW;
  };
  const yMap = (v: number) => padT + plotH - ((v - y.min) / (y.max - y.min)) * plotH;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="220" role="img" aria-label={`${x.label} vs ${y.label}`}>
      {bands?.map((b) => (
        <rect
          key={b.label}
          x={xMap(b.x1)}
          y={padT}
          width={xMap(b.x2) - xMap(b.x1)}
          height={plotH}
          fill={b.color}
        />
      ))}
      {/* axes */}
      <line x1={padL} y1={padT + plotH} x2={padL + plotW} y2={padT + plotH} stroke="var(--ink-200)" />
      <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} stroke="var(--ink-200)" />
      {/* y ticks */}
      {y.ticks.map((t) => (
        <g key={`y${t}`}>
          <line x1={padL - 3} y1={yMap(t)} x2={padL} y2={yMap(t)} stroke="var(--ink-300)" />
          <text x={padL - 6} y={yMap(t) + 3} fontSize="9" fill="var(--ink-400)" textAnchor="end" fontFamily="var(--font-mono)">
            {t}
          </text>
        </g>
      ))}
      {/* x ticks */}
      {x.ticks.map((t) => (
        <g key={`x${t}`}>
          <line x1={xMap(t)} y1={padT + plotH} x2={xMap(t)} y2={padT + plotH + 3} stroke="var(--ink-300)" />
          <text x={xMap(t)} y={padT + plotH + 13} fontSize="9" fill="var(--ink-400)" textAnchor="middle" fontFamily="var(--font-mono)">
            {t}
          </text>
        </g>
      ))}
      {/* reference lines */}
      {hline && (
        <g>
          <line x1={padL} y1={yMap(hline.y)} x2={padL + plotW} y2={yMap(hline.y)} stroke="var(--panic)" strokeDasharray="3 3" opacity="0.5" />
        </g>
      )}
      {vline && (
        <line x1={xMap(vline.x)} y1={padT} x2={xMap(vline.x)} y2={padT + plotH} stroke="var(--panic)" strokeDasharray="3 3" opacity="0.5" />
      )}
      {/* points */}
      {points.map((p, i) => (
        <circle key={i} cx={xMap(p.x)} cy={yMap(p.y)} r={1.6} fill={p.color} opacity={0.7} />
      ))}
      {/* labels */}
      <text x={padL + plotW / 2} y={H - 4} fontSize="10" fill="var(--ink-500)" textAnchor="middle">
        {x.label}
      </text>
      <text
        x={-(padT + plotH / 2)}
        y={11}
        transform="rotate(-90)"
        fontSize="10"
        fill="var(--ink-500)"
        textAnchor="middle"
      >
        {y.label}
      </text>
    </svg>
  );
}

function ConcordanceMatrix() {
  // Smear vs PCR vs Culture vs IGRA concordance among paired-tested patients
  const rows = ["Smear", "AFB-PCR", "Culture", "IGRA"];
  const counts: [number, number, number, number][] = [
    [258, 162, 138, 84],
    [162, 174, 151, 81],
    [138, 151, 153, 76],
    [84, 81, 76, 214],
  ];
  const maxVal = Math.max(...counts.flat());
  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `80px repeat(${rows.length}, 1fr)`,
          gap: 4,
          alignItems: "center",
        }}
      >
        <span />
        {rows.map((c) => (
          <span key={c} className="mono" style={{ fontSize: 10.5, color: "var(--ink-400)", textAlign: "center" }}>
            {c}
          </span>
        ))}
        {rows.map((r, ri) => (
          <div key={r} style={{ display: "contents" }}>
            <span className="mono" style={{ fontSize: 10.5, color: "var(--ink-500)", textAlign: "right", paddingRight: 6 }}>
              {r}
            </span>
            {counts[ri].map((v, ci) => {
              const t = v / maxVal;
              const bg =
                ri === ci
                  ? "var(--ink-100)"
                  : `rgba(15,118,110,${0.12 + t * 0.55})`;
              return (
                <div
                  key={ci}
                  style={{
                    background: bg,
                    borderRadius: 4,
                    padding: "10px 0",
                    textAlign: "center",
                    fontSize: 12,
                    fontWeight: 600,
                    color: ri === ci ? "var(--ink-400)" : t > 0.5 ? "#fff" : "var(--ink)",
                  }}
                  title={`${r} ∩ ${rows[ci]} positive = ${v}`}
                >
                  {v}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <p className="mono" style={{ marginTop: 8, fontSize: 10.5, color: "var(--ink-400)" }}>
        cells = patients positive on BOTH modalities · diagonal = single-modality positives
      </p>
    </div>
  );
}

function MantouxHistogram() {
  const bins = [
    { label: "0–4", v: 218, igra: 12 },
    { label: "5–9", v: 134, igra: 34 },
    { label: "10–14", v: 121, igra: 68 },
    { label: "15–19", v: 86, igra: 74 },
    { label: "20+", v: 53, igra: 44 },
  ];
  const max = Math.max(...bins.map((b) => b.v));
  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${bins.length}, 1fr)`,
          gap: 8,
          alignItems: "end",
          height: 130,
        }}
      >
        {bins.map((b) => {
          const h = (b.v / max) * 110;
          const igH = (b.igra / b.v) * h;
          return (
            <div key={b.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <span className="mono" style={{ fontSize: 10, color: "var(--ink-400)" }}>
                {b.v}
              </span>
              <div
                style={{
                  width: "100%",
                  height: h,
                  background: "var(--ink-100)",
                  borderRadius: "4px 4px 0 0",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    width: "100%",
                    height: igH,
                    background: "var(--brand)",
                  }}
                  title={`${b.igra} IGRA+ in this bin`}
                />
              </div>
              <span className="mono" style={{ fontSize: 10, color: "var(--ink-500)" }}>
                {b.label}
              </span>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 14, marginTop: 10, fontSize: 11, color: "var(--ink-500)" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: "var(--ink-100)" }} />
          all
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: "var(--brand)" }} />
          IGRA+
        </span>
        <span className="mono" style={{ marginLeft: "auto", color: "var(--ink-400)" }}>
          induration (mm)
        </span>
      </div>
    </div>
  );
}

/* --- TB pathology + vitals helpers ---------------------------------- */

function PairedBars({
  rows,
  caption,
}: {
  rows: { label: string; plus: number; minus: number; ref: string; max: number }[];
  caption?: string;
}) {
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div
        className="mono"
        style={{
          display: "flex",
          gap: 14,
          fontSize: 10.5,
          color: "var(--ink-400)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: -4,
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: "var(--panic)" }} />
          TB +ve
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: "var(--brand-2)" }} />
          TB −ve
        </span>
        <span style={{ marginLeft: "auto" }}>median value</span>
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
        {rows.map((r) => {
          const plusW = Math.min(100, (r.plus / r.max) * 100);
          const minusW = Math.min(100, (r.minus / r.max) * 100);
          return (
            <li key={r.label}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
                <span style={{ color: "var(--ink-700)" }}>{r.label}</span>
                <span className="mono" style={{ color: "var(--ink-400)", fontSize: 11 }}>
                  ref {r.ref}
                </span>
              </div>
              <div
                style={{
                  position: "relative",
                  background: "var(--paper-2)",
                  height: 22,
                  borderRadius: 4,
                  overflow: "hidden",
                  border: "1px solid var(--ink-100)",
                  display: "grid",
                  gridTemplateRows: "1fr 1fr",
                }}
              >
                <div style={{ position: "relative" }}>
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${plusW}%`,
                      background: "var(--panic)",
                      opacity: 0.85,
                    }}
                    title={`TB+ ${r.plus}`}
                  />
                  <span
                    className="mono"
                    style={{
                      position: "absolute",
                      right: 4,
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: 9.5,
                      fontWeight: 700,
                      color: "var(--ink)",
                    }}
                  >
                    {r.plus}
                  </span>
                </div>
                <div style={{ position: "relative", borderTop: "1px solid var(--ink-100)" }}>
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${minusW}%`,
                      background: "var(--brand-2)",
                      opacity: 0.85,
                    }}
                    title={`TB− ${r.minus}`}
                  />
                  <span
                    className="mono"
                    style={{
                      position: "absolute",
                      right: 4,
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: 9.5,
                      fontWeight: 700,
                      color: "var(--ink)",
                    }}
                  >
                    {r.minus}
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      {caption && (
        <p style={{ fontSize: 12.5, color: "var(--ink-500)", lineHeight: 1.5 }}>{caption}</p>
      )}
    </div>
  );
}

function PercentBars({
  rows,
  caption,
}: {
  rows: { label: string; v: number; denom: number }[];
  caption?: string;
}) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
        {rows.map((r) => (
          <li key={r.label}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
              <span style={{ color: "var(--ink-700)" }}>{r.label}</span>
              <span className="mono" style={{ color: "var(--ink-500)", fontSize: 11.5, fontWeight: 600 }}>
                {r.v}%
                <span style={{ color: "var(--ink-400)", fontWeight: 500 }}>
                  {" "}
                  ({Math.round((r.v / 100) * r.denom)}/{r.denom})
                </span>
              </span>
            </div>
            <div
              style={{
                background: "var(--paper-2)",
                height: 12,
                borderRadius: 4,
                overflow: "hidden",
                border: "1px solid var(--ink-100)",
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, r.v)}%`,
                  height: "100%",
                  background: "var(--brand)",
                  opacity: 0.9,
                }}
              />
            </div>
          </li>
        ))}
      </ul>
      {caption && (
        <p style={{ fontSize: 12.5, color: "var(--ink-500)", lineHeight: 1.5 }}>{caption}</p>
      )}
    </div>
  );
}

function FluidGrid({
  groups,
}: {
  groups: {
    source: string;
    n: number;
    rows: { label: string; v: number }[];
  }[];
}) {
  return (
    <div style={{ display: "grid", gap: 14 }}>
      {groups.map((g) => (
        <div key={g.source}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              borderBottom: "1px solid var(--ink-100)",
              paddingBottom: 4,
              marginBottom: 8,
            }}
          >
            <span style={{ fontWeight: 600, fontSize: 13, color: "var(--ink-700)" }}>
              {g.source}
            </span>
            <span className="mono" style={{ fontSize: 11, color: "var(--ink-400)" }}>
              n = {g.n}
            </span>
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 6 }}>
            {g.rows.map((r) => (
              <li
                key={r.label}
                style={{ display: "grid", gridTemplateColumns: "1fr 60px 36px", gap: 8, alignItems: "center", fontSize: 12 }}
              >
                <span style={{ color: "var(--ink-700)" }}>{r.label}</span>
                <div
                  style={{
                    background: "var(--paper-2)",
                    height: 8,
                    borderRadius: 4,
                    overflow: "hidden",
                    border: "1px solid var(--ink-100)",
                  }}
                >
                  <div style={{ width: `${Math.min(100, r.v)}%`, height: "100%", background: "var(--brand)" }} />
                </div>
                <span className="mono" style={{ fontSize: 11, color: "var(--ink-500)", fontWeight: 600, textAlign: "right" }}>
                  {r.v}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
