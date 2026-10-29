// One condition's follow-up panel, shown as a tab on /ncd. Same sections and
// visual language as /diabetes; what differs per condition comes from its
// module (rules, bands, labels) and from the copy and extra cards each
// condition file passes in.

import type { ReactNode } from "react";
import { Caption, Card, Columns, Donut, Heatmap, HBars, Legend, StackedColumns, Stat, TableView } from "../diabetes/charts";
import { LineChart } from "../diabetes/LineChart";
import { FOLLOW_UP, TIER_MIN } from "../diabetes/lib/rules";
import { fmtDay, fmtMonth } from "../diabetes/lib/rng";
import { NcdWorklist } from "./NcdWorklist";
import { LATENESS_ROWS, WORKLIST_ROWS, type DiseaseModule } from "./lib/engine";
import type { DiseaseDashboard as Dash } from "./lib/pipeline";

export const n = (v: number) => v.toLocaleString("en-IN");

export type DashboardCopy = {
  title: string;
  intro: ReactNode;
  /** Caption under the sex × age heat map. */
  prevalenceCaption: ReactNode;
  definitions: ReactNode;
  cannotSee: ReactNode;
  headlineLabel: string;
  goalLine: { value: number; label: string } | null;
};

const COLORS = { in: "var(--dx-in)", out: "var(--dx-out)" };

function kmPoints(km: { month: number; s: number; atRisk: number }[]) {
  return km.map((k) => ({ x: k.month, y: k.atRisk >= 20 ? Math.round(k.s * 1000) / 10 : null }));
}

