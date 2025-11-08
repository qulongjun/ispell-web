/*
 * @Date: 2025-10-31 10:08:45
 * @LastEditTime: 2025-11-08 22:27:48
 * @Description: 捐赠提示横幅组件
 */
'use client';

import React, { useState, useEffect } from 'react';
import { Gift, X } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

// localStorage存储键：用于记录用户关闭横幅的周数
const STORAGE_KEY = 'donateBannerClosedWeek';

/**
 * 计算自Unix纪元（1970-01-01）以来的周数
 * 采用与时间无关的统一计算方式，确保跨设备一致性
 * @param date 时间戳（如Date.now()）
 * @returns 对应的周数（整数）
 */
const getWeekNumber = (date: number): number => {
  const MSEC_PER_WEEK = 1000 * 60 * 60 * 24 * 7; // 一周的毫秒数
  return Math.floor(date / MSEC_PER_WEEK); // 时间戳除以每周毫秒数，取整得到周数
};

/**
 * 捐赠提示横幅组件
 * 仅在桌面端显示，用户关闭后本周内不再展示，新的一周自动重新显示
 */
const DonateBanner: React.FC = () => {
  const t = useTranslations('DonateBanner'); // 捐赠横幅的国际化翻译
  // 初始为null：避免服务端渲染与客户端状态不匹配导致的Hydration Error
  const [isVisible, setIsVisible] = useState<boolean | null>(null);

  /**
   * 初始化横幅显示状态
   * 组件挂载时执行，通过比较当前周数与用户上次关闭的周数决定是否显示
   */
  useEffect(() => {
    try {
      const currentWeek = getWeekNumber(Date.now()); // 当前周数
      const storedValue = localStorage.getItem(STORAGE_KEY); // 从本地存储获取上次关闭的周数
      const closedWeek = storedValue ? parseInt(storedValue, 10) : 0; // 解析存储的周数，默认为0

      // 若当前周数大于上次关闭的周数，说明进入了新的一周，需要显示横幅
      setIsVisible(currentWeek > closedWeek);
    } catch (e) {
      // 本地存储访问失败时（如隐私模式），降级为显示横幅
      console.warn('无法访问localStorage以管理捐赠横幅状态:', e);
      setIsVisible(true);
    }
  }, []); // 空依赖数组：仅在组件挂载时执行一次

  /**
   * 处理横幅关闭事件
   * 存储当前周数到localStorage，标记本周已关闭，并隐藏横幅
   */
  const handleClose = () => {
    try {
      const currentWeek = getWeekNumber(Date.now());
      localStorage.setItem(STORAGE_KEY, currentWeek.toString()); // 记录当前周数
    } catch (e) {
      console.warn('无法存储捐赠横幅关闭状态到localStorage:', e);
    }
    setIsVisible(false); // 立即隐藏横幅
  };

  // 渲染守卫：初始状态（null）或不显示状态下不渲染组件
  if (isVisible === null || !isVisible) {
    return null;
  }

  return (
    // 仅桌面端显示（sm:block），深色模式适配（颜色反转）
    <div className="hidden sm:block w-full bg-gray-900 dark:bg-gray-100 relative border-b border-gray-700 dark:border-gray-200">
      <div className="max-w-7xl mx-auto py-2 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
          {/* 礼物图标：颜色随主题反转 */}
          <Gift className="w-4 h-4 text-white dark:text-gray-900 shrink-0" />

          {/* 提示文本：颜色随主题反转 */}
          <p className="text-center text-sm text-white dark:text-gray-900">
            {t('text')}
          </p>

          {/* 捐赠链接：带箭头图标，颜色随主题反转并支持hover效果 */}
          <Link
            href="/donate"
            className="text-sm font-medium text-white dark:text-gray-900 hover:text-gray-300 dark:hover:text-gray-600 transition-colors duration-200 flex items-center gap-1 underline underline-offset-2"
          >
            {t('link')}
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              ></path>
            </svg>
          </Link>
        </div>

        {/* 关闭按钮：颜色随主题反转，点击隐藏横幅 */}
        <button
          onClick={handleClose}
          aria-label={t('closeAriaLabel')}
          className="absolute top-1/2 right-4 -translate-y-1/2 p-1 text-gray-400 dark:text-gray-600 hover:text-white dark:hover:text-gray-900 rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default DonateBanner;
