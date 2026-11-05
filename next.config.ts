import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: false,
  // Solo sviluppo: permette di aprire il dev server da 127.0.0.1 e dal telefono sulla rete locale.
  allowedDevOrigins: ['127.0.0.1', '192.168.*.*', '10.*.*.*'],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
