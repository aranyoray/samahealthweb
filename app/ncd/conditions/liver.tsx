import { Caption, Card, Donut, Stat } from "../../diabetes/charts";
import { ConditionPanel, n } from "../ConditionPanel";
import { liver } from "../lib/modules/liver";
import { getDisease } from "../lib/pipeline";

export function LiverPanel() {
  const d = getDisease("liver");
  const x = d.extras;
  return (
    <ConditionPanel
      d={d}
      m={liver}
      copy={{
        title: "Fatty liver follow-up, scored from tests already on the bill",
        intro: (
          <>
            Fatty liver is common in India and silent until scarring is advanced. The tests that flag who needs a closer look (AST,
            ALT and a platelet count) are among the most-ordered at{" "}
            <strong style={{ color: "var(--ink)" }}>Anubhav Life Care, Barasat</strong>, yet the report never combines them. This tab
            computes FIB-4 on every bill where it can be computed, applies the AASLD 2023 cut-offs, and ranks who to call for
            elastography, referral or a repeat test.
          </>
        ),
        prevalenceCaption: "Share with a raised ALT or a FIB-4 above the low cut-off. Raised ALT dominates in the young, FIB-4 in the old.",
        definitions: (
          <>
            FIB-4 = age × AST ÷ (platelets × √ALT), computed when all three are on the same bill and the person is 35 or older.
            Low risk under 1.3 (under 2.0 from age 65), indeterminate up to 2.66, high 2.67 or more. ALT over 40 U/L counts as
            raised. A person joins the pathway with a raised ALT or a FIB-4 at or above the low cut-off; people with diabetes stay
            on a two-yearly recall even once low risk, everyone else leaves when both values are back to normal.
          </>
        ),
        cannotSee:
          "Alcohol use, viral hepatitis, ultrasound and elastography results are not in lab data, so FIB-4 here is a risk score for who to send on, not a diagnosis of fatty liver.",
        headlineLabel: "FIB-4",
        goalLine: { value: 1.3, label: "FIB-4 1.3" },
      }}
      extras={
        <>
          <Card title="FIB-4 the report never printed" subtitle="bills where AST, ALT and platelets were all present, age 35+">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Stat value={n(x.scored)} label="FIB-4 scores computed here" />
              <Stat value={n(x.altNoPlt)} label="people with raised ALT but no platelets that day" />
            </div>
            <Caption>
              Every one of these scores was computable from tests already paid for. The second number is the cheapest fix: order the
              blood count with the liver test and the score comes free.
            </Caption>
          </Card>

          <Card title="People with diabetes, 35 and over" subtitle={`n = ${n(x.dmAge)}; AASLD and ADA ask for FIB-4 in everyone with type 2 diabetes`}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Stat value={`${x.dmLftPct}%`} label="ever had a liver test" />
              <Stat value={`${x.dmFibPct}%`} label="ever had a computable FIB-4" />
            </div>
            <div style={{ marginTop: 16 }}>
              <Donut
                centre="scored"
                segments={[
                  { label: "Low", v: x.dmCats[0], color: "#0d9488" },
                  { label: "Indeterminate", v: x.dmCats[1], color: "#dba300" },
                  { label: "High", v: x.dmCats[2], color: "#b91c1c" },
                ]}
              />
            </div>
            <Caption>{x.dmAtRiskPct}% of people with diabetes who were scored need elastography or a referral.</Caption>
          </Card>
        </>
      }
    />
  );
}
