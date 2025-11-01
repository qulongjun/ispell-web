'use client';
/*
 * @Date: 2025-10-28 21:49:07
 * @LastEditTime: 2025-10-31 14:29:53
 * @Description: 网站顶部导航栏右侧的操作按钮集合
 */

import React from 'react';
import ThemeToggle from './ThemeToggle';
import LanguageSwitcher from './LanguageSwitcher';
import AuthButtons from './AuthButtons';
import UserAvatar from './UserAvatar';
import { useAppContext } from '@/contexts/app.context';
import BookSelection from '../book-selection';

/**
 * @component VerticalDivider
 * @description
 * 一个小的内联组件，用于在按钮组之间创建一条微妙的垂直分隔线。
 * 它在视觉上将“应用设置”和“用户会话”区域分开。
 *
 * @returns {React.ReactElement}
 */
const VerticalDivider: React.FC = () => {
  return (
    <div
      // 设置高度为 h-6 (24px) 以匹配按钮的平均高度
      // 设置宽度为 w-px (1px)
      // 设置背景色以在明暗模式下都可见
      className="h-6 w-px bg-gray-200 dark:bg-gray-700"
      aria-hidden="true" // 对屏幕阅读器隐藏，因为它纯粹是装饰性的
    />
  );
};

/**
 * @component HeaderActions
 * @description
 * 负责渲染网站顶部导航栏右侧的所有交互按钮。
 *
 * 渲染逻辑：
 * 1.  **应用设置组**：始终显示 `BookSelection` (书籍选择)、`LanguageSwitcher` (语言切换)
 * 和 `ThemeToggle` (主题切换)。
 * 2.  **分隔线**：显示一条垂直线以区分功能区。
 * 3.  **用户会话组**：
 * - 如果用户已登录 (`isLoggedIn` 为 true)，则渲染 `UserAvatar` (用户头像菜单)。
 * - 如果用户未登录 (`isLoggedIn` 为 false)，则渲染 `AuthButtons` (登录按钮)。
 *
 * @returns {React.ReactElement}
 */
const HeaderActions: React.FC = () => {
  // 从全局上下文中获取用户登录状态
  const { isLoggedIn } = useAppContext();

  return (
    // 使用 flex 布局，`items-center` 垂直居中，`space-x-2` (8px) 设置各项之间的间距
    <div className="flex items-center space-x-2">
      {/* --- 应用设置组 --- */}

      {/* 1. 书籍选择按钮 (点击打开书架抽屉) */}
      <BookSelection />

      {/* 2. 语言切换按钮 (点击打开语言选择下拉菜单) */}
      <LanguageSwitcher />

      {/* 3. 主题切换按钮 (点击循环切换 亮/暗/系统 主题) */}
      <ThemeToggle />

      {/* --- 分隔线 --- */}
      <VerticalDivider />

      {/* --- 用户会话组 --- */}

      {/* 4. 根据登录状态条件渲染 */}
      {isLoggedIn ? (
        // 已登录：显示用户头像，点击可打开用户菜单
        <UserAvatar />
      ) : (
        // 未登录：显示登录按钮，点击可打开登录弹窗
        <AuthButtons />
      )}
    </div>
  );
};

export default HeaderActions;
