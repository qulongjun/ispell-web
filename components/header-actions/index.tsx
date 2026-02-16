/*
 * @Date: 2025-10-28 21:49:07
 * @LastEditTime: 2025-11-08 23:00:08
 * @Description: 网站顶部导航栏右侧的操作按钮集合
 */
'use client';

import React from 'react';
import ThemeToggle from './ThemeToggle'; // 主题切换按钮（明暗模式切换）
import LanguageSwitcher from './LanguageSwitcher'; // 语言切换按钮（国际化语言选择）
import AuthButtons from './AuthButtons'; // 未登录状态的登录按钮
import UserAvatar from './UserAvatar'; // 已登录状态的用户头像（含下拉菜单）
import { useAppContext } from '@/contexts/app.context'; // 全局状态上下文
import BookSelection from '../book-selection'; // 书籍选择组件

/**
 * 垂直分隔线组件
 * 在操作按钮组之间提供视觉分隔，仅在中等及以上屏幕显示，提升布局层次感
 */
const VerticalDivider: React.FC = () => {
  return (
    <div
      className="h-6 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block"
      aria-hidden="true" // 纯装饰性元素，对屏幕阅读器隐藏
    />
  );
};

/**
 * 顶部导航栏操作区组件
 * 聚合应用核心操作按钮，按功能分组展示：
 * - 应用设置组：书籍选择、语言切换、主题切换
 * - 用户会话组：根据登录状态显示用户头像或登录按钮
 * 两组之间通过垂直分隔线区分，适配不同屏幕尺寸
 */
const HeaderActions: React.FC = () => {
  // 从全局状态获取用户登录状态，用于条件渲染
  const { isLoggedIn } = useAppContext();

  return (
    <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
      {/* 应用设置功能组：书架 / 语言 / 主题 */}
      <div className="flex items-center gap-0.5 sm:gap-1">
        <BookSelection />
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      {/* 功能组分隔线：仅在中等及以上屏幕显示 */}
      <VerticalDivider />

      {/* 用户会话功能组：根据登录状态动态切换 */}
      <div className="flex items-center">
        {isLoggedIn ? (
          <UserAvatar />
        ) : (
          <AuthButtons />
        )}
      </div>
    </div>
  );
};

export default HeaderActions;