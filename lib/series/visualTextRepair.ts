import type { SeriesEpisode, SeriesProject, SeriesShot } from './types';
import { episodeScreenplay } from './domain';
import { clearStoryboardMedia } from './visualRedo';

export interface ApprovedVisualTextPatch {
  number: number;
  sourceQuote: string;
  before: Pick<SeriesShot, 'visual' | 'action' | 'imagePrompt'>;
  after: Pick<SeriesShot, 'visual' | 'action' | 'imagePrompt'>;
}

/** Apply an already reviewed correction, not an autonomous story rewrite.
 * Source evidence, exact before-values and a paused queue are mandatory. */
export function applyApprovedVisualTextRepairs(project: SeriesProject, episode: SeriesEpisode, patches: ApprovedVisualTextPatch[], revision: string): SeriesEpisode {
  if (!project.paused || !episode.script || !patches.length || !revision) throw new Error('视觉文字修复需要暂停队列、原剧本和明确修复范围');
  if (episode.deliveries.some(delivery => delivery.episodeVersion === episode.version)) throw new Error('已有交付不能自动替换');
  const numbers = new Set<number>();
  for (const patch of patches) {
    if (numbers.has(patch.number) || !patch.sourceQuote.trim() || !project.brief.includes(patch.sourceQuote)) throw new Error('修复必须有原始创意中的逐字依据，且不能重复镜号');
    numbers.add(patch.number);
    const shot = episode.script.find(shot => shot.number === patch.number);
    if (!shot || Object.keys(patch.after).some(key => !['visual', 'action', 'imagePrompt'].includes(key))) throw new Error('只能修改指定镜头的视觉文字，不能修改台词、时长或身份');
    for (const field of ['visual', 'action', 'imagePrompt'] as const) {
      if (shot[field] !== patch.before[field]) throw new Error('原稿已更新，拒绝覆盖较新的修改');
      if (typeof patch.after[field] !== 'string' || !patch.after[field]!.trim()) throw new Error('视觉修稿不能为空');
    }
    const board = episode.production?.storyboards.find(board => board.sceneNumber === patch.number);
    if (board?.videoTaskId || board?.videoUrl) throw new Error('受影响镜头已有视频，须先明确重做该片段');
    if (board?.status === 'generating' && board.taskId) throw new Error('受影响镜头已有运行中的图像任务，先保留并查询原任务');
  }
  const next = structuredClone(episode);
  next.visualTextRepairs = [...(next.visualTextRepairs || []), {
    at: new Date().toISOString(), revision, patches: structuredClone(patches),
    storyboards: (episode.production?.storyboards || []).filter(board => numbers.has(board.sceneNumber)),
  }];
  next.script = next.script!.map(shot => {
    const patch = patches.find(patch => patch.number === shot.number);
    return patch ? { ...shot, ...patch.after } : shot;
  });
  if (next.production) {
    next.production.storyContent = episodeScreenplay(project, next);
    next.production.storyboards = next.production.storyboards.map(board => {
      const patch = patches.find(patch => patch.number === board.sceneNumber);
      return patch ? { ...clearStoryboardMedia(board), action: patch.after.action, description: patch.after.visual, prompt: patch.after.imagePrompt!, videoDirection: undefined, videoDirectionSource: undefined, visualPromptRewriteId: revision } : board;
    });
    next.production.videoSegmentPlan = undefined;
  }
  return next;
}
