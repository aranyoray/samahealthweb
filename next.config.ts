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
};

export default nextConfig;
