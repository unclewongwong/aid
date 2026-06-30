import { NextRequest, NextResponse } from 'next/server';
import { generateStoryboardVideo, waitForVideoGeneration } from '@/lib/videoGenerator';

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
    // For Seedance/Doubao: filter audio outside valid range 1.8s–15.2s
    const isDoubaoSeedance = (videoModel || '').includes('doubao') || (videoModel || '').includes('seedance');
    const validAudios = isDoubaoSeedance
      ? characterAudios.filter((a: { audioDuration?: number }) => {
          const d = a.audioDuration ?? Infinity;
          return d >= 1.8 && d <= 15.2;
        })
      : characterAudios;
    const uploadedAudioUrls = validAudios.map((a: { audioUrl: string }) => a.audioUrl).filter(Boolean);

    // For Seedance with audio: sync video duration to audio duration to prevent stretching
    let effectiveStoryboard = storyboard;
    if (isDoubaoSeedance && validAudios.length > 0) {
      const maxAudioDuration = Math.max(
        ...validAudios.map((a: { audioDuration?: number }) => a.audioDuration ?? 5)
      );
      // Round up to nearest integer, clamp to [3, 10]
      const syncedDuration = Math.min(Math.max(Math.ceil(maxAudioDuration), 3), 10);
      console.log(`Syncing video duration to audio: ${maxAudioDuration.toFixed(2)}s → ${syncedDuration}s`);
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
