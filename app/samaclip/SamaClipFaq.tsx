"use client";
import { useId, useState } from "react";
import { GROUPS } from "./faq-data";


export function SamaClipFaq() {
  // First question opens by default; key is `${groupIndex}-${itemIndex}`.
  const [open, setOpen] = useState<string | null>("0-0");
  const baseId = useId();


  return (
    <div style={{ display: "grid", gap: 40 }}>
      {GROUPS.map((group, gi) => {
        const base = GROUPS.slice(0, gi).reduce((n, g) => n + g.items.length, 0);
        return (
        <div key={group.tag}>
          <h3
            style={{
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--ink-400)",
              marginBottom: 14,
            }}
          >
            {group.tag}
          </h3>
          <div style={{ display: "grid", gap: 10 }}>
            {group.items.map((item, ii) => {
              const num = String(base + ii + 1).padStart(2, "0");
              const key = `${gi}-${ii}`;
              const isOpen = open === key;
              const panelId = `${baseId}-panel-${key}`;
              const btnId = `${baseId}-btn-${key}`;
              return (
                <div
                  key={item.q}
                  style={{
                    background: "#fff",
                    border: `1px solid ${isOpen ? "var(--brand-2)" : "var(--ink-100)"}`,
                    borderRadius: 16,
                    overflow: "hidden",
                    transition: "border-color .15s ease, box-shadow .25s ease",
                    boxShadow: isOpen ? "0 18px 40px -28px rgba(15,118,110,0.35)" : "none",
                  }}
                >
                  <button
                    id={btnId}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpen(isOpen ? null : key)}
                    style={{
                      width: "100%",
                      display: "grid",
                      gridTemplateColumns: "auto 1fr auto",
                      gap: 18,
                      alignItems: "center",
                      textAlign: "left",
                      background: "transparent",
                      border: 0,
                      padding: "22px 24px",
                    }}
                  >
                    <span
                      className="mono"
                      style={{
                        fontSize: 12,
                        letterSpacing: "0.14em",
                        color: isOpen ? "var(--brand)" : "var(--ink-400)",
                      }}
                    >
                      {num}
                    </span>
                    <span
                      style={{
                        fontSize: 17,
                        fontWeight: 600,
                        color: "var(--ink)",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {item.q}
                    </span>
                    <span
                      aria-hidden
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        display: "grid",
                        placeItems: "center",
                        background: isOpen ? "var(--brand)" : "var(--paper-3)",
                        color: isOpen ? "#fff" : "var(--brand)",
                        transition: "background .15s ease, transform .2s ease",
                        transform: isOpen ? "rotate(45deg)" : "none",
                        flexShrink: 0,
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M7 2v10M2 7h10" />
                      </svg>
                    </span>
                  </button>
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={btnId}
                    hidden={!isOpen}
                    style={{
                      padding: "0 24px 24px 60px",
                    }}
                  >
                    <p style={{ fontSize: 15.5, lineHeight: 1.65, color: "var(--ink-500)", maxWidth: 760 }}>
                      {item.a}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        );
      })}
    </div>
  );
}
