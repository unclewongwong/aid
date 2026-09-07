import type { SeriesJob, SeriesProject } from './types';
import { seriesAssetsReady } from './readiness';
import { parseAuthoredScreenplay } from './authoredScreenplay';

/** A write scope protects dependencies, not the provider's execution capacity.
 * ComfyUI owns its GPU queue; API work must not acquire a global GPU lock. */
export function seriesJobScope(job: SeriesJob, project: SeriesProject): string {
  if (project.sourceMode === 'authored_screenplay'
    || parseAuthoredScreenplay(project.brief, project.language)) return 'project';
  if (job.kind === 'prepare' && job.assetId) return `asset:${job.assetId}`;
  if ((job.kind === 'script' || job.kind === 'produce') && job.episodeId && seriesAssetsReady(project))
    return `episode:${job.episodeId}`;
  return 'project';
}

export function seriesJobsConflict(job: SeriesJob, scope: string, other: SeriesJob): boolean {
  if (job.seriesId !== other.seriesId) return false;
  const activeScope = other.writeScope || 'project'; // Older running workers own full snapshots.
  return scope === 'project' || activeScope === 'project' || scope === activeScope
    || scope.startsWith('asset:') !== activeScope.startsWith('asset:');
}

/** Only merge the entity owned by this lease; other workers' snapshots can be newer. */
export function mergeSeriesCheckpoint(owner: SeriesProject, incoming: SeriesProject, job: SeriesJob): SeriesProject {
  if (incoming.id !== owner.id || incoming.revision !== (job.checkpointRevision ?? owner.revision))
    throw new Error('生产快照版本冲突，拒绝覆盖');
  const scope = job.writeScope || 'project';
  if (scope === 'project') return { ...incoming, paused: owner.paused, deletedAt: owner.deletedAt };
  const replacement = { ...owner };
  const id = scope.slice(scope.indexOf(':') + 1);
  if (scope.startsWith('episode:')) {
    const episode = incoming.episodes.find(item => item.id === id);
    const existing = owner.episodes.find(item => item.id === id);
    if (!episode || !existing || episode.version !== existing.version) throw new Error('分集版本冲突，拒绝覆盖');
    replacement.episodes = owner.episodes.map(item => item.id === id
      ? { ...episode, deliveries: existing.deliveries } : item);
  } else {
    let found = false;
    for (const key of ['characters', 'locations', 'objects'] as const) {
      const item = incoming[key].find(item => item.id === id);
      if (!item || !owner[key].some(item => item.id === id)) continue;
      // Collections differ in type, but each replacement retains its own collection's type.
      (replacement[key] as Array<{ id: string }>) = owner[key].map(existing => existing.id === id ? item : existing);
      found = true;
    }
    if (!found) throw new Error('共享素材不存在，拒绝覆盖');
  }
  return replacement;
}
