'use client';
/*
 * @Date: 2025-10-27 18:51:58
 * @LastEditTime: 2025-11-01 16:05:53
 * @Description: 单词发音展示组件（支持国际化）
 */
import React from 'react';
import { useTranslations } from 'next-intl';
import { Volume1 } from 'lucide-react';
import { Pronunciation } from '@/types/word.types';
import { useSpelling } from '@/contexts/spelling.context';

interface PronunciationDisplayProps {
  pronunciation: Pronunciation | null | undefined;
  onPlay: (type: 'uk' | 'us') => void;
  isPlaying: boolean;
  speechSupported: boolean;
  className?: string;
}

const PronunciationDisplay: React.FC<PronunciationDisplayProps> = ({
  pronunciation,
  onPlay,
  isPlaying,
  speechSupported,
  className = '',
}) => {
  const t = useTranslations('Words.Pronunciation'); // 国际化命名空间
  const { speechConfig } = useSpelling();
  const defaultAccent = speechConfig.accent;

  const ukPronunciation = pronunciation?.uk;
  const usPronunciation = pronunciation?.us;

  const isUkDefault = defaultAccent === 'en-GB';
  const isUsDefault = defaultAccent === 'en-US';

  if (!ukPronunciation && !usPronunciation) {
    return null;
  }

  const isDisabled = !speechSupported || isPlaying;

  const highlightClass = 'text-gray-700 dark:text-gray-200 font-medium';
  const defaultClass = 'text-gray-500 dark:text-gray-400';

  return (
    <div
      className={`flex items-center justify-center space-x-4 mb-4 ${className}`}
    >
      {/* UK 发音部分 */}
      {ukPronunciation && (
        <div className="flex items-center space-x-1">
          {/* 国际化：英式发音标签（原"英"） */}
          <span
            className={`text-xs font-medium ${
              isUkDefault ? highlightClass : defaultClass
            }`}
          >
            {t('ukLabel')}
          </span>
          <p
            className={`text-sm sm:text-base italic ${
              isUkDefault ? highlightClass : defaultClass
            }`}
          >
            {ukPronunciation.phonetic ? `/${ukPronunciation.phonetic}/` : ''}
          </p>
          <button
            onClick={() => onPlay('uk')}
            className={`p-1.5 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 ${
              isDisabled
                ? 'opacity-50 cursor-not-allowed'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            aria-label={t('aria.playUk')} // 国际化：播放英式发音
            disabled={isDisabled}
          >
            <Volume1 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>
        </div>
      )}

      {/* US 发音部分 */}
      {usPronunciation && (
        <div className="flex items-center space-x-1">
          {/* 国际化：美式发音标签（原"美"） */}
          <span
            className={`text-xs font-medium ${
              isUsDefault ? highlightClass : defaultClass
            }`}
          >
            {t('usLabel')}
          </span>
          <p
            className={`text-sm sm:text-base italic ${
              isUsDefault ? highlightClass : defaultClass
            }`}
          >
            {usPronunciation.phonetic ? `/${usPronunciation.phonetic}/` : ''}
          </p>
          <button
            onClick={() => onPlay('us')}
            className={`p-1.5 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 ${
              isDisabled
                ? 'opacity-50 cursor-not-allowed'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            aria-label={t('aria.playUs')} // 国际化：播放美式发音
            disabled={isDisabled}
          >
            <Volume1 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>
        </div>
      )}

      {/* 国际化：浏览器不支持语音的提示（仅屏幕阅读器可见） */}
      {!speechSupported && (
        <span className="sr-only">{t('unsupportedHint')}</span>
      )}
    </div>
  );
};

export default PronunciationDisplay;
