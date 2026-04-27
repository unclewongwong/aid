'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import VideoEditor from '@/components/video-editor/VideoEditor';
import Link from 'next/link';
import { Home } from 'lucide-react';

function EditorContent() {
  const searchParams = useSearchParams();
  const [videos, setVideos] = useState<string[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const videoParam = searchParams.get('videos');
    setError('');
    setVideos([]);

    if (!videoParam) return;

    try {
      const parsed = JSON.parse(decodeURIComponent(videoParam));
      if (!Array.isArray(parsed) || parsed.some(item => typeof item !== 'string' || item.length === 0)) {
        throw new Error('Invalid videos parameter');
      }
      setVideos(parsed);
    } catch {
      setError('视频参数无效，请重新选择视频进入编辑器。');
    }
  }, [searchParams]);

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--accent-red)] font-mono text-sm">
        {error}
      </div>
    );
  }

  return videos.length > 0 ? (
    <VideoEditor initialVideos={videos} />
  ) : (
    <div className="flex-1 flex items-center justify-center text-[var(--text-secondary)]">
      No videos to edit
    </div>
  );
}

export default function EditorPage() {
  return (
    <div className="h-screen flex flex-col bg-[var(--bg-primary)]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="AI Video Studio" className="h-6" />
          <span className="text-xs font-mono text-[var(--text-secondary)]">|</span>
          <span className="text-xs font-mono text-[var(--text-primary)]">Video Editor</span>
        </div>
        <Link href="/">
          <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] rounded">
            <Home size={14} />
            Home
          </button>
        </Link>
      </div>

      <Suspense fallback={<div className="flex-1 flex items-center justify-center text-[var(--text-secondary)]">Loading...</div>}>
        <EditorContent />
      </Suspense>
    </div>
  );
}
