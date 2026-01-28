import type { Config } from "tailwindcss";

const config: Config = {
  // 1. 告诉 Tailwind 去哪里找写了 class 的文件
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // 2. 自定义颜色 (方便以后统一修改主题色)
      colors: {
        matrix: {
          black: '#000000',
          dark: '#020617', // 深邃蓝黑背景
          green: '#10b981', // 经典的黑客绿
        },
      },
      // 5. 全局字体配置，用 CSS 变量以便 next/font 注入后生效
      fontFamily: {
        sans: ['var(--font-noto)', 'Inter', 'system-ui'],
        mono: ['var(--font-jetbrains-mono)', 'ui-monospace', 'SFMono-Regular'],
        display: ['var(--font-orbitron)'],
      },
      // 3. 定义关键帧动画 (3D 动作的核心)
      keyframes: {
        // 扫光效果：一道光从左扫到右
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        // 3D 翻转进场：从躺平状态站立起来
        'rotate-x': {
          '0%': { 
            transform: 'rotateX(30deg) scale(0.9)',
            opacity: '0' 
          },
          '100%': { 
            transform: 'rotateX(0deg) scale(1)',
            opacity: '1' 
          },
        },
        // 缓慢呼吸：用于在线状态指示灯
        'pulse-slow': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 10px rgba(16,185,129,0.5)' },
          '50%': { opacity: '0.4', boxShadow: '0 0 0px rgba(16,185,129,0)' },
        },
        // 终端光标闪烁
        'cursor-blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        }
      },
      // 4. 注册动画工具类 (在 class 里直接用 animate-shimmer 等)
      animation: {
        'shimmer': 'shimmer 2.5s linear infinite',
        'rotate-x': 'rotate-x 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        'pulse-slow': 'pulse-slow 3s ease-in-out infinite',
        'cursor-blink': 'cursor-blink 1s step-end infinite',
      },
    },
  },
  plugins: [],
};

export default config;