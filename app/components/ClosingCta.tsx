import type { ReactNode } from "react";

/** The last thing on a page: a teal banner with the way to reach us. */
export function ClosingCta({
  title,
  lede,
  children,
}: {
  title: string;
  lede?: string;
  /** The buttons. Left out, the banner shows the email address. */
  children?: ReactNode;
}) {
  return (
    <section id="contact" aria-labelledby="closing-title" style={{ padding: "16px 10px 10px" }}>
      <div
        data-tone="brand"
        className="reveal"
        style={{ background: "var(--canvas)", borderRadius: "var(--radius-tile)", padding: "clamp(64px, 9vw, 96px) 24px", textAlign: "center" }}
      >
        <h2 id="closing-title" className="headline" style={{ maxWidth: 760, margin: "0 auto" }}>
          {title}
        </h2>
        {lede ? (
          <p className="lede" style={{ maxWidth: 560, margin: "16px auto 0" }}>
            {lede}
          </p>
        ) : null}
        <div style={{ marginTop: 32, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
          {children ?? (
            <a href="mailto:hello@samahealth.in" className="btn btn-light">
              hello@samahealth.in
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
