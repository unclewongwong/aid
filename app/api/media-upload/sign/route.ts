import { NextRequest, NextResponse } from 'next/server';
import { createStorageUploadTickets } from '@/lib/cloudinaryUpload';
import { usesR2Storage } from '@/lib/r2Upload';

// Same access boundary as /api/upload-image. Only sign allowlisted media
// folders, disallow overwrite, and never return the account secret.
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    if (body.length > 2000) return NextResponse.json({ error: '签名参数过长' }, { status: 413 });
    const { folder, resource_type, public_id, content_type, protocol } = JSON.parse(body);
    if (usesR2Storage() && protocol !== 2) return NextResponse.json({ error: '媒体存储已升级，请刷新网站并更新 AID Companion 后重试；已生成任务可继续补存' }, { status: 426, headers: { 'Cache-Control': 'no-store' } });
    return NextResponse.json({ targets: await createStorageUploadTickets({ folder, resource_type, public_id }, content_type) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : '无法准备媒体保存通道' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
