/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "randomuser.me",
      },
    ],
  },

  // Prevent pdf-parse and pdfjs-dist from being bundled by Next.js SSR
  // This avoids the "Cannot find module pdf.worker.mjs" error
  serverExternalPackages: ["pdf-parse", "pdf-parse/node", "pdfjs-dist"],

  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
};

export default nextConfig;
