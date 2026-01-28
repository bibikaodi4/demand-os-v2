import { NextRequest, NextResponse } from 'next/server';

// 注意：WebSocket Realtime 不走这里（需要在反向代理层单独处理 /websocket 升级）。
const DIRECTUS_URL =
  process.env.DIRECTUS_URL ||
  process.env.NEXT_PUBLIC_DIRECTUS_URL ||
  'http://admin.cnsubscribe.xyz';

// 统一代理处理，避免重复代码并正确转发 body 与过滤不应转发的头
async function proxyRequest(req: NextRequest, context: any) {
  const params = (await context?.params) ?? { path: [] };
  const path = params?.path ? '/' + params.path.join('/') : '';
  const url = new URL(req.url);
  const target = `${DIRECTUS_URL}${path}${url.search}`;

  // 构造转发 headers，删除 Host，添加 x-forwarded-* 头
  const forwardHeaders = new Headers();
  req.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'host') return; // 让 fetch 自行设置 Host
    // 不转发一些 hop-by-hop headers
    const hopByHop = ['connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization', 'te', 'trailers', 'transfer-encoding', 'upgrade'];
    if (hopByHop.includes(key.toLowerCase())) return;
    forwardHeaders.set(key, value as string);
  });
  forwardHeaders.set('x-forwarded-host', url.host);
  forwardHeaders.set('x-forwarded-proto', url.protocol.replace(':', ''));
  forwardHeaders.set('x-forwarded-for', req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '');

  // 如果没有 Authorization 且服务器端配置了静态 token，则自动补充
  try {
    const staticToken = process.env.DIRECTUS_STATIC_TOKEN;
    if (staticToken && !forwardHeaders.has('authorization')) {
      forwardHeaders.set('authorization', `Bearer ${staticToken}`);
    }
  } catch (e) {
    // 忽略在无法访问 process.env 时的错误（如 edge runtime），客户端应自行传 token
  }

  // 处理 body：GET/HEAD 不带 body，其他方法尽量以 arrayBuffer 形式转发
  let body: ArrayBuffer | undefined = undefined;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    try {
      body = await req.arrayBuffer();
    } catch (e) {
      // 如果无法以 arrayBuffer 读取，忽略 body（fetch 可能失败并返回 4xx/5xx）
      body = undefined;
    }
  }

  const directusRes = await fetch(target, {
    method: req.method,
    headers: forwardHeaders,
    body,
    // 不自动跟随重定向
    redirect: 'manual',
  });

  const data = await directusRes.arrayBuffer();

  // 过滤下游返回的 headers，移除 hop-by-hop
  const resHeaders = new Headers();
  directusRes.headers.forEach((value, key) => {
    const banned = ['connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization', 'te', 'trailers', 'transfer-encoding', 'upgrade'];
    if (banned.includes(key.toLowerCase())) return;
    resHeaders.set(key, value as string);
  });

  return new NextResponse(data, {
    status: directusRes.status,
    headers: resHeaders,
  });
}

export async function GET(req: NextRequest, context: any) {
  return proxyRequest(req, context);
}

export async function POST(req: NextRequest, context: any) {
  return proxyRequest(req, context);
}

export async function PUT(req: NextRequest, context: any) {
  return proxyRequest(req, context);
}

export async function PATCH(req: NextRequest, context: any) {
  return proxyRequest(req, context);
}

export async function DELETE(req: NextRequest, context: any) {
  return proxyRequest(req, context);
}

// 其他方法可自动映射到 proxyRequest