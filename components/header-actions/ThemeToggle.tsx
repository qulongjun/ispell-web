'use client';
/*
 * @Date: 2025-10-28 21:48:19
 * @LastEditTime: 2025-10-31 14:44:05
 * @Description: 网站的主题（外观模式）切换按钮组件
 */
import React from 'react';
import { Sun, Moon, Laptop } from 'lucide-react'; // 导入用于不同主题的图标
import { useAppContext } from '@/contexts/app.context'; // 导入全局应用上下文

/**
 * @component ThemeToggle
 * @description
 * 渲染一个图标按钮，用户点击该按钮可以在亮色、暗色和系统默认主题之间循环切换。
 */
const ThemeToggle: React.FC = () => {
  // 从全局上下文中获取当前主题状态 (theme) 和更新主题的方法 (setTheme)
  const { theme, setTheme } = useAppContext();

  /**
   * @function cycleTheme
   * @description
   * 循环切换主题。
   * 切换顺序为: light -> dark -> system -> light
   */
  const cycleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      // 'system' 或其他/默认状态 -> 'light'
      setTheme('light');
    }
  };

  /**
   * @function getIcon
   * @description
   * 根据当前的 `theme` 状态，返回对应的 React 元素 (图标)。
   * @returns {React.ReactElement}
   */
  const getIcon = () => {
    if (theme === 'light') {
      return <Sun className="w-5 h-5 sm:w-6 sm:h-6" />; // 亮色模式显示太阳
    }
    if (theme === 'dark') {
      return <Moon className="w-5 h-5 sm:w-6 sm:h-6" />; // 暗色模式显示月亮
    }
    // 'system' 模式显示笔记本电脑
    return <Laptop className="w-5 h-5 sm:w-6 sm:h-6" />;
  };

  return (
    <button
      onClick={cycleTheme} // 点击时触发主题循环
      aria-label="切换主题" // 为辅助功能（如屏幕阅读器）提供清晰的按钮说明
      // 按钮样式，与其他 header-actions 组件保持一致
      className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
    >
      {/* 调用 getIcon() 来动态渲染当前主题对应的图标 */}
      {getIcon()}
    </button>
  );
};

export default ThemeToggle;
