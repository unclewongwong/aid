import type { CapturePreset, VisualStyle } from '@/types';
import { getProductionStylePreset } from './promptArchitecture';
import { getCapturePreset, resolveStyleCapture } from './capturePresets';

/** Image-only priorities. No video prompt, sampling or H3 defaults live here. */
export interface ImageStyleControls {
  visualStyle?: VisualStyle;
  capturePreset?: CapturePreset;
  hasCharacterReference?: boolean;
  hasStyleReference?: boolean;
}

export function buildImageStyleControls(input: ImageStyleControls): string {
  const style = input.visualStyle && input.visualStyle !== 'follow-reference' ? getProductionStylePreset(input.visualStyle) : undefined;
  const captureValue = input.capturePreset || input.visualStyle ? resolveStyleCapture(input.visualStyle, input.capturePreset) : undefined;
  const capture = captureValue && captureValue !== 'follow-reference' ? getCapturePreset(captureValue) : undefined;
  const stylized = ['guoman', 'chibi'].includes(input.visualStyle || '');
  return [
    input.hasCharacterReference ? `CHARACTER DESIGN AUTHORITY: preserve the referenced face identity, age, species, hair, clothing and signature accessories. ${stylized ? 'Reinterpret facial design, proportions and materials in the selected animation style without changing who the character is.' : 'Keep the specified anatomy, proportions and material identities.'} ${style || input.hasStyleReference ? 'Keep the actor recognizable; the selected style controls rendering and its declared stylization, lighting and camera treatment.' : 'Inherit the approved medium, palette, skin treatment, material detail, grain and light softness; do not beautify, neutralize or restyle it.'}` : '',
    style ? `SELECTED IMAGE STYLE: ${style.value}\n${style.imageContract}.` : input.hasStyleReference ? 'STYLE SOURCE: the separately mapped style image supplies medium, palette, lighting mood and surface treatment; it is not another actor, costume, product or location.' : '',
    capture ? `SELECTED CAPTURE METHOD: ${capture.value}\n${capture.image}` : input.hasCharacterReference ? 'Inherit the reference capture method while executing the authored shot size, viewpoint and action.' : '',
    style || capture || input.hasStyleReference ? 'PRIORITY: preserve identity/product design and authored actions. Selected style controls medium, character stylization and production lighting; style image controls palette/mood; selected capture controls camera perspective/depth/exposure. Render capture geometry within the selected medium. Add no people, rain, props or events to demonstrate style.' : '',
  ].filter(Boolean).join('\n');
}
