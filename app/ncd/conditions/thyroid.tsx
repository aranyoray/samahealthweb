import { Caption, Card, HBars, Stat } from "../../diabetes/charts";
import { ConditionPanel, n } from "../ConditionPanel";
import { thyroid } from "../lib/modules/thyroid";
import { getDisease } from "../lib/pipeline";

export function ThyroidPanel() {
  const d = getDisease("thyroid");
  const x = d.extras;
  const f = x.bySex[0];
  const m = x.bySex[1];
  return (
    <ConditionPanel
      d={d}
      m={thyroid}
      copy={{
        title: "Thyroid follow-up, from the first odd TSH to a stable dose",
        intro: (
          <>
            Hypothyroidism is common in India, mostly in women, and much of it goes undetected. Treatment is a daily tablet, but the
            dose is only right if TSH is rechecked after every change. This tab links every TSH done at{" "}
            <strong style={{ color: "var(--ink)" }}>Anubhav Life Care, Barasat</strong> into one timeline per person, confirms a
            single abnormal result before it becomes a lifelong diagnosis, and ranks who to call when the recheck is missed.
          </>
        ),
        prevalenceCaption: "Women dominate at every age. Among people tested here the gap is wide enough to plan outreach around.",
        definitions: (
          <>
            Reference range 0.45 to 4.5 µIU/mL. Established: any TSH over 10 or under 0.1, or two abnormal results at least 42
            days apart. A single subclinical result is &ldquo;abnormal once&rdquo; and recalled at 12 weeks; if the repeat is
            normal the person leaves the pathway. The direction of the first abnormal result sets hypo- versus hyperthyroid. Women
            18 to 45 with TSH over 2.5 are flagged because guidance for pregnancy uses that lower threshold.
          </>
        ),
        cannotSee:
          "Whether someone is pregnant or taking thyroxine is not in lab data, so the list cannot tell an untreated person from one on the wrong dose; the reminder asks.",
        headlineLabel: "TSH",
        goalLine: { value: 4.5, label: "TSH 4.5" },
      }}
      extras={
        <>
          <Card title="Abnormal TSH, women and men" subtitle="% of people tested with any TSH outside range">
            <HBars
              rows={[
                { label: "Women", value: f.pct, note: `${n(f.abnormal)} / ${n(f.n)}` },
                { label: "Men", value: m.pct, note: `${n(m.abnormal)} / ${n(m.n)}` },
              ]}
            />
            <Caption>
              Women are {f.n ? (f.n / Math.max(1, m.n)).toFixed(1) : "–"} times as likely to be tested and {(f.pct / Math.max(0.1, m.pct)).toFixed(1)}{" "}
              times as likely to have an abnormal result.
            </Caption>
          </Card>

          <Card title="Women 18 to 45 on the pathway" subtitle="where a missed recheck matters most">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Stat value={n(x.repro)} label="women 18 to 45" />
              <Stat value={`${x.reproOverduePct}%`} label="overdue or lost now" note={`${n(x.reproOverdue)} women`} />
            </div>
            <Caption>Untreated or under-treated hypothyroidism in early pregnancy affects the baby&apos;s development. These women are scored up on the list.</Caption>
          </Card>

          <Card title="Confirm before treating" subtitle={`first TSH 4.6 to 10 with at least one repeat, n = ${n(x.firstSub)}`}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Stat value={`${x.settledPct}%`} label="came back normal on every repeat" note={`${n(x.settled)} people`} />
              <Stat value={`${x.ft4SamePct}%`} label="had free T4 with the first abnormal TSH" />
            </div>
            <Caption>
              Mildly raised results often settle on their own. Treating on one result commits people to a lifelong tablet they may
              not need; the 12-week recall is there to stop that.
            </Caption>
          </Card>
        </>
      }
    />
  );
}
