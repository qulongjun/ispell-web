/*
 * @Date: 2025-10-27 18:20:11
 * @LastEditTime: 2025-11-08 22:48:54
 * @Description: 单词释义展示组件，支持单行紧凑展示和多行清晰展示两种模式，适配明暗模式，可处理无释义的空状态
 */
import React from 'react';
import { useTranslations } from 'next-intl';
import type { Definition } from '../../types/word.types';

/**
 * 单词释义展示组件属性类型
 */
interface DefinitionDisplayProps {
  /** 单词的释义数组（可能为null/undefined/空数组） */
  definitions: Definition[] | null | undefined;
  /** 自定义样式类名 */
  className?: string;
  /** 展示模式：单行紧凑展示或多行清晰展示 */
  mode?: 'single-line' | 'multi-line';
}

/**
 * 单词释义展示组件
 * 根据指定模式展示单词的词性和释义，支持无释义时的空状态提示，适配明暗模式
 * - 单行模式：所有释义在同一行显示，词性斜体标注，释义间用分号分隔
 * - 多行模式：每个释义单独成行，词性右对齐，提升可读性
 */
const DefinitionDisplay: React.FC<DefinitionDisplayProps> = ({
  definitions,
  className = '',
  mode = 'multi-line', // 默认多行模式，适合详细展示
}) => {
  const t = useTranslations('Words.DefinitionDisplay');

  // 处理无释义的空状态
  if (!definitions || !Array.isArray(definitions) || definitions.length === 0) {
    return (
      <span
        className={`text-xs sm:text-base text-gray-400 dark:text-gray-500 italic ${className}`}
      >
        {t('noDefinition')}
      </span>
    );
  }

  // 单行模式：紧凑展示所有释义
  if (mode === 'single-line') {
    return (
      <div
        className={`mt-1 text-xs sm:text-base text-gray-500 dark:text-gray-400 ${className}`}
      >
        {definitions.map((definition, index) => (
          <React.Fragment key={`${definition.pos}-${index}`}>
            {/* 词性标注：斜体加粗，与释义区分 */}
            <span className="italic font-medium text-gray-600 dark:text-gray-300 mr-1">
              {definition.pos}.
            </span>
            {/* 释义内容：移除多余空格，最后一项不加分号 */}
            <span className="mr-2">
              {definition.translation.replaceAll(' ', '')}
              {index < definitions.length - 1 ? '; ' : ''}
            </span>
          </React.Fragment>
        ))}
      </div>
    );
  }

  // 多行模式：每个释义单独成行，提升可读性
  return (
    <div
      className={`mt-1 text-xs sm:text-base text-gray-500 dark:text-gray-400 space-y-1 ${className}`}
    >
      {definitions.map((definition, index) => (
        <div key={`${definition.pos}-${index}`} className="flex items-start">
          {/* 词性标注：固定宽度右对齐，增强视觉结构 */}
          <span className="italic font-medium text-gray-600 dark:text-gray-300 text-right mr-2 shrink-0">
            {definition.pos}.
          </span>
          {/* 释义内容：占据剩余空间，支持自动换行 */}
          <span>{definition.translation.replaceAll(' ', '')}</span>
        </div>
      ))}
    </div>
  );
};

export default DefinitionDisplay;
