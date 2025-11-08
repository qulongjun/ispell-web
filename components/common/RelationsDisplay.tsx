/*
 * @Date: 2025-10-28 10:00:00
 * @LastEditTime: 2025-11-08 22:53:25
 * @Description: 单词关联词汇展示组件，支持展开/折叠显示近义词和相关词，按词性分组展示，适配明暗模式和响应式布局，单词切换时自动重置展开状态
 */
'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, ChevronUp, Link as LinkIcon } from 'lucide-react';
import { useSpelling } from '@/contexts/spelling.context';
import { Relations } from '@/types/word.types';

/**
 * 单词关联词汇展示组件属性类型
 */
interface RelationsDisplayProps {
  /** 单词的关联词汇信息（包含近义词和相关词） */
  relations: Relations | null | undefined;
  /** 自定义样式类名 */
  className?: string;
}

/**
 * 单词关联词汇展示组件
 * 以可折叠面板形式展示单词的近义词和相关词，按词性分组显示，包含词性、词汇和释义
 * 支持展开/折叠切换，单词切换时自动重置为折叠状态，适配明暗模式和响应式布局
 */
const RelationsDisplay: React.FC<RelationsDisplayProps> = ({
  relations,
  className = '',
}) => {
  // 国际化翻译：使用Words命名空间，可复用Definition中的词性翻译
  const t = useTranslations('Words');
  const { currentWord } = useSpelling(); // 获取当前单词，用于重置展开状态

  // 展开/折叠状态管理
  const [isExpanded, setIsExpanded] = useState(false);

  /**
   * 当当前单词变化时，重置展开状态为折叠
   */
  useEffect(() => {
    setIsExpanded(false);
  }, [currentWord?.text]);

  // 检查是否有可展示的近义词或相关词
  const hasSynonyms = relations?.synonyms && relations.synonyms.length > 0;
  const hasRelatedWords =
    relations?.relatedWords && relations.relatedWords.length > 0;

  // 无关联词汇时不渲染组件
  if (!hasSynonyms && !hasRelatedWords) {
    return null;
  }

  return (
    <div
      className={`w-full flex flex-col items-center text-xs sm:text-sm mt-4 ${className}`}
    >
      {/* 展开/折叠切换按钮 */}
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

      {/* 展开状态下的关联词汇内容 */}
      {isExpanded && (
        <div className="space-y-4 w-full max-w-prose text-gray-600 dark:text-gray-400">
          {/* 近义词展示区域 */}
          {hasSynonyms && (
            <div className="space-y-1.5">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 text-center mb-1">
                {t('Relations.synonymsTitle')}
              </h4>
              {relations.synonyms!.map((group, index) => (
                <div
                  key={`syn-${index}`}
                  className="flex items-start text-left"
                >
                  {/* 词性标签：复用Definition中的词性翻译，右对齐固定宽度 */}
                  <span
                    className="italic font-medium text-gray-700 dark:text-gray-300 text-right mr-2 flex-shrink-0"
                    style={{ minWidth: '2.5rem' }}
                  >
                    {t(`Definition.pos.${group.pos}`)}
                  </span>
                  {/* 近义词及释义 */}
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

          {/* 相关词展示区域 */}
          {hasRelatedWords && (
            <div className="space-y-1.5">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 text-center mb-1">
                {t('Relations.relatedWordsTitle')}
              </h4>
              {relations.relatedWords!.map((item, index) => (
                <div
                  key={`rel-${index}`}
                  className="flex items-start text-left"
                >
                  {/* 词性标签：复用Definition中的词性翻译，右对齐固定宽度 */}
                  <span
                    className="italic font-medium text-gray-700 dark:text-gray-300 text-right mr-2 flex-shrink-0"
                    style={{ minWidth: '2.5rem' }}
                  >
                    {t(`Definition.pos.${item.pos}`)}
                  </span>
                  {/* 相关词及释义 */}
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
