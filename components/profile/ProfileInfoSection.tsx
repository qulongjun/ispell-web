/*
 * @Date: 2025-11-03 15:12:28
 * @LastEditTime: 2025-11-08 11:56:19
 * @Description: 个人资料信息设置组件
 */
'use client';

import React, { useState, useRef, ChangeEvent, FormEvent } from 'react';
import { User } from '@/types/auth.types';
import { useAppContext } from '@/contexts/app.context';
import toast from 'react-hot-toast';
import {
  Save,
  Loader2,
  Edit2,
  User as UserIcon,
  AlertCircle,
} from 'lucide-react';
import { apiUpdateProfile, apiUpdateAvatar } from '@/services/authService';
import { resolveCdnUrl } from '@/utils/cdn.utils';
import SectionCard from '../common/SectionCard';
import { z } from 'zod';
import { useAuthForm } from '@/hooks/useAuthForm';
import { useTranslations } from 'next-intl';

/**
 * 表单按钮组件
 * 统一的提交按钮样式
 */
const FormButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
  children,
  className,
  ...props
}) => (
  <button
    type="submit"
    className={`inline-flex items-center justify-center rounded-lg border border-transparent bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors duration-200 ${className}`}
    {...props}
  >
    {children}
  </button>
);

/**
 * 头像操作按钮组件
 * 用于头像悬停时显示的编辑按钮
 */
const AvatarButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
  children,
  className,
  ...props
}) => (
  <button
    type="button"
    className={`rounded-full p-2 text-white transition-all duration-300 transform hover:scale-110 ${className}`}
    {...props}
  >
    {children}
  </button>
);

// 昵称验证规则 - 最多10个字符
const profileSchema = z.object({
  nickname: z
    .string()
    .min(1, { message: 'nicknameRequired' })
    .max(10, { message: 'nicknameTooLong' }),
});

type FormErrors = {
  nickname?: string[];
};

interface ProfileInfoSectionProps {
  user: User;
}

/**
 * 个人资料设置组件
 * 允许用户修改头像和昵称
 */
const ProfileInfoSection: React.FC<ProfileInfoSectionProps> = ({ user }) => {
  const { refreshUser } = useAppContext();
  const t = useTranslations('Profile.profileInfo');
  const tErr = useTranslations('Errors');
  const tCommon = useTranslations('common');
  const tAlt = useTranslations('Alt');

  const {
    isLoading: isSaving,
    setIsLoading: setIsSaving,
    apiError,
    translateAndSetApiError,
    clearErrors,
  } = useAuthForm();

  const [nickname, setNickname] = useState(user.nickname || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isShaking, setIsShaking] = useState(false);

  /**
   * 处理头像文件选择
   * 验证文件大小并生成预览
   */
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error(tErr('avatarTooLarge'));
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  /**
   * 触发隐藏的文件选择输入框
   * 用于头像上传
   */
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  /**
   * 提交表单处理
   * 验证并更新用户资料
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrors({});
    clearErrors();

    // 验证昵称
    const validation = profileSchema.safeParse({ nickname });
    if (!validation.success) {
      const fieldErrors: FormErrors = {};
      for (const issue of validation.error.issues) {
        const path = issue.path[0] as keyof FormErrors;
        fieldErrors[path] = [tErr(issue.message)];
      }
      setErrors(fieldErrors);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      setIsSaving(false);
      return;
    }

    // 检查是否有变更
    const isNicknameChanged = nickname !== (user.nickname || '');
    const isAvatarChanged = !!avatarFile;

    if (!isNicknameChanged && !isAvatarChanged) {
      toast(tCommon('messages.noChangesToSave'));
      setIsSaving(false);
      return;
    }

    try {
      // 更新昵称
      if (isNicknameChanged) {
        await apiUpdateProfile({ nickname: validation.data.nickname });
      }

      // 更新头像
      if (isAvatarChanged) {
        const formData = new FormData();
        formData.append('avatar', avatarFile as File);
        await apiUpdateAvatar(formData);
      }

      toast.success(t('saveSuccess'));
      await refreshUser();
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (error) {
      console.error('更新资料失败:', error);
      translateAndSetApiError((error as Error).message || tErr('unknownError'));
    } finally {
      setIsSaving(false);
    }
  };

  // 头像图片源
  const avatarSrc =
    avatarPreview || resolveCdnUrl(user.avatar) || '/images/user/default.png';

  return (
    <SectionCard
      title={t('title')}
      footer={
        <FormButton form="profile-form" disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {tCommon('buttons.save')}
        </FormButton>
      }
    >
      <form
        id="profile-form"
        onSubmit={handleSubmit}
        className={`space-y-6 ${isShaking ? 'animate-shake' : ''}`}
      >
        {/* 头像设置区域 */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('avatarLabel')}
          </label>
          <div className="flex items-center">
            <div className="relative h-24 w-24 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-300 hover:shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatarSrc}
                alt={tAlt('userAvatar')}
                className="h-full w-full object-cover transition-transform duration-500 hover:scale-110"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    '/images/user/default.png';
                }}
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <AvatarButton
                  onClick={triggerFileInput}
                  className="bg-white/20 backdrop-blur-sm hover:bg-white/40"
                  aria-label={tAlt('changeAvatar')}
                >
                  <Edit2 className="h-5 w-5" />
                </AvatarButton>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex flex-col">
              <div
                className="ml-4 text-sm text-gray-500 dark:text-gray-400"
                dangerouslySetInnerHTML={{ __html: t('avatarHint') }}
              />
              {avatarFile && (
                <p className="ml-4 mt-1 text-xs text-green-600 dark:text-green-400">
                  {t('chooseAvatar')}: {avatarFile.name}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 昵称设置区域 */}
        <div className="space-y-2">
          <label
            htmlFor="nickname"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {t('nicknameLabel')}
          </label>
          <div className="relative">
            <UserIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={10}
              disabled={isSaving}
              placeholder={t('nicknamePlaceholder')}
              className={`w-full rounded-lg border py-3 pl-10 pr-4 text-gray-900 focus:outline-none dark:bg-gray-800 dark:text-white transition-all duration-200 ${
                errors.nickname
                  ? 'border-red-500 focus:ring-1 focus:ring-red-500'
                  : 'border-gray-300 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 dark:border-gray-700'
              }`}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
              {nickname.length}/10
            </span>
          </div>
          {errors.nickname && (
            <p className="mt-1 text-xs text-red-500 flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" />
              {errors.nickname[0]}
            </p>
          )}
        </div>

        {/* API 错误提示 */}
        {apiError && (
          <div className="flex items-center space-x-2 text-sm text-red-500 h-5 animate-fade-in">
            <AlertCircle className="h-4 w-4" />
            <span>{apiError}</span>
          </div>
        )}
      </form>
    </SectionCard>
  );
};

export default ProfileInfoSection;
