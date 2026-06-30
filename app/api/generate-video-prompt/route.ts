import { NextRequest, NextResponse } from 'next/server';
import { chatCompletion } from '@/lib/apimart';

export async function POST(request: NextRequest) {
  try {
    const { storyboard, apiKey } = await request.json();
    if (!storyboard || !apiKey) {
      return NextResponse.json({ error: 'storyboard and apiKey are required' }, { status: 400 });
    }

    const prompt = `You are a professional cinematographer writing AI video generation prompts. Every prompt must produce KINETIC, PRECISELY TIMED motion — specific camera mechanics, not vague intentions.

## Shot Information
Scene ${storyboard.sceneNumber}: ${storyboard.description}
Context: ${storyboard.prompt}

## PACING — Choose before writing
- **FAST** (action/shock/chase): explosive weight shifts, zero hesitation, sharp muscle tension; camera: whip pan, snap dolly push, urgent handheld shake, fast arc
- **MEDIUM** (conversation/discovery): natural gait, controlled gestures, eye contact; camera: smooth tracking, gentle arc, breathing Steadicam
- **SLOW** (grief/awe/intimacy/dread): micro-tremors only — finger curl, slow blink, chest rise; camera: imperceptible creep, glacial pull-back, locked-off hold

## CAMERA MOVEMENT — Always specify ALL of these:
**Speed**: instant / snap (0–0.2s) | quick (0.2–0.5s) | moderate (0.5–1.5s) | slow (1.5–3s) | glacial (3s+)
**Easing**: linear | ease-in (starts slow, accelerates) | ease-out (decelerates into hold) | ease-in-out (smooth S-curve) | snap-hold (instant move, hard stop)
**Amplitude**: micro (1–3cm / 1–3°) | small (5–10cm / 5–10°) | medium (20–50cm / 15–30°) | large (1–2m / 45°+)
**Path**: straight axis push/pull | curved arc (concave/convex) | spiral | pendulum swing | floating drift

## REQUIRED OUTPUT STRUCTURE

Line 1: PACE: [FAST/MEDIUM/SLOW] — [one-line scene energy statement]

[00-Xs] [Shot size], [lens mm]. [Camera move: speed + easing + amplitude + path]. [Subject action with muscle/weight specifics].

[Xs-Ys] [Camera continues or transitions: exact mechanics]. [Subject action develops — body tension, eye line, contact point].

[Ys-end] [Final camera state: speed + easing + hold]. [Subject resolves — final body position, breath state].

Lighting: [source direction + quality]. DOF: [aperture feel]. Grain/format: [24fps film grain / clean 4K].

## EXAMPLES

PACE: FAST — explosive confrontation, no room to breathe
[00-01s] MCU, 35mm. Snap dolly push-in (instant ease-in, 40cm straight axis). Subject's torso lurches forward — weight slams onto front foot, jaw tightens, fists clench at sides.
[01-03s] Camera holds locked-off with micro handheld flutter (±2mm, random). Subject's arm snaps up in a single hard movement — elbow fully extended, finger pointing off-screen right. Shoulder muscles visibly strain.
[03-04s] Slow ease-out pull-back (1.5s, 30cm, straight axis). Subject holds rigid pose, then chest deflates in one sharp exhale. Eyes stay locked forward. Hard hold.
Lighting: harsh overhead practical, hard shadows under brow. DOF: f/2.8 shallow. 24fps, film grain.

---

PACE: SLOW — suffocating grief, time has stopped
[00-03s] CU, 85mm. Glacial creep inward (3s, ease-in-out, 8cm straight axis, barely perceptible). Subject's eyes downcast — a single slow blink, lashes wet. No other movement.
[03-05s] Camera locks off completely. Subject's hand, resting on a surface, curls one finger inward — micro-movement, 2cm arc. Breath is held, then releases as near-silent exhale that barely moves the chest.
[05-06s] Micro pull-back (1s, ease-out, 5cm). Eyes lift fractionally — not to look at anything, just upward. Hold.
Lighting: soft diffused window light from screen left, cool tone. DOF: f/1.8 extreme shallow, background dissolved. 24fps, heavy grain.

## RULES
- Every camera move must name: speed + easing curve + amplitude + path direction
- Never write "the camera moves" — write exactly HOW it moves
- Subject actions: name the specific muscles, weight shifts, contact points
- Do NOT describe appearance, costume, or art style
- Do NOT add music, subtitles, or sound effects
- Output ONLY the prompt — no labels, no section headers

Write the prompt for Scene ${storyboard.sceneNumber}:`;

    const videoPrompt = await chatCompletion(prompt, apiKey);
    return NextResponse.json({ videoPrompt: videoPrompt.trim() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to generate video prompt' }, { status: 500 });
  }
}
