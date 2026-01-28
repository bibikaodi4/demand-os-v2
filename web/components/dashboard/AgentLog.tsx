"use client";

import { useEffect, useState, useRef } from "react";
import { Terminal } from "lucide-react";

const BUSINESS_LOGS = [
  { type: 'sys', text: "正在接入全球供应链节点..." },
  { type: 'process', text: "SKU-9982 (Amazon) 需求激增 +12%，启动比价..." },
  { type: 'success', text: ">>> 锁定最优库存: 义乌仓 A区 (Cost: $1.42)" },
  { type: 'calc', text: "利润空间计算完毕: 28% (Auto-Approved)" },
  { type: 'warn', text: "警告: 北美航线预计延迟 2h，已切换备用物流" },
  { type: 'upload', text: "订单同步至 ERP [OK]" },
];

export default function AgentLog() {
  const [logs, setLogs] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setLogs(prev => {
        const newLog = BUSINESS_LOGS[index % BUSINESS_LOGS.length];
        const timestamp = new Date().toLocaleTimeString('en-GB', { hour12: false });
        return [...prev, { ...newLog, time: timestamp, id: Date.now() }].slice(-4);
      });
      index++;
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [logs]);

  return (
    // ✅ 关键点：这里没有 border，没有 bg-white，只有 backdrop-blur
    <div className="w-full max-w-2xl font-mono text-[10px] sm:text-xs text-slate-400">
      <div className="flex items-center gap-2 mb-2 opacity-50 px-2">
        <Terminal size={10} className="text-emerald-500" />
        <span className="tracking-[0.2em] text-emerald-500/80">SYSTEM_KERNEL_STREAM</span>
      </div>
      
      <div 
        ref={scrollRef} 
        className="h-24 overflow-hidden relative border-l-2 border-emerald-500/20 pl-3 backdrop-blur-sm bg-gradient-to-r from-black/60 to-transparent"
      >
        {logs.map((log) => (
          <div key={log.id} className="mb-1.5 flex gap-2 items-center animate-in slide-in-from-bottom-2 fade-in duration-500">
            <span className="text-slate-600 font-light shrink-0">[{log.time}]</span>
            <span className={`
              ${log.type === 'success' ? 'text-emerald-400 text-shadow-neon' : 
                log.type === 'warn' ? 'text-amber-400' : 
                log.type === 'sys' ? 'text-blue-400' : 'text-slate-300'}
            `}>
              {log.type === 'success' && '>> '}
              {log.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}