"use client";

// Tabs for the per-condition panels on /ncd. Panels are rendered on the
// server and passed in; this only decides which one is visible. The hash
// (/ncd#kidney) picks the tab so the old per-condition URLs, which now
// redirect here, still land on the right one.

import { useEffect, useState, type ReactNode } from "react";

export type ConditionTab = { key: string; label: string; panel: ReactNode };

export function ConditionTabs({ tabs }: { tabs: ConditionTab[] }) {
  const [active, setActive] = useState(tabs[0].key);

  useEffect(() => {
    const fromHash = () => {
      const k = window.location.hash.slice(1);
      if (!tabs.some((t) => t.key === k)) return;
      setActive(k);
      document.getElementById("conditions")?.scrollIntoView();
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [tabs]);

  const pick = (k: string) => {
    setActive(k);
    history.replaceState(null, "", `#${k}`);
  };

  return (
    <div className="ncd-tabs">
      <div role="tablist" aria-label="Condition" className="ncd-tablist">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            id={`tab-${t.key}`}
            aria-selected={active === t.key}
            aria-controls={`panel-${t.key}`}
            className="ncd-tab"
            onClick={() => pick(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div key={t.key} role="tabpanel" id={`panel-${t.key}`} aria-labelledby={`tab-${t.key}`} hidden={active !== t.key}>
          {t.panel}
        </div>
      ))}
    </div>
  );
}
