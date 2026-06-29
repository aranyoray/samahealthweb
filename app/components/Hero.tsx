import Link from "next/link";

export function Hero() {
  return (
    <section style={{ paddingTop: 120, paddingBottom: 24, borderBottom: "1px solid var(--ink-100)" }}>
      <div className="container" style={{ paddingTop: 56, paddingBottom: 56 }}>
        <div className="hero-grid" style={{ display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 56, alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: "clamp(38px, 6vw, 76px)" }}>
              Non-invasive screening that finds illness early.
            </h1>
            <p style={{ marginTop: 26, fontSize: 19, lineHeight: 1.6, color: "var(--ink-500)", maxWidth: 560 }}>
              SamaHealth brings painless, low-cost screening for anaemia, blood oxygen, heart rhythm
              and diabetes risk to clinics and community camps across Barasat and North&nbsp;24 Parganas.
              It is built around <strong style={{ color: "var(--ink)" }}>Anubhav Life Care</strong>, an
              NABL-accredited diagnostic lab, so a flag becomes a confirmed test, and care, before a crisis.
            </p>
            <div style={{ display: "flex", gap: 14, marginTop: 32, flexWrap: "wrap" }}>
              <Link href="/research" className="btn btn-primary">See how it’s validated</Link>
              <Link href="/blog" className="btn btn-ghost">Read the journal</Link>
            </div>

            <dl className="hero-facts" style={{ display: "flex", gap: 36, marginTop: 44, flexWrap: "wrap", margin: "44px 0 0" }}>
              <Fact n="175" l="paired screens validated" />
              <Fact n="~2 min" l="per fingertip screen" />
              <Fact n="≈ $1.50" l="per screen" />
            </dl>
          </div>

          <figure style={{ margin: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/events/anubhav-cmc-001.jpg"
              alt="Anubhav Life Care team screening donors at a community camp in North 24 Parganas"
              width={920}
              height={690}
              style={{ width: "100%", height: "auto", borderRadius: 18, border: "1px solid var(--ink-100)", display: "block" }}
            />
          </figure>
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .hero-grid { grid-template-columns: 1fr !important; gap: 36px !important; }
        }
      `}</style>
    </section>
  );
}

function Fact({ n, l }: { n: string; l: string }) {
  return (
    <div>
      <dt style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.025em", lineHeight: 1 }}>{n}</dt>
      <dd style={{ margin: 0, fontSize: 13, marginTop: 8, color: "var(--ink-400)", maxWidth: 130 }}>{l}</dd>
    </div>
  );
}
