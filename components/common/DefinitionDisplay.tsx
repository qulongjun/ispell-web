/*
 * @Date: 2025-10-27 18:20:11
 * @LastEditTime: 2025-11-03 14:03:58
 * @Description: 单词释义展示组件 (已国际化)
 */
import React from 'react';
import { useTranslations } from 'next-intl';
import type { Definition } from '../../types/word.types';

interface DefinitionDisplayProps {
  definitions: Definition[] | null | undefined;
  className?: string;
  mode?: 'single-line' | 'multi-line';
}

const DefinitionDisplay: React.FC<DefinitionDisplayProps> = ({
  definitions,
  className = '',
  mode = 'multi-line', // 默认为多行模式
}) => {
  const t = useTranslations('Words.DefinitionDisplay');

  if (!definitions || !Array.isArray(definitions) || definitions.length === 0) {
    return (
      <span
        className={`text-xs sm:text-base text-gray-400 dark:text-gray-500 italic ${className}`}
      >
        {t('noDefinition')}
      </span>
    );
  }

  // 单行展示模式
  if (mode === 'single-line') {
    return (
      <div
        className={`mt-1 text-xs sm:text-base text-gray-500 dark:text-gray-400 ${className}`}
      >
        {definitions.map((definition, index) => (
          <React.Fragment key={`${definition.pos}-${index}`}>
            {/* 词性: 斜体, 右边距 */}
            <span className="italic font-medium text-gray-600 dark:text-gray-300 mr-1">
              {definition.pos}.
            </span>
            {/* 释义: 并在末尾添加分号 (最后一个除外) */}
            <span className="mr-2">
              {definition.translation.replaceAll(' ', '')}
              {index < definitions.length - 1 ? '; ' : ''}
            </span>
          </React.Fragment>
        ))}
      </div>
    );
  }

  // 多行展示模式 (默认)
  return (
    <div
      // 基础样式 + 传入的 className + 垂直间距
      className={`mt-1 text-xs sm:text-base text-gray-500 dark:text-gray-400 space-y-1 ${className}`}
    >
      {definitions.map((definition, index) => (
        // 每个定义项使用 div 实现换行，内部使用 flex 布局
        <div key={`${definition.pos}-${index}`} className="flex items-start">
          {/* 词性: 斜体, 固定宽度, 右对齐, 右边距 */}
          <span className="italic font-medium text-gray-600 dark:text-gray-300 text-right mr-2 shrink-0">
            {definition.pos}.
          </span>
          {/* 释义: 占据剩余空间，可自动换行 */}
          <span className="">{definition.translation.replaceAll(' ', '')}</span>
        </div>
      ))}
    </div>
  );
};

export default DefinitionDisplay;
