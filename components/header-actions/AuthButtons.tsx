/*
 * @Date: 2025-10-28 21:50:38
 * @LastEditTime: 2025-11-10 07:00:00
 * @Description: 认证按钮组件
 */
'use client';

import React from 'react';
import { useAppContext } from '@/contexts/app.context';
import { useTranslations } from 'next-intl';

/**
 * 认证按钮组件
 * 提供登录功能入口，点击按钮打开登录模态框
 * 包含hover和focus状态的样式反馈，适配明暗模式
 */
const AuthButtons: React.FC = () => {
  const t = useTranslations('AuthButton'); // 国际化翻译：登录按钮文本
  const { openLoginModal } = useAppContext(); // 从全局状态获取打开登录模态框的方法

  return (
    <div className="flex items-center">
      <button
        onClick={openLoginModal}
        className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm hover:bg-gray-700 dark:text-gray-900 dark:bg-white dark:hover:bg-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        aria-label={t('login')} // 无障碍标签：登录按钮
      >
        {t('login')}
      </button>
    </div>
  );
};

export default AuthButtons;
