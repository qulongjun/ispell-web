/*
 * @Date: 2025-11-03 15:21:06
 * @LastEditTime: 2025-11-04 15:01:03
 * @Description:
 */
'use client';

import React, { useState } from 'react';
import { Unlink, Loader2, Link as LinkIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppContext } from '@/contexts/app.context';
import { apiGetOAuthUrl, apiUnlinkOAuth } from '@/services/authService';
import SectionCard from '../common/SectionCard';
import { useTranslations } from 'next-intl';

interface AccountBindingsSectionProps {
  boundProviders: string[];
}

/**
 * 危险操作按钮组件
 * 用于解除绑定等危险操作
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
 * 普通操作按钮组件
 * 用于绑定等常规操作
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
 * 账号绑定组件
 * 允许用户绑定或解除绑定第三方账号（GitHub、Google等）
 */
const AccountBindingsSection: React.FC<AccountBindingsSectionProps> = ({
  boundProviders,
}) => {
  const { refreshUser } = useAppContext();
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const t = useTranslations('Profile.accountBindings');
  const tCommon = useTranslations('common');

  // 检查各平台绑定状态
  const isGitHubBound = boundProviders.includes('github');
  const isGoogleBound = boundProviders.includes('google');

  /**
   * 解除账号绑定
   * @param provider 第三方平台标识
   */
  const handleUnlink = async (provider: string) => {
    const providerName = provider === 'github' ? t('github') : t('google');
    if (!confirm(t('unbindConfirm', { provider: providerName }))) {
      return;
    }

    setLoadingProvider(provider);
    try {
      await apiUnlinkOAuth(provider);
      toast.success(t('unbindSuccess', { provider: providerName }));
      refreshUser();
    } catch (error) {
      toast.error(
        (error as Error).message || tCommon('messages.operationFailed')
      );
    } finally {
      setLoadingProvider(null);
    }
  };

  /**
   * 绑定第三方账号
   * @param provider 第三方平台标识
   */
  const handleLink = async (provider: string) => {
    setLoadingProvider(provider);
    try {
      const { url } = await apiGetOAuthUrl(provider);
      window.location.href = url;
    } catch (error) {
      toast.error((error as Error).message || t('bindFailed'));
      setLoadingProvider(null);
    }
  };

  /**
   * 渲染绑定项
   * @param provider 平台标识
   * @param name 平台名称
   * @param imgPath 平台图标路径
   * @param altText 图标alt文本
   * @param isBound 是否已绑定
   */
  const renderBindingItem = (
    provider: 'github' | 'google',
    name: string,
    imgPath: string,
    altText: string,
    isBound: boolean
  ) => {
    const isLoading = loadingProvider === provider;
    return (
      <li className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-800 last:border-0 group">
        <div className="flex items-center space-x-3">
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
        <div>
          {isBound ? (
            <ButtonDanger
              onClick={() => handleUnlink(provider)}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Unlink className="mr-2 h-4 w-4" />
              )}
              {tCommon('buttons.unbind')}
            </ButtonDanger>
          ) : (
            <Button onClick={() => handleLink(provider)} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LinkIcon className="mr-2 h-4 w-4" />
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
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {t('description')}
      </div>
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