export function ConditionPanel({ d, m, copy, extras }: { d: Dash; m: DiseaseModule; copy: DashboardCopy; extras: ReactNode }) {
  const { hero, snapshot: s, longitudinal: L, worklist: w, linking } = d;
  const own12 = L.km.own[12];
  const other12 = L.km.other[12];
  const contact = L.lossSegments[0].rows;
  return (
    <div className="ncd-panel">
      <div style={{ maxWidth: 880 }}>
        <h3 className="ncd-panel-title">{copy.title}</h3>
        <p className="ncd-panel-intro">{copy.intro}</p>
      </div>

      <div className="dx-hero-stats">
        <Stat value={n(hero.abnormal)} label="people on the follow-up pathway" note={`of ${n(hero.tested)} tested`} />
        <Stat value={`${hero.lostPct}%`} label="of them lost to follow-up now" note={`${n(hero.lostNow)} people, 180+ days past due`} />
        <Stat value={n(hero.recoverable)} label="overdue, still reachable" note="0 to 180 days past due" />
        <Stat value={n(hero.urgent)} label="critical + high this week" note="the top of the call list" />
      </div>

      <h4 className="ncd-sub">Where the cohort stands today</h4>
      <p className="ncd-sub-blurb">
        Everyone with at least one {m.monitorTests.length > 1 ? "of the relevant tests" : "relevant test"} ({n(linking.bills)} bills),
        using each person&apos;s latest results. Linking turned the {n(linking.patientKeys)} PATIENT_KEYs across all their visits into{" "}
        {n(linking.persons)} people.
      </p>
      <div className="dx-grid">
        <Card title="Who was tested" subtitle="sex as recorded; age at latest visit">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Stat value={n(s.total)} label="people" />
            <Stat value={`${Math.round((s.female / (s.female + s.male)) * 100)} : ${Math.round((s.male / (s.female + s.male)) * 100)}`} label="female : male" />
          </div>
          <div style={{ marginTop: 18 }}>
            <Columns unit="" height={120} bars={s.ageBuckets.map((b) => ({ label: b.label, value: b.v, color: COLORS.in }))} />
          </div>
        </Card>

        <Card title={`Latest ${copy.headlineLabel}`} subtitle={`${n(s.bandCounts.reduce((a, b) => a + b, 0))} people`}>
          <Donut centre="people" segments={m.bands.map((b, i) => ({ label: b.label, v: s.bandCounts[i], color: b.color }))} />
        </Card>

        <Card title="On the pathway, by sex and age" subtitle={`% of people tested with ${m.abnormalLabel.toLowerCase()}`}>
          <Heatmap rows={["Female", "Male"]} cols={["18–29", "30–39", "40–49", "50–59", "60–69", "70+"]} values={s.prevalence} colLabel="age" />
          <Caption>{copy.prevalenceCaption}</Caption>
        </Card>

        <Card title="Where people on the pathway sit now" subtitle={`n = ${n(hero.abnormal)}; ${s.withDmPct}% also have a diabetic-range result`}>
          <HBars rows={s.statuses.map((x) => ({ label: x.label, value: x.pct, note: n(x.n) }))} />
        </Card>

        {extras}
      </div>

      <h4 className="ncd-sub">Following the same people over time</h4>
      <p className="ncd-sub-blurb">
        The clock starts at each person&apos;s first result that put them on the pathway. Someone is <strong>lost to follow-up</strong>{" "}
        once they are more than {FOLLOW_UP.lostAfterDays} days past their due date with no follow-up test here.
      </p>
      <div className="dx-grid">
        <Card
          span={12}
          title="The follow-up cascade"
          subtitle={`people who joined the pathway at least 12 months ago, n = ${n(L.eligible)}; each step counts people who also passed every step above`}
        >
          <HBars rows={L.cascade.map((c) => ({ label: c.label, value: c.pct, note: n(c.n) }))} />
          <TableView head={["Step", "People", "% of start"]} rows={L.cascade.map((c) => [c.label, c.n, `${c.pct}%`])} />
        </Card>

        <Card title="Still in care, months after the first abnormal result" subtitle={`Kaplan-Meier, censored at ${fmtDay(d.asOf)}`}>
          <LineChart
            step
            ariaLabel="Share of people still in follow-up by months since first abnormal result, own mobile versus no own number"
            xKind="since"
            yKind="pct"
            xDomain={[0, 30]}
            yDomain={[0, 100]}
            xTicks={[0, 6, 12, 18, 24, 30].map((mo) => ({ value: mo, label: `${mo} mo` }))}
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
            At 12 months {Math.round(own12.s * 100)}% of people with their own number are still in care, against{" "}
            {Math.round(other12.s * 100)}% without one
            {other12.atRisk < 20 ? ` (only ${other12.atRisk} still at risk in that group by then, so the line stops early)` : ""}.
          </Caption>
        </Card>

        <Card title={`Gap between consecutive ${copy.headlineLabel} tests`} subtitle={`${n(L.gaps)} repeat tests in people on the pathway`}>
          <Columns height={170} bars={L.retestGaps.map((g, i) => ({ label: g.label, value: Math.round(g.pct), color: i < 2 ? COLORS.in : COLORS.out, note: `${n(g.n)} tests` }))} />
          <Legend
            items={[
              { label: "Within 6 months", color: COLORS.in },
              { label: "Longer", color: COLORS.out },
            ]}
          />
          <Caption>
            {Math.round(L.retestGaps.slice(2).reduce((a, g) => a + g.pct, 0))}% of repeat tests arrive more than 6 months after the
            previous one, even among people who do come back.
          </Caption>
        </Card>

        <Card span={12} title="Month-end status of everyone on the pathway so far" subtitle="last 24 months">
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
            The lost pool grows from {n(L.flow[0].lost)} to {n(L.flow[L.flow.length - 1].lost)}. The overdue-but-reachable band
            averages {n(Math.round(L.flow.slice(-6).reduce((a, f) => a + f.overdue, 0) / 6))} over the last six months: that middle
            band is where a call list pays off.
          </Caption>
          <TableView head={["Month end", "On track", "Overdue", "Lost"]} rows={L.flow.map((f) => [fmtDay(f.day), f.onTrack, f.overdue, f.lost])} />
        </Card>
      </div>

      <h4 className="ncd-sub">Who gets lost</h4>
      <p className="ncd-sub-blurb">
        Share of people lost within 12 months of joining the pathway, among those who joined at least a year ago. Overall:{" "}
        <strong>{hero.overallLoss12}%</strong>. People without their own mobile on file are lost at {Math.round(contact[1].pct)}% and{" "}
        {Math.round(contact[2].pct)}%, against {Math.round(contact[0].pct)}% for people with one.
      </p>
      <div className="dx-grid">
        {L.lossSegments.map((g) => (
          <Card key={g.group} title={g.group} subtitle="% lost within 12 months">
            <HBars max={100} color={COLORS.out} rows={g.rows.map((r) => ({ label: r.label, value: Math.round(r.pct), note: `n = ${n(r.n)}` }))} />
          </Card>
        ))}
      </div>

      <h4 className="ncd-sub">This week&apos;s {copy.headlineLabel} call list</h4>
      <p className="ncd-sub-blurb">
        People who can still be kept are ranked by how sick and how late they are; people already lost go to a slower re-engagement
        queue. {n(w.keepTotal)} to keep in care, {n(w.reengageTotal)} to re-engage; the top {WORKLIST_ROWS.keep} and{" "}
        {WORKLIST_ROWS.reengage} are loaded here. Open a name to see the timeline.
      </p>
      <div className="dx-owners">
        <span className="dx-owners-label">Keep-in-care queue by who acts</span>
        {w.ownerTotals.map((o) => (
          <div key={o.owner}>
            <strong>{n(o.n)}</strong>
            <span>{o.owner}</span>
          </div>
        ))}
      </div>
      <NcdWorklist
        rows={w.rows}
        asOf={d.asOf}
        storeKey={`ncd-${m.key}-call-status-v1`}
        csvName={`${m.key}-call-list`}
        headlineLabel={`Last ${copy.headlineLabel}`}
        goalLine={copy.goalLine}
        totals={{ keep: w.keepTotal, reengage: w.reengageTotal, tiers: w.tierTotals }}
      />

      <h4 className="ncd-sub">The rules behind the list</h4>
      <div className="dx-grid">
        <Card title="What is due, and when">
          <table className="dx-table">
            <thead>
              <tr>
                <th>Trigger</th>
                <th>Next step</th>
                <th>Basis</th>
              </tr>
            </thead>
            <tbody>
              {m.ruleTable.map((r) => (
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
              {[...m.scoreTable, ...LATENESS_ROWS].map((r) => (
                <tr key={r.factor}>
                  <td>{r.factor}</td>
                  <td className="mono">{r.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Caption>
            Critical {TIER_MIN.critical}+ (or a result that forces it), High {TIER_MIN.high} to {TIER_MIN.critical - 1}, Medium{" "}
            {TIER_MIN.medium} to {TIER_MIN.high - 1}, Routine below {TIER_MIN.medium}.
          </Caption>
        </Card>
        <Card span={12} title="Definitions and blind spots">
          <div className="dx-prose" style={{ fontSize: 15 }}>
            <p>{copy.definitions}</p>
            <p>{copy.cannotSee}</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
