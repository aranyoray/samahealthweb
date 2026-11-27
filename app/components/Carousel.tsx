"use client";
import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from "react";

/** Where the row can come to rest: each item's left edge, up to the end of the row. */
function stops(row: HTMLElement): number[] {
  const max = Math.max(row.scrollWidth - row.clientWidth, 0);
  const first = row.firstElementChild instanceof HTMLElement ? row.firstElementChild.offsetLeft : 0;
  const out: number[] = [];
  for (const child of Array.from(row.children)) {
    if (!(child instanceof HTMLElement)) continue;
    const at = Math.min(child.offsetLeft - first, max);
    if (out.length === 0 || at - out[out.length - 1] > 1) out.push(at);
  }
  return out.length > 0 ? out : [0];
}

function nearest(values: number[], target: number): number {
  let best = 0;
  for (let i = 1; i < values.length; i++) {
    if (Math.abs(values[i] - target) < Math.abs(values[best] - target)) best = i;
  }
  return best;
}

/**
 * A row that runs past the right edge of the page. It scrolls by touch, trackpad or the two buttons,
 * and stops on each item. `header` sits beside the buttons, in the page column.
 */
export function Carousel({ label, header, children }: { label: string; header?: ReactNode; children: ReactNode }) {
  const row = useRef<HTMLUListElement>(null);
  const [count, setCount] = useState(1);
  const [index, setIndex] = useState(0);

  const measure = useCallback(() => {
    const element = row.current;
    if (!element) return;
    const at = stops(element);
    setCount(at.length);
    setIndex(nearest(at, element.scrollLeft));
  }, []);

  useEffect(() => {
    const element = row.current;
    if (!element) return;
    measure();
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    element.addEventListener("scroll", onScroll, { passive: true });
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(element);
    return () => {
      cancelAnimationFrame(frame);
      element.removeEventListener("scroll", onScroll);
      observer?.disconnect();
    };
  }, [measure]);

  const go = (step: number) => {
    const element = row.current;
    if (!element) return;
    const at = stops(element);
    const next = Math.min(Math.max(nearest(at, element.scrollLeft) + step, 0), at.length - 1);
    element.scrollTo({ left: at[next] });
  };

  return (
    <div role="group" aria-roledescription="carousel" aria-label={label} className="snap-bleed">
      <div className="container" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, marginBottom: 40 }}>
        <div>{header}</div>
        <div style={{ display: count > 1 ? "flex" : "none", gap: 8, flex: "none" }}>
          <button type="button" className="round-btn" onClick={() => go(-1)} disabled={index === 0}>
            <span className="sr-only">Previous</span>
            <Chevron left />
          </button>
          <button type="button" className="round-btn" onClick={() => go(1)} disabled={index >= count - 1}>
            <span className="sr-only">Next</span>
            <Chevron />
          </button>
        </div>
      </div>
      <ul ref={row} className="snap-row">
        {Children.toArray(children).map((item, itemIndex) => (
          <li key={itemIndex}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function Chevron({ left = false }: { left?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={left ? "M12 5l-5 5 5 5" : "M8 5l5 5-5 5"} />
    </svg>
  );
}
