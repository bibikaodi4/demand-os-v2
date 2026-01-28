import DemandWaterfall from "@/components/dashboard/DemandWaterfall";
import AgentLog from "@/components/dashboard/AgentLog";
import MarketInsight from "@/components/dashboard/MarketInsight";
import ChatWidget from "@/components/ChatWidget";

export default function Home() {
  return (
    <main className="relative min-h-screen w-full flex items-center justify-center bg-black overflow-hidden font-mono selection:bg-emerald-500/30">
      
      {/* 1. 背景层：保持之前的深邃感 */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        <div className="absolute inset-0 bg-radial-gradient from-transparent to-black"></div>
      </div>

      {/* 2. 核心层：3D 瀑布流 (保持绝对居中，不被干扰) */}
      <div className="relative z-10 w-full max-w-5xl px-4 scale-95 md:scale-100 transition-transform">
        <DemandWaterfall />
      </div>

      {/* 3. HUD 悬浮层 (装饰与信息) - 绝对定位，不影响布局 */}
      
      {/* 左上角：标题 */}
      <div className="absolute top-6 left-6 z-20 hidden md:flex items-center gap-2">
        <img src="/logo.png" alt="鸿亿鸿LOGO" className="h-8 w-auto max-h-8 mr-2 object-contain" />
        <h1 className="text-2xl font-bold tracking-tighter brand-title" style={{ color: '#ff6b81' }}>
          鸿亿鸿 全球订单对接系统
        </h1>
        <div className="flex items-center gap-2 text-[10px] text-emerald-500/50 mt-1">
           <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
           SYSTEM_ONLINE // V.4.1.2
        </div>
      </div>

      {/* 右侧居中：全息洞察卡片 (只在大屏显示) */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 z-20 hidden xl:block">
        <MarketInsight />
      </div>

      {/* 底部左侧：终端日志 */}
      <div className="absolute bottom-6 left-6 z-20 w-full max-w-lg hidden md:block pointer-events-none">
        <AgentLog />
      </div>

      {/* 底部右侧：简单的系统状态 */}
      <div className="absolute bottom-6 right-6 z-20 text-right hidden md:block opacity-40 text-[10px] text-slate-500">
         <p>LATENCY: 12ms</p>
         <p>ENCRYPTION: AES-256</p>
      </div>

      {/* 仅在首页显示的聊天机器人 */}
      <ChatWidget />

    </main>
  );
}