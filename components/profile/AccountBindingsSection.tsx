/*
 * @Date: 2025-11-03 15:21:06
 * @LastEditTime: 2025-11-08 23:08:59
 * @Description: 账号绑定管理组件，允许用户查看、绑定和解绑第三方账号
 */
'use client';

import React, { useState } from 'react';
import { Unlink, Loader2, Link as LinkIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppContext } from '@/contexts/app.context';
import { apiGetOAuthUrl, apiUnlinkOAuth } from '@/services/authService';
import SectionCard from '../common/SectionCard';
import { useTranslations } from 'next-intl';

/**
 * 账号绑定组件属性类型
 */
interface AccountBindingsSectionProps {
  /** 已绑定的第三方平台列表（如['github', 'google']） */
  boundProviders: string[];
}

/**
 * 危险操作按钮组件
 * 用于执行解绑等具有潜在风险的操作，采用红色主题以提示用户注意
 */
const ButtonDanger: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
  children,
  className,
  ...props
}) => (
  <button
    type="button"
    className={`inline-flex items-center justify-center rounded-lg border border-transparent bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 dark:hover:bg-red-500 transition-colors duration-200 ${className}`}
    {...props}
  >
    {children}
  </button>
);

/**
 * 常规操作按钮组件
 * 用于执行绑定等安全操作，采用中性主题，与危险操作按钮形成视觉区分
 */
const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
  children,
  className,
  ...props
}) => (
  <button
    type="button"
    className={`inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700 transition-colors duration-200 ${className}`}
    {...props}
  >
    {children}
  </button>
);

/**
 * 账号绑定管理组件
 * 展示用户当前已绑定的第三方账号，提供绑定新账号和解绑已有账号的功能
 * 包含操作确认机制、加载状态显示和操作结果反馈，确保用户操作安全可控
 */
const AccountBindingsSection: React.FC<AccountBindingsSectionProps> = ({
  boundProviders,
}) => {
  const { refreshUser } = useAppContext(); // 用于解绑后刷新用户信息
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null); // 跟踪当前正在处理的平台加载状态
  const t = useTranslations('Profile.accountBindings'); // 账号绑定相关国际化文本
  const tCommon = useTranslations('common'); // 通用国际化文本（按钮、提示等）

  // 检查各平台绑定状态
  const isGitHubBound = boundProviders.includes('github');
  const isGoogleBound = boundProviders.includes('google');

  /**
   * 解除第三方账号绑定
   * @param provider 第三方平台标识（如'github'、'google'）
   * 流程：显示确认对话框 → 调用解绑API → 处理结果反馈 → 刷新用户信息
   */
  const handleUnlink = async (provider: string) => {
    // 获取平台显示名称（用于确认信息和提示）
    const providerName = provider === 'github' ? t('github') : t('google');

    // 显示确认对话框，防止误操作
    if (!confirm(t('unbindConfirm', { provider: providerName }))) {
      return;
    }

    setLoadingProvider(provider); // 开始加载
    try {
      await apiUnlinkOAuth(provider); // 调用解绑API
      toast.success(t('unbindSuccess', { provider: providerName })); // 成功提示
      refreshUser(); // 刷新用户信息以更新绑定状态
    } catch (error) {
      // 错误处理：优先使用API返回的错误信息，否则使用通用错误提示
      toast.error(
        (error as Error).message || tCommon('messages.operationFailed')
      );
    } finally {
      setLoadingProvider(null); // 结束加载
    }
  };

  /**
   * 绑定第三方账号
   * @param provider 第三方平台标识（如'github'、'google'）
   * 流程：调用获取授权URL的API → 跳转到第三方授权页面
   */
  const handleLink = async (provider: string) => {
    setLoadingProvider(provider); // 开始加载
    try {
      const { url } = await apiGetOAuthUrl(provider); // 获取授权URL
      window.location.href = url; // 跳转到第三方授权页面
    } catch (error) {
      // 错误处理：显示绑定失败提示
      toast.error((error as Error).message || t('bindFailed'));
      setLoadingProvider(null); // 结束加载
    }
  };

  /**
   * 渲染第三方账号绑定项
   * @param provider 平台标识（'github' 或 'google'）
   * @param name 平台显示名称
   * @param imgPath 平台图标路径
   * @param altText 图标无障碍文本
   * @param isBound 是否已绑定
   * @returns 单个平台的绑定状态和操作按钮组件
   */
  const renderBindingItem = (
    provider: 'github' | 'google',
    name: string,
    imgPath: string,
    altText: string,
    isBound: boolean
  ) => {
    const isLoading = loadingProvider === provider; // 当前平台是否正在处理操作
    return (
      <li className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-800 last:border-0 group">
        {/* 平台图标和名称 */}
        <div className="flex items-center space-x-3">
          {/* 平台图标（添加hover缩放效果增强交互感） */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgPath}
            alt={altText}
            className="h-6 w-6 transition-transform group-hover:scale-110"
          />
          <span className="font-medium text-gray-900 dark:text-white">
            {name}
          </span>
        </div>

        {/* 操作按钮（绑定或解绑） */}
        <div>
          {isBound ? (
            // 已绑定：显示解绑按钮（危险操作）
            <ButtonDanger
              onClick={() => handleUnlink(provider)}
              disabled={isLoading}
              aria-label={tCommon('buttons.unbind', { name })}
            >
              {isLoading ? (
                <Loader2
                  className="mr-2 h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <Unlink className="mr-2 h-4 w-4" aria-hidden="true" />
              )}
              {tCommon('buttons.unbind')}
            </ButtonDanger>
          ) : (
            // 未绑定：显示绑定按钮（常规操作）
            <Button
              onClick={() => handleLink(provider)}
              disabled={isLoading}
              aria-label={tCommon('buttons.bind', { name })}
            >
              {isLoading ? (
                <Loader2
                  className="mr-2 h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <LinkIcon className="mr-2 h-4 w-4" aria-hidden="true" />
              )}
              {tCommon('buttons.bind')}
            </Button>
          )}
        </div>
      </li>
    );
  };

  return (
    <SectionCard title={t('title')}>
      {/* 功能说明文本 */}
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {t('description')}
      </div>

      {/* 第三方平台绑定列表 */}
      <ul className="space-y-0">
        {renderBindingItem(
          'github',
          t('github'),
          '/images/social/github.svg',
          t('github'),
          isGitHubBound
        )}
        {renderBindingItem(
          'google',
          t('google'),
          '/images/social/google.svg',
          t('google'),
          isGoogleBound
        )}
      </ul>
    </SectionCard>
  );
};

export default AccountBindingsSection;
