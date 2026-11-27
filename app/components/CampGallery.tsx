"use client";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import Image from "next/image";
import crops from "../camp-crops.json";

type Img = {
  file: string;
  event: number;
  location: string;
  independent: boolean;
  partnerTag: string;
  type?: "photo" | "doc" | "news" | "poster" | "team";
  /** Pixel size, written by scripts/camp_photo_sizes.py. */
  w: number;
  h: number;
};

type EventMeta = {
  id: number;
  location: string;
  independent: boolean;
  imageCount: number;
};

type Filter = "all" | "indep" | "collab";

/** The number in "anubhav-cmc-059.jpg". */
function photoNumber(file: string): number {
  return Number(file.replace("anubhav-cmc-", "").split(".")[0]);
}

/*
  The collage is a jigsaw: the strongest photos take the big pieces and the rest fill in around them
  as small boxes. These three lists are a hand pick, by photo number. Everything else is sized from
  its own proportions.
*/
const HERO = new Set([59, 10, 115, 145, 57, 120, 1, 204, 72]);
const LARGE = new Set([
  48, 92, 73, 140, 208, 151, 190, 114, 55, 197, 176, 123, 87, 144, 165, 99, 109, 189,
  203, 45, 205, 202, 146, 49, 200, 117, 124, 119, 38, 37, 12,
]);
const MEDIUM = new Set([
  2, 7, 11, 23, 34, 35, 53, 54, 64, 75, 76, 79, 90, 91, 113, 131, 136, 147, 149, 167, 175, 187, 192, 194,
]);
/** A long row of people reads best as a strip. */
const STRIP = new Set([160]);
/** Empty rooms, kit, and repeats of a shot already shown larger: always a small box. */
const MINOR = new Set([
  69, 81, 125, 126, 127, 152, 153, 154, 156, 157, 158, 159, 161, 171, 172, 173, 174, 178, 179, 180,
  182, 183, 184, 185, 186, 191, 201,
]);

/** Tighter cuts of a few photos, made by scripts/camp_photo_crops.py. The full-size view keeps the original. */
const CROPS: Record<string, { file: string; w: number; h: number } | undefined> = crops;

/** What a piece draws: the crop where there is one, the photo itself otherwise. */
function drawn(img: Img): { file: string; w: number; h: number } {
  return CROPS[img.file] ?? img;
}

/** Columns by rows on the eight-column grid. */
type Piece = "xl" | "xlp" | "ll" | "lp" | "m" | "wide" | "tall" | "s";

function pieceFor(img: Img): Piece {
  const n = photoNumber(img.file);
  const { w, h } = drawn(img);
  const landscape = w >= h;
  if (HERO.has(n)) return landscape ? "xl" : "xlp";
  if (LARGE.has(n)) return landscape ? "ll" : "lp";
  if (MEDIUM.has(n)) return "m";
  if (MINOR.has(n)) return "s";
  if (STRIP.has(n) || w / h >= 1.7) return "wide";
  if (w / h <= 0.6) return "tall";
  return "s";
}

const BIG: Piece[] = ["xl", "xlp", "ll", "lp", "m"];
/** Small pieces kept back for the end, where they close the gaps the last big pieces leave. */
const TAIL = 14;

/**
 * The order the pieces are laid in. Big pieces are spread through the collage with the small ones
 * dealt out between them, so no stretch is all big or all small and the grid packs without holes.
 */
function arrange(photos: Img[]): { img: Img; piece: Piece }[] {
  const all = photos.map((img) => ({ img, piece: pieceFor(img) }));
  const big = all.filter((item) => BIG.includes(item.piece));
  const rest = all.filter((item) => !BIG.includes(item.piece));
  if (big.length === 0) return rest;
  // Only single boxes can close any gap, so those are the ones kept for the end.
  const singles = rest.filter((item) => item.piece === "s");
  const tail = singles.slice(Math.max(singles.length - TAIL, 0));
  const small = rest.filter((item) => !tail.includes(item));
  const out: { img: Img; piece: Piece }[] = [];
  let dealt = 0;
  big.forEach((item, index) => {
    out.push(item);
    const upTo = Math.floor(((index + 1) * small.length) / big.length);
    while (dealt < upTo) out.push(small[dealt++]);
  });
  return [...out, ...tail];
}

/** Where a crop is centred, for the photos whose subject is off to one side. */
const FOCUS: Record<number, string> = { 160: "50% 36%" };

