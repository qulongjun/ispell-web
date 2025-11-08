/*
 * @Date: 2025-10-27 18:51:58
 * @LastEditTime: 2025-11-08 22:52:04
 * @Description: 单词发音展示组件，支持显示英式和美式发音音标，提供发音播放功能，适配用户默认口音设置，处理语音支持状态并提供无障碍提示
 */
'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Volume1 } from 'lucide-react';
import { Pronunciation } from '@/types/word.types';
import { useSpelling } from '@/contexts/spelling.context';

/**
 * 发音展示组件属性类型
 */
interface PronunciationDisplayProps {
  /** 单词的发音信息（包含英式和美式发音） */
  pronunciation: Pronunciation | null | undefined;
  /** 播放发音的回调函数（参数为发音类型：'uk' 或 'us'） */
  onPlay: (type: 'uk' | 'us') => void;
  /** 是否正在播放发音（用于禁用播放按钮） */
  isPlaying: boolean;
  /** 浏览器是否支持语音播放功能 */
  speechSupported: boolean;
  /** 自定义样式类名 */
  className?: string;
}

/**
 * 单词发音展示组件
 * 显示单词的英式和美式发音音标，提供播放按钮，根据用户默认口音高亮对应发音
 * 处理语音不支持的情况，提供无障碍提示，适配明暗模式和响应式布局
 */
const PronunciationDisplay: React.FC<PronunciationDisplayProps> = ({
  pronunciation,
  onPlay,
  isPlaying,
  speechSupported,
  className = '',
}) => {
  const t = useTranslations('Words.Pronunciation');
  const { speechConfig } = useSpelling();
  const defaultAccent = speechConfig.accent; // 用户默认口音设置

  // 提取英式和美式发音信息
  const ukPronunciation = pronunciation?.uk;
  const usPronunciation = pronunciation?.us;

  // 判断默认口音类型
  const isUkDefault = defaultAccent === 'en-GB';
  const isUsDefault = defaultAccent === 'en-US';

  // 无发音信息时不渲染
  if (!ukPronunciation && !usPronunciation) {
    return null;
  }

  // 播放按钮禁用状态（不支持语音或正在播放时禁用）
  const isDisabled = !speechSupported || isPlaying;

  // 样式类：高亮（默认口音）和普通状态
  const highlightClass = 'text-gray-700 dark:text-gray-200 font-medium';
  const defaultClass = 'text-gray-500 dark:text-gray-400';

  return (
    <div
      className={`flex items-center justify-center space-x-4 mb-4 ${className}`}
    >
      {/* 英式发音展示 */}
      {ukPronunciation && (
        <div className="flex items-center space-x-1">
          {/* 英式发音标签 */}
          <span
            className={`text-xs font-medium ${
              isUkDefault ? highlightClass : defaultClass
            }`}
          >
            {t('ukLabel')}
          </span>
          {/* 英式音标 */}
          <p
            className={`text-sm sm:text-base italic ${
              isUkDefault ? highlightClass : defaultClass
            }`}
          >
            {ukPronunciation.phonetic ? `/${ukPronunciation.phonetic}/` : ''}
          </p>
          {/* 英式发音播放按钮 */}
          <button
            onClick={() => onPlay('uk')}
            className={`p-1.5 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 ${
              isDisabled
                ? 'opacity-50 cursor-not-allowed'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            aria-label={t('aria.playUk')}
            disabled={isDisabled}
          >
            <Volume1 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>
        </div>
      )}

      {/* 美式发音展示 */}
      {usPronunciation && (
        <div className="flex items-center space-x-1">
          {/* 美式发音标签 */}
          <span
            className={`text-xs font-medium ${
              isUsDefault ? highlightClass : defaultClass
            }`}
          >
            {t('usLabel')}
          </span>
          {/* 美式音标 */}
          <p
            className={`text-sm sm:text-base italic ${
              isUsDefault ? highlightClass : defaultClass
            }`}
          >
            {usPronunciation.phonetic ? `/${usPronunciation.phonetic}/` : ''}
          </p>
          {/* 美式发音播放按钮 */}
          <button
            onClick={() => onPlay('us')}
            className={`p-1.5 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 ${
              isDisabled
                ? 'opacity-50 cursor-not-allowed'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            aria-label={t('aria.playUs')}
            disabled={isDisabled}
          >
            <Volume1 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>
        </div>
      )}

      {/* 语音不支持时的无障碍提示（仅屏幕阅读器可见） */}
      {!speechSupported && (
        <span className="sr-only">{t('unsupportedHint')}</span>
      )}
    </div>
  );
};

export default PronunciationDisplay;
