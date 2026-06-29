import Link from "next/link";
import { Nav } from "./components/Nav";
import { Footer } from "./components/Footer";

export const metadata = {
  title: "Page not found. SamaHealth",
};

export default function NotFound() {
  return (
    <>
      <Nav />
      <main
        id="main"
        style={{
          minHeight: "70vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "120px 24px 80px",
          background: "var(--paper)",
        }}
      >
        <div style={{ maxWidth: 640, textAlign: "center" }}>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(40px, 6vw, 72px)",
              lineHeight: 1.02,
              letterSpacing: "-0.035em",
              fontWeight: 500,
              margin: 0,
            }}
          >
            That page didn't make it to the clinic.
          </h1>
          <p
            style={{
              marginTop: 22,
              fontSize: 17,
              lineHeight: 1.55,
              color: "var(--ink-500)",
            }}
          >
            The link you followed may be old, mistyped, or pointing to something
            we haven't published yet. Try one of these instead.
          </p>
          <div
            style={{
              marginTop: 32,
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              justifyContent: "center",
            }}
          >
            <Link
              href="/"
              className="btn"
              style={{
                background: "var(--ink)",
                color: "#fff",
                height: 44,
                padding: "0 22px",
                fontSize: 14,
              }}
            >
              Back to home →
            </Link>
            <Link
              href="/research"
              className="btn"
              style={{
                background: "transparent",
                color: "var(--ink-700)",
                border: "1px solid var(--ink-200)",
                height: 44,
                padding: "0 22px",
                fontSize: 14,
              }}
            >
              Science
            </Link>
            <Link
              href="/camps"
              className="btn"
              style={{
                background: "transparent",
                color: "var(--ink-700)",
                border: "1px solid var(--ink-200)",
                height: 44,
                padding: "0 22px",
                fontSize: 14,
              }}
            >
              Field camps
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
