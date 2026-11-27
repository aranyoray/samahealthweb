import Link from "next/link";
import { Mark } from "./Mark";

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Platform",
    links: [
      { href: "/homecare", label: "SamaBeat band and SamaDock" },
      { href: "/homecare#senses", label: "What the dock senses" },
      { href: "/#evidence", label: "Where the evidence stands" },
      { href: "/camps", label: "Field camps" },
    ],
  },
  {
    title: "Science",
    links: [
      { href: "/research#validation", label: "Validation" },
      { href: "/research#lab", label: "The lab & devices" },
      { href: "/data#anemia", label: "Anaemia dashboard" },
      { href: "/data#tb", label: "Tuberculosis dashboard" },
      { href: "/diabetes", label: "Diabetes follow-up" },
      { href: "/ncd", label: "Long-term conditions" },
      { href: "/blog", label: "Journal" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/team", label: "Team" },
      { href: "/#contact", label: "Contact" },
      { href: "mailto:hello@samahealth.in", label: "hello@samahealth.in" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container" style={{ paddingTop: 64 }}>
        <div className="footer-grid">
          <div className="footer-about">
            <Link href="/" className="nav-brand">
              <Mark size={24} />
              SamaHealth
            </Link>
            <p style={{ marginTop: 16, fontSize: 15, lineHeight: 1.6, maxWidth: "34ch" }}>
              SamaBeat is a continuous care monitoring system in clinical validation. It is not cleared or
              approved by any regulator.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title} className="footer-col">
              <h2>{column.title}</h2>
              <ul>
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <p className="footer-copy">
          <span>© {new Date().getFullYear()} SamaHealth Technologies Pvt Ltd</span>
          <span>Made in India, for India</span>
        </p>
      </div>

      <div aria-hidden="true" style={{ marginTop: 40, textAlign: "center" }}>
        <span className="wordmark-giant">SamaHealth</span>
      </div>

      <style>{`
        .site-footer { overflow: hidden; border-top: 1px solid var(--hairline); background: var(--canvas); }
        .footer-grid { display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr; }
        .footer-about { padding-right: 40px; }
        .footer-col { border-left: 1px solid var(--hairline); padding-left: 24px; }
        .footer-col h2 { font-size: 14px; font-weight: 500; letter-spacing: 0; line-height: 1.4; color: var(--dim); }
        .footer-col ul { list-style: none; margin: 20px 0 0; padding: 0; display: grid; gap: 12px; }
        .footer-col a { font-size: 14px; color: var(--ink); text-underline-offset: 4px; }
        .footer-col a:hover { text-decoration: underline; }
        .footer-copy { margin-top: 56px; padding-top: 28px; border-top: 1px solid var(--hairline); display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px 20px; font-size: 13px; color: var(--dim); }
        @media (max-width: 900px) {
          .footer-grid { grid-template-columns: 1fr 1fr; gap: 40px 0; }
          .footer-about { grid-column: 1 / -1; padding-right: 0; }
          .footer-col:nth-of-type(odd) { border-left: 0; padding-left: 0; }
        }
      `}</style>
    </footer>
  );
}
