import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Canonical TB route is /parakhTB. Redirect the old /tb path so shared
  // links don't 404. NOTE: Next.js redirect `source` matching is
  // case-insensitive, so a /parakhtb -> /parakhTB rule would match /parakhTB
  // itself and loop. Lowercase /parakhtb therefore 404s by design.
  async redirects() {
    return [
      { source: "/tb", destination: "/parakhTB", permanent: true },
    ];
  },
  // Baseline hardening for a fully static, cookie-free marketing site. No CSP
  // here on purpose: the app emits inline JSON-LD and Next emits inline
  // bootstrap scripts, so a useful policy needs a nonce and a live verification
  // pass rather than a guessed header.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
