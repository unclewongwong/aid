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

    // 暂时禁用自定义TTS配音，改为让模型自动生成音频
    // TODO: 恢复自定义配音时删除此段，取消下方 generateAudio 注释
    const uploadedAudioUrls: string[] = [];
    const validAudios: unknown[] = [];
    const effectiveStoryboard = storyboard;
    const useGenerateAudio = true; // 让模型自动配音

    // 生成视频任务（image-to-video 模式，视觉信息已在图片中）
    const taskId = await generateStoryboardVideo(
      effectiveStoryboard,
      apiKey,
      videoModel,
      aspectRatio || '16:9',
      uploadedAudioUrls,
      characterAudios,
      firstFrameUrl,
      useGenerateAudio
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
