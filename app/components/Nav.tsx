"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const links = [
  { href: "/samaclip", label: "SamaClip" },
  { href: "/#platform", label: "What we screen" },
  { href: "/#outcomes", label: "How we reach" },
  { href: "/camps", label: "Field camps" },
  { href: "/research", label: "Validation" },
  { href: "/blog", label: "Journal" },
  { href: "/#contact", label: "Contact" },
];

export function Nav({ variant = "light" }: { variant?: "light" | "dark" | "hero" }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const onDark = variant === "dark" || (variant === "hero" && !scrolled);
  const bg = scrolled
    ? variant === "dark" ? "rgba(7,9,14,0.85)" : "rgba(255,255,255,0.9)"
    : variant === "dark" ? "rgba(7,9,14,0.0)" : variant === "hero" ? "rgba(255,255,255,0.0)" : "rgba(255,255,255,0.5)";
  const border = scrolled
    ? variant === "dark" ? "1px solid rgba(255,255,255,0.08)" : "1px solid var(--ink-100)"
    : "1px solid transparent";
  const textColor = onDark ? "rgba(255,255,255,0.92)" : "var(--ink-700)";
  const logoText = onDark ? "#fff" : "var(--ink)";

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        backdropFilter: "saturate(180%) blur(14px)",
        background: bg,
        borderBottom: border,
        transition: "all .25s ease",
        color: textColor,
      }}
    >
      <a
        href="#main"
        style={{
          position: "absolute",
          left: 8,
          top: 8,
          padding: "10px 16px",
          background: "var(--ink)",
          color: "#fff",
          borderRadius: 8,
          fontWeight: 600,
          fontSize: 14,
          transform: "translateY(-200%)",
          transition: "transform .15s ease",
          zIndex: 101,
        }}
        onFocus={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
        onBlur={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-200%)"; }}
      >
        Skip to content
      </a>
      <div
        className="container"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 72 }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12, fontWeight: 600, letterSpacing: "-0.015em", color: logoText, fontSize: 18 }}>
          <Logo dark={onDark} />
          <span>SamaHealth</span>
        </Link>

        <nav className="nav-links" style={{ display: "none", gap: 32, fontSize: 14, fontWeight: 500 }}>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              style={{
                color: textColor,
                position: "relative",
                padding: "4px 0",
                transition: "color .15s ease",
              }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link
            href="/#contact"
            className="btn"
            style={{
              background: onDark ? "#fff" : "var(--ink)",
              color: onDark ? "var(--ink)" : "#fff",
              height: 44,
              padding: "0 18px",
              fontSize: 14,
            }}
          >
            Get in touch
          </Link>
          <button
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
            className="menu-btn"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 44,
              height: 44,
              border: `1px solid ${onDark ? "rgba(255,255,255,0.2)" : "var(--ink-100)"}`,
              borderRadius: 12,
              background: "transparent",
              color: textColor,
            }}
          >
            <span style={{ display: "grid", gap: 4 }}>
              <span style={{ width: 16, height: 1.5, background: "currentColor", display: "block" }} />
              <span style={{ width: 16, height: 1.5, background: "currentColor", display: "block" }} />
            </span>
          </button>
        </div>
      </div>

      {open && (
        <div id="mobile-nav" style={{ borderTop: `1px solid ${onDark ? "rgba(255,255,255,0.08)" : "var(--ink-100)"}`, background: onDark ? "rgba(7,9,14,0.96)" : "#fff" }}>
          <div className="container" style={{ display: "grid", gap: 0, padding: "8px 28px 20px" }}>
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                style={{ padding: "14px 4px", borderBottom: `1px solid ${onDark ? "rgba(255,255,255,0.08)" : "var(--ink-100)"}`, fontWeight: 500, fontSize: 17, color: textColor }}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @media (min-width: 980px) {
          .nav-links { display: flex !important; }
          .menu-btn { display: none !important; }
        }
      `}</style>
    </header>
  );
}

function Logo({ dark }: { dark: boolean }) {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden>
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#14B8A6" />
          <stop offset="100%" stopColor="#0F766E" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="9" fill="url(#lg)" />
      <path
        d="M7 17h4l2-6 3 12 3-9 2 3h4"
        stroke={dark ? "#fff" : "#fff"}
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
