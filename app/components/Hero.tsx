import Link from "next/link";

export function Hero() {
  return (
    <section
      style={{
        paddingTop: 128,
        paddingBottom: 32,
        borderBottom: "1px solid var(--ink-100)",
      }}
    >
      <div className="container" style={{ paddingTop: 64, paddingBottom: 64, maxWidth: 1160 }}>
        <div
          className="hero-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1.15fr 0.85fr",
            gap: 72,
            alignItems: "start",
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(36px, 5vw, 68px)",
                letterSpacing: "-0.032em",
                lineHeight: 1.03,
                maxWidth: 700,
                fontWeight: 500,
              }}
            >
              A fingertip reads the autonomic state. A lab confirms it. A clinic follows through.
            </h1>
            <p
              style={{
                marginTop: 32,
                fontSize: 19.5,
                lineHeight: 1.62,
                color: "var(--ink-500)",
                maxWidth: 620,
              }}
            >
              SamaClip is the two-minute fingertip screen behind{" "}
              <strong style={{ color: "var(--ink)" }}>Anubhav Life Care</strong>&rsquo;s
              cardiometabolic clinic in Barasat. From a single reading it derives
              heart-rate variability, respiratory drive, oxygen saturation,
              non-invasive haemoglobin and a rhythm flag — then routes anything
              abnormal into the NABL-accredited diagnostic lab that sits behind it.
            </p>
            <p
              className="mono"
              style={{
                marginTop: 26,
                fontSize: 12.5,
                letterSpacing: "0.02em",
                color: "var(--ink-400)",
              }}
            >
              Validated on n = 175 paired screens · rolling cohort ≈ 3,200 patients ·
              Barasat, North 24 Parganas
            </p>

            <div style={{ marginTop: 44, display: "flex", gap: 28, flexWrap: "wrap" }}>
              <Link
                href="#signal"
                style={{
                  fontSize: 15,
                  fontWeight: 500,
                  color: "var(--ink)",
                  borderBottom: "1px solid var(--ink)",
                  paddingBottom: 2,
                }}
              >
                What the screen reads →
              </Link>
              <Link
                href="#triage"
                style={{
                  fontSize: 15,
                  fontWeight: 500,
                  color: "var(--ink-500)",
                  borderBottom: "1px solid var(--ink-200)",
                  paddingBottom: 2,
                }}
              >
                How it triages →
              </Link>
            </div>
          </div>

          <figure style={{ margin: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/events/anubhav-cmc-001.jpg"
              alt="Anubhav Life Care team screening donors at a community camp in North 24 Parganas"
              width={920}
              height={690}
              style={{
                width: "100%",
                height: "auto",
                borderRadius: 14,
                border: "1px solid var(--ink-100)",
                display: "block",
              }}
            />
            <figcaption
              style={{ marginTop: 12, fontSize: 12.5, color: "var(--ink-400)" }}
            >
              North 24 Parganas · community screening camp.
            </figcaption>
          </figure>
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .hero-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
        }
      `}</style>
    </section>
  );
}
