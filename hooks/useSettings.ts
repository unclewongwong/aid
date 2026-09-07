'use client';

import { useState, useCallback, useEffect } from 'react';
import { hasExplicitGenerationModels } from '@/lib/settingsReadiness';
import { AppSettings } from '@/types';
import { SEEDREAM_5_PRO } from '@/lib/imageModels';
import { storyStorageKeys } from '@/lib/series/storageScope';
import { normalizeVideoModel, SEEDANCE_MINI } from '@/lib/videoModels';

const DEFAULT_SETTINGS: AppSettings = {
  apiProvider: 'apimart',
  apiKey: process.env.NEXT_PUBLIC_APIMART_API_KEY || '',
  scriptProvider: 'auto',
  scriptModel: 'gpt-4o',
  imageModel: SEEDREAM_5_PRO,
  midjourneyProfileEnabled: true,
  midjourneyProfile: 'votj2t8',
  videoModel: SEEDANCE_MINI,
  videoProvider: 'apimart',
  fal: {
    apiKey: '',
    resolution: '768P',
    promptExpansionMode: 'disabled',
  },
  comfyui: {
    sshHost: 'me21gb3rds8p0h44.ssh.x-gpu.com',
    sshPort: 43213,
    sshUser: 'root',
    sshKeyPath: '~/.ssh/id_ed25519',
    useLocalCompanion: true,
    localCompanionUrl: 'http://127.0.0.1:3018',
    comfyPort: 8188,
    workflowRoot: '/root/ComfyUI',
    imageWorkflowPath: '',
    multiImageWorkflowPath: '',
    firstLastWorkflowPath: '',
    h3Fl2vaProfile: 'dasiwa4',
    h3ContinuityMode: 'tail-frame',
    h3MotionContextFrames: 22,
    timeoutSeconds: 7200,
  },
  aspectRatio: '16:9', // 默认横屏
};

const LEGACY_VIDEO_MODEL_MAP: Record<string, string> = {
  'grok-imagine-1.0-video-apimart': 'grok-imagine-1.5-video-apimart',
};

const LEGACY_IMAGE_MODEL_MAP: Record<string, string> = {
  'doubao-seedream-5-0-lite': SEEDREAM_5_PRO,
};

function migrateSettings(settings: AppSettings): AppSettings {
  const migratedVideoModel = normalizeVideoModel(LEGACY_VIDEO_MODEL_MAP[settings.videoModel] || settings.videoModel || DEFAULT_SETTINGS.videoModel);
  const migratedImageModel = LEGACY_IMAGE_MODEL_MAP[settings.imageModel] || settings.imageModel;
  const legacyComfyUI = settings.comfyui as (AppSettings['comfyui'] & {
    sshPrivateKey?: string;
    sshPrivateKeyPassphrase?: string;
  }) | undefined;
  const legacyKeyPath = String(legacyComfyUI?.sshKeyPath || '');
  const comfyui = {
    ...DEFAULT_SETTINGS.comfyui!,
    ...(legacyComfyUI || {}),
    h3Fl2vaProfile: 'dasiwa4' as const,
    sshKeyPath: /^(?:\/|~\/)/.test(legacyKeyPath)
      ? legacyKeyPath
      : DEFAULT_SETTINGS.comfyui!.sshKeyPath,
    useLocalCompanion: legacyComfyUI?.useLocalCompanion ?? true,
    localCompanionUrl: legacyComfyUI?.localCompanionUrl || 'http://127.0.0.1:3018',
  };
  delete comfyui.sshPrivateKey;
  delete comfyui.sshPrivateKeyPassphrase;
  return {
    ...DEFAULT_SETTINGS,
    ...settings,
    scriptProvider: settings.scriptProvider || 'auto',
    imageModel: migratedImageModel,
    videoModel: migratedVideoModel,
    videoProvider: settings.videoProvider || 'apimart',
    fal: {
      ...DEFAULT_SETTINGS.fal,
      ...(settings.fal || {}),
    },
    comfyui,
  };
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [settingsReady, setSettingsReady] = useState(false);
  const [hasSavedSettings, setHasSavedSettings] = useState(false);

  // 从 localStorage 加载设置
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storyStorageKeys().settings);
      if (saved) {
        const raw = JSON.parse(saved);
        const parsed = migrateSettings(raw as AppSettings);
        setSettings(parsed);
        // Do not let migration turn an empty/partial record into configured defaults.
        const configured = hasExplicitGenerationModels(raw);
        setHasSavedSettings(configured);
        if (configured) localStorage.setItem(storyStorageKeys().settings, JSON.stringify(parsed));
      }
    } catch {
      setHasSavedSettings(false);
    } finally {
      setSettingsReady(true);
    }
  }, []);

  // 保存设置到 localStorage
  const saveSettings = useCallback((newSettings: AppSettings) => {
    const migrated = migrateSettings(newSettings);
    localStorage.setItem(storyStorageKeys().settings, JSON.stringify(migrated));
    setSettings(migrated);
    setHasSavedSettings(hasExplicitGenerationModels(migrated));
    setSettingsReady(true);
  }, []);

  // 重置为默认设置
  const resetSettings = useCallback(() => {
    localStorage.setItem(storyStorageKeys().settings, JSON.stringify(DEFAULT_SETTINGS));
    setSettings(DEFAULT_SETTINGS);
    setHasSavedSettings(true);
    setSettingsReady(true);
    console.log('Settings reset to defaults');
  }, []);

  return {
    settings,
    settingsReady,
    hasSavedSettings,
    saveSettings,
    resetSettings,
  };
}
