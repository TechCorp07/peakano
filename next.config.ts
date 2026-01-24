import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Turbopack configuration
   * Configure resolve aliases for Node.js modules used by Cornerstone codecs
   */
  turbopack: {
    resolveAlias: {
      // Provide empty fallbacks for Node.js modules used by Cornerstone codecs
      fs: { browser: './src/lib/polyfills/empty.js' },
      path: { browser: './src/lib/polyfills/empty.js' },
      crypto: { browser: './src/lib/polyfills/empty.js' },
    },
  },

  /**
   * Transpile Cornerstone packages
   */
  transpilePackages: [
    '@cornerstonejs/core',
    '@cornerstonejs/tools',
    '@cornerstonejs/streaming-image-volume-loader',
    '@cornerstonejs/dicom-image-loader',
  ],

  /**
   * Webpack configuration for browser compatibility (fallback if not using Turbopack)
   * Cornerstone's codecs try to use Node.js modules - provide empty fallbacks
   */
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Provide empty fallbacks for Node.js modules used by Cornerstone codecs
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }

    // Add rule to handle WASM files from Cornerstone
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    return config;
  },

  /**
   * TypeScript settings - ignore build errors for deployment
   */
  typescript: {
    ignoreBuildErrors: true,
  },

  /**
   * ESLint settings - ignore during builds for deployment
   */
  eslint: {
    ignoreDuringBuilds: true,
  },

  /**
   * Experimental settings
   */
  experimental: {
    // Enable server actions if needed
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
