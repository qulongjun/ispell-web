/*
 * @Date: 2025-11-06 05:00:00
 * @LastEditTime: 2025-11-08 23:05:30
 * @Description: 学习启动页组件，展示当前选中书籍的学习进度
 */
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Play, BookOpen, Rocket, CheckCircle2, Wand } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAppContext } from '@/contexts/app.context';
import toast from 'react-hot-toast';
import { LearningPlan } from '@/types/book.types';
import { Word } from '@/types/word.types';
import { advancePlan } from '@/services/planService';

import DEMO_WORDS from '@/mocks/word.json';

/**
 * 学习启动页组件
 * 核心功能：
 * - 未选择书籍时：引导用户选择书籍或体验演示模式（未登录用户）
 * - 已选择书籍时：展示书籍进度（当前章节、今日任务完成情况）
 * - 书籍完成时：显示祝贺信息并引导选择新书籍
 * - 提供开始学习、切换书籍、推进章节等操作入口
 */
const LearningStart: React.FC = () => {
  // 国际化翻译
  const t = useTranslations('LearningStart');
  const t_err = useTranslations('Errors');

  // 从全局状态获取必要数据和方法
  const {
    isLoggedIn,
    setIsBookDrawerOpen,
    currentBookId,
    learningList,
    startLearningSession,
    startMistakeReview,
  } = useAppContext();

  // 当前选中的学习计划和书籍信息
  const currentPlan: LearningPlan | undefined = learningList.find(
    (plan) => plan.listCode === currentBookId
  );
  const currentBook = currentPlan?.book;
  const progress = currentPlan?.progress;

  // 加载状态管理（用于章节推进操作）
  const [isLoading, setIsLoading] = useState(false);

  /**
   * 启动演示模式（未登录用户）
   * 使用模拟单词数据开启学习会话
   */
  const handleStartDemo = () => {
    startMistakeReview(0, DEMO_WORDS as Word[]);
  };

  // 未选择书籍或无进度信息时的展示
  if (!currentBook || !progress) {
    return (
      <div className="w-full max-w-md flex flex-col items-center p-6 sm:p-8 sm:pt-0 pt-0 text-center">
        {/* 插图（明暗模式适配） */}
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

        {/* 标题与描述 */}
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-3">
          {t('title')}
        </h2>
        <p className="text-base text-gray-600 dark:text-gray-400 mb-6">
          {t(
            isLoggedIn ? 'noActiveBookDescription' : 'noActiveBookDescription2'
          )}
        </p>

        {/* 操作按钮组 */}
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full max-w-xl mt-0 justify-center">
          {!isLoggedIn && (
            <button
              onClick={handleStartDemo}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm hover:bg-gray-700 dark:text-gray-900 dark:bg-white dark:hover:bg-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              aria-label={t('testNow')}
            >
              <Wand className="w-4 h-4 mr-2 -ml-1" aria-hidden="true" />
              {t('testNow')}
            </button>
          )}

          <button
            onClick={() => setIsBookDrawerOpen(true)}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-800 bg-gray-200 rounded-lg shadow-sm hover:bg-gray-300 dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            aria-label={t('browseBookshelfBtn')}
          >
            <BookOpen className="w-4 h-4 mr-2 -ml-1" aria-hidden="true" />
            {t('browseBookshelfBtn')}
          </button>
        </div>
      </div>
    );
  }

  // 书籍进度计算逻辑
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

  // 任务完成状态判断
  const isTodayComplete =
    (totalNewTask > 0 || totalReviewTask > 0) &&
    completedNew >= totalNewTask &&
    dueReviewCount === 0;
  const isBookComplete =
    isTodayComplete &&
    totalChaptersNum > 0 &&
    currentChapterNum >= totalChaptersNum;

  /**
   * 推进到下一章
   * 调用API更新学习计划，成功后开启新章节学习
   */
  const handleAdvanceChapter = async () => {
    if (!currentPlan || isLoading) return;

    setIsLoading(true);
    try {
      await advancePlan(currentPlan.planId);
      toast.success(t('openNewChapterSuccess'));
      startLearningSession();
    } catch (error: unknown) {
      // 错误信息处理：优先使用API错误信息，否则使用默认错误提示
      const errorMsg =
        error instanceof Error ? error.message : t_err('unknownError');
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md flex flex-col items-center p-6 sm:p-8 sm:pt-0 pt-0 text-center">
      {/* 书籍插图（明暗模式适配） */}
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

      {/* 书籍名称（未完成时显示） */}
      {!isBookComplete && (
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-6">
          {currentBook.name}
        </h2>
      )}

      {/* 书籍完成状态展示 */}
      {isBookComplete ? (
        <div className="w-full max-w-xl mx-auto flex flex-col items-center space-y-3 my-6 px-2">
          {/* 完成标识与标题 */}
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

          {/* 完成描述 */}
          <p className="text-base text-gray-600 dark:text-gray-400">
            {t('congratsBookCompleteDesc', { bookName: currentBook.name })}
          </p>

          {/* 浏览书架按钮 */}
          <button
            onClick={() => setIsBookDrawerOpen(true)}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm hover:bg-gray-700 dark:text-gray-900 dark:bg-white dark:hover:bg-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 mt-5"
            aria-label={t('browseBookshelfBtn')}
          >
            <BookOpen className="w-4 h-4 mr-2 -ml-1" aria-hidden="true" />
            {t('browseBookshelfBtn')}
          </button>
        </div>
      ) : (
        // 未完成章节的进度展示
        <div className="w-full max-w-xl mx-auto space-y-6">
          {/* 章节进度 */}
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            {t('chapterProgress', {
              current: progress.currentChapter || 1,
              total: progress.totalChapters || 0,
            })}
          </p>

          {/* 今日任务进度条 */}
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

            {/* 进度条 */}
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
                aria-label={`今日进度：${
                  totalTodayTask > 0
                    ? Math.round((completedTodayTask / totalTodayTask) * 100)
                    : 0
                }%`}
              ></div>
            </div>

            {/* 进度百分比 */}
            <div className="text-right text-sm font-medium text-gray-700 dark:text-gray-300">
              {totalTodayTask > 0
                ? `${Math.round((completedTodayTask / totalTodayTask) * 100)}%`
                : '0%'}
            </div>
          </div>
        </div>
      )}

      {/* 未完成章节的操作按钮组 */}
      {!isBookComplete && (
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full max-w-xl mt-8 justify-center">
          {isTodayComplete ? (
            // 今日任务完成：显示推进章节按钮
            <button
              onClick={handleAdvanceChapter}
              disabled={isLoading}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm hover:bg-gray-700 dark:text-gray-900 dark:bg-white dark:hover:bg-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
              aria-label={
                isLoading ? t('openingChapter') : t('openNextChapterBtn')
              }
            >
              <Rocket className="w-4 h-4 mr-2 -ml-1" aria-hidden="true" />
              {isLoading ? t('openingChapter') : t('openNextChapterBtn')}
            </button>
          ) : (
            // 今日任务未完成：显示开始学习按钮
            <button
              onClick={startLearningSession}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm hover:bg-gray-700 dark:text-gray-900 dark:bg-white dark:hover:bg-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              aria-label={t('startLearningBtn')}
            >
              <Play className="w-4 h-4 mr-2 -ml-1" aria-hidden="true" />
              {t('startLearningBtn')}
            </button>
          )}

          {/* 打开书架按钮 */}
          <button
            onClick={() => setIsBookDrawerOpen(true)}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-800 bg-gray-200 rounded-lg shadow-sm hover:bg-gray-300 dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            aria-label={t('openBookshelfBtn')}
          >
            <BookOpen className="w-4 h-4 mr-2 -ml-1" aria-hidden="true" />
            {t('openBookshelfBtn')}
          </button>
        </div>
      )}
    </div>
  );
};

export default LearningStart;
