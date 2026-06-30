import { NextRequest, NextResponse } from 'next/server';
import { generateStoryboardVideo, waitForVideoGeneration } from '@/lib/videoGenerator';
import { snapDurationToModel } from '@/lib/apimart';

export async function POST(request: NextRequest) {
  try {
    const { storyboard, apiKey, videoModel, aspectRatio, characterAudios = [], firstFrameUrl } = await request.json();

    if (!storyboard) {
      return NextResponse.json(
        { error: 'Storyboard is required' },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    console.log('Starting video generation for scene:', storyboard.sceneNumber);
    console.log('Using model:', videoModel || 'sora-2');
    console.log('Aspect ratio:', aspectRatio || '16:9');
    console.log('Image URL:', storyboard.imageUrl);

    // audioFiles are already public URLs (from fish.audio → Cloudinary), pass directly
    // Filter audio to valid range per model:
    //   seedance-2.0: 1.8–15s | wan2.6/wan2.7: 2–30s | others: no audio support
    const m = (videoModel || '').toLowerCase();
    const isSeedance20 = m.includes('seedance-2') || m.includes('seedance-4') || m.includes('seedance-5');
    const isWanAudio = m.includes('wan2.6') || m.includes('wan2.7') || m.includes('wan 2.6') || m.includes('wan 2.7');
    const supportsAudio = isSeedance20 || isWanAudio;

    const validAudios = supportsAudio
      ? characterAudios.filter((a: { audioDuration?: number }) => {
          const d = a.audioDuration ?? Infinity;
          if (isSeedance20) return d >= 1.8 && d <= 15;
          if (isWanAudio)   return d >= 2   && d <= 30;
          return false;
        })
      : [];
    const uploadedAudioUrls = validAudios.map((a: { audioUrl: string }) => a.audioUrl).filter(Boolean);

    // Sync video duration to audio duration, snapped to the model's valid values
    let effectiveStoryboard = storyboard;
    if (validAudios.length > 0) {
      const maxAudioDuration = Math.max(
        ...validAudios.map((a: { audioDuration?: number }) => a.audioDuration ?? 5)
      );
      const syncedDuration = snapDurationToModel(maxAudioDuration, videoModel || 'sora-2');
      console.log(`Syncing video duration to audio: ${maxAudioDuration.toFixed(2)}s → ${syncedDuration}s (model: ${videoModel})`);
      effectiveStoryboard = { ...storyboard, videoDuration: syncedDuration };
    }

    // 生成视频任务（image-to-video 模式，视觉信息已在图片中）
    const taskId = await generateStoryboardVideo(
      effectiveStoryboard,
      apiKey,
      videoModel,
      aspectRatio || '16:9',
      uploadedAudioUrls,
      characterAudios,
      firstFrameUrl
    );
    console.log('Video task created, ID:', taskId);

    // 立即返回 taskId，不等待完成（异步模式）
    // 前端将轮询检查状态
    return NextResponse.json({ taskId, status: 'processing' });
  } catch (error: any) {
    console.error('Generate video API error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: error.message || 'Failed to generate video' },
      { status: 500 }
    );
  }
}
