/*
 * @Date: 2025-10-30 10:25:00
 * @LastEditTime: 2025-11-03 14:20:58
 * @Description: 学习计划列表组件
 * 功能：展示用户已添加的学习计划，支持激活、调整、重置、取消学习等操作
 */

import React, { RefObject } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl'; // 1. 恢复真实的 import
import {
  MoreHorizontal,
  RotateCcw,
  Trash2,
  ListTree,
  SlidersHorizontal,
} from 'lucide-react';
import type { Book, LearningPlan, PlanDetails } from '@/types/book.types';
import PlanSetupView from './PlanSetupView'; // 1. 恢复真实的 import

interface LearningViewProps {
  learningList: LearningPlan[];
  currentBookId: string | null;
  previewBook: Book | null;
  openMenu: number | null;
  menuRef: RefObject<HTMLDivElement | null>;
  getPlanDescription: (book: Book, plan: PlanDetails) => string;
  reviewStrategyNames: { [key: string]: string };
  handleActivateLearning: (planId: number, listCode: string) => void;
  handleAdjustPlanClick: (book: Book) => void;
  setOpenMenu: (id: number | null) => void;
  openResetModal: (planId: number, bookName: string) => void;
  openCancelModal: (planId: number, bookName: string) => void;
  setPreviewBook: (book: Book | null) => void;
  handleUpdatePlan: (planId: number, book: Book, plan: PlanDetails) => void;
  handleViewPlanWords: (planId: number, bookName: string) => void;
}

const LearningView: React.FC<LearningViewProps> = ({
  learningList,
  currentBookId,
  previewBook,
  openMenu,
  menuRef,
  getPlanDescription,
  reviewStrategyNames,
  handleActivateLearning,
  handleAdjustPlanClick,
  setOpenMenu,
  openResetModal,
  openCancelModal,
  setPreviewBook,
  handleUpdatePlan,
  handleViewPlanWords,
}) => {
  const t = useTranslations('BookSelection'); // 1. 恢复真实的 hook

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
          learningList.map((learningItem) => {
            const { planId, listCode, book, series, plan } = learningItem;
            const isPreviewingThis = previewBook?.listCode === listCode;
            const isActuallyCurrent = currentBookId === listCode;

            const learningOrderText =
              plan.learningOrder === 'SEQUENTIAL'
                ? t('LearningView.learningOrder.sequential')
                : t('LearningView.learningOrder.random');

            return (
              <div key={planId}>
                <div
                  onClick={() => handleActivateLearning(planId, listCode)}
                  className={`relative p-4 rounded-lg border-2 cursor-pointer ${
                    isActuallyCurrent
                      ? 'border-gray-900 dark:border-gray-100'
                      : 'border-gray-200 dark:border-gray-700'
                  } bg-white dark:bg-gray-800`}
                >
                  {/* --- 3. 修改为带文字的 "芯片" 按钮 --- */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // 阻止触发卡片点击
                      handleViewPlanWords(planId, book.name);
                    }}
                    className="absolute top-3 right-3 flex items-center space-x-1.5 rounded-full bg-gray-100 dark:bg-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    aria-label={t('LearningView.buttons.viewPlanWords')}
                  >
                    <ListTree className="w-4 h-4" />
                    <span>{t('LearningView.buttons.viewPlanWords')}</span>
                  </button>
                  {/* --- 修改结束 --- */}

                  {isActuallyCurrent && (
                    <div className="text-xs font-semibold text-gray-900 dark:text-white mb-2">
                      {t('LearningView.currentActive')}
                    </div>
                  )}
                  {/* 标题（为按钮腾出空间） */}
                  <h5 className="font-semibold text-gray-900 dark:text-white pr-24">
                    {book.name}
                  </h5>
                  <p className="text-xs mt-0.5 text-gray-500 dark:text-gray-400">
                    {series.description}
                    {book.description && ` / ${book.description}`}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                    {getPlanDescription(book, plan)}
                  </p>
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

                  {/* --- 按钮布局 (已移除 "查看单词列表" 按钮) --- */}
                  <div className="mt-4 flex space-x-3">
                    {/* 按钮 1: 激活 (始终可见) */}
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
                        : t('LearningView.buttons.setAsCurrent')}{' '}
                    </button>

                    {/* 按钮 2: 调整计划 (中屏 md: 及以上可见) - 恢复灰色 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAdjustPlanClick(book);
                      }}
                      className="hidden md:flex flex-1 py-2 px-4 rounded-lg bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-medium flex items-center justify-center"
                    >
                      {t('LearningView.buttons.adjustPlan')}{' '}
                    </button>

                    {/* 按钮 3: 更多 (始终可见) */}
                    <div className="relative shrink-0" ref={menuRef}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenu(openMenu === planId ? null : planId);
                        }}
                        className="py-2 px-3 rounded-lg bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                        aria-haspopup="true"
                        aria-expanded={openMenu === planId}
                      >
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                      <AnimatePresence>
                        {openMenu === planId && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="absolute right-0 top-full mt-2 w-48 z-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700"
                          >
                            <ul className="p-1">
                              {/* 调整计划 (仅在 中屏 md: 以下在菜单中显示) */}
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
                                  </span>{' '}
                                </button>
                              </li>

                              {/* 重置进度 (始终在菜单中) */}
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
                                  </span>{' '}
                                </button>
                              </li>

                              {/* 取消学习 (始终在菜单中) */}
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
                                  </span>{' '}
                                </button>
                              </li>
                            </ul>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
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
                      <PlanSetupView // 1. 恢复真实的 import
                        book={previewBook}
                        initialPlan={plan}
                        onStart={(updatedPlan) =>
                          handleUpdatePlan(planId, book, updatedPlan)
                        }
                        onCancel={() => setPreviewBook(null)}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-10">
            {t('LearningView.noLearningBooks')}{' '}
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default LearningView;
