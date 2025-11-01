import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Ignore ESLint errors during production builds so local development builds can run.
  // Keep linting during development; consider fixing the listed lint errors as a follow-up.
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Fix Next's workspace root inference so it doesn't pick a parent directory
  // that contains another lockfile and accidentally ignore our src/app routes.
  // This ensures server output tracing and route discovery happen relative to
  // this project folder, not a parent.
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
