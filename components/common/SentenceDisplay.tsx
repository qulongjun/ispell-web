'use client';
/*
 * @Date: 2025-10-28 09:30:00
 * @LastEditTime: 2025-11-01 16:09:10
 * @Description: 例句显示组件 (带箭头按钮, 图标翻译, 精确高亮)
 */

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { useSpelling } from '@/contexts/spelling.context';

/**
 * 例句的数据结构
 */
interface Sentence {
  cn: string;
  en: string;
  en_highlighted: string;
  speechUrl?: string;
}

interface SentenceDisplayProps {
  sentences: Sentence[] | null | undefined;
  className?: string;
}

const SentenceDisplay: React.FC<SentenceDisplayProps> = ({
  sentences,
  className = '',
}) => {
  const t = useTranslations('Words.Sentence'); // 国际化命名空间
  const { currentWord } = useSpelling();

  const [isExpanded, setIsExpanded] = useState(false);
  const [visibleTranslations, setVisibleTranslations] = useState<Set<number>>(
    new Set()
  );

  useEffect(() => {
    setIsExpanded(false);
    setVisibleTranslations(new Set());
  }, [currentWord?.text]);

  if (!sentences || !Array.isArray(sentences) || sentences.length === 0) {
    return null;
  }

  const toggleTranslation = (index: number) => {
    setVisibleTranslations((currentSet) => {
      const newSet = new Set(currentSet);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  return (
    <div
      className={`w-full flex flex-col items-center text-xs sm:text-base mt-4 ${className}`}
    >
      {/* 切换按钮（国际化文本和aria标签） */}
      <button
        onClick={() => setIsExpanded((prev) => !prev)}
        className="flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors font-medium mb-3"
        aria-label={isExpanded ? t('aria.hide') : t('aria.show')} // 国际化无障碍标签
        aria-expanded={isExpanded}
      >
        <span>{isExpanded ? t('hide') : t('show')}</span> {/* 国际化按钮文本 */}
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 ml-1" />
        ) : (
          <ChevronDown className="w-4 h-4 ml-1" />
        )}
      </button>

      {isExpanded && (
        <div className="space-y-3">
          {sentences.map((sentence, index) => (
            <div key={index} className="text-center">
              <div className="flex items-center justify-center gap-x-1.5">
                <p
                  className="text-gray-700 dark:text-gray-200"
                  dangerouslySetInnerHTML={{
                    __html: sentence.en_highlighted,
                  }}
                />
                {/* 问号图标按钮（国际化aria标签） */}
                <button
                  onClick={() => toggleTranslation(index)}
                  className="p-0.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                  aria-label={t('aria.toggleTranslation')} // 国际化无障碍标签
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>

              {visibleTranslations.has(index) && (
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  {sentence.cn}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SentenceDisplay;
