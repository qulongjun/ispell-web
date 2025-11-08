/*
 * @Date: 2025-11-03 15:12:52
 * @LastEditTime: 2025-11-08 10:42:02
 * @Description: 
 */
'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import toast from 'react-hot-toast';
import SectionCard from '../common/SectionCard';
import {
  Save,
  Loader2,
  Mail,
  MessageSquare,
  Lock,
  Key,
  AlertCircle,
} from 'lucide-react';
import { User } from '@/types/auth.types';
import { ApiError } from '@/utils/error.utils'; // [!!] 导入 ApiError

// [!! 关键修改 1: 拆分 Imports !!]
import {
  apiResetPassword,
  apiSendCode, // [!!] 需要导入 apiSendCode
  COUNTDOWN_TIMESTAMP_KEY,
  COUNTDOWN_SECONDS, // [!!] 导入 COUNTDOWN_SECONDS
  getInitialCountdown, // [!!] 导入 getInitialCountdown
} from '@/services/authService';
// [!!] 从 authSchema 导入
import {
  passwordSchema,
  codeSchema,
  changePasswordSchema, // [!!] 导入在 authSchema.ts 中定义的新 schema
} from '@/schema/authSchema';
// [!! 修改结束 !!]

import { z } from 'zod';
// [!!] 不再需要 useAuthForm，我们将在此处实现逻辑
// import { useAuthForm } from '@/hooks/useAuthForm'; 
import { useTranslations } from 'next-intl';

/**
 * 表单提交按钮组件 (不变)
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
 * 验证码按钮组件 (不变)
 */
const CodeButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
  children,
  className,
  ...props
}) => (
  <button
    type="button"
    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
      props.disabled
        ? 'text-gray-400 cursor-not-allowed'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
    } ${className}`}
    {...props}
  >
    {children}
  </button>
);

// [!!] Zod schema 已从 authSchema.ts 导入
type FormErrors = {
  code?: string[];
  newPassword?: string[];
  confirmPassword?: string[];
};

interface ChangePasswordSectionProps {
  user: User;
}

const ChangePasswordSection: React.FC<ChangePasswordSectionProps> = ({
  user,
}) => {
  const t = useTranslations('Profile.changePassword');
  const tErr = useTranslations('Errors');
  const tCommon = useTranslations('common');

  // [!! 修改 !!] 移入 useAuthForm 的状态
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(getInitialCountdown());
  // [!! 修改结束 !!]

  const [errors, setErrors] = useState<FormErrors>({});
  const [isShaking, setIsShaking] = useState(false);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 联系方式及类型
  const contactIdentifier = user.email || user.phone;
  const contactTypeLabel = user.email
    ? t('contactLabel_email')
    : t('contactLabel_phone');

  // [!! 新增 !!] 倒计时
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);
  
  // 清除错误状态
  useEffect(() => {
    setApiError(null);
    setErrors({});
  }, []);

  /**
   * [!! 修改 !!]
   * 发送验证码处理
   */
  const handleSendCode = async () => {
    if (!contactIdentifier) {
      toast.error(tErr('noEmailORPhone'));
      return;
    }
    
    setIsLoading(true);
    setApiError(null);
    try {
      await apiSendCode(contactIdentifier);
      toast.success(tErr('sendCodeSuccess'));
      setCountdown(COUNTDOWN_SECONDS);
      localStorage.setItem(COUNTDOWN_TIMESTAMP_KEY, Date.now().toString());
    } catch (error) {
       console.error('Send code failed:', error);
      if (error instanceof ApiError) {
        const message = tErr(`e${error.code}`, {
          defaultValue: tErr('unknownError'),
        });
        toast.error(message);
      } else {
        toast.error(tErr('unknownError'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * [!! 修改 !!]
   * 提交密码修改表单
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setApiError(null);

    // 验证表单数据
    const validation = changePasswordSchema.safeParse({
      code,
      newPassword,
      confirmPassword,
    });
    if (!validation.success) {
      const fieldErrors: FormErrors = {};
      for (const issue of validation.error.issues) {
        const path = issue.path[0] as keyof FormErrors;
        fieldErrors[path] = [tErr(issue.message)];
      }
      setErrors(fieldErrors);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    if (!contactIdentifier) {
      toast.error(tErr('infoNotComplete'));
      return;
    }

    setIsLoading(true);
    try {
      await apiResetPassword({
        emailOrPhone: contactIdentifier,
        password: newPassword,
        confirmPassword: confirmPassword, // [!!] 确保 apiResetPassword 接受
        code: code,
      });
      toast.success(
        user.hasPassword ? t('saveSuccess_change') : t('saveSuccess_set')
      );
      setCode('');
      setNewPassword('');
      setConfirmPassword('');
      localStorage.removeItem(COUNTDOWN_TIMESTAMP_KEY); // 清除倒计时
      setCountdown(0);
    } catch (error) {
      // [!! 修改 !!]
      console.error('Reset password failed:', error);
      if (error instanceof ApiError) {
        const message = tErr(`e${error.code}`, {
          defaultValue: tErr('unknownError'),
        });
        setApiError(message);
      } else {
        setApiError(tErr('unknownError'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 根据用户状态显示不同标题和描述
  const title = user.hasPassword ? t('title') : t('setPasswordTitle');
  const description = user.hasPassword
    ? t('description')
    : t('setPasswordDescription');

  return (
    // ... (其余 JSX 代码与您提供的文件 100% 相同) ...
    <SectionCard
      title={title}
      footer={
        <FormButton
          form="change-password-form"
          disabled={isLoading || !contactIdentifier}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {tCommon('buttons.save')}
        </FormButton>
      }
    >
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        {description}
      </div>

      <form
        id="change-password-form"
        onSubmit={handleSubmit}
        className={`space-y-5 ${isShaking ? 'animate-shake' : ''}`}
      >
        {/* 账号显示（只读） */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {contactTypeLabel}
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={contactIdentifier || ''}
              disabled
              className="w-full rounded-lg border py-3 pl-10 pr-4 text-gray-900 bg-gray-50 focus:outline-none dark:bg-gray-800 dark:text-white border-gray-300 dark:border-gray-700 disabled:opacity-70"
            />
          </div>
        </div>

        {/* 验证码输入 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('verificationCodeLabel')}
          </label>
          <div className="relative">
            <MessageSquare className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('verificationCodePlaceholder')}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={isLoading}
              maxLength={6}
              className={`w-full rounded-lg border py-3 pl-10 pr-32 text-gray-900 focus:outline-none dark:bg-gray-800 dark:text-white ${
                errors.code
                  ? 'border-red-500 focus:ring-1 focus:ring-red-500'
                  : 'border-gray-300 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 dark:border-gray-700'
              } transition-all duration-200`}
            />
            <CodeButton
              onClick={handleSendCode}
              disabled={!contactIdentifier || isLoading || countdown > 0}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              {countdown > 0
                ? t('resendCodeBtn', { seconds: countdown })
                : t('getCodeBtn')}
            </CodeButton>
          </div>
          {errors.code && (
            <p className="mt-1 text-xs text-red-500 flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" />
              {errors.code[0]}
            </p>
          )}
        </div>

        {/* 新密码输入 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('newPasswordLabel')}
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="password"
              placeholder={t('newPasswordPlaceholder')}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isLoading}
              className={`w-full rounded-lg border py-3 pl-10 pr-4 text-gray-900 focus:outline-none dark:bg-gray-800 dark:text-white ${
                errors.newPassword
                  ? 'border-red-500 focus:ring-1 focus:ring-red-500'
                  : 'border-gray-300 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 dark:border-gray-700'
              } transition-all duration-200`}
            />
          </div>
          {errors.newPassword && (
            <p className="mt-1 text-xs text-red-500 flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" />
              {errors.newPassword[0]}
            </p>
          )}
        </div>

        {/* 确认新密码输入 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('confirmPasswordLabel')}
          </label>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="password"
              placeholder={t('confirmPasswordPlaceholder')}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              className={`w-full rounded-lg border py-3 pl-10 pr-4 text-gray-900 focus:outline-none dark:bg-gray-800 dark:text-white ${
                errors.confirmPassword
                  ? 'border-red-500 focus:ring-1 focus:ring-red-500'
                  : 'border-gray-300 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 dark:border-gray-700'
              } transition-all duration-200`}
            />
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-red-500 flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" />
              {errors.confirmPassword[0]}
            </p>
          )}
        </div>

        {/* API 错误提示 */}
        {apiError && (
          <div className="flex items-center space-x-2 text-sm text-red-500 h-5 pt-2 animate-fade-in">
            <AlertCircle className="h-4 w-4" />
            <span>{apiError}</span>
          </div>
        )}
      </form>
    </SectionCard>
  );
};

export default ChangePasswordSection;