"use client"
import { useState, useRef, useEffect } from "react";
import { X, Send } from "lucide-react";

export default function ChatWidget() {
	// 初始为 false，避免在初始渲染时读取浏览器 API 导致 SSR 与客户端输出不一致。
	const [open, setOpen] = useState<boolean>(false);

	// 在客户端挂载后再从 localStorage 恢复状态。
	useEffect(() => {
		try {
			const val = localStorage.getItem('chat_open') === '1';
			setOpen(val);
		} catch {}
	}, []);
	const [messages, setMessages] = useState<{id:number, from:'user'|'bot', text:string, time:number}[]>([]);
	const [input, setInput] = useState("");
	const [isTyping, setIsTyping] = useState(false);
	const [unread, setUnread] = useState(0);
	const listRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		try { localStorage.setItem('chat_open', open ? '1' : '0'); } catch {}
		if (open) setUnread(0);
	}, [open]);

	useEffect(() => {
		if (open && listRef.current) {
			listRef.current.scrollTop = listRef.current.scrollHeight;
		}
	}, [messages, open]);

	const pushMessage = (from:'user'|'bot', text:string) => {
		const m = { id: Date.now(), from, text, time: Date.now() };
		setMessages(prev => [...prev, m]);
		if (!open && from === 'bot') setUnread(u => u + 1);
	};

	const send = () => {
		if (!input.trim()) return;
		pushMessage('user', input.trim());
		setInput("");
		setIsTyping(true);
		setTimeout(() => {
			pushMessage('bot', '已收到询盘，我们会在24小时内为您匹配合适供应商。');
			setIsTyping(false);
		}, 900 + Math.random() * 700);
	};

	const insertTemplate = (tpl:string) => setInput(tpl);
	const formatTime = (ts:number) => new Date(ts).toLocaleTimeString('zh-CN', { hour12:false });

	return (
		<div className="fixed right-6 bottom-6 z-50">
			{/* Panel */}
			<div className={`w-[360px] max-w-[92vw] bg-gradient-to-br from-[#061018]/80 to-[#071726]/80 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden transform origin-bottom-right transition-all ${open ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-95 pointer-events-none'}`}>
				<div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-full flex items-center justify-center ring-1 ring-white/6" aria-hidden>
							{/* Gradient avatar (non-photoreal) */}
							<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
								<defs>
									<linearGradient id="chatGradLarge" x1="0" x2="1" y1="0" y2="1">
										<stop offset="0%" stopColor="#00b4d8" />
										<stop offset="100%" stopColor="#38d39f" />
									</linearGradient>
								</defs>
								<circle cx="20" cy="20" r="19" fill="url(#chatGradLarge)" />
								<path d="M13 15c0-2.5 2.5-4.5 5.5-4.5h3c3 0 5.5 2 5.5 4.5v1c0 2.5-2.5 4.5-5.5 4.5h-1.8L17 23v-2.2H18c3 0 5.5-2 5.5-4.5v-1c0-2.5-2.5-4.5-5.5-4.5h-3C15.5 10 13 12 13 15z" fill="#fff" opacity="0.98" />
							</svg>
						</div>
						<div>
							<div className="text-sm font-semibold">客服机器人</div>
							<div className="text-xs text-slate-400">智能对接助手 · 在线</div>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<div className="text-xs text-slate-400 mr-2">辅助工具</div>
						<button aria-label="关闭" onClick={() => setOpen(false)} className="p-1 rounded-md hover:bg-white/3">
							<X className="w-4 h-4 text-slate-300" />
						</button>
					</div>
				</div>

				<div className="p-3">
					<div className="flex gap-2 mb-3">
						<button onClick={() => insertTemplate('询盘：我需要1000件，目标价格 X 美元/件，要求…')} className="text-xs px-3 py-1 rounded bg-white/5 hover:bg-white/6">询盘模板</button>
						<button onClick={() => insertTemplate('请帮我匹配适合的供应商，目标交期 30 天以内。')} className="text-xs px-3 py-1 rounded bg-white/5 hover:bg-white/6">匹配供应商</button>
					</div>

					<div ref={listRef} className="max-h-56 overflow-y-auto p-2 space-y-3 custom-scrollbar">
						{messages.length === 0 && (
							<div className="text-xs text-slate-400">欢迎，您可以在此输入询盘内容，机器人会辅助您完成对接。</div>
						)}
						{messages.map(m => (
							<div key={m.id} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
								<div className={`${m.from === 'user' ? 'bg-emerald-400 text-black' : 'bg-white/5 text-slate-200'} px-3 py-2 rounded-xl max-w-[78%] text-sm`}> 
									<div className="whitespace-pre-wrap">{m.text}</div>
									<div className="text-[10px] text-slate-400 mt-1 text-right">{formatTime(m.time)}</div>
								</div>
							</div>
						))}

						{isTyping && (
							<div className="flex justify-start">
								<div className="bg-white/5 px-3 py-2 rounded-xl text-sm">
									<div className="flex items-center gap-1">
										<span className="w-2 h-2 bg-white/60 rounded-full animate-pulse inline-block" />
										<span className="w-2 h-2 bg-white/40 rounded-full animate-pulse inline-block" />
										<span className="w-2 h-2 bg-white/20 rounded-full animate-pulse inline-block" />
									</div>
								</div>
							</div>
						)}
					</div>
				</div>

				<div className="px-3 pb-3 pt-1 border-t border-white/5">
					<div className="flex gap-2 items-center">
						<input
							value={input}
							onChange={e => setInput(e.target.value)}
							onKeyDown={e => { if (e.key === 'Enter') send(); }}
							placeholder="输入您的询盘内容，按回车发送..."
							className="flex-1 bg-transparent placeholder:text-slate-500 text-sm outline-none px-3 py-2 rounded-md border border-white/6"
						/>
						<button onClick={send} className="px-3 py-2 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-md hover:brightness-105 flex items-center gap-2">
							<Send className="w-4 h-4 text-white" />
						</button>
					</div>
				</div>
			</div>

			{/* Floating trigger */}
			<button
				onClick={() => setOpen(o => !o)}
				className={`mt-3 w-16 h-16 rounded-full flex items-center justify-center shadow-xl transform transition-all ${open ? 'scale-95' : 'animate-pulse-slow'}`}
				aria-label="打开聊天"
				title={unread > 0 ? `有 ${unread} 条新消息` : '联系客服'}
			>
				<svg width="36" height="36" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-hidden>
					<defs>
						<linearGradient id="chatGradBtn" x1="0" x2="1" y1="0" y2="1">
							<stop offset="0%" stopColor="#00b4d8" />
							<stop offset="100%" stopColor="#38d39f" />
						</linearGradient>
					</defs>
					<circle cx="20" cy="20" r="19" fill="url(#chatGradBtn)" />
					<path d="M14 16c0-2.2 2.2-4 4.9-4H22c2.7 0 4.9 1.8 4.9 4v1c0 2.2-2.2 4-4.9 4h-1.6L17 24v-2H18c2.7 0 4.9-1.8 4.9-4v-1c0-2.2-2.2-4-4.9-4h-2.9C16.2 12 14 13.8 14 16z" fill="#fff" opacity="0.98" />
				</svg>
				{unread > 0 && (
					<span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold">{unread}</span>
				)}
			</button>
		</div>
	);
}

