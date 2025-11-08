/*
 * @Date: 2025-11-08 12:00:00
 * @LastEditTime: 2025-11-08 18:06:42
 * @Description: 系统设置页面客户端交互组件
 */

'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/app.context';
import { useTranslations } from 'next-intl';
import { Loader2, MessageSquareWarning } from 'lucide-react';

// 导入设置表单组件
import SettingsForm from '@/components/settings';
// 导入公共卡片组件
import SectionCard from '@/components/common/SectionCard';

/**
 * 系统设置页面客户端组件
 * 整合应用偏好设置表单和问题反馈入口
 * 包含身份验证保护和加载状态处理
 */
const SettingsContent: React.FC<{ locale: string }> = ({ locale }) => {
  const { user, isLoggedIn, isLoading, openFeedbackModal } = useAppContext();
  const router = useRouter();
  const t = useTranslations('Settings');

  // 身份验证保护 - 未登录用户自动跳转至首页（带当前语言参数）
  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push(`/${locale}`);
    }
  }, [isLoading, isLoggedIn, router, locale]);

  // 加载状态显示
  if (isLoading || !isLoggedIn || !user) {
    return (
      <div className="flex min-h-[60vh] justify-center items-center">
        <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* 页面标题区域 */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('pageTitle')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          {t('pageDescription')}
        </p>
      </div>

      {/* 设置内容区域 */}
      <div className="space-y-6 pb-16">
        {/* 应用设置表单卡片 */}
        <SectionCard title={t('sectionTitles.appSettings')}>
          <SettingsForm />
        </SectionCard>

        {/* 问题反馈卡片 */}
        <SectionCard title={t('feedbackCardTitle')}>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('feedbackCardDescription')}
            </p>
            <button
              onClick={openFeedbackModal}
              className="inline-flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <MessageSquareWarning className="w-4 h-4" />
              <span>{t('feedbackBtn')}</span>
            </button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
};

export default SettingsContent;
