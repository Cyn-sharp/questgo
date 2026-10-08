import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  allowedDevOrigins: [
    "192.168.1.74",
    "63c5-2001-4454-4c2-5100-3158-d1ef-e573-7526.ngrok-free.app",
  ],
};

export default nextConfig;
