'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Download, Home, Image as ImageIcon, Loader2, RefreshCw, Settings, Sparkles, Upload } from 'lucide-react';
import DevToolsLayout from '@/components/DevToolsLayout';
import SettingsModal from '@/components/SettingsModal';
import { useSettings } from '@/hooks/useSettings';

export default function ImageToImagePage() {
  const { settings, saveSettings } = useSettings();
  const [showSettings, setShowSettings] = useState(false);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [userIntent, setUserIntent] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [statusText, setStatusText] = useState('');

  const handleImageUpload = (file: File) => {
    if (file.size > 8 * 1024 * 1024) {
      alert('Image size should be less than 8MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setReferenceImage(reader.result as string);
      setImageUrl(null);
      setGeneratedPrompt('');
    };
    reader.readAsDataURL(file);
  };

  const pollImageStatus = async (taskId: string) => {
    for (let i = 0; i < 90; i++) {
      setStatusText(`Generating studio image... ${i + 1}/90`);
      await new Promise(resolve => setTimeout(resolve, 3000));

      const response = await fetch('/api/check-image-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, apiKey: settings.apiKey })
      });

      if (!response.ok) continue;

      const data = await response.json();
      if (data.status === 'completed' && data.imageUrl) {
        setImageUrl(data.imageUrl);
        setStatusText('Completed');
        return;
      }

      if (data.status === 'failed') {
        throw new Error('Image generation failed');
      }
    }

    throw new Error('Image generation timeout');
  };

  const handleGenerate = async () => {
    if (!referenceImage) {
      alert('Please upload a reference image first');
      return;
    }

    if (!settings.apiKey) {
      alert('Please configure API Key in settings');
      setShowSettings(true);
      return;
    }

    setIsGenerating(true);
    setStatusText('Creating image generation task...');
    setImageUrl(null);

    try {
      const response = await fetch('/api/image-to-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referenceImage,
          userIntent,
          aspectRatio,
          imageModel: settings.imageModel,
          apiKey: settings.apiKey,
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start generation');
      }

      const { taskId, prompt } = await response.json();
      setGeneratedPrompt(prompt);
      await pollImageStatus(taskId);
    } catch (error) {
      alert(`Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setStatusText('Failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!imageUrl) return;
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studio-image-${Date.now()}.png`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toolbar = (
    <div className="h-12 flex items-center justify-between px-4 bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
      <div className="flex items-center gap-3">
        <Link href="/">
          <img src="/logo.png" alt="AI Video Studio" className="h-7 cursor-pointer" />
        </Link>
        <span className="text-xs font-mono text-[var(--text-secondary)]">|</span>
        <span className="text-xs font-mono text-[var(--text-primary)]">Image to Image</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowSettings(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] rounded"
        >
          <Settings size={14} /> Settings
        </button>
        <Link href="/">
          <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] rounded">
            <Home size={14} /> Home
          </button>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      <DevToolsLayout toolbar={toolbar}>
        <div className="h-full overflow-y-auto bg-[var(--bg-primary)]">
          <div className="max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="border-l-4 border-[var(--accent-blue)] pl-4">
                <h1 className="text-2xl font-mono text-[var(--accent-green)] mb-2">Image to Image</h1>
                <p className="text-sm font-mono text-[var(--text-secondary)]">
                  Upload a reference image and generate ultra-realistic professional studio photos.
                </p>
              </div>

              <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-4 space-y-4">
                <label className="block text-sm font-mono text-[var(--text-secondary)]">Reference Image</label>
                <div className="border-2 border-dashed border-[var(--border-color)] rounded-lg overflow-hidden bg-[var(--bg-primary)]">
                  {referenceImage ? (
                    <img src={referenceImage} alt="Reference" className="w-full max-h-[420px] object-contain" />
                  ) : (
                    <label className="h-64 flex flex-col items-center justify-center cursor-pointer hover:bg-[var(--bg-hover)] transition-colors">
                      <Upload size={40} className="text-[var(--text-secondary)] mb-3" />
                      <span className="text-sm font-mono text-[var(--text-secondary)]">Upload reference image</span>
                      <span className="text-xs font-mono text-[var(--text-secondary)] mt-1">PNG/JPG/WebP, max 8MB</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file);
                        }}
                      />
                    </label>
                  )}
                </div>
                {referenceImage && (
                  <label className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-mono bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] rounded cursor-pointer">
                    <Upload size={14} /> Replace Image
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                    />
                  </label>
                )}
              </div>

              <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-4 space-y-4">
                <div>
                  <label className="block text-sm font-mono text-[var(--text-secondary)] mb-2">Scene / Creative Direction</label>
                  <textarea
                    value={userIntent}
                    onChange={(e) => setUserIntent(e.target.value)}
                    placeholder="例如：高级香水广告图，黑色亚克力台面，柔和轮廓光，奢华商业摄影；或：电商主图，纯净白底，产品清晰居中。"
                    className="w-full h-32 p-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-sm font-mono text-[var(--text-primary)] resize-none focus:outline-none focus:border-[var(--accent-blue)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-mono text-[var(--text-secondary)] mb-2">Aspect Ratio</label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value as '16:9' | '9:16' | '1:1')}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded px-3 py-2 text-sm font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]"
                  >
                    <option value="1:1">1:1 Square</option>
                    <option value="16:9">16:9 Landscape</option>
                    <option value="9:16">9:16 Portrait</option>
                  </select>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !referenceImage}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-mono bg-[var(--accent-blue)] hover:bg-[#006bb3] text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  {isGenerating ? statusText || 'Generating...' : 'Generate Studio Photo'}
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-4 min-h-[520px] flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <ImageIcon size={16} className="text-[var(--accent-purple)]" />
                  <h2 className="text-sm font-mono text-[var(--text-primary)]">Generated Image</h2>
                </div>

                <div className="flex-1 bg-black/20 rounded border border-[var(--border-color)] flex items-center justify-center overflow-hidden">
                  {imageUrl ? (
                    <img src={imageUrl} alt="Generated studio photo" className="w-full h-full object-contain" />
                  ) : isGenerating ? (
                    <div className="text-center text-[var(--text-secondary)] font-mono text-sm">
                      <Loader2 size={36} className="animate-spin mx-auto mb-3" />
                      {statusText || 'Generating...'}
                    </div>
                  ) : (
                    <div className="text-center text-[var(--text-secondary)] font-mono text-sm">
                      <ImageIcon size={48} className="mx-auto mb-3 opacity-50" />
                      Generated image will appear here
                    </div>
                  )}
                </div>

                {imageUrl && (
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={handleDownload}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-xs font-mono bg-[var(--accent-green)] hover:bg-[#5dd18d] text-white rounded"
                    >
                      <Download size={14} /> Download
                    </button>
                    <button
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-xs font-mono bg-[var(--accent-purple)] hover:bg-[#9b59b6] text-white rounded disabled:opacity-50"
                    >
                      <RefreshCw size={14} /> Regenerate
                    </button>
                  </div>
                )}
              </div>

              {generatedPrompt && (
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-4">
                  <h3 className="text-sm font-mono text-[var(--accent-green)] mb-2">Generated Prompt</h3>
                  <pre className="max-h-72 overflow-y-auto whitespace-pre-wrap text-xs font-mono text-[var(--text-secondary)] bg-[var(--bg-primary)] border border-[var(--border-color)] rounded p-3">
                    {generatedPrompt}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </DevToolsLayout>

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSave={saveSettings}
      />
    </>
  );
}
