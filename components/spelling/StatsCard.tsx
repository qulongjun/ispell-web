'use client';
/*
 * @Date: 2025-10-26 10:03:34
 * @LastEditTime: 2025-11-01 15:49:49
 * @Description: 单词学习统计卡片组件（支持国际化）
 */
import { useTranslations } from 'next-intl';
import { useSpelling } from '@/contexts/spelling.context';

export default function StatsCard() {
  const t = useTranslations('Words'); // 关联到Words命名空间
  const { stats } = useSpelling();
  const { time, inputCount, correctCount, masteredCount, accuracy } = stats;

  return (
    <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-xl shadow-lg p-3 sm:p-6 transform transition-all duration-300 hover:shadow-xl mb-6">
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-4">
        <div className="text-center p-1 sm:p-2">
          <p className="text-lg sm:text-2xl font-semibold text-gray-900 dark:text-white mb-0.5 sm:mb-1">
            {time}
          </p>
          <p className="text-[11px] sm:text-sm text-gray-500 dark:text-gray-400">
            {t('statsCard.timing')} {/* 国际化：计时 */}
          </p>
        </div>
        <div className="text-center p-1 sm:p-2">
          <p className="text-lg sm:text-2xl font-semibold text-gray-900 dark:text-white mb-0.5 sm:mb-1">
            {inputCount}
          </p>
          <p className="text-[11px] sm:text-sm text-gray-500 dark:text-gray-400">
            {t('statsCard.attempts')} {/* 国际化：尝试次数 */}
          </p>
        </div>
        <div className="text-center p-1 sm:p-2">
          <p className="text-lg sm:text-2xl font-semibold text-gray-900 dark:text-white mb-0.5 sm:mb-1">
            {correctCount}
          </p>
          <p className="text-[11px] sm:text-sm text-gray-500 dark:text-gray-400">
            {t('statsCard.correctSpelling')} {/* 国际化：正确拼写 */}
          </p>
        </div>
        <div className="text-center p-1 sm:p-2">
          <p className="text-lg sm:text-2xl font-semibold text-gray-900 dark:text-white mb-0.5 sm:mb-1">
            {masteredCount}
          </p>
          <p className="text-[11px] sm:text-sm text-gray-500 dark:text-gray-400">
            {t('statsCard.mastered')} {/* 国际化：已掌握 */}
          </p>
        </div>
        <div className="text-center p-1 sm:p-2">
          <p className="text-lg sm:text-2xl font-semibold text-green-500 dark:text-green-400 mb-0.5 sm:mb-1">
            {accuracy}%
          </p>
          <p className="text-[11px] sm:text-sm text-gray-500 dark:text-gray-400">
            {t('statsCard.accuracy')} {/* 国际化：正确率 */}
          </p>
        </div>
      </div>
    </div>
  );
}
