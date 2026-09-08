import { normalizeImageStyleReference } from '../imageStyleReference';
import type { SeriesProject } from './types';
import { normalizeVisualStyle, PRODUCTION_STYLE_PRESETS } from '../promptArchitecture';
import type { VisualStyle } from '@/types';

export function setSeriesStyleReference(project: SeriesProject, input: unknown, visualStyle?: unknown): boolean {
  const style = normalizeImageStyleReference(input);
  if (visualStyle !== undefined && !PRODUCTION_STYLE_PRESETS.some(preset => preset.value === visualStyle)) throw new Error('请选择有效的全剧视觉风格');
  const nextVisualStyle = visualStyle === undefined ? project.visualStyle : normalizeVisualStyle(visualStyle as VisualStyle);
  if (project.visualStyle === nextVisualStyle && (project.styleReference?.imageUrl || '') === (style?.imageUrl || '') && (project.styleReference?.description || '') === (style?.description || '')) return false;
  project.visualHistory ||= [];
  project.visualHistory.push({
    changedAt: new Date().toISOString(), reason: 'style_change', styleReference: project.styleReference, visualStyle: project.visualStyle,
    characters: structuredClone(project.characters), locations: structuredClone(project.locations), objects: structuredClone(project.objects),
    productions: project.episodes.filter(e => e.production).map(e => ({ episodeId:e.id, version:e.version, production:structuredClone(e.production!) })),
  });
  project.styleReference = style ? { ...style, version: project.visualHistory.length } : undefined;
  project.visualStyle = nextVisualStyle;
  for (const c of project.characters) {
    for (const key of ['bibleUrl','imageTaskId','imageSubmissionKey','imageIssue','imageFailures','photographicAnchor','photographicCardReview','photographicSheetUrl'] as const) delete c[key];
    c.locked = c.appearance === 'voice_only' && (!c.speaking || !!(c.voiceId && c.voiceReferenceUrl));
    c.version++;
  }
  for (const l of project.locations) for (const key of ['imageUrl','imageTaskId','imageSubmissionKey','imageIssue','imageFailures'] as const) delete l[key];
  for (const e of project.episodes) { delete e.production; e.version++; }
  return true;
}
