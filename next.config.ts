import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  },
  // 防止 public/projects (2.8GB / 18816 个文件) 被打包到 serverless function
  outputFileTracingExcludes: {
    "*": ["**/public/projects/**/*"],
  },
};

export default nextConfig;
