"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Package, MapPin, Calendar, DollarSign, ShoppingBag, User, Phone, Mail, Building, Truck, CheckCircle, Clock } from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface OrderDetail {
  id: string;
  product_name: string;
  product_image: string;
  platform: string;
  quantity: number;
  target_price: number;
  buyer_region: string;
  status: string;
  date_created: string;
  valid_until?: string;
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  const getDaysLeft = (validUntil?: string) => {
    if (!validUntil) return null;
    const dayMs = 1000 * 60 * 60 * 24;
    return Math.ceil((new Date(validUntil).getTime() - Date.now()) / dayMs);
  };

  useEffect(() => {
    // 模拟获取订单详情
    const fetchOrder = async () => {
      try {
        setLoading(true);
        // 这里应该调用实际的 API
        // const response = await fetch(`/api/orders/${orderId}`);
        // const data = await response.json();
        
        // 模拟数据（实际应从 Directus 获取）
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setOrder({
          id: orderId,
          product_name: "智能手表 运动健康监测",
          product_image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80",
          platform: "Amazon",
          quantity: 5000,
          target_price: 45.99,
          buyer_region: "美国东海岸",
          status: "pending",
          date_created: new Date().toISOString(),
          valid_until: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString()
        });
      } catch (error) {
        console.error('Failed to fetch order:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const handleConnect = async () => {
    setConnecting(true);
    // 这里实现对接逻辑
    await new Promise(resolve => setTimeout(resolve, 2000));
    alert('订单对接成功！系统将自动匹配最优供应链方案');
    setConnecting(false);
  };

  // 附件上传相关
  const [attachments, setAttachments] = useState<{name:string, url:string, id:number, uploading?:boolean}[]>([]);
  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      const id = Date.now() + Math.floor(Math.random()*1000);
      setAttachments(prev => [...prev, { name: file.name, url: '', id, uploading: true }]);
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        try {
          const res = await fetch('/api/uploads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: file.name, data: base64 })
          });
          const json = await res.json();
          if (res.ok && json.url) {
            setAttachments(prev => prev.map(a => a.id === id ? { ...a, url: json.url, uploading: false } : a));
          } else {
            setAttachments(prev => prev.map(a => a.id === id ? { ...a, uploading: false } : a));
            console.error('Upload failed', json);
            alert('上传失败：' + (json?.error || '未知错误'));
          }
        } catch (err) {
          setAttachments(prev => prev.map(a => a.id === id ? { ...a, uploading: false } : a));
          console.error(err);
          alert('上传时发生错误');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-emerald-500/60 text-sm font-mono">加载订单详情...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-sm font-mono">订单不存在</p>
          <button 
            onClick={() => router.push('/')}
            className="mt-4 text-emerald-500 hover:text-emerald-400 text-sm underline"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const daysLeft = getDaysLeft(order.valid_until);
  const badgeClass = daysLeft === null
    ? 'text-slate-400 bg-slate-700/40 border-slate-600/60'
    : daysLeft < 14
      ? 'text-red-400 bg-red-500/10 border-red-500/40'
      : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';

  return (
    <div className="min-h-screen bg-black text-slate-200 font-sans">
      {/* 背景网格 */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      </div>

      {/* 主内容 */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">
        
        {/* 返回按钮 */}
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-mono">返回订单列表</span>
        </button>

        {/* 标题区 */}
        <div className="mb-8">
          <h1 className="brand-title text-3xl mb-2 text-white">订单对接详情</h1>
          <p className="text-slate-500 text-sm font-mono">Order ID: #{order.id}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* 左侧：产品信息 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 bg-[#030712]/90 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-6 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)]"
          >
            <div className="flex gap-6 mb-6">
              {/* 产品图片 */}
              <div className="relative w-48 h-48 flex-shrink-0 rounded-xl overflow-hidden border border-white/10 bg-slate-900">
                <Image 
                  src={order.product_image}
                  alt={order.product_name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>

              {/* 产品基本信息 */}
              <div className="flex-1">
                <div className="inline-block px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-yellow-400 text-xs font-bold mb-3">
                  {order.platform}
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">{order.product_name}</h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span className="text-slate-400">目标价格:</span>
                    <span className="text-emerald-400 font-mono font-bold">${order.target_price}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <ShoppingBag className="w-4 h-4 text-blue-400" />
                    <span className="text-slate-400">订购数量:</span>
                    <span className="text-white font-mono font-bold">{order.quantity?.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-pink-400" />
                    <span className="text-slate-400">买家地区:</span>
                    <span className="text-white">{order.buyer_region}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-purple-400" />
                    <span className="text-slate-400">发布时间:</span>
                    <span className="text-white font-mono text-xs">
                      {new Date(order.date_created).toLocaleDateString('zh-CN')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span className="text-slate-400">有效期:</span>
                    <span className={`font-mono text-xs px-2 py-1 rounded border ${badgeClass}`}>
                      {daysLeft ?? '—'} 天
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 订单详细描述 */}
            <div className="border-t border-white/5 pt-6">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-400" />
                订单需求
              </h3>
              <div className="text-slate-300 text-sm space-y-2 leading-relaxed">
                <p>• 产品质量要求：符合目标市场安全标准（CE/FCC认证）</p>
                <p>• 包装要求：中性包装，可定制品牌LOGO</p>
                <p>• 交付周期：30-45天（含海运时间）</p>
                <p>• 付款方式：30%预付，70%见提单复印件</p>
                <p>• 目标利润率：≥25%</p>
              </div>
            </div>
          </motion.div>

          {/* 右侧：对接操作区 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* 状态卡片 */}
            <div className="bg-[#030712]/90 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-6 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)]">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-white">订单状态</h3>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <span className="text-yellow-400 font-mono">等待对接</span>
              </div>
            </div>

            {/* 对接按钮 */}
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="w-full px-6 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-slate-700 disabled:to-slate-800 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:shadow-[0_0_40px_rgba(16,185,129,0.6)] transition-all duration-300 flex items-center justify-center gap-2"
            >
              {connecting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>对接中...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>立即对接订单</span>
                </>
              )}
            </button>

            {/* 买家信息 */}
            <div className="bg-[#030712]/90 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-6 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)]">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-white">买家信息</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <Building className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-slate-400 text-xs mb-0.5">公司名称</p>
                    <p className="text-white">Global Trade Co., Ltd</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-slate-400 text-xs mb-0.5">联系电话</p>
                    <p className="text-white font-mono">+1-***-***-****</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Mail className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-slate-400 text-xs mb-0.5">联系邮箱</p>
                    <p className="text-white text-xs">buyer@*****.com</p>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-xs text-slate-500 italic">
                * 完整联系方式将在对接成功后显示
              </p>
            </div>

            {/* 附件上传 */}
            <div className="bg-[#030712]/90 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-6 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)]">
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-white">上传附件</h3>
              </div>

              <div className="space-y-3">
                <p className="text-slate-400 text-sm">上传与订单相关的附件（合同、规格表、图片等）。文件将存储为临时演示文件并返回可访问 URL。</p>

                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    multiple
                    onChange={e => handleFiles(e.target.files)}
                    className="text-sm text-slate-200"
                  />
                </div>

                <div className="pt-2">
                  {attachments.length === 0 && <div className="text-xs text-slate-500">尚无附件</div>}
                  {attachments.map(a => (
                    <div key={a.id} className="flex items-center justify-between gap-2 py-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white/5 rounded flex items-center justify-center text-xs text-slate-200">{a.name.split('.').pop()?.toUpperCase()}</div>
                        <div>
                          <div className="text-sm text-white">{a.name}</div>
                          <div className="text-xs text-slate-400">{a.uploading ? '上传中...' : (a.url ? '已上传' : '失败')}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        {a.url && (
                          <a href={a.url} target="_blank" rel="noreferrer" className="text-emerald-400 text-sm underline">打开</a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 物流预估 */}
            <div className="bg-[#030712]/90 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-6 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)]">
              <div className="flex items-center gap-2 mb-4">
                <Truck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-white">物流预估</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">运输方式</span>
                  <span className="text-white font-mono">海运</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">预计时效</span>
                  <span className="text-white font-mono">30-35天</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">物流成本</span>
                  <span className="text-emerald-400 font-mono">$2,850</span>
                </div>
              </div>
            </div>

          </motion.div>
        </div>
      </div>
    </div>
  );
}
