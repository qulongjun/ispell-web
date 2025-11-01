/*
 * @Date: 2025-10-29 17:02:17
 * @LastEditTime: 2025-11-01 14:24:58
 * @Description: 学习启动组件
 */
'use client';

// React核心导入
import React, { useState } from 'react';
import Image from 'next/image'; // 导入Next.js Image组件（替换原生img）

// 图标组件导入
import { Play, BookOpen, Rocket } from 'lucide-react';

// 国际化与工具导入
import { useTranslations } from 'next-intl'; // 国际化Hook
import { useAppContext } from '@/contexts/app.context'; // 应用全局上下文
import toast from 'react-hot-toast'; // 消息提示工具

// 类型与服务导入
import { LearningPlan } from '@/types/book.types'; // 学习计划类型定义
import { advancePlan } from '@/services/planService'; // 推进章节API服务

const LearningStart: React.FC = () => {
  // 国际化翻译Hook（指定当前组件的翻译命名空间）
  const t = useTranslations('LearningStart');
  // 错误信息翻译（复用现有Errors命名空间）
  const t_err = useTranslations('Errors');

  // 从全局上下文获取所需状态与方法
  const {
    setIsBookDrawerOpen, // 打开书籍选择抽屉
    currentBookId, // 当前激活书籍的listCode
    learningList, // 用户所有学习计划列表
    startLearningSession, // 启动学习会话
  } = useAppContext();

  // 当前激活的学习计划（通过currentBookId匹配）
  const currentPlan: LearningPlan | undefined = learningList.find(
    (plan) => plan.listCode === currentBookId
  );
  // 当前激活计划对应的书籍信息
  const currentBook = currentPlan?.book;
  // 当前激活计划的学习进度数据
  const progress = currentPlan?.progress;

  // 加载状态（控制"开启下一章"按钮的禁用与文本显示）
  const [isLoading, setIsLoading] = useState(false);

  // --- 场景1：无激活的学习书籍 ---
  if (!currentBook || !progress) {
    return (
      <div className="w-full max-w-md flex flex-col items-center p-6 sm:p-8 text-center">
        {/* 引导插图（区分明暗模式，替换为Next.js Image） */}
        <div
          className="w-48 h-48 sm:w-64 sm:h-64 mb-6 relative"
          aria-hidden="true"
        >
          <Image
            src="/images/illustrations/question.svg"
            alt={t('alt.selectBookIllustration')} // 国际化图片alt文本
            width={48}
            height={48}
            className="block dark:hidden w-full h-full object-contain"
            priority={false}
          />
          <Image
            src="/images/illustrations/question-dark.svg"
            alt={t('alt.selectBookIllustration')} // 国际化图片alt文本
            width={48}
            height={48}
            className="hidden dark:block w-full h-full object-contain"
            priority={false}
          />
        </div>

        {/* 引导文案（国际化） */}
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-3">
          {t('title')}
        </h2>
        <p className="text-base text-gray-600 dark:text-gray-400 mb-6">
          {t('noActiveBookDescription')}
        </p>

        {/* 打开书架按钮（国际化） */}
        <button
          onClick={() => setIsBookDrawerOpen(true)}
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm hover:bg-gray-700 dark:text-gray-900 dark:bg-white dark:hover:bg-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          <BookOpen className="w-4 h-4 mr-2 -ml-1" />
          {t('browseBookshelfBtn')}
        </button>
      </div>
    );
  }

  // --- 场景2：有激活的学习书籍（计算进度相关变量） ---
  // 今日应学新词数 / 已学新词数
  const totalNewTask = progress.dueNewCount || 0;
  const completedNew = progress.learnedTodayCount || 0;

  // 今日应复习单词数 / 已复习单词数 / 复习总任务数
  const dueReviewCount = progress.dueReviewCount || 0;
  const completedReview = progress.reviewedTodayCount || 0;
  const totalReviewTask = dueReviewCount + completedReview;

  // 是否隐藏复习进度（无复习策略 或 无复习任务）
  const isReviewHidden =
    currentPlan.plan.reviewStrategy === 'NONE' || totalReviewTask === 0;

  // 今日总任务数 / 已完成任务数（根据是否隐藏复习进度计算）
  const totalTodayTask = isReviewHidden
    ? totalNewTask
    : totalNewTask + totalReviewTask;
  const completedTodayTask = isReviewHidden
    ? completedNew
    : completedNew + completedReview;

  // 今日进度百分比（避免除以零，默认0%）
  const todayProgressPercent =
    totalTodayTask > 0
      ? Math.round((completedTodayTask / totalTodayTask) * 100)
      : 0;

  // 章节进度文案（国际化，带占位符）
  const chapterText = t('chapterProgress', {
    current: progress.currentChapter || 1,
    total: progress.totalChapters || 0,
  });

  // 今日任务文案（国际化，区分是否显示复习进度）
  const taskText = isReviewHidden
    ? t('todayTaskOnlyNew', { completed: completedNew, total: totalNewTask })
    : t('todayTaskWithReview', {
        completedNew,
        totalNew: totalNewTask,
        completedReview,
        totalReview: totalReviewTask,
      });

  // 判断今日任务是否完成（有任务且已完成所有新学+无待复习）
  const isTodayComplete =
    (totalNewTask > 0 || totalReviewTask > 0) &&
    completedNew >= totalNewTask &&
    dueReviewCount === 0;

  /**
   * 开启下一章（今日任务完成时触发）
   * 逻辑：调用推进章节API → 显示成功/失败提示 → 启动学习会话
   */
  const handleAdvanceChapter = async () => {
    if (!currentPlan || isLoading) return; // 防止重复点击或无计划时调用

    setIsLoading(true);
    try {
      await advancePlan(currentPlan.planId); // 调用API推进到下一章
      toast.success(t('openNewChapterSuccess')); // 国际化成功提示
      startLearningSession(); // 自动启动新章节的学习会话
    } catch (error: unknown) {
      // 捕获错误并显示国际化提示（兼容不同错误类型）
      toast.error((error as Error).message || t_err('unknownError'));
    } finally {
      setIsLoading(false); // 无论成功失败，结束加载状态
    }
  };

  // --- 场景2：有激活书籍的UI渲染 ---
  return (
    <div className="w-full max-w-md flex flex-col items-center p-6 sm:p-8 text-center">
      {/* 书籍相关插图（区分明暗模式，替换为Next.js Image） */}
      <div
        className="w-48 h-48 sm:w-64 sm:h-64 mb-6 relative"
        aria-hidden="true"
      >
        <Image
          src="/images/illustrations/target.svg"
          alt={t('alt.bookIllustration')} // 国际化图片alt文本
          width={48}
          height={48}
          className="block dark:hidden w-full h-full object-contain"
          priority={false}
        />
        <Image
          src="/images/illustrations/target-dark.svg"
          alt={t('alt.bookIllustration')} // 国际化图片alt文本
          width={48}
          height={48}
          className="hidden dark:block w-full h-full object-contain"
          priority={false}
        />
      </div>

      {/* 书籍名称 */}
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-6">
        {currentBook.name}
      </h2>

      {/* 进度展示区域（章节进度 + 今日任务进度） */}
      <div className="w-full max-w-xs mx-auto space-y-6">
        {/* 章节进度文案（国际化） */}
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
          {chapterText}
        </p>

        {/* 今日任务进度条 */}
        <div className="space-y-3">
          {/* 进度文案（左侧标题 + 右侧任务统计，国际化） */}
          <div className="flex justify-between text-sm">
            <div className="font-medium text-gray-900 dark:text-white">
              {t('todayProgressTitle')}
            </div>
            <div className="text-gray-600 dark:text-gray-400">{taskText}</div>
          </div>

          {/* 进度条容器 */}
          <div className="w-full h-2.5 border border-gray-300 dark:border-gray-600 rounded-full overflow-hidden">
            <div
              className="h-full bg-gray-600 dark:bg-gray-400 rounded-full transition-all duration-800 ease-out"
              style={{ width: `${todayProgressPercent}%` }}
            ></div>
          </div>

          {/* 进度百分比 */}
          <div className="text-right text-sm font-medium text-gray-700 dark:text-gray-300">
            {todayProgressPercent}%
          </div>
        </div>
      </div>

      {/* 操作按钮区域（开始学习/开启下一章 + 打开书架，国际化） */}
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full max-w-xs mt-8 justify-center">
        {/* 主按钮：今日任务完成则显示"开启下一章"，否则显示"开始学习" */}
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

        {/* 辅助按钮：打开书架（切换书籍，国际化） */}
        <button
          onClick={() => setIsBookDrawerOpen(true)}
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-800 bg-gray-200 rounded-lg shadow-sm hover:bg-gray-300 dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          <BookOpen className="w-4 h-4 mr-2 -ml-1" />
          {t('openBookshelfBtn')}
        </button>
      </div>
    </div>
  );
};

export default LearningStart;
