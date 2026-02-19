import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  devIndicators: {
    // buildActivity: false, // buildActivity might support boolean in some versions, but type says only position. Commenting out to be safe.
  },
};

export default nextConfig;