/** What the browser is told each piece's width is, so it fetches a picture of about that size. */
const SIZES: Record<Piece, string> = {
  xl: "(max-width: 560px) 100vw, (max-width: 900px) 66vw, 600px",
  xlp: "(max-width: 560px) 75vw, (max-width: 900px) 50vw, 450px",
  ll: "(max-width: 560px) 75vw, (max-width: 900px) 50vw, 450px",
  lp: "(max-width: 560px) 50vw, (max-width: 900px) 33vw, 300px",
  m: "(max-width: 560px) 50vw, (max-width: 900px) 33vw, 300px",
  wide: "(max-width: 560px) 50vw, (max-width: 900px) 33vw, 300px",
  tall: "(max-width: 560px) 25vw, (max-width: 900px) 17vw, 150px",
  s: "(max-width: 560px) 25vw, (max-width: 900px) 17vw, 150px",
};

/** A wait that looks random but is the same on the server and in the browser. */
function stagger(file: string): number {
  return ((photoNumber(file) * 7919) % 11) * 55;
}

function isScan(img: Img): boolean {
  return img.type === "doc" || img.type === "news" || img.type === "poster";
}

/**
 * The camp photos as one collage. Pieces fade in at slightly different moments as they are scrolled to.
 * Letters, posters and press cuttings sit in their own row under it. Any piece opens full size.
 */
