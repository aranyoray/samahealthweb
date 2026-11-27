"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mark } from "./Mark";

/** The home link is the wordmark, so the bar lists the other pages. */
const links = [
  { href: "/samaclip", label: "SamaClip" },
  { href: "/homecare", label: "Home care" },
  { href: "/camps", label: "Field camps" },
  { href: "/research", label: "Validation" },
  { href: "/team", label: "Team" },
  { href: "/blog", label: "Journal" },
];

/** How far the page moves before the bar draws in to a floating capsule. */
const FLOAT_AFTER = 24;

/** What the floating bar is passing over: all light, all black card, or some of each. */
type Ground = "light" | "dark" | "mixed";

/** Where across the bar's width the ground is read. */
const GROUND_SAMPLES = [0.12, 0.5, 0.88];

/** Reads the tone of the page behind the bar at a few points along it, from where the toned blocks are drawn. */
function groundUnder(header: HTMLElement, bar: HTMLElement): Ground {
  const box = bar.getBoundingClientRect();
  const y = box.top + box.height / 2;
  const toned = [...document.querySelectorAll<HTMLElement>("[data-tone]")]
    .filter((element) => !header.contains(element))
    .map((element) => ({ tone: element.dataset.tone, at: element.getBoundingClientRect() }))
    .filter(({ at }) => at.top <= y && at.bottom >= y);
  let dark = 0;
  for (const share of GROUND_SAMPLES) {
    const x = box.left + box.width * share;
    // A block inside another comes later in the page, so the last one that covers the point is the nearest.
    const nearest = toned.filter(({ at }) => at.left <= x && at.right >= x).pop();
    if (nearest?.tone === "dark") dark += 1;
  }
  if (dark === GROUND_SAMPLES.length) return "dark";
  return dark > 0 ? "mixed" : "light";
}

/**
 * The top bar on every page: pages on the left, the wordmark in the middle, the contact button on the
 * right. Below 1200px the pages collapse into a frosted menu. The bar reads the page behind it, so no
 * page has to say whether it starts on a black card.
 */
export function Nav() {
  const pathname = usePathname();
  // The menu belongs to the address it was opened on, so any navigation closes it.
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const open = openedAt === pathname;
  const [floating, setFloating] = useState(false);
  const [ground, setGround] = useState<Ground>("light");
  const header = useRef<HTMLElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let frame = 0;
    const read = () => {
      frame = 0;
      setFloating(window.scrollY > FLOAT_AFTER);
      if (header.current && bar.current) setGround(groundUnder(header.current, bar.current));
    };
    // One reading a frame is enough, however fast the scroll events come.
    const onMove = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };
    read();
    const settled = window.setTimeout(read, 300);
    window.addEventListener("scroll", onMove, { passive: true });
    window.addEventListener("resize", onMove);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(settled);
      window.removeEventListener("scroll", onMove);
      window.removeEventListener("resize", onMove);
    };
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpenedAt(null);
      toggle.current?.focus();
    };
    const wide = window.matchMedia("(min-width: 1200px)");
    const onWide = () => {
      if (wide.matches) setOpenedAt(null);
    };
    document.addEventListener("keydown", onKey);
    wide.addEventListener("change", onWide);
    return () => {
      document.removeEventListener("keydown", onKey);
      wide.removeEventListener("change", onWide);
    };
  }, [open]);

  const glass = floating || open;
  const dark = glass && !open && ground === "dark";

  return (
    <header ref={header} className="nav-shell">
      <a
        href="#main"
        className="btn btn-solid btn-sm"
        style={{ position: "absolute", left: 16, top: 16, zIndex: 2, pointerEvents: "auto", transform: "translateY(-300%)" }}
        onFocus={(event) => { event.currentTarget.style.transform = "translateY(0)"; }}
        onBlur={(event) => { event.currentTarget.style.transform = "translateY(-300%)"; }}
      >
        Skip to content
      </a>
      <div
        ref={bar}
        data-tone={dark ? "dark" : undefined}
        className={[
          "nav-capsule",
          glass ? "is-floating" : "",
          glass && ground === "mixed" ? "is-dense" : "",
          open ? "is-open" : "",
        ].join(" ")}
      >
        <div className="nav-row">
          <nav aria-label="Primary" className="nav-primary">
            <ul className="nav-links">
              {links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} aria-current={pathname === link.href || pathname.startsWith(`${link.href}/`) ? "page" : undefined}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <Link href="/" className="nav-brand">
            <Mark size={24} />
            SamaHealth
          </Link>

          <div className="nav-end">
            <Link href="/#contact" className="btn btn-solid btn-sm">
              Get in touch
            </Link>
            <button
              ref={toggle}
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="mobile-nav"
              onClick={() => setOpenedAt(open ? null : pathname)}
              className="nav-menu-btn"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
                {open ? <path d="M5 5l10 10M15 5L5 15" /> : <path d="M3 7h14M3 13h14" />}
              </svg>
            </button>
          </div>
        </div>

        {/* Always mounted so the button's aria-controls target exists while closed; capped and
            scrollable so every link stays reachable in landscape. */}
        <div id="mobile-nav" hidden={!open} className="nav-sheet" style={{ maxHeight: "calc(100dvh - 90px)", overflowY: "auto" }}>
          {links.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setOpenedAt(null)}>
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
