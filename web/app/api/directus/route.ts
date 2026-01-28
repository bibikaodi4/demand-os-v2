import { NextRequest, NextResponse } from 'next/server';

// 代理所有 Directus REST 请求到远程服务器
// 注意：WebSocket Realtime 不走这里（需要在反向代理层单独处理 /websocket 升级）。
const DIRECTUS_URL =
  process.env.DIRECTUS_URL ||
  process.env.NEXT_PUBLIC_DIRECTUS_URL ||
  'http://admin.cnsubscribe.xyz';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api\/directus/, '');
  const target = `${DIRECTUS_URL}${path}${url.search}`;

  const directusRes = await fetch(target, {
    method: 'GET',
    headers: req.headers,
    // credentials: 'include', // 如有需要可加
  });

  const data = await directusRes.arrayBuffer();
  const response = new NextResponse(data, {
    status: directusRes.status,
    headers: directusRes.headers,
  });
  return response;
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api\/directus/, '');
  const target = `${DIRECTUS_URL}${path}${url.search}`;

  const directusRes = await fetch(target, {
    method: 'POST',
    headers: req.headers,
    body: req.body,
  });

  const data = await directusRes.arrayBuffer();
  const response = new NextResponse(data, {
    status: directusRes.status,
    headers: directusRes.headers,
  });
  return response;
}

// 其他方法（PUT、DELETE等）可按需补充