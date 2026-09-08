import { buildGptImage2PhotographicContract } from './gptImagePrompt';
import { ANIMATED_VISUAL_STYLES } from './visualStylePresets';
import type { VisualStyle } from '@/types';
import { normalizeVisualStyle, buildCharacterBiblePrompt, buildCharacterConceptGridPrompt, buildSceneReferencePrompt } from './promptArchitecture';
import { buildGptPhotographicDetail } from './gptPhotographicDetail';

export function usesPhotographicReferences(style?: VisualStyle): boolean {
  return ![...ANIMATED_VISUAL_STYLES, 'follow-reference'].includes(normalizeVisualStyle(style));
}

export const PHOTOGRAPHIC_IDENTITY_RULE = 'References lock face/head, age, species, anatomy, hair and costume, not their rendering style. Use practical makeup, sewn wardrobe or creature effects without redesigning the character. Merfolk retain their fish tail, never human legs or shoes; a tail outside the crop need not be shown.';

const fittingLight = 'For this wardrobe fitting, use broad window daylight from one side with gentle room bounce, natural color and restrained contrast, unless the brief specifies a different light setup.';

export function buildGptCharacterAnchorPrompt(input: Parameters<typeof buildCharacterBiblePrompt>[0]): string {
  // Describe the requested portrait, without injecting a changing-room scene or
  // unrelated creature/body instructions into every human character request.
  const brief = [input.description, input.costumeDesc, input.role].filter(Boolean).join(' ');
  const merfolk = /mermaid|merman|merfolk|人鱼|魚人|鱼尾|魚尾/i.test(brief);
  return [
    `Create one photorealistic portrait of ${input.name || 'the specified character'} for a story character reference.`,
    input.hasIdentityReference
      ? 'Image 1 defines this character’s face or head, age, hairstyle and outfit. Preserve that design in the requested photographic medium.'
      : 'Create the character from the written brief below; preserve the stated age and appearance.',
    input.age ? `AGE: ${input.age}` : '',
    input.role ? `ROLE: ${input.role}` : '',
    input.description || '',
    input.costumeDesc ? `OUTFIT: ${input.costumeDesc}` : '',
    'One eye-level, chest-up portrait against a plain neutral backdrop. The character wears the complete outfit described in the brief, with the face, hairstyle and clothing clearly readable. Use a relaxed, natural expression unless another expression is specified.',
    'Soft daylight and natural color. Natural skin and hair; retain the specified makeup and distinguishing features. Keep the stated age, proportions and character design.',
    merfolk ? 'Merfolk retain their fish tail, never human legs or shoes; a tail outside this portrait crop need not be shown.' : '',
    'One photograph only, no character sheet, labels or extra views.',
  ].filter(Boolean).join('\n');
}

export function buildGptCharacterBiblePrompt(input: Parameters<typeof buildCharacterBiblePrompt>[0]): string {
  if (!usesPhotographicReferences(input.visualStyle)) return buildCharacterBiblePrompt(input);
  return `Create a photorealistic costume-continuity photo sheet for ${input.name || 'one story character'}, photographed during a live-action wardrobe fitting. One identity in every view.

CHARACTER: ${input.description || ''}
WARDROBE: ${input.costumeDesc || 'Preserve the wardrobe described above and in the identity reference.'}
${input.hasIdentityReference ? PHOTOGRAPHIC_IDENTITY_RULE : 'Establish one distinctive identity from the brief, with the specified age and species, and keep it identical in every view.'}
${input.role ? `ROLE: ${input.role}` : ''}
${input.age ? `AGE: ${input.age}` : ''}

LAYOUT: One 4:3 horizontal sheet. A large three-quarter chest-up photograph shows the face clearly. Four supporting full-body photographs show front, three-quarter, side and back views with the complete body and costume visible. All views show the same individual, grooming and clothing at a consistent scale. Relaxed weight-bearing posture and neutral expression. An unobtrusive plain gray fitting-room backdrop. No diagrams, silhouette cutouts, color swatches or tiny expression grids. No text, labels or borders.

PHOTOGRAPHIC TREATMENT: ${fittingLight}
${buildGptPhotographicDetail({ view: 'character-sheet' })}
Fantasy beings remain the same species and anatomy, portrayed as physically present creatures with believable skin, scales, fur and costume contact, never redesigned into human actors or game characters. Photograph every view in the same room with the same lighting. Preserve identity and wardrobe; change only the requested viewing angle.`;
}

export function buildGptCharacterConceptPrompt(input: Parameters<typeof buildCharacterConceptGridPrompt>[0]): string {
  if (!usesPhotographicReferences(input.visualStyle)) return buildCharacterConceptGridPrompt(input);
  return `Create a photorealistic casting and wardrobe-test contact sheet with exactly ${input.candidateCount} distinct candidates in a ${input.candidateCount === 4 ? '2 by 2' : '3 by 3'} grid.
ROLE: ${input.name || ''}. ${input.role || ''}. ${input.description || ''}
WARDROBE: ${input.costumeDesc || ''}
AGE: ${input.age || 'As specified in the role brief; do not change age to improve appearance.'}
${input.hasReferences ? PHOTOGRAPHIC_IDENTITY_RULE : 'Use the written brief to establish the specified species and age.'}
Explore casting and wardrobe alternatives only within the brief. One character per cell, full body visible at consistent scale, naturally standing against a plain gray backdrop. No added people within a cell. These are real fitting photographs, not sculptures or concept illustrations.
${fittingLight}
${buildGptPhotographicDetail({ view: 'full-body' })}
No titles, numbers, labels, watermark, expression sub-panels, cropped feet or overlapping cells. Keep anatomy, species and the selected photographic medium consistent.`;
}

export function buildGptSceneReferencePrompt(scene: string, style?: VisualStyle, aspectRatio = '16:9'): string {
  if (!usesPhotographicReferences(style)) return buildSceneReferencePrompt(scene, style, aspectRatio as '16:9' | '9:16' | '1:1');
  return `Create one photorealistic location-scouting photograph, ${aspectRatio} composition, of this story location: ${scene}.
For a fantasy location, photograph how a film crew would build and light that design: fabricated scenery and illuminated props, without showing the crew. Preserve architecture, entrances, landmarks and scale.
One wide photograph from human height beside the entrance, with usable foreground space. Honor the authored time, weather and light. Surfaces need not all shine; moisture is irregular where the scene requires it. Keep background detail subordinate to the room's layout.
${buildGptImage2PhotographicContract(style, undefined, { view: 'environment', characterCount: 0 })}
Keep the location faithful to the brief. No people, contact sheet, alternate views, labels, titles or added text.`;
}
