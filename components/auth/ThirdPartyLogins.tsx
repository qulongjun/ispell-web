/*
 * @Description: 共享的第三方登录按钮组件
 * @Date: 2025-10-31
 */
/* eslint-disable @next/next/no-img-element */
import React from 'react';
import { useTranslations } from 'next-intl';

type ThirdPartyLoginsProps = {
  handleOAuthClick: (provider: string, width: number, height: number) => void;
  isLoading: boolean;
};

const ThirdPartyLogins: React.FC<ThirdPartyLoginsProps> = ({
  handleOAuthClick,
  isLoading,
}) => {
  const t = useTranslations('LoginModal');
  const t_alt = useTranslations('Alt');

  return (
    <div className="my-6">
      <div className="relative flex items-center justify-center">
        <span className="absolute w-full border-t border-gray-300 dark:border-gray-700"></span>
        <span className="relative z-10 bg-white px-4 text-sm text-gray-500 dark:bg-gray-900">
          {t('thirdParty')}
        </span>
      </div>
      <div className="mt-6 flex justify-center space-x-4">
        {/* 微信按钮 */}
        <button
          onClick={() => handleOAuthClick('wechat', 600, 550)}
          disabled={isLoading}
          className="rounded-full border border-gray-300 p-2.5 text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <img
            src="/images/social/wechat.svg"
            alt={t_alt('wechat')}
            className="h-5 w-5"
          />
        </button>

        {/* QQ 按钮 */}
        <button
          onClick={() => handleOAuthClick('qq', 600, 500)}
          disabled={isLoading}
          className="rounded-full border border-gray-300 p-2.5 text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <img
            src="/images/social/qq.svg"
            alt={t_alt('qq')}
            className="h-5 w-5"
          />
        </button>

        {/* Google 按钮 */}
        <button
          onClick={() => handleOAuthClick('google', 600, 700)}
          disabled={isLoading}
          className="rounded-full border border-gray-300 p-2.5 text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <img
            src="/images/social/google.svg"
            alt={t_alt('google')}
            className="h-5 w-5"
          />
        </button>

        {/* GitHub 按钮 */}
        <button
          onClick={() => handleOAuthClick('github', 600, 700)}
          disabled={isLoading}
          className="rounded-full border border-gray-300 p-2.5 text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <img
            src="/images/social/github.svg"
            alt={t_alt('github')}
            className="h-5 w-5"
          />
        </button>
      </div>
    </div>
  );
};

export default ThirdPartyLogins;
