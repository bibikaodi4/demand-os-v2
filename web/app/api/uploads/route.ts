import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, data } = body as { name: string; data: string };
    if (!name || !data) return NextResponse.json({ error: 'missing name or data' }, { status: 400 });

    const uploadsDir = path.join(process.cwd(), 'web', 'public', 'uploads');
    await fs.promises.mkdir(uploadsDir, { recursive: true });

    const safeName = name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filename = `${Date.now()}-${safeName}`;
    const filePath = path.join(uploadsDir, filename);

    const buffer = Buffer.from(data, 'base64');
    await fs.promises.writeFile(filePath, buffer);

    const url = `/uploads/${filename}`;
    return NextResponse.json({ url });
  } catch (err) {
    console.error('upload error', err);
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}
