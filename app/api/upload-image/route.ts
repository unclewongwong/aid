import { NextRequest, NextResponse } from 'next/server';
import { uploadToCloudinary } from '@/lib/cloudinaryUpload';

export async function POST(request: NextRequest) {
  try {
    const { imageData, resourceType = 'image' } = await request.json();
    if (!imageData) return NextResponse.json({ error: 'Missing imageData' }, { status: 400 });
    if (!['image', 'video'].includes(resourceType)) {
      return NextResponse.json({ error: 'Unsupported resource type' }, { status: 400 });
    }

    const result = await uploadToCloudinary(imageData, {
      folder: resourceType === 'video' ? 'aid-video' : 'aid-images',
      resource_type: resourceType,
    });
    return NextResponse.json({ url: result.secure_url });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}
