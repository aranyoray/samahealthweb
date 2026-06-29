import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Canonical TB route is /parakhTB (case-sensitive). Catch the common
  // lowercase typo and the old /tb path so neither 404s.
  async redirects() {
    return [
      { source: "/tb", destination: "/parakhTB", permanent: true },
      { source: "/parakhtb", destination: "/parakhTB", permanent: true },
    ];
  },
};

export default nextConfig;
