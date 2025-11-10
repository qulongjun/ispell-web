/*
 * @Date: 2025-10-28 09:30:00
 * @LastEditTime: 2025-11-10 09:28:36
 * @Description: 单词例句展示组件，支持多例句切换、翻译显示/隐藏及单词隐藏模式（用下划线替换目标单词），包含平滑切换动画和分页指示器，适配响应式布局和明暗模式
 */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// 上下文与工具函数
import { useSpelling } from '@/contexts/spelling.context';
import { findWordIndices } from '@/utils/word.utils';
import { useSettings } from '@/contexts/setting.context';

/**
 * 例句数据结构类型
 */
interface Sentence {
  /** 中文翻译 */
  cn: string;
  /** 原始英文句子 */
  en: string;
  /** 包含高亮目标单词的英文句子（HTML格式） */
  en_highlighted: string;
  /** 发音音频URL（可选） */
  speechUrl?: string;
}

/**
 * 例句展示组件属性类型
 */
interface SentenceDisplayProps {
  /** 例句数组（可能为null/undefined/空数组） */
  sentences: Sentence[] | null | undefined;
  /** 自定义样式类名 */
  className?: string;
  /** 是否显示中文翻译 */
  showTranslation: boolean;
}

/**
 * 动画变体配置：定义例句切换时的进入、停留和退出动画
 */
const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 30 : -30, // 从右侧进入或左侧进入
    opacity: 0,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 30 : -30, // 向右侧退出或左侧退出
    opacity: 0,
  }),
};

/**
 * 例句渲染辅助组件
 * 根据模式渲染原始高亮例句或隐藏目标单词的例句（用下划线替换）
 */
const SentenceRenderer: React.FC<{
  sentence: Sentence;
  targetWord: string;
  isHiding: boolean;
}> = ({ sentence, targetWord, isHiding }) => {
  const sentenceText = sentence.en;

  // 缓存渲染内容，避免频繁计算
  const content = useMemo(() => {
    if (isHiding) {
      // 隐藏模式：定位目标单词位置并替换为下划线
      const indicesToHide = new Set(
        findWordIndices(targetWord, sentenceText, [])
      );
      return (
        <p className="text-gray-700 dark:text-gray-300 text-xs sm:text-base italic">
          {sentenceText
            .split('')
            .map((char, index) => (indicesToHide.has(index) ? '_' : char))}
        </p>
      );
    }

    // 默认模式：渲染带高亮的英文例句
    return (
      <p
        className="text-gray-700 dark:text-gray-300 text-xs sm:text-base italic"
        dangerouslySetInnerHTML={{ __html: sentence.en_highlighted }}
      />
    );
  }, [isHiding, targetWord, sentenceText, sentence.en_highlighted]);

  return content;
};

/**
 * 单词例句展示组件
 * 提供多例句轮播功能，支持切换、翻译显示控制和单词隐藏模式，通过动画提升切换体验
 */
const SentenceDisplay: React.FC<SentenceDisplayProps> = ({
  sentences,
  className = '',
  showTranslation,
}) => {
  const t = useTranslations('Words.Sentence');
  const { currentWord } = useSpelling(); // 从全局状态获取当前单词和隐藏设置
  const { hideWordInSentence } = useSettings();

  // 分页状态：[当前页码, 切换方向]
  const [[page, direction], setPage] = useState([0, 0]);

  /**
   * 当例句数组变化时，重置分页状态
   */
  useEffect(() => {
    setPage([0, 0]);
  }, [sentences]);

  // 无例句时不渲染组件
  if (!sentences || !Array.isArray(sentences) || sentences.length === 0) {
    return null;
  }

  // 计算当前例句索引（处理循环切换）
  const currentSentenceIndex =
    ((page % sentences.length) + sentences.length) % sentences.length;
  const currentSentence = sentences[currentSentenceIndex];

  /**
   * 切换例句
   * @param newDirection 切换方向：1为下一页，-1为上一页
   */
  const paginate = (newDirection: number) => {
    setPage([page + newDirection, newDirection]);
  };

  // 状态变量提取
  const isTranslationVisible = showTranslation;
  const isHidingWord = hideWordInSentence;
  const targetWord = currentWord?.text || '';

  return (
    <div
      className={`w-full max-w-lg mx-auto flex flex-col items-center mb-4 ${className}`}
    >
      <div className="relative w-full flex items-center justify-center min-h-[80px]">
        {/* 上一页按钮（仅当例句数量大于1时显示） */}
        {sentences.length > 1 && (
          <button
            onClick={() => paginate(-1)}
            className="absolute left-0 z-10 p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors rounded-full bg-gray-100 dark:bg-gray-800/50 hover:bg-gray-200 dark:hover:bg-gray-700"
            aria-label={t('aria.prevSentence')}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* 例句动画容器 */}
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={page}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.15 },
            }}
            className="w-full px-10"
          >
            <div className="text-center">
              {/* 英文例句渲染 */}
              <div className="flex items-center justify-center">
                <SentenceRenderer
                  sentence={currentSentence}
                  targetWord={targetWord}
                  isHiding={isHidingWord}
                />
              </div>

              {/* 中文翻译（带显示/隐藏动画） */}
              <AnimatePresence>
                {isTranslationVisible && (
                  <motion.p
                    className="text-gray-700 dark:text-gray-300 text-xs sm:text-base mt-2"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                  >
                    {currentSentence.cn}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* 下一页按钮（仅当例句数量大于1时显示） */}
        {sentences.length > 1 && (
          <button
            onClick={() => paginate(1)}
            className="absolute right-0 z-10 p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors rounded-full bg-gray-100 dark:bg-gray-800/50 hover:bg-gray-200 dark:hover:bg-gray-700"
            aria-label={t('aria.nextSentence')}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 分页指示器（仅当例句数量大于1时显示） */}
      {sentences.length > 1 && (
        <div className="flex justify-center space-x-1.5 mt-3">
          {sentences.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                const currentIndex =
                  ((page % sentences.length) + sentences.length) %
                  sentences.length;
                if (index === currentIndex) return;
                setPage([index, index > currentIndex ? 1 : -1]);
              }}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentSentenceIndex
                  ? 'bg-gray-800 dark:bg-gray-200'
                  : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-500'
              }`}
              aria-label={`Go to sentence ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SentenceDisplay;