export function CampGallery({ events, images }: { events: EventMeta[]; images: Img[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [locationFilter, setLocationFilter] = useState<string>("");
  const [lightbox, setLightbox] = useState<number | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const collageRef = useRef<HTMLDivElement>(null);

  // Photos first, then the scans, which is also the order the full-size view steps through.
  const visibleImages = useMemo(() => {
    const kept = images.filter((img) => {
      if (filter === "indep" && !img.independent) return false;
      if (filter === "collab" && img.independent) return false;
      if (locationFilter && img.location !== locationFilter) return false;
      return true;
    });
    return [...kept.filter((img) => !isScan(img)), ...kept.filter(isScan)];
  }, [filter, locationFilter, images]);

  const photos = useMemo(() => arrange(visibleImages.filter((img) => !isScan(img))), [visibleImages]);
  const scans = useMemo(() => visibleImages.filter(isScan), [visibleImages]);

  const allLocations = useMemo(() => {
    const s = new Set(images.map((i) => i.location));
    return Array.from(s).sort();
  }, [images]);

  // Each piece shows itself the first time it is scrolled to.
  useEffect(() => {
    const root = collageRef.current;
    if (!root) return;
    const pieces = root.querySelectorAll<HTMLElement>(".piece:not(.is-in)");
    if (!("IntersectionObserver" in window)) {
      pieces.forEach((piece) => piece.classList.add("is-in"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.05 },
    );
    pieces.forEach((piece) => observer.observe(piece));
    return () => observer.disconnect();
  }, [visibleImages]);

  const openLb = useCallback((file: string, trigger: HTMLElement | null) => {
    const idx = visibleImages.findIndex((i) => i.file === file);
    if (idx >= 0) {
      openerRef.current = trigger;
      setLightbox(idx);
    }
  }, [visibleImages]);

  const closeLb = useCallback(() => {
    setLightbox(null);
    requestAnimationFrame(() => openerRef.current?.focus());
  }, []);
  const prev = useCallback(() => setLightbox((i) => (i === null ? null : (i - 1 + visibleImages.length) % visibleImages.length)), [visibleImages.length]);
  const next = useCallback(() => setLightbox((i) => (i === null ? null : (i + 1) % visibleImages.length)), [visibleImages.length]);

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLb();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Tab") {
        // Cycle through the dialog's own controls instead of parking focus on
        // Close — otherwise Previous and Next are unreachable by keyboard.
        const controls = Array.from(
          dialogRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? []
        );
        if (!controls.length) return;
        e.preventDefault();
        const at = controls.indexOf(document.activeElement as HTMLButtonElement);
        const step = e.shiftKey ? -1 : 1;
        const to = at === -1 ? 0 : (at + step + controls.length) % controls.length;
        controls[to]?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => closeBtnRef.current?.focus());
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox, closeLb, prev, next]);

  const open = lightbox === null ? null : visibleImages[lightbox];

  return (
    <section style={{ padding: "24px 0 112px" }}>
      <style>{`
        .collage { container-type: inline-size; }
        .collage-grid {
          --gap: 10px;
          --cols: 8;
          display: grid;
          grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
          grid-auto-rows: calc((100cqw - (var(--cols) - 1) * var(--gap)) / var(--cols));
          grid-auto-flow: dense;
          gap: var(--gap);
        }
        .piece {
          position: relative; display: block; margin: 0; padding: 0; border: 0; overflow: hidden;
          border-radius: 14px; background: var(--tile); cursor: zoom-in; appearance: none;
          opacity: 0; transform: scale(0.965);
          transition: opacity .9s cubic-bezier(0.2, 0.7, 0.2, 1), transform .9s cubic-bezier(0.2, 0.7, 0.2, 1);
          transition-delay: var(--wait, 0ms);
        }
        .piece.is-in { opacity: 1; transform: none; }
        .piece img { object-fit: cover; transition: transform .6s cubic-bezier(0.2, 0.7, 0.2, 1); }
        .piece:hover img, .piece:focus-visible img { transform: scale(1.04); }
        .piece-wide { grid-column: span 2; }
        .piece-tall { grid-row: span 2; }
        .piece-m { grid-column: span 2; grid-row: span 2; }
        .piece-ll { grid-column: span 3; grid-row: span 2; }
        .piece-lp { grid-column: span 2; grid-row: span 3; }
        .piece-xl { grid-column: span 4; grid-row: span 3; border-radius: 20px; }
        .piece-xlp { grid-column: span 3; grid-row: span 4; border-radius: 20px; }
        /* Where the photo was taken, on frosted glass, while it is pointed at. */
        .piece-place {
          position: absolute; left: 8px; bottom: 8px; max-width: calc(100% - 16px);
          padding: 4px 10px; border-radius: 999px; font-size: 13px; font-weight: 500; letter-spacing: -0.01em;
          color: #0A0A0A; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          opacity: 0; transform: translateY(4px); transition: opacity .25s ease, transform .25s ease;
        }
        .piece:hover .piece-place, .piece:focus-visible .piece-place { opacity: 1; transform: none; }
        .piece-s .piece-place, .piece-tall .piece-place { display: none; }
        .scan-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
        .scan-grid .piece { aspect-ratio: 3 / 4; background: #fff; border: 1px solid var(--hairline); }
        .scan-grid .piece img { object-fit: contain; padding: 8px; }
        @media (max-width: 900px) {
          .collage-grid { --cols: 6; --gap: 8px; }
        }
        @media (max-width: 560px) {
          .collage-grid { --cols: 4; --gap: 6px; }
          .scan-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; }
          .piece { border-radius: 10px; }
          .piece-xl, .piece-xlp { border-radius: 14px; }
          .camp-filter-bar { padding: 8px 10px !important; gap: 8px !important; flex-wrap: nowrap !important; }
          .camp-filter-chips { flex: 1 1 auto; overflow-x: auto; -webkit-overflow-scrolling: touch; flex-wrap: nowrap !important; scrollbar-width: none; }
          .camp-filter-chips::-webkit-scrollbar { display: none; }
          .camp-filter-chips button { white-space: nowrap; font-size: 12px !important; padding: 11px 14px !important; min-height: 44px; }
          .camp-filter-select { font-size: 12px !important; padding: 11px 12px !important; min-height: 44px; flex-shrink: 0; max-width: 130px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .piece { opacity: 1; transform: none; transition: none; }
          .piece img { transition: none; }
        }
      `}</style>
      {/* Without scripts nothing would ever add .is-in, so the pieces are simply shown. */}
      <noscript>
        <style>{`.piece { opacity: 1 !important; transform: none !important; }`}</style>
      </noscript>

      <div className="container">
        {/* Filter bar */}
        <div
          className="camp-filter-bar glass"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 28,
            padding: "12px 14px",
            border: "1px solid rgba(10,10,10,0.09)",
            borderRadius: 16,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7), 0 16px 36px -22px rgba(0,0,0,0.25)",
            position: "sticky",
            top: 84,
            zIndex: 10,
          }}
        >
          <div className="camp-filter-chips" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
              All camps · {events.length}
            </FilterChip>
            <FilterChip active={filter === "indep"} onClick={() => setFilter("indep")}>
              Anubhav CMC standalone
            </FilterChip>
            <FilterChip active={filter === "collab"} onClick={() => setFilter("collab")}>
              With Barasat Blood Bank
            </FilterChip>
          </div>
          <select
            aria-label="Filter camps by location"
            className="camp-filter-select"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            style={{
              padding: "8px 14px",
              border: "1px solid rgba(10,10,10,0.2)",
              borderRadius: 999,
              background: "transparent",
              fontSize: 13,
              fontWeight: 500,
              color: "var(--ink)",
              cursor: "pointer",
            }}
          >
            <option value="">All locations · {allLocations.length}</option>
            {allLocations.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>

        {visibleImages.length === 0 && (
          <div style={{ padding: 60, textAlign: "center", color: "var(--ink-500)" }}>
            No camps match this filter.
          </div>
        )}

        <div ref={collageRef} className="collage">
          <div className="collage-grid">
            {photos.map(({ img, piece }, index) => {
              return (
                <button
                  key={img.file}
                  type="button"
                  onClick={(e) => openLb(img.file, e.currentTarget)}
                  className={`piece piece-${piece}`}
                  style={{ ["--wait" as string]: `${stagger(img.file)}ms` }}
                >
                  <Image
                    src={`/events/${drawn(img).file}`}
                    alt={`Screening camp at ${img.location}`}
                    fill
                    sizes={SIZES[piece]}
                    priority={index < 4}
                    style={{ objectPosition: FOCUS[photoNumber(img.file)] }}
                  />
                  <span className="piece-place glass" aria-hidden>{img.location}</span>
                </button>
              );
            })}
          </div>

          {scans.length > 0 && (
            <div style={{ marginTop: 72 }}>
              <h2 className="title" style={{ marginBottom: 20 }}>Letters, posters and press</h2>
              <div className="scan-grid">
                {scans.map((img) => (
                  <button
                    key={img.file}
                    type="button"
                    onClick={(e) => openLb(img.file, e.currentTarget)}
                    className="piece"
                    style={{ ["--wait" as string]: `${stagger(img.file)}ms` }}
                  >
                    <Image
                      src={`/events/${img.file}`}
                      alt={`${img.type === "news" ? "Press cutting" : "Letter or poster"} from the ${img.location} camp`}
                      fill
                      sizes="(max-width: 560px) 50vw, 200px"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox !== null && open && (
        <div
          ref={dialogRef}
          onClick={closeLb}
          role="dialog"
          aria-modal="true"
          aria-label={`Camp photo ${lightbox + 1} of ${visibleImages.length}, ${open.location}`}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.92)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            cursor: "zoom-out",
          }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            aria-label="Previous"
            style={lightboxBtn("left")}
          >‹</button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            aria-label="Next"
            style={lightboxBtn("right")}
          >›</button>
          <button
            ref={closeBtnRef}
            onClick={closeLb}
            aria-label="Close lightbox"
            style={{ ...lightboxBtn("right"), top: 24, right: 24, transform: "none", width: 44, height: 44, fontSize: 18 }}
          >✕</button>

          <figure
            onClick={(e) => e.stopPropagation()}
            style={{
              margin: 0,
              maxWidth: "min(1200px, 92vw)",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
              cursor: "default",
            }}
          >
            {/* Full-resolution on purpose: this only loads when the viewer
                explicitly opens a photo, and the original is what they came to see. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/events/${open.file}`}
              alt={`Screening camp at ${open.location}`}
              style={{
                maxWidth: "100%",
                maxHeight: "82vh",
                objectFit: "contain",
                borderRadius: 12,
              }}
            />
            <div style={{ fontSize: 14, color: "#E5E5E5" }}>{open.location}</div>
          </figure>
        </div>
      )}
    </section>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 16px",
        borderRadius: 999,
        border: `1px solid ${active ? "var(--ink)" : "rgba(10,10,10,0.2)"}`,
        background: active ? "var(--ink)" : "transparent",
        color: active ? "#fff" : "var(--ink)",
        fontSize: 13,
        fontWeight: 500,
        cursor: "pointer",
        transition: "all .15s ease",
      }}
    >
      {children}
    </button>
  );
}

function lightboxBtn(side: "left" | "right"): React.CSSProperties {
  return {
    position: "absolute",
    top: "50%",
    [side]: 24,
    transform: "translateY(-50%)",
    width: 52,
    height: 52,
    borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.2)",
    background: "rgba(0,0,0,0.4)",
    color: "#fff",
    fontSize: 28,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  };
}
