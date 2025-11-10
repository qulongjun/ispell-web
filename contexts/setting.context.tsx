/*
 * @Date: 2025-11-09
 * @Description: 用户设置上下文，负责在应用加载时获取用户设置，并提供刷新功能
 */
'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { useAppContext } from '@/contexts/app.context';
import { apiFetchSettings } from '@/services/settingService';
import { SpeechConfig, DisplayMode } from '@/types/setting.types';
import toast from 'react-hot-toast';

/**
 * 语音配置的默认值
 */
const defaultSpeechConfig: SpeechConfig = {
  lang: 'en-GB',
  rate: 0.8,
  volume: 1,
  pitch: 1,
  accent: 'en-GB',
  gender: 'auto',
};

/**
 * 整个设置的默认状态
 */
const defaultSettings = {
  speechConfig: defaultSpeechConfig,
  isCustomSpeech: false,
  displayMode: 'hideRandom' as DisplayMode,
  hideWordInSentence: true,
  showSentences: false,
  showSentenceTranslation: true,
};

/**
 * 设置上下文暴露的类型
 */
export interface SettingsContextType {
  // 状态 (只读 - 这是从服务器获取的“已保存”状态)
  speechConfig: SpeechConfig;
  isCustomSpeech: boolean;
  displayMode: DisplayMode;
  hideWordInSentence: boolean;
  showSentences: boolean;
  showSentenceTranslation: boolean;
  
  // 加载状态
  isLoadingSettings: boolean;

  // 操作
  refreshSettings: () => Promise<void>; // 重新从服务器获取设置
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

/**
 * 设置上下文提供者
 */
export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const { isLoggedIn } = useAppContext();

  // 跟踪设置是否已从后端加载
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  // 设置状态 - 从默认值初始化
  const [speechConfig, setSpeechConfig] = useState(
    defaultSettings.speechConfig
  );
  const [isCustomSpeech, setIsCustomSpeech] = useState(
    defaultSettings.isCustomSpeech
  );
  const [displayMode, setDisplayMode] = useState(defaultSettings.displayMode);
  const [hideWordInSentence, setHideWordInSentence] = useState(
    defaultSettings.hideWordInSentence
  );
  const [showSentences, setShowSentences] = useState(
    defaultSettings.showSentences
  );
  const [showSentenceTranslation, setShowSentenceTranslation] = useState(
    defaultSettings.showSentenceTranslation
  );

  /**
   * 将所有本地设置状态重置为默认值
   */
  const resetSettingsToDefault = () => {
    setSpeechConfig(defaultSettings.speechConfig);
    setIsCustomSpeech(defaultSettings.isCustomSpeech);
    setDisplayMode(defaultSettings.displayMode);
    setHideWordInSentence(defaultSettings.hideWordInSentence);
    setShowSentences(defaultSettings.showSentences);
    setShowSentenceTranslation(defaultSettings.showSentenceTranslation);
  };

  /**
   * 从 API 加载设置的函数
   */
  const loadSettings = useCallback(async () => {
    if (isLoggedIn) {
      try {
        setIsLoadingSettings(true);
        console.log('[Setting Context] 登录用户，正在从 API 加载设置...');
        const settings = await apiFetchSettings();

        // 应用从后端获取的设置
        setSpeechConfig(settings.speechConfig);
        setIsCustomSpeech(settings.isCustomSpeech);
        setDisplayMode(settings.displayMode);
        setHideWordInSentence(settings.hideWordInSentence);
        setShowSentences(settings.showSentences);
        setShowSentenceTranslation(settings.showSentenceTranslation);
      } catch (error) {
        console.error('[Setting Context] 从 API 加载设置失败:', error);
        toast.error('加载用户设置失败，使用默认设置');
        resetSettingsToDefault(); // 加载失败时回退到默认值
      } finally {
        setIsLoadingSettings(false);
      }
    } else {
      // 未登录，使用默认设置
      console.log('[Setting Context] 未登录用户，使用默认设置。');
      resetSettingsToDefault();
      setIsLoadingSettings(false);
    }
  }, [isLoggedIn]); // 依赖 isLoggedIn

  // 效果1: 当登录状态变化时，加载或重置设置
  useEffect(() => {
    loadSettings();
  }, [isLoggedIn, loadSettings]);

  // -------------------------------------------------
  // 刷新功能 (供子组件在保存后调用)
  // -------------------------------------------------
  const refreshSettings = async () => {
    console.log('[Setting Context] 正在刷新设置...');
    await loadSettings();
  };

  // 上下文暴露的值
  const contextValue: SettingsContextType = {
    speechConfig,
    isCustomSpeech,
    displayMode,
    hideWordInSentence,
    showSentences,
    showSentenceTranslation,
    isLoadingSettings,
    refreshSettings,
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

/**
 * 自定义Hook：获取设置上下文
 */
export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings 必须在 SettingsProvider 内部使用');
  }
  return context;
};