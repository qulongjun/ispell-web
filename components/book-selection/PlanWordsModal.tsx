'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, ChevronDown } from 'lucide-react'; // 导入 ChevronDown 图标
import { useTranslations } from 'next-intl';
// 确保你已经从 services 中导出了这些
import { getPlanWordsByDay, PlanDayWords } from '../../services/planService'; // <-- 修复：使用相对路径
import { useAppContext } from '../../contexts/app.context'; // <-- 修复：使用相对路径

// --- 修复 ---
// 1. 导入你提供的 DefinitionDisplay 组件
import DefinitionDisplay from '../common/DefinitionDisplay';
// 2. 导入 Definition 类型 (假设的路径)
import type { Definition } from '../../types/word.types';
// --- 修复结束 ---

interface PlanWordsModalProps {
  isOpen: boolean;
  planId: number | undefined;
  bookName: string | undefined;
  onClose: () => void;
}

const PlanWordsModal: React.FC<PlanWordsModalProps> = ({
  isOpen,
  planId,
  bookName,
  onClose,
}) => {
  const t = useTranslations('BookSelection.PlanWordsModal');
  const { accessToken } = useAppContext(); // 用于验证服务调用
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planWords, setPlanWords] = useState<PlanDayWords[]>([]);

  // 用于跟踪当前展开的是哪一天
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && planId && accessToken) {
      const fetchWords = async () => {
        setIsLoading(true);
        setError(null);
        setPlanWords([]);
        setExpandedDay(null); // 重置展开状态
        try {
          const data = await getPlanWordsByDay(planId);
          setPlanWords(data);
        } catch (err) {
          setError(t('error'));
        }
        setIsLoading(false);
      };
      fetchWords();
    }
  }, [isOpen, planId, accessToken, t]);

  // 切换手风琴项
  const handleToggle = (day: number) => {
    setExpandedDay((prev) => (prev === day ? null : day));
  };

  // f-motion 的动画变体
  const accordionVariants = {
    open: {
      opacity: 1,
      height: 'auto',
      transition: { duration: 0.3, ease: 'easeInOut' },
    },
    collapsed: {
      opacity: 0,
      height: 0,
      transition: { duration: 0.3, ease: 'easeInOut' },
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            aria-hidden="true"
          />
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed inset-0 m-auto w-11/12 md:w-2/3 lg:w-1/2 max-w-2xl h-[80vh] bg-white dark:bg-gray-800 rounded-lg shadow-2xl z-50 flex flex-col"
            role="dialog"
            aria-modal="true"
          >
            {/* 头部 (不变) */}
            <div className="flex items-center justify-between p-4 shrink-0 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('title', { bookName: bookName || '...' })}
              </h2>
              <button
                onClick={onClose}
                className="p-1 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label={t('close')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 内容区 (已修改为手风琴样式) */}
            <div className="flex-1 p-4 overflow-y-auto">
              {isLoading && (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
                  <span className="ml-2 text-gray-500">{t('loading')}</span>
                </div>
              )}
              {error && (
                <div className="flex items-center justify-center h-full text-red-600">
                  {error}
                </div>
              )}
              {!isLoading && !error && (
                <div className="space-y-2">
                  {planWords.map((dayPlan) => {
                    const isExpanded = expandedDay === dayPlan.day;
                    return (
                      <div
                        key={dayPlan.day}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden" // 关键: overflow-hidden
                      >
                        {/* 1. 可点击的日期标题 */}
                        <button
                          onClick={() => handleToggle(dayPlan.day)}
                          className="w-full flex justify-between items-center p-3 text-left bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                          aria-expanded={isExpanded}
                        >
                          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                            {t('dayHeader', { day: dayPlan.day })} (
                            {t('wordCount', { count: dayPlan.words.length })})
                          </h3>
                          <ChevronDown
                            className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </button>

                        {/* 2. 可折叠的单词列表 */}
                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.section
                              key="content"
                              initial="collapsed"
                              animate="open"
                              exit="collapsed"
                              className="overflow-hidden"
                            >
                              <ul className="divide-y divide-gray-200 dark:divide-gray-600 max-h-60 overflow-y-auto">
                                {dayPlan.words.map((word) => (
                                  <li
                                    key={word.id}
                                    className="flex justify-between items-start p-3" // items-start 保证对齐
                                  >
                                    <span className="font-medium text-gray-900 dark:text-gray-100 pt-1">
                                      {word.word}
                                    </span>
                                    {/* --- 修复 --- */}
                                    {/* 3. 使用 DefinitionDisplay 组件 */}
                                    <DefinitionDisplay
                                      definitions={
                                        word.definitions as Definition[]
                                      }
                                      mode="single-line"
                                      className="text-sm text-right max-w-[70%]" // 限制最大宽度并右对齐
                                    />
                                    {/* --- 修复结束 --- */}
                                  </li>
                                ))}
                              </ul>
                            </motion.section>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}

                  {/* 计划为空时的提示 */}
                  {planWords.length === 0 && (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-10">
                      {t('empty')}
                    </p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PlanWordsModal;
