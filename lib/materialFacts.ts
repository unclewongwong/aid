import type { ObjectItem, Storyboard } from '@/types';
import { currentVisualIdentity, visibleStoryObjects } from './storyVisualAssets';

/** Explicit testimony is separate from machine observations of a sealed package. */
export interface MaterialFacts {
  sourceUrl: string;
  confirmedAt: string;
  source: 'user';
  packaging: string;
  contents: string;
  usage: string;
  evidenceUrl?: string;
}
export const currentMaterialFacts = (asset: Pick<ObjectItem, 'imageUrl' | 'materialFacts'>) =>
  asset.materialFacts?.sourceUrl === asset.imageUrl ? asset.materialFacts : undefined;

export interface MaterialQuestion { objectId: string; name: string; reason: string; sceneNumber: number }
export function materialQuestions(board: Storyboard, objects: ObjectItem[]): MaterialQuestion[] {
  const text = `${board.description || ''} ${board.action || ''} ${board.prompt || ''}`;
  const visible = new Set(visibleStoryObjects(board, objects));
  return objects.filter(asset => visible.has(asset) || [asset.name, ...(asset.aliases || [])].some(name => name && board.description?.includes(name))).flatMap(asset => {
    const identity = currentVisualIdentity(asset);
    const facts = currentMaterialFacts(asset);
    // High-confidence packaging/content ambiguity only; arbitrary provider failures
    // are not evidence that the user owes us material information.
    const contentsVisible = /敷|贴.{0,8}脸|膜布|涂抹|倒出|挤出|拆开|撕开|unpack|apply|applied|wearing.{0,65}mask|wear.{0,65}mask|face mask|pour|squeez/i.test(text);
    if (identity?.kind !== 'packaging' || !contentsVisible || facts?.contents.trim()) return [];
    return [{ objectId: asset.id, name: asset.name, sceneNumber: board.sceneNumber,
      reason: '参考图仅确认外包装，本镜需要展示内含物或使用状态；请补充颜色、材质，避免把包装当成产品。' }];
  });
}
export class MaterialInformationRequired extends Error {
  readonly name = 'MaterialInformationRequired';
  readonly shouldRetry = false;
  constructor(public questions: MaterialQuestion[]) {
    super(`需要补充素材事实：${questions.map(q => `第${q.sceneNumber}镜「${q.name}」：${q.reason}`).join('；')} 尚未提交生成，请在连续剧素材事实窗口补充。`);
  }
}
export function requireMaterialFacts(board: Storyboard, objects: ObjectItem[]) {
  const questions = materialQuestions(board, objects);
  if (questions.length) throw new MaterialInformationRequired(questions);
}
