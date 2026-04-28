import { NextRequest, NextResponse } from 'next/server';
import { createImageTask } from '@/lib/apimart';

function buildStudioPrompt(userIntent?: string) {
  const intent = userIntent?.trim();

  return `Use the provided reference image as the primary visual source.

GOAL:
Create an ultra-realistic professional studio photograph with high-end commercial photography quality.${intent ? `\n\nSCENE / CREATIVE DIRECTION FROM USER:\n${intent}` : ''}

REFERENCE IMAGE RULES:
- Preserve the main subject identity, structure, proportions, materials, colors, texture, and all key details from the reference image.
- Keep the subject recognizable and faithful to the reference.
- If the reference contains a product, preserve its shape, packaging, material, color, logo/text details, and design language.
- If the reference contains a person, preserve facial identity, hairstyle, body proportions, clothing identity, and natural skin texture.

STUDIO PHOTOGRAPHY QUALITY:
- Professional studio photo shoot, ultra realistic, premium commercial photography.
- Clean high-end set design, controlled softbox lighting, natural contact shadows, realistic reflections.
- Sharp details, realistic texture, balanced highlights, no overexposure.
- 50mm or 85mm lens look, shallow depth of field when appropriate, crisp subject separation.
- Premium editorial composition, polished but natural.

NEGATIVE RULES:
- No deformation, no warped anatomy, no extra limbs, no duplicate subjects.
- No random text, no watermark, no subtitles, no UI elements.
- Do not add logos or text unless they already exist in the reference image and should be preserved.
- Do not change the core subject into a different object or person.`;
}

export async function POST(request: NextRequest) {
  try {
    const { referenceImage, userIntent, aspectRatio, imageModel, apiKey } = await request.json();

    if (!referenceImage) {
      return NextResponse.json({ error: 'Reference image is required' }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'API Key is required' }, { status: 400 });
    }

    const prompt = buildStudioPrompt(userIntent);
    const taskId = await createImageTask(
      prompt,
      [referenceImage],
      apiKey,
      imageModel || 'doubao-seedream-5-0-lite',
      aspectRatio || '1:1'
    );

    return NextResponse.json({ taskId, prompt });
  } catch (error) {
    console.error('Image-to-image API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create image-to-image task' },
      { status: 500 }
    );
  }
}
