/** @type {import('next').NextConfig} */
const isNetlify = process.env.NETLIFY === "true";

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  ...(isNetlify ? {} : { output: "standalone" }),
};

module.exports = nextConfig;
