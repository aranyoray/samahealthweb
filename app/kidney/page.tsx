import type { Metadata } from "next";
import { Caption, Card, HBars, Stat } from "../diabetes/charts";
import { DiseaseDashboard, n } from "../ncd/DiseaseDashboard";
import { A_LABELS, G_LABELS, KDIGO_FREQ, KDIGO_RISK, RISK_LABEL, kidney } from "../ncd/lib/modules/kidney";
import { getDisease } from "../ncd/lib/pipeline";

export const metadata: Metadata = {
  title: "Kidney disease follow-up: catching CKD the lab already sees · SamaHealth",
  description:
    "Creatinine turned into eGFR, CKD confirmed on the KDIGO 3-month rule, recall frequency from the KDIGO heat map, and a ranked call list for people whose kidney checks have lapsed.",
  alternates: { canonical: "/kidney" },
  openGraph: {
    title: "Kidney disease follow-up: catching CKD the lab already sees",
    description: "eGFR from creatinine, KDIGO staging and recall, and a call list for lapsed kidney checks.",
    url: "/kidney",
    siteName: "SamaHealth",
    type: "website",
    images: [{ url: "/events/anubhav-cmc-001.jpg", width: 1200, height: 630, alt: "SamaHealth community screening" }],
  },
};

const RISK_BG = ["#d7efe9", "#fbefc4", "#fbd5bf", "#f3b4b4"];

export default function KidneyPage() {
  const d = getDisease("kidney");
  const x = d.extras;
  const gridTotal = x.grid.flat().reduce((a, b) => a + b, 0);
  const noAcr = x.grid.reduce((s, row) => s + row[3], 0);
  return (
    <DiseaseDashboard
      d={d}
      m={kidney}
      copy={{
        title: "Kidney disease follow-up, from creatinine the lab already runs",
        intro: (
          <>
            Creatinine is one of the most-ordered tests at <strong style={{ color: "var(--ink)" }}>Anubhav Life Care, Barasat</strong>,
            but the report shows a number in mg/dL, not kidney function. This page turns every creatinine into an eGFR, confirms
            chronic kidney disease the way KDIGO asks (a raised marker lasting more than three months), sets the recall interval
            from the KDIGO heat map, and ranks who to call when the next check is missed.
          </>
        ),
        prevalenceCaption:
          "A referral lab, not a survey: people are tested because a doctor suspected something. The age gradient is the useful part.",
        definitions: (
          <>
            eGFR from serum creatinine with the race-free CKD-EPI 2021 equation, using sex and age on the bill; when no sex is
            recorded ({n(x.noSexEgfr)} people) no eGFR is computed rather than guessed. A kidney marker is eGFR under 60 or urine
            ACR 30 mg/g or more. CKD is confirmed when markers are at least 90 days apart; a single raised marker is
            &ldquo;not yet confirmed&rdquo; and recalled at 3 months. Staging uses the latest eGFR (G1 to G5) and latest ACR (A1
            to A3); when ACR was never done the person is staged as A1, which understates risk.
          </>
        ),
        cannotSee:
          "Blood pressure, ACE inhibitor or SGLT2 inhibitor use and dialysis status are not in lab data, and acute illness can lower eGFR for a while.",
        headlineLabel: "eGFR",
        goalLine: { value: 60, label: "eGFR 60" },
      }}
      extras={
        <>
          <Card span={12} title="KDIGO grid for everyone on the pathway" subtitle={`latest eGFR stage × latest urine ACR, n = ${n(gridTotal)}; colour is KDIGO risk, small number is checks per year`}>
            <div style={{ overflowX: "auto" }}>
              <table className="dx-table dx-table-num" style={{ minWidth: 560 }}>
                <thead>
                  <tr>
                    <th>eGFR stage</th>
                    {A_LABELS.map((a) => (
                      <th key={a}>{a}</th>
                    ))}
                    <th>ACR never done</th>
                  </tr>
                </thead>
                <tbody>
                  {G_LABELS.map((g, gi) => (
                    <tr key={g}>
                      <td>{g}</td>
                      {[0, 1, 2].map((ai) => (
                        <td key={ai} style={{ background: RISK_BG[KDIGO_RISK[gi][ai]] }} title={`${RISK_LABEL[KDIGO_RISK[gi][ai]]} risk, ${KDIGO_FREQ[gi][ai]} checks a year`}>
                          <strong>{n(x.grid[gi][ai])}</strong> <span className="dx-dim">{KDIGO_FREQ[gi][ai]}×</span>
                        </td>
                      ))}
                      <td style={{ background: "var(--ink-50)" }}>
                        <strong>{n(x.grid[gi][3])}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Caption>
              {n(noAcr)} of {n(gridTotal)} people ({Math.round((noAcr / Math.max(1, gridTotal)) * 100)}%) have never had a urine ACR, so
              their real KDIGO risk is unknown. Albuminuria is the earlier and cheaper warning; this column is the first thing to fix.
            </Caption>
          </Card>

          <Card title="People with diabetes: the yearly kidney pair" subtitle={`n = ${n(x.dm)} with a diabetic-range result`}>
            <HBars
              rows={[
                { label: "Ever had a creatinine (eGFR)", value: x.dmEgfrPct },
                { label: "Ever had a urine ACR", value: x.dmAcrPct },
              ]}
            />
            <Caption>
              ADA and KDIGO ask for both every year. The blood test is routine; the urine test that catches diabetic kidney disease
              earliest is the one that gets skipped.
            </Caption>
          </Card>

          <Card title="Found only by urine" subtitle="people on the pathway with a normal eGFR but ACR 30+">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Stat value={n(x.acrOnly)} label="people" />
              <Stat value={`${x.acrOnlyPct}%`} label="of the pathway" />
            </div>
            <Caption>Without urine ACR these people would not be on any list: their creatinine looks fine.</Caption>
          </Card>
        </>
      }
    />
  );
}
