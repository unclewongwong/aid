import type { SeriesEpisode, SeriesJob, SeriesProject } from './types';
import type { VideoGenerationSelection } from '../videoGenerationSelection';
import { videoGenerationSelection, videoSelectionKey } from '../videoGenerationSelection';
import { resetEpisodeVideosForProviderChange } from './videoProviderChange';
import { seriesJobScope, seriesJobsConflict } from './concurrency';

/** Prefer the current production, then its delivery/job record. No settings or credentials are exposed. */
export function episodeVideoSelection(episode: SeriesEpisode, jobs: SeriesJob[]): VideoGenerationSelection | undefined {
  if (episode.videoSelection) return episode.videoSelection;
  const delivery = [...episode.deliveries].reverse().find(d => d.episodeVersion === episode.version);
  if (delivery?.videoSelection) return delivery.videoSelection;
  const deliveryJob = delivery && jobs.find(j => j.id === delivery.id);
  if (deliveryJob?.videoSelection) return deliveryJob.videoSelection;
  return [...jobs].filter(j => j.episodeId === episode.id && j.kind === 'produce')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)).find(j => j.videoSelection)?.videoSelection;
}

export function rerunChangedEpisodeVideos(project: SeriesProject, jobs: SeriesJob[], episodeIds: Set<string> | undefined, selection: VideoGenerationSelection): number {
  const next = videoGenerationSelection(selection);
  const changed = project.episodes.filter(episode => {
    if (episodeIds && !episodeIds.has(episode.id)) return false;
    const previous = episodeVideoSelection(episode, jobs);
    if (previous) return videoSelectionKey(previous) !== videoSelectionKey(next);
    // Very old/deleted job records may lack a model. Rebuild their paid video
    // once under the explicit choice, then persist it so another click is a no-op.
    return episode.deliveries.some(d => d.episodeVersion === episode.version)
      || Boolean(episode.production?.storyboards.some(b => b.videoTaskId || b.videoUrl || b.videoSourceUrl));
  });
  // Preflight the entire selection before mutating any episode. A live lease
  // may still save old results, so it must finish/pause before this operation.
  for (const episode of changed) {
    const candidate = { seriesId: project.id, episodeId: episode.id, kind: 'produce' } as SeriesJob;
    const scope = seriesJobScope(candidate, project);
    if (jobs.some(j => j.status === 'running' && seriesJobsConflict(candidate, scope, j)))
      throw new Error(`第${episode.number}集相关任务仍在运行，请先暂停并等待保存断点，再用新模型制作`);
  }
  for (const episode of changed) {
    const related = jobs.filter(j => j.seriesId === project.id && j.episodeId === episode.id && j.kind === 'produce');
    const hasMedia = Boolean(episode.production || episode.deliveries.some(d => d.episodeVersion === episode.version));
    if (hasMedia) {
      episode.videoHistory ||= [];
      episode.videoHistory.push({ at: new Date().toISOString(), version: episode.version, videoSelection: episodeVideoSelection(episode, jobs), production: episode.production ? structuredClone(episode.production) : undefined });
      episode.version++;
      resetEpisodeVideosForProviderChange(episode);
      if (episode.production) {
        episode.production.id = `${project.id}-${episode.id}-v${episode.version}`;
        episode.production.videoSegmentPlan = undefined;
        episode.production.pipelineState = undefined;
        episode.production.updatedAt = new Date().toISOString();
      }
    }
    episode.videoSelection = next;
    for (const job of related.filter(j => ['queued', 'paused', 'failed'].includes(j.status))) {
      job.status = 'failed';
      job.supersededByVideoModel = true;
      job.error = '已由新视频模型任务接替；原素材已归档';
      job.finishedAt = new Date().toISOString();
      job.cancelRequested = true;
      job.lease = undefined;
      job.workerId = undefined;
      job.stage = '已归档：改用新视频模型制作';
      job.updatedAt = new Date().toISOString();
    }
  }
  return changed.length;
}
