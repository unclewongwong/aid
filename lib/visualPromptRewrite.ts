import type { Storyboard } from '@/types';

/** Replace only model-authored visual execution fields. The screenplay beat,
 * exact dialogue, timing, shot grammar and reusable dialogue audio remain the
 * authority of the retained storyboard. */
export function mergeRegeneratedVisualPrompts(
  retained: Storyboard[],
  regenerated: Storyboard[],
): Storyboard[] {
  const targeted = retained.some(storyboard => Boolean(storyboard.visualPromptRewriteId));
  const expected = retained.filter(shot => !targeted || shot.visualPromptRewriteId);
  const freshByNumber = new Map(regenerated.map(shot => [shot.sceneNumber, shot]));
  if (regenerated.length !== expected.length || freshByNumber.size !== expected.length
    || expected.some(shot => !freshByNumber.has(shot.sceneNumber))) {
    throw new Error(`视觉提示重写返回的镜头与指定的 ${expected.map(shot => shot.sceneNumber).join('、')} 镜不匹配`);
  }
  return retained.map((storyboard, index) => {
    if (targeted && !storyboard.visualPromptRewriteId) return storyboard;
    const fresh = freshByNumber.get(storyboard.sceneNumber);
    if (!fresh || fresh.sceneNumber !== storyboard.sceneNumber) {
      throw new Error(`视觉提示重写的第 ${index + 1} 项与保留的第 ${storyboard.sceneNumber} 镜不匹配`);
    }
    const next: Storyboard = {
      ...storyboard,
      description: fresh.description,
      prompt: fresh.prompt,
      videoDirection: fresh.videoDirection,
      videoDirectionSource: fresh.videoDirectionSource,
      characters: fresh.characters,
      objects: fresh.objects,
      characterCostume: fresh.characterCostume,
      sceneStyle: fresh.sceneStyle,
      referenceBindings: fresh.referenceBindings,
      videoPrompt: undefined,
      videoPromptOverride: false,
    };
    delete next.visualPromptRewriteId;
    return next;
  });
}
