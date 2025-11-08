/*
 * @Date: 2025-11-01 00:08:55
 * @LastEditTime: 2025-11-08 22:18:33
 * @Description: 第三方登录选项组件
 * 展示Google和GitHub的第三方登录按钮，提供社交账号快捷登录功能
 * 依赖父组件传递的点击处理函数和加载状态，控制按钮交互与禁用状态
 */

import React from 'react';
import { useTranslations } from 'next-intl';

/**
 * 第三方登录组件的属性类型定义
 */
type ThirdPartyLoginsProps = {
  /**
   * 处理第三方登录点击的回调函数
   * @param provider 第三方登录提供商（如'google'、'github'）
   * @param width 登录弹窗宽度
   * @param height 登录弹窗高度
   */
  handleOAuthClick: (provider: string, width: number, height: number) => void;
  /**
   * 加载状态标记，为true时禁用所有登录按钮
   */
  isLoading: boolean;
};

/**
 * 第三方登录选项组件
 * 提供Google和GitHub的快捷登录入口，包含分隔线和图标按钮
 * 按钮状态随加载状态动态变化，点击触发父组件传递的OAuth处理逻辑
 */
const ThirdPartyLogins: React.FC<ThirdPartyLoginsProps> = ({
  handleOAuthClick,
  isLoading,
}) => {
  // 国际化翻译：登录相关文本
  const t = useTranslations('LoginModal');
  // 国际化翻译：替代文本（用于图片alt属性）
  const t_alt = useTranslations('Alt');

  return (
    <div className="my-6">
      {/* 分隔线与提示文本：用于区分账号密码登录和第三方登录 */}
      <div className="relative flex items-center justify-center">
        <span className="absolute w-full border-t border-gray-300 dark:border-gray-700"></span>
        <span className="relative z-10 bg-white px-4 text-sm text-gray-500 dark:bg-gray-900">
          {t('thirdParty')} {/* 文本内容："或使用以下方式登录" */}
        </span>
      </div>

      {/* 第三方登录按钮组 */}
      <div className="mt-6 flex justify-center space-x-4">
        {/* Google登录按钮 */}
        <button
          onClick={() => handleOAuthClick('google', 600, 700)}
          disabled={isLoading}
          className="rounded-full border border-gray-300 p-2.5 text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          aria-label={t_alt('google')}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/social/google.svg"
            alt={t_alt('google')}
            className="h-5 w-5"
          />
        </button>

        {/* GitHub登录按钮 */}
        <button
          onClick={() => handleOAuthClick('github', 600, 700)}
          disabled={isLoading}
          className="rounded-full border border-gray-300 p-2.5 text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          aria-label={t_alt('github')}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
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
