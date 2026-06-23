'use client';

import { useState, useCallback, useEffect } from 'react';
import { AppSettings } from '@/types';

const DEFAULT_SETTINGS: AppSettings = {
  apiProvider: 'apimart',
  apiKey: process.env.NEXT_PUBLIC_APIMART_API_KEY || '',
  scriptModel: 'gpt-4o',
  imageModel: 'doubao-seedream-5-0-lite',
  videoModel: 'doubao-seedance-1-5-pro',
  aspectRatio: '16:9', // 默认横屏
};

const LEGACY_VIDEO_MODEL_MAP: Record<string, string> = {
  'grok-imagine-1.0-video-apimart': 'grok-imagine-1.5-video-apimart',
};

function migrateSettings(settings: AppSettings): AppSettings {
  const migratedVideoModel = LEGACY_VIDEO_MODEL_MAP[settings.videoModel] || settings.videoModel;
  return {
    ...settings,
    videoModel: migratedVideoModel,
  };
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  // 从 localStorage 加载设置
  useEffect(() => {
    const saved = localStorage.getItem('appSettings');
    if (saved) {
      try {
        const parsed = migrateSettings(JSON.parse(saved) as AppSettings);
        setSettings(parsed);
        localStorage.setItem('appSettings', JSON.stringify(parsed));
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
  }, []);

  // 保存设置到 localStorage
  const saveSettings = useCallback((newSettings: AppSettings) => {
    const migrated = migrateSettings(newSettings);
    setSettings(migrated);
    localStorage.setItem('appSettings', JSON.stringify(migrated));
    console.log('Settings saved:', migrated);
  }, []);

  // 重置为默认设置
  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.setItem('appSettings', JSON.stringify(DEFAULT_SETTINGS));
    console.log('Settings reset to defaults');
  }, []);

  return {
    settings,
    saveSettings,
    resetSettings,
  };
}
