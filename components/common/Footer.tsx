/*
 * @Date: 2025-11-06
 * @LastEditTime: 2025-11-08 22:50:48
 * @Description: 页脚组件，展示版权信息和导航链接（条款、隐私、捐赠、更新日志、意见反馈），适配响应式布局和明暗模式，固定在页面底部
 */
'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation'; // 国际化路由链接组件
import { useAppContext } from '@/contexts/app.context'; // 全局状态上下文

const Footer: React.FC = () => {
  const t = useTranslations('Footer'); // 国际化翻译
  const { openFeedbackModal } = useAppContext(); // 从全局状态获取打开反馈模态框的方法
  const currentYear = new Date().getFullYear(); // 当前年份，用于版权信息

  return (
    <footer
      className="fixed bottom-0 left-0 right-0 z-10 h-auto sm:h-16 border-t border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm"
      role="contentinfo" // 无障碍属性：标识页脚内容
    >
      {/* 内容容器：响应式布局，移动端垂直排列，桌面端水平排列 */}
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between py-3 sm:py-0 sm:h-16 space-y-2 sm:space-y-0">
        {/* 左侧版权信息 */}
        <p className="text-xs text-gray-500 dark:text-gray-400">
          © {currentYear} {t('copyright')}
        </p>

        {/* 右侧导航链接组 */}
        <nav className="flex items-center space-x-4">
          {/* 服务条款链接 */}
          <Link
            href="/terms"
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            {t('terms')}
          </Link>

          {/* 隐私政策链接 */}
          <Link
            href="/privacy"
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            {t('privacy')}
          </Link>

          {/* 捐赠链接 */}
          <Link
            href="/donate"
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            {t('donate')}
          </Link>

          {/* 更新日志链接 */}
          <Link
            href="/changelog"
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            {t('changelogLink')}
          </Link>

          {/* 意见反馈按钮 */}
          <button
            onClick={openFeedbackModal}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            aria-label={t('feedbackLink')}
          >
            {t('feedbackLink')}
          </button>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
