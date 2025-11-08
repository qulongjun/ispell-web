/*
 * @Date: 2025-10-30 10:25:00
 * @LastEditTime: 2025-11-08 22:38:40
 * @Description: 学习计划视图组件
 */
'use client';

import React, { RefObject } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import {
  MoreHorizontal,
  RotateCcw,
  Trash2,
  ListTree,
  SlidersHorizontal,
  ArchiveX,
} from 'lucide-react';

// 类型定义
import type { LearningPlan } from '@/types/book.types';

// 子组件
import PlanSetupView from './PlanSetupView';

/**
 * 学习计划视图组件属性类型
 */
interface LearningViewProps {
  /** 用户的所有进行中学习计划列表 */
  learningList: LearningPlan[];
  /** 当前激活的书籍ID */
  currentBookId: string | null;
  /** 当前预览的书籍（用于展开计划调整面板） */
  previewBook: LearningPlan['book'] | null;
  /** 当前打开的操作菜单ID */
  openMenu: number | null;
  /** 操作菜单的DOM引用（用于点击外部关闭菜单） */
  menuRef: RefObject<HTMLDivElement | null>;
  /** 复习策略名称映射（国际化后的文本） */
  reviewStrategyNames: { [key: string]: string };
  /** 激活指定学习计划的回调 */
  handleActivateLearning: (planId: number, listCode: string) => void;
  /** 调整指定学习计划的回调（打开计划设置面板） */
  handleAdjustPlanClick: (book: LearningPlan['book']) => void;
  /** 控制操作菜单显示/隐藏的回调 */
  setOpenMenu: (id: number | null) => void;
  /** 打开重置计划进度确认弹窗的回调 */
  openResetModal: (planId: number, bookName: string) => void;
  /** 打开取消学习计划确认弹窗的回调 */
  openCancelModal: (planId: number, bookName: string) => void;
  /** 更新预览书籍状态的回调 */
  setPreviewBook: (book: LearningPlan['book'] | null) => void;
  /** 更新学习计划的回调 */
  handleUpdatePlan: (
    planId: number,
    book: LearningPlan['book'],
    plan: LearningPlan['plan']
  ) => void;
  /** 查看计划单词列表的回调（可选） */
  handleViewPlanWords?: (planId: number, bookName: string) => void;
  /** 查看计划错题集的回调（可选） */
  handleViewMistakes?: (planId: number, bookName: string) => void;
}

/**
 * 学习计划视图组件
 * 集中展示用户的学习计划，提供计划管理的全流程操作，包含进度可视化和响应式交互
 */
