"use client";

import { useEffect, useState, useRef } from 'react';
import { 
  createDirectus, 
  rest, 
  realtime, 
  readItems,
  staticToken,
} from '@directus/sdk';

// ✅ 关键修改 1：分开定义 URL
// REST 请求走本地代理 (解决 CORS 和 Failed to fetch)
const PROXY_URL = typeof window !== 'undefined' ? `${window.location.origin}/api/directus` : 'http://localhost:3000/api/directus';
// Realtime 连接请使用 http(s) 基础地址：SDK 会自动切换为 ws(s) 并使用 /websocket 路径。
// 如果这里直接传 ws://，SDK 会按原样连接到 /（导致你看到 ws://admin.cnsubscribe.xyz/ 失败）。
// 注意：默认用 http（很多自建 Directus 并没有给 8055 配 TLS），生产环境请用 HTTPS + WSS。
// 优先使用 NEXT_PUBLIC_DIRECTUS_URL；未配置时回落到同源（配合 Nginx 反代 /websocket 可避免跨域 WS）。
const REMOTE_URL =
  process.env.NEXT_PUBLIC_DIRECTUS_URL ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8055');

// ✅ 关键修改 2：创建两个不同的客户端
// authClient has full auth methods; restClient is the rest wrapper
const authClient = createDirectus(PROXY_URL);
const restClient = authClient.with(rest());

// WS client instance factory and current instance
const createWsClientInstance = (token?: string) => {
  // When token provided, append as search param to force searchparams-style auth
  try {
    if (token) {
      const u = new URL(REMOTE_URL);
      u.searchParams.set('access_token', token);
      return createDirectus(u.toString()).with(realtime({ authMode: 'public', debug: process.env.NODE_ENV !== 'production' }));
    }
  } catch {
    // fallback
  }
  return createDirectus(REMOTE_URL).with(realtime({ authMode: 'public', debug: process.env.NODE_ENV !== 'production' }));
};

// initialize instance, prefer env token if available
const initialToken = typeof window !== 'undefined' ? (window as any).NEXT_PUBLIC_DIRECTUS_TOKEN || process.env.NEXT_PUBLIC_DIRECTUS_TOKEN : process.env.NEXT_PUBLIC_DIRECTUS_TOKEN;
let wsInstance: any = createWsClientInstance(initialToken as string | undefined);

export type Demand = {
  id: string;
  platform: 'TikTok' | 'Temu' | 'Shein' | 'Amazon';
  product_name: string;
  quantity: number;
  target_price: number;
  buyer_region: string;
  status: 'inbound' | 'matching' | 'dispatched';
  date_created: string;
  product_image?: string;
};

// 辅助函数：处理图片路径
const getAssetUrl = (imageId?: string) => {
  if (!imageId) return undefined;
  if (imageId.startsWith('http')) return imageId;
  // 图片也走代理，避免跨域
  return `${PROXY_URL}/assets/${imageId}`;
};

const transformDemand = (data: any): Demand => ({
  ...data,
  product_image: getAssetUrl(data.product_image),
  quantity: Number(data.quantity) || 0,
  target_price: Number(data.target_price) || 0,
  platform: data.platform || 'Amazon',
  status: data.status || 'inbound',
  buyer_region: data.buyer_region || 'Unknown',
  date_created: data.date_created || new Date().toISOString(),
});

