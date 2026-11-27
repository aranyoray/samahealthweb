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
        return (
        <div key={group.tag}>
          <h3
            style={{
              fontSize: 20,
              fontWeight: 500,
              letterSpacing: "-0.02em",
              color: "var(--ink)",
              marginBottom: 16,
            }}
          >
            {group.tag}
          </h3>
          <div style={{ display: "grid", gap: 10 }}>
            {group.items.map((item, ii) => {
              const key = `${gi}-${ii}`;
              const isOpen = open === key;
              const panelId = `${baseId}-panel-${key}`;
              const btnId = `${baseId}-btn-${key}`;
              return (
                <div
                  key={item.q}
                  style={{
                    background: "var(--tile)",
                    borderRadius: 16,
                    overflow: "hidden",
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
                      gridTemplateColumns: "1fr auto",
                      gap: 18,
                      alignItems: "center",
                      textAlign: "left",
                      background: "transparent",
                      border: 0,
                      padding: "22px 24px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 17,
                        fontWeight: 500,
                        color: "var(--ink)",
                        letterSpacing: "-0.015em",
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
                        background: isOpen ? "var(--ink)" : "#fff",
                        color: isOpen ? "#fff" : "var(--ink)",
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
                      padding: "0 24px 24px",
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
