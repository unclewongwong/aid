import type { SeriesEpisode } from './types';
import { withVideoSelection } from '@/lib/videoGenerationSelection';
import type { AppSettings, Storyboard } from '@/types';

// Keep the submitted model selection through queueing, resuming and execution.
export function enforceSeriesVideoProvider(settings: AppSettings): AppSettings {
  return withVideoSelection(settings, settings);
}

export function mergeResumedSeriesSettings(
  previous: AppSettings,
  incoming: Partial<AppSettings>,
  serverApiKey = '',
): AppSettings {
  return enforceSeriesVideoProvider({
    ...previous,
    ...incoming,
    apiKey: incoming.apiKey || previous.apiKey || serverApiKey,
    fal: {
      ...(previous.fal || {}),
      ...(incoming.fal || {}),
    },
    comfyui: previous.comfyui || incoming.comfyui
      ? {
          ...(previous.comfyui || {}),
          ...(incoming.comfyui || {}),
        } as AppSettings['comfyui']
      : undefined,
  });
}

export function clearVideoArtifact(storyboard: Storyboard): Storyboard {
  return {
    ...storyboard,
    videoUrl: undefined,
    videoSourceUrl: undefined,
    videoCacheKey: undefined,
    videoCacheStatus: undefined,
    videoCachedAt: undefined,
    videoSegmentId: undefined,
    videoSegmentStoryboardIds: undefined,
    videoGenerationSignature: undefined,
    videoStatus: 'pending',
    videoTaskId: undefined,
    videoProviderUsed: undefined,
    videoSeed: undefined,
    videoContinuityChainId: undefined,
    videoContinuitySegmentIndex: undefined,
    videoPrompt: undefined,
    videoPromptOverride: false,
    videoDuration: undefined,
    videoEndingAudit: undefined,
    videoEndingWarning: undefined,
    videoEndingRepairAttempts: undefined,
    videoEndingMinimumDuration: undefined,
    videoEndingHistory: undefined,
    videoDuplicateAudit: undefined,
    videoDuplicateRepairPrompt: undefined,
    videoDuplicateRepairAttempts: undefined,
    videoDuplicateHistory: undefined,
  };
}

export function resetEpisodeVideosForProviderChange(
  episode: SeriesEpisode | undefined,
): number {
  const storyboards = episode?.production?.storyboards;
  if (!storyboards?.length) return 0;
  const affected = storyboards.filter((storyboard) =>
    Boolean(
      storyboard.videoTaskId ||
      storyboard.videoUrl ||
      storyboard.videoSourceUrl ||
      storyboard.videoCacheKey ||
      storyboard.videoSegmentId ||
      storyboard.videoStatus === 'generating' ||
      storyboard.videoStatus === 'completed',
    ),
  ).length;
  episode!.production!.storyboards = storyboards.map(clearVideoArtifact);
  return affected;
}
