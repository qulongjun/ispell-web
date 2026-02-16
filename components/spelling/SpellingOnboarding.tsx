/*
 * @Description: 拼写界面首次进入的新人引导（多步骤）
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';

const STORAGE_KEY = 'ispell_spelling_onboarding_done';

const TARGET_IDS = [
  'spelling-guide-word',
  'spelling-guide-nav',
  'spelling-guide-stats',
  'spelling-guide-wordlist',
] as const;

export function useSpellingOnboarding() {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    try {
      const done = localStorage.getItem(STORAGE_KEY);
      setShouldShow(done !== 'true');
    } catch {
      setShouldShow(true);
    }
  }, []);

  const finish = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // ignore
    }
    setShouldShow(false);
  }, []);

  return { shouldShow, finish };
}

export default function SpellingOnboarding() {
  const t = useTranslations('SpellingOnboarding');
  const { shouldShow, finish } = useSpellingOnboarding();
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const updateRect = useCallback(() => {
    const id = TARGET_IDS[step];
    const el = typeof document !== 'undefined' ? document.getElementById(id) : null;
    setTargetRect(el ? el.getBoundingClientRect() : null);
  }, [step]);

  useEffect(() => {
    if (!shouldShow) return;
    updateRect();
    const t1 = requestAnimationFrame(updateRect);
    const t2 = setTimeout(updateRect, 100);
    const ro =
      typeof window !== 'undefined' &&
      new ResizeObserver(() => {
        updateRect();
      });
    const targetEl = document.getElementById(TARGET_IDS[step]);
    if (ro && targetEl) ro.observe(targetEl);
    return () => {
      cancelAnimationFrame(t1);
      clearTimeout(t2);
      ro && targetEl && ro.disconnect();
    };
  }, [shouldShow, step, updateRect]);

  if (!shouldShow) return null;

  const isLast = step === TARGET_IDS.length - 1;
  const titleKey = `step${step + 1}Title` as const;
  const descKey = `step${step + 1}Desc` as const;

  const handleNext = () => {
    if (isLast) finish();
    else setStep((s) => s + 1);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
      aria-labelledby="onboarding-title"
    >
      {/* 半透明遮罩，点击不关闭，仅突出下方内容 */}
      <div className="absolute inset-0 bg-black/40" />

      {/* 高亮框：在目标元素位置画一个描边框 */}
      {targetRect && (
        <div
          className="absolute rounded-xl ring-4 ring-white/90 dark:ring-gray-600 shadow-lg pointer-events-none transition-all duration-200"
          style={{
            left: targetRect.left - 8,
            top: targetRect.top - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          }}
        />
      )}

      {/* 说明卡片：固定在底部或目标下方，避免遮挡 */}
      <div
        id="onboarding-title"
        className="relative z-10 mx-4 max-w-md rounded-2xl bg-white dark:bg-gray-800 shadow-xl p-5 sm:p-6 border border-gray-200 dark:border-gray-700"
      >
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
          {t('stepIndicator', {
            current: step + 1,
            total: TARGET_IDS.length,
          })}
        </p>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {t(titleKey)}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-5">
          {t(descKey)}
        </p>
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={finish}
            className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            {t('skip')}
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-lg hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            {isLast ? t('done') : t('next')}
          </button>
        </div>
      </div>
    </div>
  );
}
