import type { SeriesProject } from './types';
import type { MaterialFacts } from '../materialFacts';
import { materialQuestions } from '../materialFacts';
import { seriesShotObjectIds } from './domain';
import { currentVisualIdentity, visibleStoryObjects } from '../storyVisualAssets';
import { clearVideoArtifact } from './videoProviderChange';
import { clearStoryboardMedia } from './visualRedo';

export function materialRepairScope(project: SeriesProject, objectId: string) {
  return project.episodes.flatMap(episode => {
    const numbers = new Set((episode.script || []).filter(shot => seriesShotObjectIds(project, shot).includes(objectId)).map(s => s.number));
    for (const board of episode.production?.storyboards || [])
      if (visibleStoryObjects(board, project.objects).some(o => o.id === objectId) || project.objects.filter(o => o.id === objectId).some(o => [o.name, ...(o.aliases || [])].some(name => name && board.description?.includes(name)))) numbers.add(board.sceneNumber);
    return numbers.size ? [{ episodeId: episode.id, episode: episode.number, shots: [...numbers].sort((a,b) => a-b) }] : [];
  });
}
export function projectMaterialQuestions(project: SeriesProject) {
  return project.episodes.flatMap(episode => {
    const assets = project.objects.map(object => {
      const prepared = episode.production?.objects?.find(o => o.id === object.id);
      return !currentVisualIdentity(object) && prepared && prepared.imageUrl === object.imageUrl && prepared.description === object.description
        ? { ...object, visualIdentity: prepared.visualIdentity } : object;
    });
    return (episode.production?.storyboards || []).flatMap(board => materialQuestions(board, assets).map(q => ({ ...q, episode: episode.number })));
  });
}

/** Pure transaction: validate everything before returning a replacement project. */
export function supplementMaterialFacts(project: SeriesProject, objectId: string, input: Partial<MaterialFacts>, revision: number): SeriesProject {
  if (revision !== project.revision) throw new Error('项目已有更新，请刷新后确认修复范围');
  if (!project.paused) throw new Error('请先暂停队列，保存当前生成断点后再补充素材');
  const original = project.objects.find(o => o.id === objectId);
  if (!original) throw new Error('道具不存在');
  const clean = (value: unknown) => typeof value === 'string' ? value.trim() : '';
  const contents = clean(input.contents), packaging = clean(input.packaging), usage = clean(input.usage);
  if (!contents || [contents, packaging, usage].some(s => s.length > 2000)) throw new Error('请填写内含物的颜色、材质等事实，每项最多2000字');
  const evidenceUrl = clean(input.evidenceUrl);
  if (evidenceUrl) {
    const url = new URL(evidenceUrl);
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error('补充照片地址必须是HTTPS公开素材地址');
  }
  const previous = original.materialFacts;
  if (previous?.sourceUrl === original.imageUrl && previous.contents === contents && previous.packaging === packaging && previous.usage === usage && (previous.evidenceUrl || '') === evidenceUrl
    && project.episodes.every(e => !e.production || (e.production.objects || []).filter(o => o.id === objectId).every(o => JSON.stringify(o.materialFacts) === JSON.stringify(previous) && JSON.stringify(o.imageApiReference) === JSON.stringify(original.imageApiReference)))) return structuredClone(project);
  const scope = materialRepairScope(project, objectId);
  const dependentVideoIds = (episode: SeriesProject['episodes'][number], shots: number[]) => {
    const boards = episode.production?.storyboards || [];
    const affected = boards.filter(b => shots.includes(b.sceneNumber));
    return new Set(boards.filter(b => affected.some(a =>
      (a.videoSegmentId && a.videoSegmentId === b.videoSegmentId) ||
      (a.videoContinuityChainId && a.videoContinuityChainId === b.videoContinuityChainId && b.sceneNumber >= a.sceneNumber)
    )).map(b => b.id));
  };
  for (const item of scope) {
    const episode = project.episodes.find(e => e.id === item.episodeId)!;
    if (episode.production?.storyboards.some(b => (item.shots.includes(b.sceneNumber) || dependentVideoIds(episode, item.shots).has(b.id)) && (b.status === 'generating' && b.taskId || b.videoStatus === 'generating' && b.videoTaskId)))
      throw new Error('相关镜头仍有运行中的任务，请先查询并保存原结果，不能重复提交');
  }
  const next = structuredClone(project);
  const at = new Date().toISOString();
  const fact: MaterialFacts = { source: 'user', sourceUrl: original.imageUrl, confirmedAt: at, contents, packaging, usage, ...(evidenceUrl ? { evidenceUrl } : {}) };
  next.materialRepairHistory = [...(next.materialRepairHistory || []), { at, objectId, before: original.materialFacts, after: fact,
    productions: scope.map(item => { const ep = project.episodes.find(e => e.id === item.episodeId)!; return { episodeId: ep.id, version: ep.version, production: structuredClone(ep.production) }; }) }];
  next.objects = next.objects.map(o => o.id === objectId ? { ...o, materialFacts: fact } : o);
  for (const item of scope) {
    const episode = next.episodes.find(e => e.id === item.episodeId)!;
    if (!episode.production) continue;
    const dependent = dependentVideoIds(episode, item.shots);
    // Existing deliveries remain attached to their previous version.
    if (episode.deliveries.some(d => d.episodeVersion === episode.version)) {
      episode.version++;
      episode.production.id = `${project.id}-${episode.id}-v${episode.version}`;
    }
    episode.production.objects = (episode.production.objects || next.objects).map(o => o.id === objectId ? { ...o, materialFacts: fact, imageApiReference: original.imageApiReference } : o);
    episode.production.storyboards = episode.production.storyboards.map(board => item.shots.includes(board.sceneNumber)
      ? { ...clearStoryboardMedia(board), videoDirection: undefined, videoDirectionSource: undefined, visualPromptRewriteId: `material-facts:${objectId}:${at}` }
      : dependent.has(board.id) ? clearVideoArtifact(board) : board);
    episode.production.pipelineState = undefined;
    episode.production.videoSegmentPlan = undefined;
  }
  return next;
}
