'use client';
/*
 * @Date: 2025-10-28 10:00:00
 * @LastEditTime: 2025-11-01 16:14:02
 * @Description: 词语关系显示组件 (可展开/收起，支持国际化)
 */

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, ChevronUp, Link as LinkIcon } from 'lucide-react';
import { useSpelling } from '@/contexts/spelling.context';
import { Relations } from '@/types/word.types';

interface RelationsDisplayProps {
  relations: Relations | null | undefined;
  className?: string;
}

const RelationsDisplay: React.FC<RelationsDisplayProps> = ({
  relations,
  className = '',
}) => {
  // 命名空间设为 Words，方便跨子节点访问 Definition 的词性翻译
  const t = useTranslations('Words');
  const { currentWord } = useSpelling();

  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setIsExpanded(false);
  }, [currentWord?.text]);

  const hasSynonyms = relations?.synonyms && relations.synonyms.length > 0;
  const hasRelatedWords =
    relations?.relatedWords && relations.relatedWords.length > 0;

  if (!hasSynonyms && !hasRelatedWords) {
    return null;
  }

  return (
    <div
      className={`w-full flex flex-col items-center text-xs sm:text-sm mt-4 ${className}`}
    >
      {/* 切换按钮（国际化文本和aria标签） */}
      <button
        onClick={() => setIsExpanded((prev) => !prev)}
        className="flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors font-medium mb-3 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-2 py-1"
        aria-label={
          isExpanded ? t('Relations.aria.hide') : t('Relations.aria.show')
        }
        aria-expanded={isExpanded}
      >
        <LinkIcon className="w-3.5 h-3.5 mr-1.5 shrink-0" />
        <span>{t('Relations.title')}</span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 ml-1 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 ml-1 shrink-0" />
        )}
      </button>

      {isExpanded && (
        <div className="space-y-4 w-full max-w-prose text-gray-600 dark:text-gray-400">
          {/* 近义词部分（国际化标题和词性） */}
          {hasSynonyms && (
            <div className="space-y-1.5">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 text-center mb-1">
                {t('Relations.synonymsTitle')} {/* 国际化：近义词 */}
              </h4>
              {relations.synonyms!.map((group, index) => (
                <div
                  key={`syn-${index}`}
                  className="flex items-start text-left"
                >
                  <span
                    className="italic font-medium text-gray-700 dark:text-gray-300 text-right mr-2 flex-shrink-0"
                    style={{ minWidth: '2.5rem' }}
                  >
                    {/* 复用 Definition 中的词性翻译，避免重复配置 */}
                    {t(`Definition.pos.${group.pos}`)}
                  </span>
                  <div className="flex-grow">
                    <span className="text-gray-800 dark:text-gray-100">
                      {group.words.join(', ')}
                    </span>
                    <span className="ml-2 text-gray-500 dark:text-gray-400">
                      ({group.translation})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 相关词部分（国际化标题和词性） */}
          {hasRelatedWords && (
            <div className="space-y-1.5">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 text-center mb-1">
                {t('Relations.relatedWordsTitle')} {/* 国际化：相关词 */}
              </h4>
              {relations.relatedWords!.map((item, index) => (
                <div
                  key={`rel-${index}`}
                  className="flex items-start text-left"
                >
                  <span
                    className="italic font-medium text-gray-700 dark:text-gray-300 text-right mr-2 flex-shrink-0"
                    style={{ minWidth: '2.5rem' }}
                  >
                    {/* 复用 Definition 中的词性翻译 */}
                    {t(`Definition.pos.${item.pos}`)}
                  </span>
                  <div className="flex-grow">
                    <span className="text-gray-800 dark:text-gray-100">
                      {item.word}
                    </span>
                    <span className="ml-2 text-gray-500 dark:text-gray-400">
                      ({item.translation})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RelationsDisplay;
