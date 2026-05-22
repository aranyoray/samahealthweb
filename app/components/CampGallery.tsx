"use client";
import { useEffect, useState, useMemo, useCallback } from "react";

type Img = {
  file: string;
  event: number;
  location: string;
  independent: boolean;
  caption: string;
  partnerTag: string;
  type?: "photo" | "doc" | "news" | "poster" | "team";
};

const PREVIEW_PER_EVENT = 6;

type EventMeta = {
  id: number;
  location: string;
  independent: boolean;
  imageCount: number;
};

type Filter = "all" | "indep" | "collab";

export function CampGallery({ events, images }: { events: EventMeta[]; images: Img[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [locationFilter, setLocationFilter] = useState<string>("");
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const toggleExpand = useCallback((eventId: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      const willCollapse = next.has(eventId);
      if (willCollapse) next.delete(eventId);
      else next.add(eventId);
      if (willCollapse) {
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        requestAnimationFrame(() => {
          document.getElementById(`camp-${eventId}`)?.scrollIntoView({
            block: "start",
            behavior: reduceMotion ? "auto" : "smooth",
          });
        });
      }
      return next;
    });
  }, []);

  const visibleImages = useMemo(() => {
    return images.filter((img) => {
      if (filter === "indep" && !img.independent) return false;
      if (filter === "collab" && img.independent) return false;
      if (locationFilter && img.location !== locationFilter) return false;
      return true;
    });
  }, [filter, locationFilter, images]);

  const groupedByEvent = useMemo(() => {
    const out: { ev: EventMeta; imgs: Img[] }[] = [];
    for (const ev of events) {
      const imgs = visibleImages.filter((i) => i.event === ev.id);
      if (imgs.length) out.push({ ev, imgs });
    }
    return out;
  }, [visibleImages, events]);

  const allLocations = useMemo(() => {
    const s = new Set(images.map((i) => i.location));
    return Array.from(s).sort();
  }, [images]);

  const openLb = useCallback((file: string) => {
    const idx = visibleImages.findIndex((i) => i.file === file);
    if (idx >= 0) setLightbox(idx);
  }, [visibleImages]);

  const closeLb = useCallback(() => setLightbox(null), []);
  const prev = useCallback(() => setLightbox((i) => (i === null ? null : (i - 1 + visibleImages.length) % visibleImages.length)), [visibleImages.length]);
  const next = useCallback(() => setLightbox((i) => (i === null ? null : (i + 1) % visibleImages.length)), [visibleImages.length]);

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLb();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox, closeLb, prev, next]);

  return (
    <section style={{ padding: "56px 0 120px" }}>
      <style>{`
        @keyframes campShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .camp-img-wrap {
          background: linear-gradient(90deg, var(--ink-50) 0%, var(--ink-100) 50%, var(--ink-50) 100%);
          background-size: 200% 100%;
          animation: campShimmer 1.6s linear infinite;
        }
        .camp-img-wrap.doc {
          background: linear-gradient(90deg, #F8FAFC 0%, #EEF2F6 50%, #F8FAFC 100%);
          background-size: 200% 100%;
        }
        .camp-img-wrap img {
          opacity: 0;
          transition: opacity .35s ease;
        }
        .camp-img-wrap.loaded {
          animation: none;
          background: var(--ink-50);
        }
        .camp-img-wrap.doc.loaded { background: #F8FAFC; }
        .camp-img-wrap.loaded img { opacity: 1; }
        @media (prefers-reduced-motion: reduce) {
          .camp-img-wrap { animation: none; }
          .camp-img-wrap img { transition: none; }
        }
        @media (max-width: 640px) {
          .camp-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
          .camp-grid p { font-size: 12px !important; line-height: 1.35 !important; }
          .camp-grid .mono { font-size: 10px !important; }
          .camp-filter-bar { padding: 10px 12px !important; gap: 8px !important; flex-wrap: nowrap !important; }
          .camp-filter-chips { flex: 1 1 auto; overflow-x: auto; -webkit-overflow-scrolling: touch; flex-wrap: nowrap !important; scrollbar-width: none; }
          .camp-filter-chips::-webkit-scrollbar { display: none; }
          .camp-filter-chips button { white-space: nowrap; font-size: 12px !important; padding: 11px 14px !important; min-height: 44px; }
          .camp-filter-select { font-size: 12px !important; padding: 11px 12px !important; min-height: 44px; flex-shrink: 0; max-width: 130px; }
          .camp-filter-bar { padding: 8px 10px !important; }
          .camp-event-head h2 { font-size: 18px !important; }
          .camp-event-head .mono { font-size: 9px !important; }
          .camp-event-head span[style*="brand"], .camp-event-head span[style*="rgba(220"] { font-size: 10px !important; padding: 3px 7px !important; }
        }
      `}</style>
      <div className="container">
        {/* Filter bar */}
        <div
          className="camp-filter-bar"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 36,
            padding: "16px 20px",
            background: "var(--paper-2)",
            border: "1px solid var(--ink-100)",
            borderRadius: 14,
            position: "sticky",
            top: 80,
            zIndex: 10,
            backdropFilter: "blur(8px)",
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
            className="camp-filter-select"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            style={{
              padding: "8px 14px",
              border: "1px solid var(--ink-200)",
              borderRadius: 999,
              background: "#fff",
              fontSize: 13,
              fontWeight: 500,
              color: "var(--ink-700)",
              cursor: "pointer",
            }}
          >
            <option value="">All locations · 22</option>
            {allLocations.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>

        {/* Events */}
        {groupedByEvent.length === 0 && (
          <div style={{ padding: 60, textAlign: "center", color: "var(--ink-400)" }}>
            No camps match this filter.
          </div>
        )}

        {groupedByEvent.map(({ ev, imgs }, evIdx) => (
          <div key={ev.id} id={`camp-${ev.id}`} style={{ marginBottom: 64, scrollMarginTop: 160 }} className="reveal">
            <div
              className="camp-event-head"
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                marginBottom: 18,
                paddingBottom: 14,
                borderBottom: "1px solid var(--ink-100)",
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
                <span
                  className="mono"
                  style={{ fontSize: 11, color: "var(--ink-400)", letterSpacing: "0.12em" }}
                >
                  CAMP {String(ev.id).padStart(2, "0")}
                </span>
                <h2 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em", fontFamily: "inherit" }}>
                  📍 {ev.location}
                </h2>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "4px 10px",
                    borderRadius: 999,
                    background: ev.independent
                      ? "rgba(15,118,110,0.10)"
                      : "rgba(220,38,38,0.10)",
                    color: ev.independent ? "var(--brand)" : "#B91C1C",
                  }}
                >
                  {ev.independent ? "Anubhav CMC camp" : "With Barasat Blood Bank"}
                </span>
              </div>
              <span style={{ fontSize: 13, color: "var(--ink-400)" }}>
                {imgs.length} {imgs.length === 1 ? "frame" : "frames"}
              </span>
            </div>

            {(() => {
              const isExpanded = expanded.has(ev.id);
              const hidden = Math.max(0, imgs.length - PREVIEW_PER_EVENT);
              const visible = isExpanded ? imgs : imgs.slice(0, PREVIEW_PER_EVENT);
              return (
                <>
                  <div
                    className="camp-grid"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                      gap: 16,
                    }}
                  >
                    {visible.map((img, imgIdx) => {
                      const isDoc = img.type === "doc" || img.type === "news" || img.type === "poster";
                      const eager = evIdx === 0 && imgIdx < 6;
                      return (
                        <button
                          key={img.file}
                          onClick={() => openLb(img.file)}
                          style={{
                            all: "unset",
                            cursor: "zoom-in",
                            display: "block",
                            borderRadius: 12,
                            overflow: "hidden",
                            border: "1px solid var(--ink-100)",
                            background: "#fff",
                            transition: "transform .2s ease, box-shadow .2s ease, border-color .2s ease",
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
                            (e.currentTarget as HTMLElement).style.boxShadow =
                              "0 14px 32px -18px rgba(15,118,110,0.35)";
                            (e.currentTarget as HTMLElement).style.borderColor = "var(--brand-2)";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.transform = "";
                            (e.currentTarget as HTMLElement).style.boxShadow = "";
                            (e.currentTarget as HTMLElement).style.borderColor = "var(--ink-100)";
                          }}
                        >
                          <div
                            className={`camp-img-wrap${isDoc ? " doc" : ""}`}
                            style={{
                              width: "100%",
                              aspectRatio: isDoc ? "3/4" : "4/3",
                              overflow: "hidden",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              position: "relative",
                            }}
                          >
                            {isDoc && (
                              <span
                                style={{
                                  position: "absolute",
                                  top: 8,
                                  left: 8,
                                  fontSize: 10,
                                  fontWeight: 600,
                                  letterSpacing: "0.08em",
                                  textTransform: "uppercase",
                                  padding: "3px 7px",
                                  borderRadius: 4,
                                  background: "rgba(15,118,110,0.92)",
                                  color: "#fff",
                                  zIndex: 1,
                                }}
                                className="mono"
                              >
                                {img.type === "news" ? "Press" : img.type === "poster" ? "Poster" : "Letter"}
                              </span>
                            )}
                            <img
                              src={`/events/${img.file}`}
                              alt={isDoc
                                ? img.caption
                                : `${img.caption} — ${img.location} blood donation camp`}
                              loading={eager ? "eager" : "lazy"}
                              fetchPriority={eager ? "high" : "auto"}
                              decoding="async"
                              width={isDoc ? 600 : 800}
                              height={isDoc ? 800 : 600}
                              ref={(node) => {
                                if (node?.complete && node.naturalHeight > 0) {
                                  node.parentElement?.classList.add("loaded");
                                }
                              }}
                              onLoad={(e) => e.currentTarget.parentElement?.classList.add("loaded")}
                              onError={(e) => e.currentTarget.parentElement?.classList.add("loaded")}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: isDoc ? "contain" : "cover",
                                display: "block",
                              }}
                            />
                          </div>
                          <div style={{ padding: "12px 14px 14px" }}>
                            <p
                              style={{
                                fontSize: 13.5,
                                lineHeight: 1.45,
                                color: "var(--ink-700)",
                                margin: 0,
                              }}
                            >
                              {img.caption}
                            </p>
                            <div
                              style={{
                                marginTop: 8,
                                display: "flex",
                                gap: 8,
                                alignItems: "center",
                                fontSize: 11,
                                color: "var(--ink-400)",
                              }}
                              className="mono"
                            >
                              <span>{img.location}</span>
                              <span style={{ opacity: 0.4 }}>·</span>
                              <span>{img.file.replace(/\.(jpe?g|png)$/i, "")}</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {hidden > 0 && (
                    <button
                      onClick={() => toggleExpand(ev.id)}
                      style={{
                        marginTop: 18,
                        padding: "10px 22px",
                        borderRadius: 999,
                        border: "1px solid var(--ink-200)",
                        background: "#fff",
                        color: "var(--ink-700)",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all .15s ease",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = "var(--brand)";
                        (e.currentTarget as HTMLElement).style.color = "var(--brand)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = "var(--ink-200)";
                        (e.currentTarget as HTMLElement).style.color = "var(--ink-700)";
                      }}
                    >
                      {isExpanded ? `Show fewer` : `View all ${imgs.length} frames →`}
                    </button>
                  )}
                </>
              );
            })()}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox !== null && visibleImages[lightbox] && (
        <div
          onClick={closeLb}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(7,9,14,0.92)",
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
            onClick={closeLb}
            aria-label="Close"
            style={{ ...lightboxBtn("right"), top: 24, right: 24, transform: "none", width: 44, height: 44, fontSize: 18 }}
          >✕</button>

          <figure
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "min(1200px, 92vw)",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              gap: 14,
              cursor: "default",
            }}
          >
            <img
              src={`/events/${visibleImages[lightbox].file}`}
              alt={visibleImages[lightbox].caption}
              style={{
                maxWidth: "100%",
                maxHeight: "75vh",
                objectFit: "contain",
                borderRadius: 8,
              }}
            />
            <figcaption
              style={{
                color: "#fff",
                fontSize: 15,
                lineHeight: 1.5,
                textAlign: "center",
                opacity: 0.92,
              }}
            >
              {visibleImages[lightbox].caption}
              <div
                style={{
                  marginTop: 6,
                  fontSize: 12,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  opacity: 0.6,
                }}
                className="mono"
              >
                {visibleImages[lightbox].location} · {lightbox + 1}/{visibleImages.length}
              </div>
            </figcaption>
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
        border: `1px solid ${active ? "var(--brand)" : "var(--ink-200)"}`,
        background: active ? "var(--brand)" : "#fff",
        color: active ? "#fff" : "var(--ink-700)",
        fontSize: 13,
        fontWeight: 600,
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
