import type { Storyboard } from '@/types';

/** Export needs the completed media, not the receipt of the generation job.
 * Recover from existing storage only; this path never purchases generation. */
export async function recoverCompletedVideoForExport(
  leader: Storyboard,
  deps: {
    cached: (key: string) => Promise<string | undefined>;
    download?: (taskId: string) => Promise<string>;
  },
): Promise<Storyboard> {
  if (leader.videoStatus !== 'completed') throw new Error(`导出前镜头 ${leader.sceneNumber} 尚未完成`);
  if (leader.videoUrl) return leader;
  const cached = leader.videoCacheKey ? await deps.cached(leader.videoCacheKey) : undefined;
  const recovered = cached || leader.videoSourceUrl
    || (leader.videoTaskId && deps.download ? await deps.download(leader.videoTaskId) : undefined);
  if (!recovered) throw new Error(`导出前无法恢复镜头 ${leader.sceneNumber} 的已有视频`);
  return { ...leader, videoUrl: recovered, videoCacheStatus: cached ? 'completed' : leader.videoCacheStatus };
}
