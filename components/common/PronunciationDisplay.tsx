/*
 * @Date: 2025-10-27 18:51:58
 * @LastEditTime: 2026-02-16 20:26:31
 * @Description: 单词发音展示组件，默认显示设置中的音标类型，可点击切换图标切换另一种
 */
'use client';

import React, { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Volume1, ArrowLeftRight } from 'lucide-react';
import { Pronunciation } from '@/types/word.types';
import { useSettings } from '@/contexts/setting.context';

interface PronunciationDisplayProps {
  pronunciation: Pronunciation | null | undefined;
  onPlay: (type: 'uk' | 'us') => void;
  isPlaying: boolean;
  speechSupported: boolean;
  className?: string;
}

/**
 * 默认只显示设置中的音标类型，通过切换图标可切换到另一种（PC/移动端一致）
 */
const PronunciationDisplay: React.FC<PronunciationDisplayProps> = ({
  pronunciation,
  onPlay,
  isPlaying,
  speechSupported,
  className = '',
}) => {
  const t = useTranslations('Words.Pronunciation');
  const { speechConfig } = useSettings();
  const defaultAccent = speechConfig.accent;

  const ukPronunciation = pronunciation?.uk;
  const usPronunciation = pronunciation?.us;

  const hasBoth = !!(ukPronunciation && usPronunciation);
  const defaultShowing: 'uk' | 'us' = defaultAccent === 'en-GB' ? 'uk' : 'us';

  const [showing, setShowing] = useState<'uk' | 'us'>(defaultShowing);

  const current = useMemo(() => {
    if (showing === 'uk' && ukPronunciation) return { type: 'uk' as const, data: ukPronunciation };
    if (showing === 'us' && usPronunciation) return { type: 'us' as const, data: usPronunciation };
    return null;
  }, [showing, ukPronunciation, usPronunciation]);

  const isDisabled = !speechSupported || isPlaying;

  if (!ukPronunciation && !usPronunciation) return null;

  const handleSwitch = () => {
    setShowing((prev) => (prev === 'uk' ? 'us' : 'uk'));
  };

  return (
    <div
      className={`flex items-center justify-center flex-wrap gap-x-4 mb-4 ${className}`}
    >
      {current && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
            {current.type === 'uk' ? t('ukLabel') : t('usLabel')}
          </span>
          <p className="text-sm sm:text-base italic text-gray-700 dark:text-gray-200">
            {current.data.phonetic ?? ''}
          </p>
          <button
            onClick={() => onPlay(current.type)}
            className="p-1.5 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={current.type === 'uk' ? t('aria.playUk') : t('aria.playUs')}
            disabled={isDisabled}
          >
            <Volume1 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>
          {hasBoth && (
            <button
              type="button"
              onClick={handleSwitch}
              className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
              aria-label={showing === 'uk' ? t('aria.switchToUs') : t('aria.switchToUk')}
              title={showing === 'uk' ? t('aria.switchToUs') : t('aria.switchToUk')}
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {!speechSupported && (
        <span className="sr-only">{t('unsupportedHint')}</span>
      )}
    </div>
  );
};

export default PronunciationDisplay;
