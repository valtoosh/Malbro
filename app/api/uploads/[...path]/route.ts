// app/api/uploads/[...path]/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const ROOT = () => process.env.LOCAL_UPLOADS_DIR ?? path.join(process.cwd(), 'uploads');

export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await params;
  const safe = parts.map((p) => decodeURIComponent(p)).join('/').replace(/\.\./g, '');
  const filePath = path.join(ROOT(), safe);
  try {
    const buf = await fs.readFile(filePath);
    const ext = path.extname(filePath).slice(1).toLowerCase();
    const ct = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'png' ? 'image/png' : 'application/octet-stream';
    return new NextResponse(buf, { headers: { 'Content-Type': ct } });
  } catch {
    return new NextResponse('Not found', { status: 404 });
  }
}
