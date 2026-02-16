/*
 * @Date: 2025-11-06 05:00:00
 * @LastEditTime: 2026-02-16 22:55:56
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

/** 主按钮样式（开始学习、试用体验、开启下一章等） */
const btnPrimary =
  'inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 text-white bg-gray-900 hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200';
/** 次按钮样式（打开书架、逛逛书架等） */
const btnSecondary =
  'inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 text-gray-800 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600';

/** 未登录用户「试用体验」使用的演示单词数据 */
const DEMO_WORDS: Word[] = [
  {
    progressId: 1,
    id: 1,
    pronunciation: { uk: { phonetic: '/heləʊ/' }, us: { phonetic: '/heˈloʊ/' } },
    definitions: { 'int.': [{ translation: '喂；你好' }] },
    examples: {
      general: [
        { cn: '你好，请问有什么可以帮您？', en: 'Hello, how can I help you?', en_highlighted: 'Hello, how can I help you?' },
      ],
    },
    relations: {},
    text: 'hello',
  },
  {
    progressId: 2,
    id: 2,
    pronunciation: { uk: { phonetic: '/ˈwɜːd/' }, us: { phonetic: '/wɜːrd/' } },
    definitions: { 'n.': [{ translation: '词；单词；话' }] },
    examples: {
      general: [
        { cn: '这个词很难拼写。', en: 'This word is difficult to spell.', en_highlighted: 'This word is difficult to spell.' },
      ],
    },
    relations: {},
    text: 'word',
  },
  {
    progressId: 3,
    id: 3,
    pronunciation: { uk: { phonetic: '/ˈpræktɪs/' }, us: { phonetic: '/ˈpræktɪs/' } },
    definitions: { 'n.': [{ translation: '练习；实践' }], 'v.': [{ translation: '练习；实践' }] },
    examples: {
      general: [
        { cn: '熟能生巧。', en: 'Practice makes perfect.', en_highlighted: 'Practice makes perfect.' },
      ],
    },
    relations: {},
    text: 'practice',
  },
];

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
    startMistakeReview(0, DEMO_WORDS);
  };

  // 未选择书籍或无进度信息时的展示
  if (!currentBook || !progress) {
    return (
      <div className="w-full max-w-md flex flex-col items-center text-center">
        {/* 插图（明暗模式适配） */}
        <div
          className="w-28 h-28 sm:w-40 sm:h-40 mb-5 sm:mb-6 relative"
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
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3">
          {t('title')}
        </h2>
        <p className="text-base text-gray-600 dark:text-gray-400 mb-6 sm:mb-8 max-w-sm mx-auto">
          {t(
            isLoggedIn ? 'noActiveBookDescription' : 'noActiveBookDescription2'
          )}
        </p>

        {/* 操作按钮组 */}
        <div className="flex flex-col sm:flex-row w-full max-w-sm sm:max-w-none sm:flex-initial gap-3 justify-center">
          {!isLoggedIn && (
            <button
              onClick={handleStartDemo}
              className={btnPrimary}
              aria-label={t('testNow')}
            >
              <Wand className="w-4 h-4 shrink-0" aria-hidden="true" />
              {t('testNow')}
            </button>
          )}
          <button
            onClick={() => setIsBookDrawerOpen(true)}
            className={btnSecondary}
            aria-label={t('browseBookshelfBtn')}
          >
            <BookOpen className="w-4 h-4 shrink-0" aria-hidden="true" />
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
    <div className="w-full max-w-md flex flex-col items-center text-center">
      {/* 书籍插图（明暗模式适配） */}
      <div
        className="w-28 h-28 sm:w-40 sm:h-40 mb-5 sm:mb-6 relative"
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
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6 px-2 wrap-break-word">
          {currentBook.name}
        </h2>
      )}

      {/* 书籍完成状态展示 */}
      {isBookComplete ? (
        <div className="w-full flex flex-col items-center space-y-3 my-4 sm:my-6">
          <div className="flex items-center justify-center gap-2">
            <CheckCircle2
              className="w-6 h-6 text-green-600 dark:text-green-500 shrink-0"
              strokeWidth={2.5}
              aria-hidden="true"
            />
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {t('congratsBookCompleteTitle')}
            </h3>
          </div>
          <p className="text-base text-gray-600 dark:text-gray-400">
            {t('congratsBookCompleteDesc', { bookName: currentBook.name })}
          </p>
          <button
            onClick={() => setIsBookDrawerOpen(true)}
            className={`${btnPrimary} mt-2`}
            aria-label={t('browseBookshelfBtn')}
          >
            <BookOpen className="w-4 h-4 shrink-0" aria-hidden="true" />
            {t('browseBookshelfBtn')}
          </button>
        </div>
      ) : (
        <div className="w-full max-w-sm sm:max-w-md mx-auto space-y-4 sm:space-y-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('chapterProgress', {
              current: progress.currentChapter || 1,
              total: progress.totalChapters || 0,
            })}
          </p>

          {/* 今日任务进度条 */}
          <div className="space-y-2 sm:space-y-3 text-left">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-900 dark:text-white">
                {t('todayProgressTitle')}
              </span>
              <span className="text-gray-600 dark:text-gray-400 tabular-nums">
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
              </span>
            </div>
            <div className="w-full h-2.5 border border-gray-300 dark:border-gray-600 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
              <div
                className="h-full bg-gray-600 dark:bg-gray-400 rounded-full transition-all duration-500 ease-out"
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
              />
            </div>
            <p className="text-right text-sm font-medium text-gray-700 dark:text-gray-300 tabular-nums">
              {totalTodayTask > 0
                ? `${Math.round((completedTodayTask / totalTodayTask) * 100)}%`
                : '0%'}
            </p>
          </div>
        </div>
      )}

      {/* 未完成章节的操作按钮组 */}
      {!isBookComplete && (
        <div className="flex flex-col sm:flex-row w-full max-w-sm sm:max-w-none sm:flex-initial gap-3 mt-6 sm:mt-8 justify-center">
          {isTodayComplete ? (
            <button
              onClick={handleAdvanceChapter}
              disabled={isLoading}
              className={btnPrimary}
              aria-label={
                isLoading ? t('openingChapter') : t('openNextChapterBtn')
              }
            >
              <Rocket className="w-4 h-4 shrink-0" aria-hidden="true" />
              {isLoading ? t('openingChapter') : t('openNextChapterBtn')}
            </button>
          ) : (
            <button
              onClick={startLearningSession}
              className={btnPrimary}
              aria-label={t('startLearningBtn')}
            >
              <Play className="w-4 h-4 shrink-0" aria-hidden="true" />
              {t('startLearningBtn')}
            </button>
          )}
          <button
            onClick={() => setIsBookDrawerOpen(true)}
            className={btnSecondary}
            aria-label={t('openBookshelfBtn')}
          >
            <BookOpen className="w-4 h-4 shrink-0" aria-hidden="true" />
            {t('openBookshelfBtn')}
          </button>
        </div>
      )}
    </div>
  );
};

export default LearningStart;
