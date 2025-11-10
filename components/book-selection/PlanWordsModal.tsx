/*
 * @Date: 2025-11-03 13:30:05
 * @LastEditTime: 2025-11-10 18:43:30
 * @Description: 学习计划单词列表模态框组件，按天展示计划中的单词，支持手风琴式展开/折叠每天的单词列表，包含加载状态、错误处理和空状态展示
 */
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';

// 服务与类型
import { getPlanWordsByDay, PlanDayWords } from '../../services/planService';
import { useAppContext } from '../../contexts/app.context';

// 子组件
import DefinitionDisplay from '../common/DefinitionDisplay';

/**
 * 计划单词列表模态框属性类型
 */
interface PlanWordsModalProps {
  /** 模态框是否打开 */
  isOpen: boolean;
  /** 学习计划ID（用于获取对应单词列表） */
  planId: number | undefined;
  /** 书籍名称（用于标题显示） */
  bookName: string | undefined;
  /** 关闭模态框的回调函数 */
  onClose: () => void;
}

/**
 * 学习计划单词列表模态框组件
 * 按天展示指定学习计划中的单词分配，支持手风琴式展开/折叠每天的单词详情
 * 包含完整的加载状态、错误处理和空状态展示，适配明暗模式和响应式布局
 */
const PlanWordsModal: React.FC<PlanWordsModalProps> = ({
  isOpen,
  planId,
  bookName,
  onClose,
}) => {
  const t = useTranslations('BookSelection.PlanWordsModal');
  const { accessToken } = useAppContext();

  // 状态管理
  const [isLoading, setIsLoading] = useState(false); // 数据加载状态
  const [error, setError] = useState<string | null>(null); // 错误信息
  const [planWords, setPlanWords] = useState<PlanDayWords[]>([]); // 按天划分的单词列表
  const [expandedDay, setExpandedDay] = useState<number | null>(null); // 当前展开的天数

  /**
   * 获取按天划分的计划单词列表
   * 当模态框打开、计划ID或访问令牌变化时触发，处理加载状态和错误捕获
   */
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
          console.error('获取计划单词列表失败:', err);
          setError(t('error'));
        } finally {
          setIsLoading(false);
        }
      };

      fetchWords();
    }
  }, [isOpen, planId, accessToken, t]);

  /**
   * 切换指定天数的展开/折叠状态
   * @param day 要切换的天数
   */
  const handleToggle = (day: number) => {
    setExpandedDay((prev) => (prev === day ? null : day));
  };

  // 手风琴动画变体配置
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
          {/* 背景遮罩：半透明黑色，点击关闭模态框 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            aria-hidden="true"
          />

          {/* 模态框主体：包含头部和内容区 */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed inset-0 m-auto w-11/12 md:w-2/3 lg:w-1/2 max-w-2xl h-[80vh] bg-white dark:bg-gray-800 rounded-lg shadow-2xl z-50 flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-labelledby="plan-words-modal-title"
          >
            {/* 头部：标题和关闭按钮 */}
            <div className="flex items-center justify-between p-4 shrink-0 border-b border-gray-200 dark:border-gray-700">
              <h2
                id="plan-words-modal-title"
                className="text-lg font-semibold text-gray-900 dark:text-white"
              >
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

            {/* 内容区：显示加载状态、错误信息或按天划分的单词列表 */}
            <div className="flex-1 p-4 overflow-y-auto">
              {/* 加载状态 */}
              {isLoading && (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
                  <span className="ml-2 text-gray-500">{t('loading')}</span>
                </div>
              )}

              {/* 错误状态 */}
              {error && (
                <div className="flex items-center justify-center h-full text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}

              {/* 单词列表（加载完成且无错误） */}
              {!isLoading && !error && (
                <div className="space-y-2">
                  {planWords.map((dayPlan) => {
                    const isExpanded = expandedDay === dayPlan.day;
                    return (
                      <div
                        key={dayPlan.day}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                      >
                        {/* 可点击的日期标题（手风琴标题） */}
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

                        {/* 可折叠的单词列表（手风琴内容） */}
                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.section
                              key="content"
                              initial="collapsed"
                              animate="open"
                              exit="collapsed"
                              className="overflow-hidden"
                            >
                              <ul className="divide-y divide-gray-200 dark:divide-gray-600 max-h-96 overflow-y-auto">
                                {dayPlan.words.map((word) => (
                                  <li
                                    key={word.id}
                                    className="flex justify-between items-start p-3"
                                  >
                                    <span className="font-medium text-gray-900 dark:text-gray-100 pt-1">
                                      {word.word}
                                    </span>
                                    <DefinitionDisplay
                                      definitions={
                                        word.definitions
                                      }
                                      mode="single-line"
                                      className="text-sm text-right max-w-[70%]"
                                    />
                                  </li>
                                ))}
                              </ul>
                            </motion.section>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}

                  {/* 空状态：计划无单词时显示 */}
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
