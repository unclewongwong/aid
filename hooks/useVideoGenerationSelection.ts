'use client';

import { useEffect, useState } from 'react';
import type { AppSettings } from '@/types';
import { videoGenerationSelection, type VideoGenerationSelection } from '@/lib/videoGenerationSelection';

/** Project choice contains no credentials. Isolated Series workers use the job snapshot only. */
export function useVideoGenerationSelection(scope: string, defaults: AppSettings, isolated = false) {
  const key = `aid:video-selection:${scope}`;
  const [saved, setSaved] = useState<{ key: string; selection?: VideoGenerationSelection }>();
  useEffect(() => {
    let selection: VideoGenerationSelection | undefined;
    if (!isolated) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) selection = videoGenerationSelection(JSON.parse(raw));
      } catch { /* A corrupt preference must not prevent opening a project. */ }
    }
    setSaved({ key, selection });
  }, [key, isolated]);
  const selection = (!isolated && saved?.key === key && saved.selection) || videoGenerationSelection(defaults);
  const select = (value: VideoGenerationSelection) => {
    if (isolated) return;
    const next = videoGenerationSelection(value);
    localStorage.setItem(key, JSON.stringify(next));
    setSaved({ key, selection: next });
  };
  return { selection, select, ready: saved?.key === key };
}
