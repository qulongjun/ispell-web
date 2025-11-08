/*
 * @Date: 2025-10-29 14:57:30
 * @LastEditTime: 2025-11-08 22:36:36
 * @Description: 书籍选择按钮组件
 */
'use client';

import React from 'react';
import { BookOpen } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAppContext } from '@/contexts/app.context';

// 子组件
import BookSelectionDrawer from './BookSelectionDrawer';

/**
 * 书籍选择按钮组件
 * 作为打开书籍选择抽屉的入口点，显示当前激活的书籍名称（若存在）
 * 未登录或无选中书籍时显示默认文本"书架"
 */
const BookSelection: React.FC = () => {
  // 国际化翻译：使用BookSelection命名空间
  const t = useTranslations('BookSelection');

  // 从全局上下文获取状态与方法
  const {
    setIsBookDrawerOpen, // 打开书籍选择抽屉的方法
    isLoggedIn, // 用户登录状态
    currentBookId, // 当前激活的书籍ID
    learningList, // 用户的学习计划列表
  } = useAppContext();

  // 查找当前激活的学习计划，获取对应的书籍名称
  const currentPlan = learningList.find(
    (plan) => plan.listCode === currentBookId
  );
  const currentBookName = currentPlan?.book.name;

  // 确定按钮显示文本：
  // - 已登录且有当前选中书籍时，显示书籍名称
  // - 否则显示默认文本"书架"（国际化）
  const buttonText =
    isLoggedIn && currentBookName ? currentBookName : t('bookshelfBtnText');

  return (
    <>
      {/* 书籍选择按钮：点击打开抽屉 */}
      <button
        onClick={() => setIsBookDrawerOpen(true)}
        aria-label={t('aria.selectBook')} // 无障碍标签："选择书籍"
        className="flex items-center p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
      >
        {/* 书籍图标：尺寸适配响应式布局 */}
        <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />

        {/* 按钮文本：响应式显示（移动端隐藏，桌面端显示） */}
        <span
          className="ml-1 text-sm hidden md:inline max-w-[150px] truncate"
          title={buttonText} // 鼠标悬停时显示完整文本（解决长书名截断问题）
        >
          {buttonText}
        </span>
      </button>

      {/* 书籍选择抽屉组件：点击按钮后显示 */}
      <BookSelectionDrawer />
    </>
  );
};

export default BookSelection;
