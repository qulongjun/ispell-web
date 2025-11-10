/*
 * @Date: 2025-10-27 18:20:11
 * @LastEditTime: 2025-11-10 19:06:19
 * @Description: 单词释义展示组件，适配新版 DefinitionsData 类型
 */
import React from 'react';
import { useTranslations } from 'next-intl';
import type { DefinitionsData, DefinitionItem } from '../../types/word.types';

/**
 * 单词释义展示组件属性类型
 */
interface DefinitionDisplayProps {
  /** 单词的释义对象 */
  definitions: DefinitionsData | null;
  /** 自定义样式类名 */
  className?: string;
  /** 展示模式：单行紧凑展示或多行清晰展示 */
  mode?: 'single-line' | 'multi-line';
}

/**
 * 单词释义展示组件
 * 根据指定模式展示单词的词性和释义，支持无释义时的空状态提示，适配明暗模式
 * - 单行模式：所有释义在同一行显示，词性斜体标注，释义间用分号分隔
 * - 多行模式：每个词性组单独成行，词性右对齐，提升可读性
 */
const DefinitionDisplay: React.FC<DefinitionDisplayProps> = ({
  definitions,
  className = '',
  mode = 'multi-line', // 默认多行模式，适合详细展示
}) => {
  const t = useTranslations('Words.DefinitionDisplay');

  // 增加兼容性检查，自动将旧的数组格式转换为新的对象格式
  let processedDefinitions: DefinitionsData = {};

  if (Array.isArray(definitions)) {
    // 警告：检测到旧的数组格式 (Definition[])，执行转换
    // console.warn('DefinitionDisplay: Detected old array format, transforming to object.');

    processedDefinitions = definitions.reduce((acc: DefinitionsData, item) => {
      // 'item' 结构是 { pos: string, translation: string, ... }
      const pos = item.pos;

      if (!pos || typeof pos !== 'string') {
        return acc; // 跳过无效数据
      }

      // 提取 'pos' 之外的字段 (如 translation, description 等)
      const { pos: _pos, ...rest } = item;

      if (!acc[pos]) {
        acc[pos] = [];
      }
      // 'rest' 对象 ({ translation: ... }) 符合 DefinitionItem 结构
      acc[pos].push(rest as DefinitionItem);
      return acc;
    }, {});
  } else if (
    definitions &&
    typeof definitions === 'object' &&
    !Array.isArray(definitions)
  ) {
    // 正常：检测到新的对象格式 (DefinitionsData)
    processedDefinitions = definitions as DefinitionsData;
  }

  // --- 渲染逻辑 ---

  // 处理无释义的空状态 (检查处理后的对象)
  if (Object.keys(processedDefinitions).length === 0) {
    return (
      <span
        className={`text-xs sm:text-base text-gray-400 dark:text-gray-500 italic ${className}`}
      >
        {t('noDefinition')}
      </span>
    );
  }

  // 获取释义条目 (使用处理后的数据)
  const definitionEntries = Object.entries(processedDefinitions);

  // 单行模式：紧凑展示所有释义
  if (mode === 'single-line') {
    return (
      <div
        className={`mt-1 text-xs sm:text-base text-gray-500 dark:text-gray-400 ${className}`}
      >
        {definitionEntries.map(([pos, items], index) => (
          <React.Fragment key={pos}>
            {/* 词性标注：斜体加粗，与释义区分 */}
            <span className="italic font-medium text-gray-600 dark:text-gray-300 mr-1">
              {pos}
            </span>
            {/* 释义内容：拼接同一词性下的所有释义，用全角分号分隔 */}
            <span className="mr-2">
              {items 
                .map((item) => item.translation.replaceAll(' ', ''))
                .join('；')}
              {/* 在不同词性之间添加全角逗号作为分隔符 */}
              {index < definitionEntries.length - 1 ? '， ' : ''}
            </span>
          </React.Fragment>
        ))}
      </div>
    );
  }

  // 多行模式：每个词性组单独成行，提升可读性
  return (
    <div
      className={`mt-1 text-xs sm:text-base text-gray-500 dark:text-gray-400 space-y-1 ${className}`}
    >
      {definitionEntries.map(([pos, items]) => (
        <div key={pos} className="flex items-start">
          {/* 词性标注：固定宽度右对齐，增强视觉结构 */}
          <span className="italic font-medium text-gray-600 dark:text-gray-300 text-right mr-2 shrink-0">
            {pos}
          </span>
          {/* 释义内容：拼接同一词性下的所有释义，用全角分号分隔 */}
          <span>
            {items
              .map((item) => item.translation.replaceAll(' ', ''))
              .join('；')}
          </span>
        </div>
      ))}
    </div>
  );
};

export default DefinitionDisplay;
