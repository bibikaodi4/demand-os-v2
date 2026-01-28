"use client";

import { useDirectusRealtime } from '@/lib/hooks/useDirectusRealtime';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, MapPin, Zap, ShoppingBag, Globe, Cpu, Radio, ArrowRight, Clock } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

export default function DemandWaterfall() {
  const { demands, isConnected, error, reconnect, authenticate, testAnonymous, clearLocalAuth } = useDirectusRealtime();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 🔄 核心升级 1: 自动滚动逻辑 (让数据像瀑布一样流动)
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer || isHovering) return;

    let animationFrameId: number;
    const scroll = () => {
      if (scrollContainer) {
        // 数值越大滚动越快，0.5 是一个比较优雅的速度
        scrollContainer.scrollTop += 0.5;
        // 到底后不回顶：等待新数据 push 进来继续“向下流动”
      }
      animationFrameId = requestAnimationFrame(scroll);
    };
    animationFrameId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isHovering, demands.length]); // 依赖项：只有在不悬停且有数据时滚动

  // 辅助样式：保留了你原来的逻辑，但增加了荧光感
  const getPlatformStyle = (platform: string) => {
    switch (platform) {
      case 'TikTok': return 'text-pink-400 border-pink-500/30 shadow-[0_0_10px_rgba(244,114,182,0.1)]';
      case 'Temu': return 'text-orange-400 border-orange-500/30 shadow-[0_0_10px_rgba(251,146,60,0.1)]';
      case 'Amazon': return 'text-yellow-400 border-yellow-500/30 shadow-[0_0_10px_rgba(250,204,21,0.1)]';
      default: return 'text-blue-400 border-blue-500/30 shadow-[0_0_10px_rgba(96,165,250,0.1)]';
    }
  };

  const getDaysLeft = (expiry?: string, createdAt?: string) => {
    const dayMs = 1000 * 60 * 60 * 24;
    const fallback = createdAt ? new Date(createdAt).getTime() + 20 * dayMs : NaN; // 兜底：创建后 20 天失效
    const target = expiry ? new Date(expiry).getTime() : fallback;
    if (!Number.isFinite(target)) return null;
    return Math.ceil((target - Date.now()) / dayMs);
  };

  return (
    // 🌌 核心升级 2: 添加 Perspective 透视层
    <div className="w-full max-w-5xl mx-auto py-10 perspective-2000 relative z-10">
      
      {/* 错误提示 (悬浮在 3D 空间之上) */}
      {error && (
        <div className="absolute top-0 inset-x-0 -mt-16 z-50 flex justify-center">
          <div className="px-4 py-2 bg-red-950/80 border border-red-500 text-red-400 text-xs font-mono rounded shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse">
             ⚠️ SIGNAL INTERRUPTED: {error}
          </div>
        </div>
      )}

      {/* 🚀 核心升级 3: 3D 旋转容器 */}
      <div 
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        className="relative bg-[#030712]/90 backdrop-blur-xl border border-emerald-500/20 rounded-3xl overflow-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)] transition-all duration-700 ease-out preserve-3d group"
        style={{ 
          // 悬停时归位，平时向后倾斜
          transform: isHovering 
            ? 'rotateX(0deg) translateY(0px) scale(1.01)' 
            : 'rotateX(12deg) translateY(-20px)' 
        }}
      >
        
        {/* HUD 头部：模仿控制台界面 */}
        <div className="relative z-20 flex items-center justify-between px-6 py-5 border-b border-emerald-500/10 bg-black/40">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="鸿亿鸿LOGO" className="h-8 w-auto max-h-8 mr-2 object-contain" />
            <div>
              <h3 className="brand-title text-lg font-bold tracking-wider drop-shadow-[0_0_5px_rgba(255,107,129,0.5)]" style={{ color: '#ff6b81' }}>
                鸿亿鸿 全球订单对接系统
              </h3>
              <div className="flex items-center gap-3 text-[10px] text-emerald-600/80 font-mono mt-1">
                <span className="flex items-center gap-1"><Cpu className="w-3 h-3" /> CPU: 12%</span>
                <span className="flex items-center gap-1"><Radio className="w-3 h-3" /> NET: SECURE</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* 呼吸灯组件 */}
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse-slow' : 'bg-red-500'}`} />
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-widest">
              {isConnected ? 'ONLINE' : 'OFFLINE'}
            </span>
            {!isConnected && (
              <>
                <button
                  onClick={() => reconnect?.()}
                  className="ml-2 text-[10px] px-2 py-1 bg-yellow-600/10 border border-yellow-500/20 text-yellow-300 rounded font-mono hover:bg-yellow-600/20"
                >
                  Reconnect
                </button>
                <button
                  onClick={() => testAnonymous && testAnonymous()}
                  className="ml-2 text-[10px] px-2 py-1 bg-slate-700/10 border border-slate-600/20 text-slate-200 rounded font-mono hover:bg-slate-700/20"
                >
                  Test Anonymous
                </button>
                <button
                  onClick={() => clearLocalAuth && clearLocalAuth()}
                  className="ml-2 text-[10px] px-2 py-1 bg-red-700/10 border border-red-600/20 text-red-300 rounded font-mono hover:bg-red-700/20"
                >
                  Clear Local Auth
                </button>
              </>
            )}
            {/* 调试登录表单（仅 dev 用） */}
            {!isConnected && (
              <div className="ml-3 flex items-center gap-2">
                <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="email" className="text-xs p-1 rounded bg-slate-800 border border-white/10 text-white" />
                <input value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="password" type="password" className="text-xs p-1 rounded bg-slate-800 border border-white/10 text-white" />
                <button onClick={async()=>{ try{ await authenticate?.(email,password); }catch(e){ console.error(e); } }} className="text-xs px-2 py-1 bg-emerald-600 rounded">Login</button>
              </div>
            )}
          </div>
        </div>

        {/* 瀑布流显示区域 */}
        <div className="relative h-[600px] bg-black/50">
          
          {/* 上下遮罩：制造“全息投影”的渐隐感 */}
          <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-[#020617] to-transparent z-10 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#020617] to-transparent z-10 pointer-events-none"></div>

          {/* 滚动容器 */}
          <div 
            ref={scrollRef}
            className="h-full overflow-y-auto no-scrollbar p-6 pb-32 space-y-3 relative z-0"
          >
            <AnimatePresence mode="popLayout" initial={false}>
              {demands.map((item, index) => {
                const daysLeft = getDaysLeft((item as any).expiry_date || (item as any).valid_until, (item as any).date_created);
                const badgeClass = daysLeft === null
                  ? 'text-slate-400 bg-slate-700/40 border-slate-600/60'
                  : daysLeft < 14
                    ? 'text-red-400 bg-red-500/10 border-red-500/40'
                    : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';

                return (
                  <motion.div
                    layout
                    key={item.id}
                    // 进场动画：不仅淡入，还有一个 3D 翻转效果
                    initial={{ opacity: 0, x: -20, rotateX: -45 }}
                    animate={{ opacity: 1, x: 0, rotateX: 0 }}
                    exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className={`
                      relative group/item overflow-hidden rounded-xl border bg-[#0a0a0a]/80 backdrop-blur-sm 
                      hover:bg-white/[0.05] transition-colors cursor-pointer
                      ${getPlatformStyle(item.platform)}
                    `}
                    // 给每一行稍微加一点左边框颜色
                    style={{ borderLeftWidth: '3px' }}
                  >
                    {/* ✨ 扫光特效：使用 tailwind.config.ts 里的 animate-shimmer */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent -translate-x-full group-hover/item:animate-shimmer z-0"></div>

                    <div className="relative z-10 flex items-center gap-4 p-3">
                      
                      {/* 序号：像代码行号一样 */}
                      <div className="text-[10px] font-mono text-slate-700 w-6">
                        {(index + 1).toString().padStart(2, '0')}
                      </div>

                      {/* 买家头像 */}
                      <div className="relative w-9 h-9 flex-shrink-0 rounded-full overflow-hidden border-2 border-emerald-500/30 bg-slate-800 group-hover/item:border-emerald-500/60 transition-colors shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                        <Image 
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${(item as any).buyer_region || index}`}
                          alt="Buyer Avatar"
                          fill
                          className="object-cover"
                          unoptimized 
                        />
                      </div>

                      {/* 图片容器 */}
                      <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden border border-white/10 bg-slate-900 group-hover/item:border-white/30 transition-colors">
                        <Image 
                          src={(item as any).product_image?.startsWith('http') ? (item as any).product_image : 'https://images.unsplash.com/photo-1550259114-ad7188f0a967?w=150&q=80'}
                          alt="Product"
                          fill
                          className="object-cover opacity-80 group-hover/item:opacity-100 transition-opacity"
                          unoptimized 
                        />
                      </div>

                      {/* 中间信息 */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 group-hover/item:text-white transition-colors">
                            {item.platform}
                          </span>
                          <span className="text-sm text-slate-200 font-bold truncate font-sans tracking-tight group-hover/item:text-emerald-400 transition-colors">
                            {(item as any).product_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {(item as any).buyer_region || 'Unknown'}
                          </span>
                          <span className="flex items-center gap-1 text-emerald-600">
                            <Zap className="w-3 h-3" /> Live
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className={`inline-flex items-center gap-1 font-mono px-2 py-1 rounded border ${badgeClass}`}>
                            <Clock className="w-3 h-3" />
                            <span>有效期 {daysLeft ?? '—'} 天</span>
                          </span>
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-sm">
                          <div className="inline-flex items-center gap-2">
                            <span className="text-slate-400 text-xs">价格</span>
                            <span className="text-emerald-400 font-mono font-bold">${(item as any).target_price}</span>
                          </div>
                          <div className="inline-flex items-center gap-2">
                            <span className="text-slate-400 text-xs">数量</span>
                            <span className="text-white font-mono">{(item as any).quantity?.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* 右侧数据 */}
                      <div className="pl-4 border-l border-white/5 flex items-center">
                        <Link 
                          href={`/order/${item.id}`}
                          className="ml-auto px-3 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-xs font-bold rounded-md shadow-[0_0_10px_rgba(16,185,129,0.25)] transition-all duration-300 flex items-center gap-2"
                        >
                          <span>对接</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>

                    </div>

                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* 空状态加载动画 */}
            {demands.length === 0 && isConnected && (
              <div className="flex flex-col items-center justify-center h-40 text-emerald-900/50 gap-3 mt-20">
                <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                <p className="text-xs font-mono tracking-[0.2em] animate-pulse">ESTABLISHING UPLINK...</p>
              </div>
            )}
            
          </div>

          {/* 底部装饰栏 */}
          <div className="absolute bottom-0 inset-x-0 h-8 bg-[#020617] border-t border-white/5 flex items-center justify-between px-6 z-20">
             <div className="text-[9px] font-mono text-emerald-900/60 uppercase tracking-widest">
               System V3.4.17 // Secure
             </div>
             <div className="flex gap-1">
               <div className="w-1.5 h-1.5 bg-emerald-900/40 rounded-full"></div>
               <div className="w-1.5 h-1.5 bg-emerald-900/40 rounded-full"></div>
               <div className="w-1.5 h-1.5 bg-emerald-500/80 rounded-full animate-pulse"></div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}