import Link from "next/link";

export function Footer() {
  return (
    <footer style={{ background: "var(--ink)", color: "rgba(255,255,255,0.7)", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="container" style={{ padding: "80px 28px 32px" }}>
        <div
          className="footer-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
            gap: 48,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, fontWeight: 600, color: "#fff", fontSize: 18 }}>
              <Mark />
              SamaHealth
            </div>
            <p style={{ marginTop: 18, color: "rgba(255,255,255,0.55)", fontSize: 14, maxWidth: 360 }}>
              Cardiac screening built for India's last-mile. Offline-first, clinical-grade, DPDPA-compliant.
              Bengaluru + Patna.
            </p>
            <div style={{ marginTop: 28, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Pill>asia-south1</Pill>
              <Pill>DPDPA</Pill>
              <Pill>ISO 13485 (in progress)</Pill>
            </div>
          </div>

          <Col title="Platform" links={[
            { href: "/#platform", label: "Application scenarios" },
            { href: "/#parameters", label: "What we track" },
            { href: "/#outcomes", label: "Outcomes" },
          ]} />
          <Col title="Science" links={[
            { href: "/research", label: "Research" },
            { href: "/research#validation", label: "Validation" },
            { href: "/research#papers", label: "Publications" },
          ]} />
          <Col title="Company" links={[
            { href: "/#contact", label: "Contact" },
            { href: "mailto:hello@samahealth.in", label: "hello@samahealth.in" },
            { href: "/research#partners", label: "Partners" },
          ]} />
        </div>

        <hr style={{ border: 0, height: 1, background: "rgba(255,255,255,0.08)", margin: "56px 0 24px" }} />
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 12, fontSize: 13, color: "rgba(255,255,255,0.45)" }}>
          <span>© {new Date().getFullYear()} SamaHealth Technologies Pvt Ltd</span>
          <span className="mono">Made in India · for India · v0.1</span>
        </div>
      </div>
      <style>{`
        @media (max-width: 820px) { .footer-grid { grid-template-columns: 1fr 1fr !important; } }
        @media (max-width: 520px) { .footer-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </footer>
  );
}

function Mark() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden>
      <defs>
        <linearGradient id="lgf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#14B8A6" />
          <stop offset="100%" stopColor="#0F766E" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="9" fill="url(#lgf)" />
      <path d="M7 17h4l2-6 3 12 3-9 2 3h4" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Col({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)" }}>{title}</div>
      <ul style={{ listStyle: "none", padding: 0, margin: "20px 0 0", display: "grid", gap: 12 }}>
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} style={{ fontSize: 14, color: "#fff" }}>{l.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="mono"
      style={{
        fontSize: 11,
        padding: "5px 10px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        color: "rgba(255,255,255,0.7)",
        letterSpacing: "0.04em",
      }}
    >
      {children}
    </span>
  );
}
