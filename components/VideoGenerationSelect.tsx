'use client';

import { VIDEO_GENERATION_CHOICES, videoSelectionKey, videoSelectionLabel, type VideoGenerationSelection } from '@/lib/videoGenerationSelection';

export default function VideoGenerationSelect({ value, onChange, disabled = false, rerunOnModelChange = false }: {
  value: VideoGenerationSelection;
  onChange: (value: VideoGenerationSelection) => void;
  disabled?: boolean;
  rerunOnModelChange?: boolean;
}) {
  const key = videoSelectionKey(value);
  return <label className="inline-flex max-w-full items-center gap-2 text-xs text-[var(--text-secondary)]">
    <span className="shrink-0">视频模型</span>
    <select aria-label="成片视频模型" value={key} disabled={disabled}
      title={disabled ? '任务执行中使用已保存模型；暂停后可更改后续生成模型' : rerunOnModelChange ? '切换模型后点制作，复用剧本与参考图重做视频，保留旧成片' : '用于本项目后续视频生成；已有视频保留，全部更换请重做'}
      className="max-w-[240px] rounded-lg border border-[var(--border-color)] bg-[var(--bg-tertiary)] px-2 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[#a78bfa] disabled:opacity-60"
      onChange={event => {
        const choice = VIDEO_GENERATION_CHOICES.find(item => videoSelectionKey(item) === event.target.value);
        if (choice) onChange({ videoProvider: choice.videoProvider, videoModel: choice.videoModel });
      }}>
      {!VIDEO_GENERATION_CHOICES.some(item => videoSelectionKey(item) === key) && <option value={key}>{videoSelectionLabel(value)}</option>}
      {VIDEO_GENERATION_CHOICES.map(choice => <option key={videoSelectionKey(choice)} value={videoSelectionKey(choice)}>{choice.label}</option>)}
    </select>
  </label>;
}
