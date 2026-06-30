import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 生成角色声音参考音频：用一段简短文本捕捉音色，上传到 Cloudinary
export async function POST(request: NextRequest) {
  try {
    const { characterName, sampleText, voiceId, fishAudioKey } = await request.json();

    if (!sampleText || !fishAudioKey) {
      return NextResponse.json({ error: 'sampleText and fishAudioKey are required' }, { status: 400 });
    }

    // 用 fish.audio 生成 TTS
    const ttsRes = await fetch('https://api.fish.audio/v1/tts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${fishAudioKey}`,
        'Content-Type': 'application/json',
        'model': 's2-pro',
      },
      body: JSON.stringify({
        text: sampleText,
        format: 'mp3',
        ...(voiceId ? { reference_id: voiceId } : {}),
      }),
    });

    if (!ttsRes.ok) {
      throw new Error(`fish.audio error: ${await ttsRes.text()}`);
    }

    const audioBuffer = Buffer.from(await ttsRes.arrayBuffer());
    const base64 = `data:audio/mpeg;base64,${audioBuffer.toString('base64')}`;

    const result = await cloudinary.uploader.upload(base64, {
      folder: 'aid-voice-refs',
      resource_type: 'video',
      public_id: `voice-ref-${characterName?.replace(/\s+/g, '-') || 'character'}-${Date.now()}`,
    });

    return NextResponse.json({
      url: result.secure_url,
      duration: result.duration ?? 0,
      characterName,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to generate voice reference' }, { status: 500 });
  }
}
