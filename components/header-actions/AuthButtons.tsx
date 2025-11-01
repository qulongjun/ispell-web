'use client';
/*
 * @Date: 2025-10-28 21:50:38
 * @LastEditTime: 2025-10-31 14:44:55
 * @Description: 登录按钮
 */

import React from 'react';
import { useAppContext } from '@/contexts/app.context';
import { useTranslations } from 'next-intl';

const AuthButtons: React.FC = () => {
  const t = useTranslations('AuthButton');
  const { openLoginModal } = useAppContext();

  return (
    <div className="flex items-center">
      <button
        onClick={openLoginModal}
        className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm hover:bg-gray-700 dark:text-gray-900 dark:bg-white dark:hover:bg-gray-300 transition-colors duration-200  focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 "
      >
        {t('login')}
      </button>
    </div>
  );
};

export default AuthButtons;
