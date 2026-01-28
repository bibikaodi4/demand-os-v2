import { Zap, Activity } from "lucide-react";

export default function MarketInsight() {
  return (
    // ✅ 关键点：w-64, backdrop-blur-md, bg-black/40
    <div className="w-64 backdrop-blur-md bg-black/40 border border-white/10 rounded-lg overflow-hidden shadow-[0_0_30px_-10px_rgba(16,185,129,0.2)]">
      
      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
      
      <div className="p-4 flex flex-col gap-4">
        <div className="flex justify-between items-center text-xs text-emerald-500/80 tracking-widest uppercase">
          <span className="flex items-center gap-1">
            <Activity size={12} />
            AI Insight
          </span>
          <span className="animate-pulse">● LIVE</span>
        </div>

        <div>
          <p className="text-[10px] text-slate-500 mb-1">OPPORTUNITY DETECTED</p>
          <div className="text-sm text-slate-200 leading-snug">
            <span className="text-emerald-400 font-bold">TikTok Shop</span> 
            美区同类竞品库存告急，建议补货 <span className="font-mono text-emerald-400">500+</span>
          </div>
        </div>

        <div className="w-full h-px bg-white/5 relative">
            <div className="absolute left-0 top-0 h-full w-1/3 bg-emerald-500/30"></div>
        </div>

        <div>
          <p className="text-[10px] text-slate-500 mb-1">AUTO-ACTION</p>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Zap size={12} className="text-amber-400" />
            <span>已自动匹配 <span className="text-amber-400">广东·佛山</span> 优质工厂</span>
          </div>
        </div>
      </div>
    </div>
  );
}