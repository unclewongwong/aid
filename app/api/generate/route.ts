import { NextRequest, NextResponse } from 'next/server';
import { generateStoryboardImage } from '@/lib/imageGenerator';

export async function POST(request: NextRequest) {
  try {
    const { storyboard, characters, objects, aspectRatio, imageModel, apiKey, costumeImages, sceneImage, referenceImages, referenceImageLabels, visualStyle, styleReference, capturePreset, comfyui = {}, midjourneyProfile = '', midjourneyStyle = {}, resolutionOverride } = await request.json();
    if (resolutionOverride !== undefined && !['1K', '2K', '4K'].includes(resolutionOverride))
      return NextResponse.json({ error: 'Invalid image resolution' }, { status: 400 });

    if (!storyboard || !characters || characters.length === 0) {
      return NextResponse.json(
        { error: 'Storyboard and characters are required' },
        { status: 400 }
      );
    }

    const { imageModelRequiresApiKey } = await import('@/lib/imageModels');
    if (imageModelRequiresApiKey(imageModel || 'seedream-5-0-pro') && !apiKey) {
      return NextResponse.json(
        { error: 'API Key is required' },
        { status: 400 }
      );
    }

    const taskId = await generateStoryboardImage(
      storyboard,
      characters,
      apiKey,
      objects || [],
      aspectRatio || '16:9',
      imageModel,
      costumeImages || {},
      sceneImage,
      referenceImages || [],
      referenceImageLabels || [],
      visualStyle,
      capturePreset,
      comfyui,
      midjourneyProfile,
      midjourneyStyle,
      styleReference,
      resolutionOverride,
    );

    return NextResponse.json({ taskId });
  } catch (error) {
    console.error('Generate API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate image' },
      { status: 500 }
    );
  }
}
