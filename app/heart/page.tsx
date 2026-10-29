import type { Metadata } from "next";
import { Caption, Card, HBars, Stat } from "../diabetes/charts";
import { DiseaseDashboard, n } from "../ncd/DiseaseDashboard";
import { heart } from "../ncd/lib/modules/heart";
import { getDisease } from "../ncd/lib/pipeline";

export const metadata: Metadata = {
  title: "Cholesterol follow-up: LDL to target, families tested · SamaHealth",
  description:
    "Lipid results linked per person, LDL targets from the Lipid Association of India, recall after statin changes, family testing for LDL 190+, and a ranked call list.",
  alternates: { canonical: "/heart" },
  openGraph: {
    title: "Cholesterol follow-up: LDL to target, families tested",
    description: "LDL targets by risk, recall after statin changes, and a call list for lapsed lipid checks.",
    url: "/heart",
    siteName: "SamaHealth",
    type: "website",
    images: [{ url: "/events/anubhav-cmc-001.jpg", width: 1200, height: 630, alt: "SamaHealth community screening" }],
  },
};

export default function HeartPage() {
  const d = getDisease("heart");
  const x = d.extras;
  return (
    <DiseaseDashboard
      d={d}
      m={heart}
      copy={{
        title: "Cholesterol follow-up, so LDL reaches target and stays there",
        intro: (
          <>
            Heart attack and stroke are the largest cause of death in India, and LDL cholesterol is the risk factor a lab can
            measure and a cheap tablet can move. This page links every lipid profile done at{" "}
            <strong style={{ color: "var(--ink)" }}>Anubhav Life Care, Barasat</strong> into one timeline per person, judges LDL
            against the target for that person&apos;s risk, and ranks who to call when the recheck after a statin change never
            happens.
          </>
        ),
        prevalenceCaption:
          "Share with a lipid result that needs action. People with diabetes or kidney disease have a stricter target, so the curve climbs with age as those conditions accumulate.",
        definitions: (
          <>
            High risk means a diabetic-range result (HbA1c 6.5%+ or fasting glucose 126+) or an eGFR under 60 anywhere on the
            timeline; target LDL under 70 mg/dL. Everyone else: under 100. A person joins the pathway with LDL 160+, LDL 100+ when
            high risk, or triglycerides 500+. LDL 190+ at any point is flagged as possible familial hypercholesterolaemia.
            Household members are people sharing the same own mobile number after linking.
          </>
        ),
        cannotSee:
          "Smoking, blood pressure, previous heart attack or stroke and statin prescriptions are not in lab data, so some people placed at moderate risk are really very high risk with a stricter target of 55.",
        headlineLabel: "LDL",
        goalLine: { value: 100, label: "LDL 100" },
      }}
      extras={
        <>
          <Card title="LDL at target, by risk group" subtitle="people on the pathway, latest LDL">
            <HBars
              rows={[
                { label: `Diabetes or CKD (target < ${x.targets.high})`, value: x.high.pct, note: `${n(x.high.ok)} / ${n(x.high.n)}` },
                { label: `Everyone else (target < ${x.targets.other})`, value: x.other.pct, note: `${n(x.other.ok)} / ${n(x.other.n)}` },
              ]}
            />
            <Caption>
              {x.high.pct < x.other.pct
                ? "The people with the most to gain are the least often at target. "
                : "Even the better-controlled group is mostly above target. "}
              The high-risk target is stricter, and a single statin dose rarely gets there without a recheck and a dose change.
            </Caption>
          </Card>

          <Card title="Diabetes or CKD, never a lipid profile" subtitle={`n = ${n(x.risky)} high-risk people`}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Stat value={n(x.riskyNoLipid)} label="never had a lipid profile here" />
              <Stat value={`${x.riskyNoLipidPct}%`} label="of high-risk people" />
            </div>
            <Caption>These people are not on the cholesterol list at all, because nobody ordered the test. The diabetes list carries the reminder.</Caption>
          </Card>

          <Card span={12} title="LDL 190 and over: test the family" subtitle="possible familial hypercholesterolaemia, relatives found through a shared household mobile">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
              <Stat value={n(x.fh)} label="people with any LDL 190+" />
              <Stat value={n(x.relatives)} label="household members on the same number" />
              <Stat value={n(x.relativesUntested)} label="of them never had a lipid profile" />
            </div>
            <Caption>
              Familial hypercholesterolaemia passes to half of first-degree relatives and is treatable from childhood. The linking
              step that separates family members on one phone number is the same step that finds who to test next.
            </Caption>
          </Card>
        </>
      }
    />
  );
}
