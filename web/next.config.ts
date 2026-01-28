import type { NextConfig } from "next";

const isGithubActions = process.env.GITHUB_ACTIONS === 'true';

// 支持通过环境变量在构建时设置 basePath（例如在 GitHub Actions 或 CI/CD 中）
const envBasePath = process.env.NEXT_BASE_PATH || process.env.BASE_PATH;
const defaultGithubBasePath = isGithubActions ? '/demand-os' : undefined;

const basePath = envBasePath || defaultGithubBasePath;

const shouldExport = isGithubActions || process.env.NEXT_EXPORT === 'true';

const nextConfig: NextConfig = {
  ...(basePath
    ? {
        basePath,
        // 确保静态资源引用使用相同前缀（在某些托管环境下需要）
        assetPrefix: basePath,
      }
    : {}),
  ...(shouldExport ? { output: 'export' } : {}),

  images: {
    unoptimized: true,
  },
};

export default nextConfig;