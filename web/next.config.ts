import type { NextConfig } from "next";

const isGithubActions = process.env.GITHUB_ACTIONS === 'true';

const nextConfig: NextConfig = {
  // 仅在 GitHub Actions（用于 GitHub Pages 部署）时启用静态导出与 basePath
  ...(isGithubActions
    ? {
        output: 'export',
        basePath: '/demand-os',
      }
    : {}),

  images: {
    unoptimized: true,
  },
};

export default nextConfig;