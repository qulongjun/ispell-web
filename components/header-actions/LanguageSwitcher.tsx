'use client';
/*
 * @Date: 2025-10-28 21:48:34
 * @LastEditTime: 2025-10-31 14:37:34
 * @Description: 国际化 (i18n) 语言切换器组件
 */

import React, { useState, useEffect, useRef } from 'react';
import { Globe, Check } from 'lucide-react';
import { useLocale } from 'next-intl'; // Hook，用于获取当前语言环境
import { useRouter, usePathname } from '@/i18n/navigation'; // next-intl 提供的导航工具

/**
 * @constant languageOptions
 * @description
 * 定义了下拉菜单中所有可用的语言选项。
 * 这是一个静态配置数组。
 */
const languageOptions: { code: string; name: string }[] = [
  { code: 'en', name: 'English' },
  { code: 'zh-CN', name: '简体中文' },
  { code: 'zh-TW', name: '繁體中文' },
  { code: 'ja', name: '日本語' },
];

/**
 * @component LanguageSwitcher
 * @description
 * 渲染语言切换器按钮及其下拉菜单。
 */
const LanguageSwitcher: React.FC = () => {
  // --- Hooks ---

  // 从 next-intl 获取当前激活的语言代码 (例如 "en", "zh-CN")
  const locale = useLocale();
  // 获取 next-intl 的路由器实例，用于切换语言
  const router = useRouter();
  // 获取当前页面的路径 (不包含语言代码前缀)
  const pathname = usePathname();

  // --- State and Ref ---

  // `isOpen` 状态用于控制下拉菜单的显示和隐藏
  const [isOpen, setIsOpen] = useState(false);
  // `dropdownRef` 用于引用组件的根 DOM 元素，以便检测外部点击
  const dropdownRef = useRef<HTMLDivElement>(null);

  // --- Effects ---

  /**
   * Effect: 处理 "Escape" 键按下事件。
   * 当下拉菜单打开时，监听全局 keydown 事件，如果按下 "Escape" 键，则关闭菜单。
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
    // 清理函数：在组件卸载或 isOpen 变为 false 时移除监听器
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen]); // 依赖项：仅在 isOpen 状态改变时重新运行此 effect

  /**
   * Effect: 处理点击组件外部事件。
   * 当下拉菜单打开时，监听全局 mousedown 事件，如果点击位置不在
   * `dropdownRef` (即组件自身) 内部，则关闭菜单。
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
    // 清理函数：在组件卸载或 isOpen 变为 false 时移除监听器
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]); // 依赖项：仅在 isOpen 状态改变时重新运行此 effect

  // --- Handlers ---

  /**
   * @function handleChangeLanguage
   * @description
   * 当用户在下拉菜单中点击一个新的语言时调用此函数。
   * 它使用 next-intl 的 `router.replace` 方法来更新 URL 中的语言代码，
   * 同时保持在当前页面。
   * @param {string} newLocale - 目标语言的代码 (例如 "en", "zh-CN")。
   */
  const handleChangeLanguage = (newLocale: string) => {
    // 切换路由到新的语言版本
    router.replace(pathname, { locale: newLocale });
    // 立即关闭下拉菜单
    setIsOpen(false);
  };

  // --- Derived Data ---

  // 从静态列表中查找当前语言代码对应的完整对象
  const currentLanguage = languageOptions.find(
    (option) => option.code === locale
  );
  // 确定要在按钮上显示的名称：
  // 如果找到了对应的名称 (例如 "简体中文")，则使用它；
  // 否则，回退到显示大写的语言代码 (例如 "EN")。
  const currentLanguageName = currentLanguage
    ? currentLanguage.name
    : locale.toUpperCase();

  return (
    // 根元素，附加 ref 以便检测外部点击
    <div className="relative" ref={dropdownRef}>
      {/* 触发按钮 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)} // 点击时切换 isOpen 状态
        aria-label="选择语言"
        // 按钮样式，与其他 header-actions 组件保持一致
        className="flex items-center p-2 cursor-pointer text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200 list-none select-none"
      >
        <Globe className="w-5 h-5 sm:w-6 sm:h-6" />
        <span className="ml-1 text-sm">{currentLanguageName}</span>
      </button>

      {/* 下拉菜单：仅在 isOpen 为 true 时渲染 */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 z-20 origin-top-right">
          <ul className="py-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5">
            {/* 遍历 languageOptions 数组来创建菜单项 */}
            {languageOptions.map((option) => (
              <li key={option.code}>
                <button
                  onClick={() => handleChangeLanguage(option.code)}
                  className={`
                    flex items-center justify-between w-full px-4 py-2 text-left text-sm
                    ${
                      // 根据是否为当前激活的语言，应用不同的字体粗细和颜色
                      locale === option.code
                        ? 'font-bold text-gray-900 dark:text-white' // 激活状态
                        : 'font-medium text-gray-700 dark:text-gray-300' // 非激活状态
                    }
                    hover:bg-gray-100 dark:hover:bg-gray-700
                  `}
                >
                  {/* 语言名称 */}
                  <span>{option.name}</span>

                  {/* 仅在当前语言旁边显示一个 Check (勾) 图标 */}
                  {locale === option.code && <Check className="w-4 h-4" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
