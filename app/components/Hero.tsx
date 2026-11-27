import Link from "next/link";
import Image from "next/image";

/** The system in four lines, on frosted glass over the foot of the picture. */
const PARTS = [
  { name: "SamaBeat band", line: "6 LEDs, ECG and bioimpedance on the wrist" },
  { name: "Medical ID", line: "Clip-on E Ink, read without a phone" },
  { name: "SamaDock", line: "Wi-Fi and radar sensing, no camera or microphone" },
  { name: "One timeline", line: "A confidence flag on every value" },
];

/**
 * The first screen: one black card, inset from the edges of the page. The statement is centred at the
 * top, the band stands under it, and the four parts of the system sit over the foot of the picture on
 * frosted glass, arriving one after another.
 */
export function Hero() {
  return (
    <section aria-labelledby="hero-title" data-tone="dark" className="hero-card home-hero">
      <div className="home-hero-text">
        <h1 id="hero-title" className="display">
          <span style={{ display: "block" }}>Continuous care monitoring,</span>
          <span style={{ display: "block", color: "var(--dim)" }}>on the wrist and in the room.</span>
        </h1>
        <p className="lede" style={{ maxWidth: "40rem", margin: "20px auto 0" }}>
          SamaBeat is a medical device system in clinical validation: a wrist band and a bedside dock for
          people cared for at home. It is not cleared or approved by any regulator yet.
        </p>
        <div style={{ marginTop: 28, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
          <Link href="/homecare" className="btn btn-light">
            How it works
          </Link>
          <Link href="#evidence" className="btn btn-ghost">
            Where the evidence stands
          </Link>
        </div>
      </div>

      <div className="home-hero-stage">
        <Image
          src="/band/hero.webp"
          alt="The SamaBeat band: a slim sensing core on a knit strap, with the E Ink medical ID lifted just above the rails it clips onto"
          width={1200}
          height={812}
          priority
          sizes="(max-width: 860px) 100vw, 760px"
          className="home-hero-band"
        />

        <ul className="glass-dark home-parts">
          {PARTS.map((part, index) => (
            <li key={part.name} className="reading-cell" style={{ ["--delay" as string]: `${400 + index * 220}ms` }}>
              <span className="title" style={{ fontSize: 17 }}>{part.name}</span>
              <span className="home-parts-line">{part.line}</span>
            </li>
          ))}
        </ul>
      </div>

      <style>{`
        .home-hero { display: flex; flex-direction: column; min-height: min(860px, max(660px, calc(100svh - var(--nav-h) - 104px))); }
        .home-hero-text { position: relative; z-index: 1; padding: 60px 24px 0; text-align: center; }
        .home-hero-text h1 { max-width: 60rem; margin: 0 auto; }
        .home-hero-stage { position: relative; flex: 1; min-height: 380px; }
        .home-hero-band { position: absolute; left: 50%; top: -22%; transform: translateX(-50%); width: auto; max-width: none; height: 158%; }
        .home-parts {
          position: absolute; left: 50%; bottom: 28px; transform: translateX(-50%);
          width: min(1040px, calc(100% - 32px)); margin: 0; padding: 0; list-style: none;
          display: grid; grid-template-columns: repeat(4, 1fr);
          border-radius: 18px; color: #F5F5F5;
        }
        .home-parts li { padding: 18px 20px; border-left: 1px solid rgba(255,255,255,0.12); display: grid; gap: 4px; align-content: start; }
        .home-parts li:first-child { border-left: 0; }
        .home-parts-line { font-size: 14px; line-height: 1.4; color: #D6D6D6; }
        @media (max-width: 860px) {
          .home-hero-text { padding-top: 44px; }
          .home-hero-stage { min-height: 470px; }
          .home-hero-band { top: -8%; height: 340px; }
          .home-parts { grid-template-columns: 1fr 1fr; bottom: 16px; }
          .home-parts li { padding: 14px 16px; border-left: 0; border-top: 1px solid rgba(255,255,255,0.12); }
          .home-parts li:nth-child(-n + 2) { border-top: 0; }
          .home-parts li:nth-child(even) { border-left: 1px solid rgba(255,255,255,0.12); }
        }
      `}</style>
    </section>
  );
}
