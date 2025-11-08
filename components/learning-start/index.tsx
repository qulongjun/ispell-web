/*
 * @Date: 2025-11-06 05:00:00
 * @LastEditTime: 2025-11-07 23:51:35
 * @Description: 学习启动组件 (V6, 从 JSON 加载演示模式)
 */
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Play, BookOpen, Rocket, CheckCircle2, Wand } from 'lucide-react'; // [!! 修改 !!] 引入 Wand
import { useTranslations } from 'next-intl';
import { useAppContext } from '@/contexts/app.context';
import toast from 'react-hot-toast';
import { LearningPlan } from '@/types/book.types';
import { advancePlan } from '@/services/planService';

import DEMO_WORDS from '@/mocks/word.json';

const LearningStart: React.FC = () => {
  const { isLoggedIn } = useAppContext();
  const t = useTranslations('LearningStart');
  const t_err = useTranslations('Errors');

  const {
    setIsBookDrawerOpen,
    currentBookId,
    learningList,
    startLearningSession,
    startMistakeReview, // [!!] 获取函数
  } = useAppContext();

  const currentPlan: LearningPlan | undefined = learningList.find(
    (plan) => plan.listCode === currentBookId
  );
  const currentBook = currentPlan?.book;
  const progress = currentPlan?.progress;

  const [isLoading, setIsLoading] = useState(false);

  // [!!] 演示模式处理器
  const handleStartDemo = () => {
    // [!! 关键 !!] 我们使用 planId: 0 作为 "演示模式" 的信号
    // SpellingContext 将会捕获这个信号
    startMistakeReview(0, DEMO_WORDS);
  };

  // 无激活书籍场景 (已修改按钮)
  if (!currentBook || !progress) {
    return (
      <div className="w-full max-w-md flex flex-col items-center p-6 sm:p-8 sm:pt-0 pt-0 text-center">
        <div
          className="w-32 h-32 sm:w-48 sm:h-48 mb-6 relative"
          aria-hidden="true"
        >
          <Image
            src="/images/illustrations/question.svg"
            alt={t('alt.selectBookIllustration')}
            width={48}
            height={48}
            className="block dark:hidden w-full h-full object-contain"
            priority={false}
          />
          <Image
            src="/images/illustrations/question-dark.svg"
            alt={t('alt.selectBookIllustration')}
            width={48}
            height={48}
            className="hidden dark:block w-full h-full object-contain"
            priority={false}
          />
        </div>

        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-3">
          {t('title')}
        </h2>
        <p className="text-base text-gray-600 dark:text-gray-400 mb-6">
          {t(isLoggedIn ? 'noActiveBookDescription': 'noActiveBookDescription2')}
        </p>

        {/* [!! 核心修改 !!] 演示 + 书架 按钮组 */}
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full max-w-xl mt-0 justify-center">
          {!isLoggedIn && (
            <button
              onClick={handleStartDemo} // [!!]
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm hover:bg-gray-700 dark:text-gray-900 dark:bg-white dark:hover:bg-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <Wand className="w-4 h-4 mr-2 -ml-1" />
              {t('testNow')}
            </button>
          )}

          <button
            onClick={() => setIsBookDrawerOpen(true)}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-800 bg-gray-200 rounded-lg shadow-sm hover:bg-gray-300 dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            <BookOpen className="w-4 h-4 mr-2 -ml-1" />
            {t('browseBookshelfBtn')}
          </button>
        </div>
      </div>
    );
  }

  // --- 激活书籍后的逻辑 (完全保留原样) ---

  // 进度计算逻辑
  const totalNewTask = progress.dueNewCount || 0;
  const completedNew = progress.learnedTodayCount || 0;
  const dueReviewCount = progress.dueReviewCount || 0;
  const completedReview = progress.reviewedTodayCount || 0;
  const totalReviewTask = dueReviewCount + completedReview;
  const isReviewHidden =
    currentPlan.plan.reviewStrategy === 'NONE' || totalReviewTask === 0;
  const totalTodayTask = isReviewHidden
    ? totalNewTask
    : totalNewTask + totalReviewTask;
  const completedTodayTask = isReviewHidden
    ? completedNew
    : completedNew + completedReview;
  const currentChapterNum = progress.currentChapter || 1;
  const totalChaptersNum = progress.totalChapters || 0;
  const isTodayComplete =
    (totalNewTask > 0 || totalReviewTask > 0) &&
    completedNew >= totalNewTask &&
    dueReviewCount === 0;
  const isBookComplete =
    isTodayComplete &&
    totalChaptersNum > 0 &&
    currentChapterNum >= totalChaptersNum;

  // 推进章节方法
  const handleAdvanceChapter = async () => {
    if (!currentPlan || isLoading) return;
    setIsLoading(true);
    try {
      await advancePlan(currentPlan.planId);
      toast.success(t('openNewChapterSuccess'));
      startLearningSession();
    } catch (error: unknown) {
      toast.error((error as Error).message || t_err('unknownError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md flex flex-col items-center p-6 sm:p-8 sm:pt-0 pt-0 text-center">
      {/* 书籍插图 */}
      <div
        className="w-32 h-32 sm:w-48 sm:h-48 mb-6 relative"
        aria-hidden="true"
      >
        <Image
          src="/images/illustrations/target.svg"
          alt={t('alt.bookIllustration')}
          width={48}
          height={48}
          className="block dark:hidden w-full h-full object-contain"
          priority={false}
        />
        <Image
          src="/images/illustrations/target-dark.svg"
          alt={t('alt.bookIllustration')}
          width={48}
          height={48}
          className="hidden dark:block w-full h-full object-contain"
          priority={false}
        />
      </div>

      {/* 书籍名称 */}
      {!isBookComplete && (
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-6">
          {currentBook.name}
        </h2>
      )}

      {/* [!! 核心优化区域 !!] */}
      {isBookComplete ? (
        // [!! 优化后的样式 V6 !!]
        <div className="w-full max-w-xl mx-auto flex flex-col items-center space-y-3 my-6 px-2">
          {/* 1. 图标 + 标题 */}
          <div className="flex items-center justify-center gap-2">
            <CheckCircle2
              className="w-6 h-6 text-green-600 dark:text-green-500"
              strokeWidth={2.5}
              aria-hidden="true"
            />
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {t('congratsBookCompleteTitle')}
            </h3>
          </div>

          {/* 2. 描述文案 */}
          <p className="text-base text-gray-600 dark:text-gray-400">
            {t('congratsBookCompleteDesc', { bookName: currentBook.name })}
          </p>

          {/* 3. 按钮 */}
          <button
            onClick={() => setIsBookDrawerOpen(true)}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm hover:bg-gray-700 dark:text-gray-900 dark:bg-white dark:hover:bg-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 mt-5"
          >
            <BookOpen className="w-4 h-4 mr-2 -ml-1" />
            {t('browseBookshelfBtn')}
          </button>
        </div>
      ) : (
        // 未完成章节的显示
        <div className="w-full max-w-xl mx-auto space-y-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            {t('chapterProgress', {
              current: progress.currentChapter || 1,
              total: progress.totalChapters || 0,
            })}
          </p>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <div className="font-medium text-gray-900 dark:text-white">
                {t('todayProgressTitle')}
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                {isReviewHidden
                  ? t('todayTaskOnlyNew', {
                      completed: completedNew,
                      total: totalNewTask,
                    })
                  : t('todayTaskWithReview', {
                      completedNew,
                      totalNew: totalNewTask,
                      completedReview,
                      totalReview: totalReviewTask,
                    })}
              </div>
            </div>

            <div className="w-full h-2.5 border border-gray-300 dark:border-gray-600 rounded-full overflow-hidden">
              <div
                className="h-full bg-gray-600 dark:bg-gray-400 rounded-full transition-all duration-800 ease-out"
                style={{
                  width: `${
                    totalTodayTask > 0
                      ? Math.round((completedTodayTask / totalTodayTask) * 100)
                      : 0
                  }%`,
                }}
              ></div>
            </div>

            <div className="text-right text-sm font-medium text-gray-700 dark:text-gray-300">
              {totalTodayTask > 0
                ? `${Math.round((completedTodayTask / totalTodayTask) * 100)}%`
                : '0%'}
            </div>
          </div>
        </div>
      )}

      {/* 未完成章节的操作按钮 */}
      {!isBookComplete && (
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full max-w-xl mt-8 justify-center">
          {isTodayComplete ? (
            <button
              onClick={handleAdvanceChapter}
              disabled={isLoading}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm hover:bg-gray-700 dark:text-gray-900 dark:bg-white dark:hover:bg-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
            >
              <Rocket className="w-4 h-4 mr-2 -ml-1" />
              {isLoading ? t('openingChapter') : t('openNextChapterBtn')}
            </button>
          ) : (
            <button
              onClick={startLearningSession}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm hover:bg-gray-700 dark:text-gray-900 dark:bg-white dark:hover:bg-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <Play className="w-4 h-4 mr-2 -ml-1" />
              {t('startLearningBtn')}
            </button>
          )}

          <button
            onClick={() => setIsBookDrawerOpen(true)}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-800 bg-gray-200 rounded-lg shadow-sm hover:bg-gray-300 dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            <BookOpen className="w-4 h-4 mr-2 -ml-1" />
            {t('openBookshelfBtn')}
          </button>
        </div>
      )}
    </div>
  );
};

export default LearningStart;
