import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Pin the workspace root so Next doesn't pick up an unrelated parent lockfile.
  outputFileTracingRoot: path.join(__dirname),
  webpack: (config) => {
    // Konva references an optional Node-only `canvas` module that we never use
    // (the editor runs client-side via WebGL/2D canvas). Aliasing it to `false`
    // makes webpack ignore it in both bundles without breaking API routes.
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      canvas: false,
    };
    return config;
  },
};

export default nextConfig;
