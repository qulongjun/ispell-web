/*
 * @Date: 2025-10-26 10:03:34
 * @LastEditTime: 2026-02-16 20:26:31
 * @Description: 单词学习统计卡片，计时区支持悬停显示暂停/继续/重新计时
 */
'use client';

import { useTranslations } from 'next-intl';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { useSpelling } from '@/contexts/spelling.context';

export default function StatsCard() {
  const t = useTranslations('Words');
  const {
    stats,
    words,
    isTimerPaused,
    pauseTimer,
    resumeTimer,
    resetTimer,
  } = useSpelling();
  const { time, inputCount, correctCount, accuracy } = stats;

  const remainingWords = Math.max(0, words.length - correctCount);

  return (
    <div id="spelling-guide-stats" className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-xl shadow-lg p-2 sm:p-6 transform transition-all duration-300 hover:shadow-xl mb-4 sm:mb-6">
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-1 sm:gap-4">
        {/* 1. 计时：悬停显示 暂停/继续、重新计时 */}
        <div className="text-center p-1 sm:p-2 relative group">
          <p className="text-lg sm:text-2xl font-semibold text-gray-900 dark:text-white mb-0.5 sm:mb-1">
            {time}
          </p>
          <p className="text-[11px] sm:text-sm text-gray-500 dark:text-gray-400">
            {t('statsCard.timing')}
          </p>
          <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-lg bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
            {!isTimerPaused ? (
              <button
                type="button"
                onClick={pauseTimer}
                className="p-1.5 text-gray-700 dark:text-gray-200 rounded-full hover:bg-gray-200/80 dark:hover:bg-gray-600/80 transition-colors"
                aria-label={t('statsCard.pause')}
              >
                <Pause className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={resumeTimer}
                className="p-1.5 text-gray-700 dark:text-gray-200 rounded-full hover:bg-gray-200/80 dark:hover:bg-gray-600/80 transition-colors"
                aria-label={t('statsCard.resume')}
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
            <button
              type="button"
              onClick={resetTimer}
              className="p-1.5 text-gray-700 dark:text-gray-200 rounded-full hover:bg-gray-200/80 dark:hover:bg-gray-600/80 transition-colors"
              aria-label={t('statsCard.reset')}
            >
              <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* 2. 尝试次数 */}
        <div className="hidden sm:block text-center p-1 sm:p-2">
          <p className="text-lg sm:text-2xl font-semibold text-gray-900 dark:text-white mb-0.5 sm:mb-1">
            {inputCount}
          </p>
          <p className="text-[11px] sm:text-sm text-gray-500 dark:text-gray-400">
            {t('statsCard.attempts')}
          </p>
        </div>

        {/* 3. 正确拼写 */}
        <div className="hidden sm:block text-center p-1 sm:p-2">
          <p className="text-lg sm:text-2xl font-semibold text-gray-900 dark:text-white mb-0.5 sm:mb-1">
            {correctCount}
          </p>
          <p className="text-[11px] sm:text-sm text-gray-500 dark:text-gray-400">
            {t('statsCard.correctSpelling')}
          </p>
        </div>

        {/* 4. 剩余单词 */}
        <div className="text-center p-1 sm:p-2">
          <p className="text-lg sm:text-2xl font-semibold text-gray-900 dark:text-white mb-0.5 sm:mb-1">
            {remainingWords}
          </p>
          <p className="text-[11px] sm:text-sm text-gray-500 dark:text-gray-400">
            {t('statsCard.remainingWords')}
          </p>
        </div>

        {/* 5. 正确率 */}
        <div className="text-center p-1 sm:p-2">
          <p className="text-lg sm:text-2xl font-semibold text-green-500 dark:text-green-400 mb-0.5 sm:mb-1">
            {accuracy}%
          </p>
          <p className="text-[11px] sm:text-sm text-gray-500 dark:text-gray-400">
            {t('statsCard.accuracy')}
          </p>
        </div>
      </div>
    </div>
  );
}
