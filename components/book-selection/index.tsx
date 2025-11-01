'use client';
/*
 * @Date: 2025-10-29 14:57:30
 * @LastEditTime: 2025-11-01 14:27:17
 * @Description: 书籍选择按钮组件（支持国际化）
 * 功能：显示当前激活书籍名称或"书架"按钮，点击打开书籍选择抽屉
 */

import React from 'react';
import { BookOpen } from 'lucide-react';
import { useTranslations } from 'next-intl'; // 导入国际化Hook
import BookSelectionDrawer from './BookSelectionDrawer';
import { useAppContext } from '@/contexts/app.context';

const BookSelection: React.FC = () => {
  // 国际化翻译Hook（指定当前组件的翻译命名空间）
  const t = useTranslations('BookSelection');

  // 从全局上下文获取所需状态与方法
  const { setIsBookDrawerOpen, isLoggedIn, currentBookId, learningList } =
    useAppContext();

  // 查找当前激活的学习计划，获取对应书籍名称
  const currentPlan = learningList.find(
    (plan) => plan.listCode === currentBookId
  );
  const currentBookName = currentPlan?.book.name;

  // 确定按钮文本：已登录且有当前书名则显示书名，否则显示"书架"（国际化）
  const buttonText =
    isLoggedIn && currentBookName ? currentBookName : t('bookshelfBtnText');

  return (
    <>
      <button
        onClick={() => setIsBookDrawerOpen(true)}
        aria-label={t('aria.selectBook')} // 国际化无障碍标签
        // 样式保持不变，严格匹配 LanguageSwitcher 组件
        className="flex items-center p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
      >
        {/* 图标尺寸保持不变，与 LanguageSwitcher 一致 */}
        <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />

        {/* 文本样式保持不变，保留响应式隐藏和截断逻辑（适配长书名） */}
        <span
          className="ml-1 text-sm hidden md:inline max-w-[150px] truncate"
          title={buttonText} // 鼠标悬停显示完整文本（书名/书架）
        >
          {buttonText}
        </span>
      </button>

      {/* 书籍选择抽屉组件（保持不变） */}
      <BookSelectionDrawer />
    </>
  );
};

export default BookSelection;
