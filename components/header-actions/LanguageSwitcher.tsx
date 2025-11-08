/*
 * @Date: 2025-10-28 21:48:34
 * @LastEditTime: 2025-11-08 23:01:25
 * @Description: 国际化语言切换器组件
 */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Globe, Check } from 'lucide-react';
import { useLocale } from 'next-intl'; // 获取当前语言环境
import { useRouter, usePathname } from '@/i18n/navigation'; // 国际化路由工具
import { motion, AnimatePresence } from 'framer-motion'; // 动画效果

/**
 * 语言选项数据类型接口
 */
interface LanguageOption {
  /** 语言代码（符合ISO标准，如'en'、'zh-CN'） */
  code: string;
  /** 语言名称（用户可见，如'English'、'简体中文'） */
  name: string;
}

/**
 * 支持的语言选项配置
 * 静态数组，定义所有可用的语言及其显示名称
 */
const languageOptions: LanguageOption[] = [
  { code: 'en', name: 'English' },
  { code: 'zh-CN', name: '简体中文' },
  { code: 'zh-TW', name: '繁體中文' },
  { code: 'ja', name: '日本語' },
];

/**
 * 国际化语言切换器组件
 * 提供下拉菜单用于切换网站语言，保持当前页面路径不变仅更新语言环境
 * 支持键盘操作（ESC关闭菜单）和点击外部关闭，适配响应式布局和明暗模式
 */
const LanguageSwitcher: React.FC = () => {
  // 国际化与路由相关Hook
  const locale = useLocale(); // 当前语言环境
  const router = useRouter(); // 国际化路由实例
  const pathname = usePathname(); // 当前页面路径

  // 状态与引用管理
  const [isOpen, setIsOpen] = useState(false); // 下拉菜单是否展开
  const dropdownRef = useRef<HTMLDivElement>(null); // 下拉菜单容器引用

  /**
   * 监听ESC键按下事件，关闭下拉菜单
   * 仅在菜单展开时生效，组件卸载或菜单关闭时移除监听
   */
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen]);

  /**
   * 监听点击外部事件，关闭下拉菜单
   * 仅在菜单展开时生效，组件卸载或菜单关闭时移除监听
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  /**
   * 切换语言环境
   * @param newLocale 目标语言代码
   * 保持当前页面路径不变，仅更新语言参数
   */
  const handleChangeLanguage = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
    setIsOpen(false); // 切换后关闭菜单
  };

  // 获取当前语言的显示名称
  const currentLanguage = languageOptions.find(
    (option) => option.code === locale
  );
  const currentLanguageName = currentLanguage
    ? currentLanguage.name
    : locale.toUpperCase();

  // 下拉菜单动画变体
  const dropdownVariants = {
    open: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.15, ease: 'easeOut' },
    },
    closed: {
      opacity: 0,
      y: -5,
      transition: { duration: 0.1, ease: 'easeIn' },
    },
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 语言切换触发按钮 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="切换语言"
        aria-expanded={isOpen} // 无障碍属性：指示下拉菜单是否展开
        className="flex items-center p-2 cursor-pointer text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
      >
        <Globe className="w-5 h-5 sm:w-6 sm:h-6" />
        {/* 桌面端显示当前语言名称，移动端隐藏 */}
        <span className="ml-1 text-sm hidden sm:inline">
          {currentLanguageName}
        </span>
      </button>

      {/* 语言选择下拉菜单（带动画效果） */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            className="absolute top-full right-0 mt-2 w-56 sm:w-48 z-20 origin-top-right"
            role="menu" // 无障碍属性：标识为菜单
            aria-orientation="vertical"
          >
            <ul className="py-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5">
              {languageOptions.map((option) => (
                <li key={option.code}>
                  <button
                    onClick={() => handleChangeLanguage(option.code)}
                    className={`
                      flex items-center justify-between w-full px-4 py-2 text-left text-sm
                      ${
                        locale === option.code
                          ? 'font-bold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700/50'
                          : 'font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }
                    `}
                    role="menuitem" // 无障碍属性：标识为菜单项
                    tabIndex={0} // 支持键盘导航
                  >
                    <span>{option.name}</span>
                    {/* 当前选中的语言显示勾选图标 */}
                    {locale === option.code && (
                      <Check className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LanguageSwitcher;
