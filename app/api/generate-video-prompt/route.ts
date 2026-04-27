import { NextRequest, NextResponse } from 'next/server';
import { chatCompletion } from '@/lib/apimart';

export async function POST(request: NextRequest) {
  try {
    const { storyboard, apiKey } = await request.json();
    if (!storyboard || !apiKey) {
      return NextResponse.json({ error: 'storyboard and apiKey are required' }, { status: 400 });
    }

    const prompt = `You are a professional cinematographer and film director writing AI video generation prompts. Your prompts must produce CINEMATIC motion — not just "images that move", but real film language with intentional camera work, blocking, and staging.

## Shot Information
Scene ${storyboard.sceneNumber}: ${storyboard.description}
Image prompt context: ${storyboard.prompt}

## Your Task
Write a professional cinematic video prompt using a TIMELINE structure. The video should feel like a real film shot with a complete action arc.

Follow this EXACT structure (no section labels in output):

[00-02s] Establish shot
- Shot size + lens: [ECU / CU / MCU / MS / MLS / WS / EWS / OTS], [24mm / 35mm / 50mm / 85mm / telephoto]
- Camera movement: locked-off / dolly in / track / crane / Steadicam / handheld / arc / pull back reveal
- Subject enters frame or position, establishing context

[02-04s] Core action
- The main action unfolds with specific body language: timing, body tension, eye line, hand gestures
- Environment interaction: light, objects, weather, surface contact
- Camera continues or transitions

[04-05s] Resolution
- Action completes naturally, no abrupt cut
- Final body position, emotional state, environment state
- End with seamless transition or hold

CAMERA / LIGHTING / AUDIO / CONSISTENCY
- Motivated lighting source and quality
- Depth of field: shallow DOF / deep focus
- Mood tone
- 24fps, film grain or cinematic 4K

## Critical Rules
- Each time segment focuses on ONE core action — never stack multiple events in a single segment
- Every camera movement must be MOTIVATED by the scene's emotion and narrative
- Blocking must feel like real actor performance, not random movement
- Do NOT describe character appearance (reference image handles that)
- Do NOT mention art style, animation, or rendering style
- Do NOT add background music, sound effects, or subtitles
- Do NOT change character face, clothing, hair, or object details from the input image
- No extra characters that do not appear in the reference image
- The shot must feel COMPLETE — clear beginning, middle, natural end
- Output ONLY the prompt text, no labels or section headers

## Examples of TIMELINE vs NON-TIMELINE

❌ Non-timeline: "The character walks forward and looks around."
✅ Timeline: "[00-02s] Medium shot, 50mm. Locked-off. Subject enters from screen left, pauses at center, weight shifting to one foot — a moment of hesitation. Eyes scan the space. [02-04s] Slow dolly in. Subject leans toward off-screen right, hand reaching out tentatively. Motivated window light from left creates soft shadow across face. [04-05s] Subject's fingers make contact with surface, breath held. Camera holds. Shallow DOF. Quiet dread. 24fps, film grain."

Now write the cinematic video prompt for Scene ${storyboard.sceneNumber}:`;

    const videoPrompt = await chatCompletion(prompt, apiKey);
    return NextResponse.json({ videoPrompt: videoPrompt.trim() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to generate video prompt' }, { status: 500 });
  }
}
