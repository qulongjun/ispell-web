'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/app.context';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import ProfileInfoSection from '@/components/profile/ProfileInfoSection';
import ChangePasswordSection from '@/components/profile/ChangePasswordSection';
import AccountBindingsSection from '@/components/profile/AccountBindingsSection';
import DeleteAccountSection from '@/components/profile/DeleteAccountSection';

/**
 * 个性化设置页面组件
 * 整合个人资料、密码修改、账号绑定和账户删除功能模块
 */
export default function ProfilePage() {
  const { user, isLoggedIn, isLoading, logout } = useAppContext();
  const router = useRouter();
  const t = useTranslations('Profile');

  // 身份验证保护 - 未登录用户自动跳转
  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push('/');
    }
  }, [isLoading, isLoggedIn, router]);

  // 加载状态显示
  if (isLoading || !isLoggedIn || !user) {
    return (
      <div className="flex min-h-[60vh] justify-center items-center">
        <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
      </div>
    );
  }

  // 检查账户状态 - 已删除账户处理
  if (user.status !== 'ACTIVE') {
    toast.error('账户已被删除');
    logout();
    router.push('/');
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('pageTitle')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          {t('pageDescription')}
        </p>
      </div>

      <div className="space-y-6 pb-16">
        <ProfileInfoSection user={user} />
        <ChangePasswordSection user={user} />
        <AccountBindingsSection boundProviders={user.boundProviders || []} />
        <DeleteAccountSection user={user} />
      </div>
    </div>
  );
}
