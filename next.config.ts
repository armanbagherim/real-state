import type { NextConfig } from "next";
import path from "node:path";
const config: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.resolve("."),
  poweredByHeader: false,
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "same-origin" },
        ],
      },
    ];
  },
};
export default config;