export const useDirectusRealtime = () => {
  const [demands, setDemands] = useState<Demand[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const manualConnectRef = useRef<null | (() => Promise<void>)>(null);
  const removeWsHandlersRef = useRef<Array<() => void>>([]);

  useEffect(() => {
    let mounted = true;
    let unsubscribeFunc: (() => void) | null = null;
    // local reference to handlers array (kept in ref so authenticate can reset)
    let removeWsHandlers: Array<() => void> = removeWsHandlersRef.current;

    const connectAndSubscribe = async () => {
      try {
        // ✅ 关键修改 3：使用 restClient 获取历史数据
        try {
          // 这里使用的是 restClient (走代理)，而不是 old client
          const initialData = await restClient.request(
            readItems('demands', {
              sort: ['-date_created'],
              limit: 50,
            })
          );
          if (mounted && Array.isArray(initialData)) {
            // UI 用“日志式”从上到下（旧 -> 新），订阅到的新数据 push 到末尾
            setDemands(initialData.map(transformDemand).reverse());
          }
        } catch (fetchErr: any) {
          console.error('REST fetch error:', fetchErr);
          // 不中断，继续尝试连接 WS
        }

        // ✅ 关键修改 4：使用 wsInstance 建立实时连接并支持自动重连（指数退避）
        let connected = false;
        let attempt = 0;
        const maxRetryDelay = 30_000; // 30s
        // 监听底层 WebSocket 生命周期，确保 UI 状态能同步
        if (removeWsHandlers.length === 0 && wsInstance && wsInstance.onWebSocket) {
          removeWsHandlers = [
            wsInstance.onWebSocket('open', () => {
              if (!mounted) return;
              setIsConnected(true);
              setError(null);
            }),
            wsInstance.onWebSocket('close', () => {
              if (!mounted) return;
              setIsConnected(false);
            }),
            wsInstance.onWebSocket('error', () => {
              if (!mounted) return;
              setIsConnected(false);
            }),
          ];
          removeWsHandlersRef.current = removeWsHandlers;
        }

        while (!connected && mounted) {
          try {
            console.info('Attempting Directus realtime connect (base URL):', REMOTE_URL);
            await wsInstance.connect();
            console.info('WS connect success');
            connected = true;
          } catch (e: any) {
            attempt++;
            const delay = Math.min(1000 * Math.pow(2, attempt), maxRetryDelay) + Math.floor(Math.random() * 500);
            console.error('WebSocket connect failed, retrying in', delay, 'ms:', e?.message ?? e);
            if (!mounted) return;
            setIsConnected(false);
            setError(e?.message || 'WebSocket connect failed');
            await new Promise((r) => setTimeout(r, delay));
          }
        }

        if (!connected) return; // 若组件已卸载，则退出

        if (!mounted) return;
        setIsConnected(true);
        setError(null);

        try {
          const { subscription, unsubscribe } = await wsInstance.subscribe('demands', {
            event: 'create',
            query: { fields: ['*'] }
          });
          unsubscribeFunc = unsubscribe;

          for await (const msg of subscription) {
            if (!mounted) break;
            if (msg.event === 'create' && msg.data) {
              const newOrder = transformDemand(msg.data);
              setDemands((prev) => [...prev, newOrder].slice(-50));
            }
          }
        } catch (subErr: any) {
          console.error('Subscription error:', subErr);
          if (!mounted) return;
          setIsConnected(false);
          setError(subErr?.message || 'Subscription failed');
        }

      } catch (err: any) {
        if (!mounted) return;
        setIsConnected(false);
        setError(err?.message || 'Connection Failed');
      }
    };

    // 暴露手动触发函数
    manualConnectRef.current = connectAndSubscribe;
    connectAndSubscribe();

    return () => {
      mounted = false;
      if (unsubscribeFunc) unsubscribeFunc();
      try {
        if (wsInstance && wsInstance.disconnect) wsInstance.disconnect();
      } catch {
        // ignore
      }
      removeWsHandlersRef.current.forEach((fn) => {
        try {
          fn();
        } catch {
          // ignore
        }
      });
    };
  }, []);

  const reconnect = async () => {
    setError(null);
    setIsConnected(false);
    if (manualConnectRef.current) {
      await manualConnectRef.current();
    }
  };

  // 手动鉴权：使用 REST 登录获取 token，然后重建 wsInstance 并重连
  const authenticate = async (email: string, password: string) => {
    try {
      const auth = await (authClient as any).login(email, password);
      const token = auth?.access_token;
      if (!token) throw new Error('No token returned');
      // rebuild wsInstance with token passed as search param
      wsInstance = createWsClientInstance(token);
      // reset handlers so new instance will reattach
      removeWsHandlersRef.current = [];
      await reconnect();
      return auth;
    } catch (e: any) {
      setError(e?.message || 'Authentication failed');
      throw e;
    }
  };

  // 测试匿名订阅（用于诊断是否为鉴权问题）
  const testAnonymous = async () => {
    try {
      const publicClient: any = createDirectus(REMOTE_URL).with(realtime({ authMode: 'public', debug: true }));
      await publicClient.connect();
      const { subscription, unsubscribe } = await publicClient.subscribe('demands', { event: 'create' });
      let received = false;
      const timeout = setTimeout(async () => {
        try { await unsubscribe(); } catch {};
        try { publicClient.disconnect(); } catch {};
        if (!received) console.info('testAnonymous: no messages received within timeout');
      }, 5000);
      (async () => {
        for await (const msg of subscription) {
          received = true;
          console.info('testAnonymous received:', msg);
          clearTimeout(timeout);
          try { await unsubscribe(); } catch {};
          try { publicClient.disconnect(); } catch {};
          break;
        }
      })();
      return true;
    } catch (e: any) {
      console.error('testAnonymous failed:', e?.message ?? e);
      return false;
    }
  };

  // 清除本地可能残留的鉴权信息（会清空常见 Directus 存储项）
  const clearLocalAuth = () => {
    if (typeof window === 'undefined') return;
    try {
      // common Directus storage keys
      const keys = ['directus.auth', 'directus_auth_token', 'directus_auth', 'directus'];
      keys.forEach(k => localStorage.removeItem(k));
      // also clear localStorage entirely if needed (commented out)
      // localStorage.clear();
      console.info('Cleared local Directus auth keys');
    } catch (e) {
      console.error('clearLocalAuth failed', e);
    }
  };

  return { demands, isConnected, error, reconnect, authenticate, testAnonymous, clearLocalAuth };
};