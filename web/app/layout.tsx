import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Noto_Sans_SC, Orbitron } from "next/font/google";
import "./globals.css";
import DebugHydration from "../components/DebugHydration";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const mono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const noto = Noto_Sans_SC({
  variable: "--font-noto",
  weight: ["400", "700"],
  preload: false,
});

const orbit = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
});

// ✅ 1. Metadata 只保留标题和描述
export const metadata: Metadata = {
  title: "鸿亿鸿 全球订单对接系统 | Real-time Monitor",
  description: "Live transaction feed and supply chain visualization dashboard.",
};

// ✅ 2. Viewport 必须单独导出 (这是消除警告的关键！)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${mono.variable} ${noto.variable} ${orbit.variable} antialiased bg-black text-slate-200 selection:bg-emerald-500/30 selection:text-emerald-200`}
      >
        <DebugHydration />
        {children}
      </body>
    </html>
  );
}