const LearningView: React.FC<LearningViewProps> = ({
  learningList,
  currentBookId,
  previewBook,
  openMenu,
  menuRef,
  reviewStrategyNames,
  handleActivateLearning,
  handleAdjustPlanClick,
  setOpenMenu,
  openResetModal,
  openCancelModal,
  setPreviewBook,
  handleUpdatePlan,
  handleViewPlanWords,
  handleViewMistakes,
}) => {
  const t = useTranslations('BookSelection'); // 国际化翻译

  return (
    <motion.div
      key="learning"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="flex-1 flex flex-col overflow-y-auto"
    >
      <div className="p-4 space-y-3">
        {learningList.length > 0 ? (
          // 遍历渲染每个学习计划
          learningList.map((learningItem) => {
            const { planId, listCode, book, series, plan, progress } =
              learningItem;
            // 判断当前计划是否处于预览状态
            const isPreviewingThis = previewBook?.listCode === listCode;
            // 判断当前计划是否为激活状态
            const isActuallyCurrent = currentBookId === listCode;
            // 判断计划是否已完成（已学单词数 >= 总单词数）
            const isCompleted = progress.learnedCount >= progress.totalWords;
            // 计算每日应学单词数（总单词数 ÷ 总章节数，向上取整）
            const wordsPerDay =
              progress.totalChapters > 0
                ? Math.ceil(progress.totalWords / progress.totalChapters)
                : 0;
            // 学习顺序文本（国际化）
            const learningOrderText =
              plan.learningOrder === 'SEQUENTIAL'
                ? t('LearningView.learningOrder.sequential')
                : t('LearningView.learningOrder.random');

            return (
              <div key={planId}>
                {/* 学习计划卡片 */}
                <div
                  onClick={() => handleActivateLearning(planId, listCode)}
                  className={`relative p-4 rounded-lg border-2 cursor-pointer ${
                    isActuallyCurrent
                      ? 'border-gray-900 dark:border-gray-100'
                      : 'border-gray-200 dark:border-gray-700'
                  } bg-white dark:bg-gray-800`}
                >
                  {/* 计划操作快捷按钮组 */}
                  <div className="absolute top-3 right-3 flex space-x-2">
                    {/* 查看计划单词按钮 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // 阻止事件冒泡到卡片
                        handleViewPlanWords?.(planId, book.name);
                      }}
                      className="flex items-center space-x-1.5 rounded-full bg-gray-100 dark:bg-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      aria-label={t('LearningView.buttons.viewPlanWords')}
                    >
                      <ListTree className="w-4 h-4" />
                      <span>{t('LearningView.buttons.viewPlanWords')}</span>
                    </button>

                    {/* 查看错题集按钮 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewMistakes?.(planId, book.name);
                      }}
                      className="flex items-center space-x-1.5 rounded-full bg-red-100 dark:bg-red-900/50 px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/80 transition-colors"
                      aria-label={t('LearningView.buttons.viewMistakes')}
                    >
                      <ArchiveX className="w-4 h-4" />
                      <span>{t('LearningView.buttons.viewMistakes')}</span>
                    </button>
                  </div>

                  {/* 当前激活计划标记 */}
                  {isActuallyCurrent && (
                    <div className="text-xs font-semibold text-gray-900 dark:text-white mb-2">
                      {t('LearningView.currentActive')}
                    </div>
                  )}

                  {/* 计划标题与描述 */}
                  <h5 className="font-semibold text-gray-900 dark:text-white pr-40">
                    {book.name}
                  </h5>
                  <p className="text-xs mt-0.5 text-gray-500 dark:text-gray-400">
                    {series.description}
                    {book.description && ` / ${book.description}`}
                  </p>

                  {/* 计划进度显示 */}
                  <p className="text-sm mt-2">
                    {isCompleted ? (
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {t('LearningView.planProgress.completed')}
                      </span>
                    ) : (
                      <span className="text-gray-900 dark:text-gray-100 font-medium">
                        {t('LearningView.planProgress.detailed', {
                          current: progress.currentChapter,
                          total: progress.totalChapters,
                          wordsPerDay: wordsPerDay,
                        })}
                      </span>
                    )}
                  </p>

                  {/* 计划基础配置信息 */}
                  <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>
                      {t('LearningView.learningOrder.label')}:{' '}
                      {learningOrderText}
                    </span>
                    <span>
                      {t('LearningView.reviewStrategy.label')}:{' '}
                      {reviewStrategyNames[plan.reviewStrategy] ||
                        plan.reviewStrategy}
                    </span>
                  </div>

                  {/* 计划操作按钮组 */}
                  <div className="mt-4 flex space-x-3">
                    {/* 设为当前计划按钮 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleActivateLearning(planId, listCode);
                      }}
                      disabled={isActuallyCurrent}
                      className="flex-1 py-2 px-4 rounded-lg bg-gray-900 text-white dark:bg-gray-200 dark:text-gray-900 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {isActuallyCurrent
                        ? t('LearningView.buttons.active')
                        : t('LearningView.buttons.setAsCurrent')}
                    </button>

                    {/* 调整计划按钮（桌面端显示） */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAdjustPlanClick(book);
                      }}
                      className="hidden md:flex flex-1 py-2 px-4 rounded-lg bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-medium flex items-center justify-center"
                    >
                      {t('LearningView.buttons.adjustPlan')}
                    </button>

                    {/* 更多操作菜单 */}
                    <div className="relative shrink-0" ref={menuRef}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // 切换菜单显示/隐藏
                          setOpenMenu(openMenu === planId ? null : planId);
                        }}
                        className="py-2 px-3 rounded-lg bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                        aria-haspopup="true"
                        aria-expanded={openMenu === planId}
                      >
                        <MoreHorizontal className="w-5 h-5" />
                      </button>

                      {/* 更多操作下拉菜单（带动画） */}
                      <AnimatePresence>
                        {openMenu === planId && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="absolute right-0 top-full mt-2 w-48 z-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700"
                          >
                            <ul className="p-1">
                              {/* 调整计划（移动端显示） */}
                              <li className="md:hidden">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAdjustPlanClick(book);
                                  }}
                                  className="w-full text-left flex items-center space-x-2 px-3 py-2 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  <SlidersHorizontal className="w-4 h-4" />
                                  <span>
                                    {t('LearningView.buttons.adjustPlan')}
                                  </span>
                                </button>
                              </li>

                              {/* 重置学习进度 */}
                              <li>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openResetModal(planId, book.name);
                                  }}
                                  className="w-full text-left flex items-center space-x-2 px-3 py-2 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                  <span>
                                    {t('LearningView.buttons.resetProgress')}
                                  </span>
                                </button>
                              </li>

                              {/* 取消学习计划 */}
                              <li>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openCancelModal(planId, book.name);
                                  }}
                                  className="w-full text-left flex items-center space-x-2 px-3 py-2 rounded text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  <span>
                                    {t('LearningView.buttons.cancelLearning')}
                                  </span>
                                </button>
                              </li>
                            </ul>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* 计划调整面板（预览状态时展开） */}
                <AnimatePresence>
                  {isPreviewingThis && previewBook && (
                    <motion.div
                      key="plan-setup-inline-learning"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{
                        type: 'spring',
                        damping: 25,
                        stiffness: 180,
                      }}
                      className="overflow-hidden"
                    >
                      <div className="pt-3">
                        <PlanSetupView
                          book={previewBook}
                          initialPlan={plan}
                          onStart={(updatedPlan) =>
                            handleUpdatePlan(planId, book, updatedPlan)
                          }
                          onCancel={() => setPreviewBook(null)}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        ) : (
          // 空状态：用户暂无学习计划
          <div className="flex flex-col items-center justify-center text-center py-10 px-4">
            {/* 空状态插图（适配明暗模式） */}
            <div
              className="w-40 h-40 sm:w-48 sm:h-48 mb-6 relative"
              aria-hidden="true"
            >
              <Image
                src="/images/illustrations/power.svg"
                alt={t('LearningView.empty.alt')}
                width={192}
                height={192}
                className="block dark:hidden w-full h-full object-contain"
                priority={false}
              />
              <Image
                src="/images/illustrations/power-dark.svg"
                alt={t('LearningView.empty.alt')}
                width={192}
                height={192}
                className="hidden dark:block w-full h-full object-contain"
                priority={false}
              />
            </div>

            {/* 空状态文本 */}
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
              {t('LearningView.empty.title')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xl">
              {t('LearningView.noLearningBooks')}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default LearningView;
