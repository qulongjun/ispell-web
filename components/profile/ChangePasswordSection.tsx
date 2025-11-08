/*
 * @Date: 2025-11-03 15:12:52
 * @LastEditTime: 2025-11-08 23:11:15
 * @Description: 密码修改组件
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
import { ApiError } from '@/utils/error.utils';
import { useTranslations } from 'next-intl';
import { z } from 'zod';

// 认证服务与常量
import {
  apiResetPassword,
  apiSendCode,
  COUNTDOWN_TIMESTAMP_KEY,
  COUNTDOWN_SECONDS,
  getInitialCountdown,
} from '@/services/authService';

// 密码修改表单验证 schema
import { changePasswordSchema } from '@/schema/authSchema';

/**
 * 表单提交按钮组件
 * 用于密码修改表单的提交操作，包含加载状态样式
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
 * 验证码按钮组件
 * 用于发送/重发验证码，根据状态显示不同样式（可用/禁用）
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

/**
 * 密码修改表单错误类型
 * 对应表单字段的验证错误信息
 */
type FormErrors = {
  code?: string[];
  newPassword?: string[];
  confirmPassword?: string[];
};

/**
 * 密码修改组件属性类型
 */
interface ChangePasswordSectionProps {
  /** 当前用户信息（用于获取联系方式和判断是否已设置密码） */
  user: User;
}

/**
 * 密码修改组件
 * 功能：
 * - 已设置密码用户：修改现有密码
 * - 未设置密码用户：首次设置密码
 * - 通过验证码验证用户身份（发送至用户绑定的邮箱/手机）
 * - 包含表单验证（密码强度、验证码格式、两次输入一致性）
 * - 提供验证码倒计时、加载状态和操作结果反馈
 */
const ChangePasswordSection: React.FC<ChangePasswordSectionProps> = ({
  user,
}) => {
  // 国际化翻译
  const t = useTranslations('Profile.changePassword');
  const tErr = useTranslations('Errors');
  const tCommon = useTranslations('common');

  // 状态管理
  const [isLoading, setIsLoading] = useState(false); // 整体加载状态
  const [apiError, setApiError] = useState<string | null>(null); // API请求错误信息
  const [countdown, setCountdown] = useState(getInitialCountdown()); // 验证码倒计时
  const [errors, setErrors] = useState<FormErrors>({}); // 表单验证错误
  const [isShaking, setIsShaking] = useState(false); // 表单验证失败时的抖动动画
  const [code, setCode] = useState(''); // 验证码输入
  const [newPassword, setNewPassword] = useState(''); // 新密码输入
  const [confirmPassword, setConfirmPassword] = useState(''); // 确认密码输入

  // 用户联系方式信息
  const contactIdentifier = user.email || user.phone; // 用于接收验证码的邮箱/手机号
  const contactTypeLabel = user.email
    ? t('contactLabel_email')
    : t('contactLabel_phone'); // 联系方式类型标签

  /**
   * 验证码倒计时效果
   * 每秒更新一次倒计时，直到归零
   */
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer); // 清理定时器
    }
  }, [countdown]);

  /**
   * 组件初始化时清除错误状态
   */
  useEffect(() => {
    setApiError(null);
    setErrors({});
  }, []);

  /**
   * 发送验证码
   * 流程：验证联系方式存在 → 调用发送验证码API → 处理结果 → 更新倒计时
   */
  const handleSendCode = async () => {
    if (!contactIdentifier) {
      toast.error(tErr('noEmailORPhone')); // 无联系方式时提示错误
      return;
    }

    setIsLoading(true);
    setApiError(null);
    try {
      await apiSendCode(contactIdentifier); // 调用发送验证码接口
      toast.success(tErr('sendCodeSuccess')); // 发送成功提示
      setCountdown(COUNTDOWN_SECONDS); // 开始倒计时
      localStorage.setItem(COUNTDOWN_TIMESTAMP_KEY, Date.now().toString()); // 保存倒计时起始时间
    } catch (error) {
      console.error('发送验证码失败:', error);
      // 错误处理：区分API错误和普通错误
      if (error instanceof ApiError) {
        const message = tErr(`e${error.code}`, {
          defaultValue: tErr('unknownError'),
        });
        toast.error(message);
      } else {
        toast.error(tErr('unknownError'));
      }
    } finally {
      setIsLoading(false); // 结束加载状态
    }
  };

  /**
   * 提交密码修改表单
   * 流程：表单验证 → 调用修改密码API → 处理结果 → 重置表单（成功时）
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({}); // 清除现有错误
    setApiError(null); // 清除现有API错误

    // 表单数据验证（使用zod schema）
    const validation = changePasswordSchema.safeParse({
      code,
      newPassword,
      confirmPassword,
    });
    if (!validation.success) {
      // 整理验证错误信息
      const fieldErrors: FormErrors = {};
      for (const issue of validation.error.issues) {
        const path = issue.path[0] as keyof FormErrors;
        fieldErrors[path] = [tErr(issue.message)];
      }
      setErrors(fieldErrors); // 显示验证错误
      setIsShaking(true); // 触发抖动动画
      setTimeout(() => setIsShaking(false), 500); // 500ms后停止动画
      return;
    }

    // 验证联系方式存在
    if (!contactIdentifier) {
      toast.error(tErr('infoNotComplete'));
      return;
    }

    setIsLoading(true);
    try {
      // 调用修改密码API
      await apiResetPassword({
        emailOrPhone: contactIdentifier,
        password: newPassword,
        confirmPassword: confirmPassword,
        code: code,
      });

      // 成功提示（区分修改和首次设置）
      toast.success(
        user.hasPassword ? t('saveSuccess_change') : t('saveSuccess_set')
      );

      // 重置表单
      setCode('');
      setNewPassword('');
      setConfirmPassword('');
      localStorage.removeItem(COUNTDOWN_TIMESTAMP_KEY); // 清除倒计时
      setCountdown(0);
    } catch (error) {
      console.error('修改密码失败:', error);
      // 错误处理：区分API错误和普通错误
      if (error instanceof ApiError) {
        const message = tErr(`e${error.code}`, {
          defaultValue: tErr('unknownError'),
        });
        setApiError(message); // 显示API错误
      } else {
        setApiError(tErr('unknownError')); // 显示通用错误
      }
    } finally {
      setIsLoading(false); // 结束加载状态
    }
  };

  // 根据用户状态显示不同标题和描述
  const title = user.hasPassword ? t('title') : t('setPasswordTitle');
  const description = user.hasPassword
    ? t('description')
    : t('setPasswordDescription');

  return (
    <SectionCard
      title={title}
      footer={
        <FormButton
          form="change-password-form"
          disabled={isLoading || !contactIdentifier}
          aria-label={tCommon('buttons.save')}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="mr-2 h-4 w-4" aria-hidden="true" />
          )}
          {tCommon('buttons.save')}
        </FormButton>
      }
    >
      {/* 功能说明文本 */}
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        {description}
      </div>

      {/* 密码修改表单 */}
      <form
        id="change-password-form"
        onSubmit={handleSubmit}
        className={`space-y-5 ${isShaking ? 'animate-shake' : ''}`}
        noValidate // 禁用浏览器默认验证
      >
        {/* 账号显示（只读） */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {contactTypeLabel}
          </label>
          <div className="relative">
            <Mail
              className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
            <input
              type="text"
              value={contactIdentifier || ''}
              disabled
              className="w-full rounded-lg border py-3 pl-10 pr-4 text-gray-900 bg-gray-50 focus:outline-none dark:bg-gray-800 dark:text-white border-gray-300 dark:border-gray-700 disabled:opacity-70"
              aria-readonly="true"
            />
          </div>
        </div>

        {/* 验证码输入 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('verificationCodeLabel')}
          </label>
          <div className="relative">
            <MessageSquare
              className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
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
              aria-invalid={!!errors.code}
              aria-describedby={errors.code ? 'code-error' : undefined}
            />
            <CodeButton
              onClick={handleSendCode}
              disabled={!contactIdentifier || isLoading || countdown > 0}
              className="absolute right-2 top-1/2 -translate-y-1/2"
              aria-label={
                countdown > 0
                  ? t('resendCodeBtn', { seconds: countdown })
                  : t('getCodeBtn')
              }
            >
              {countdown > 0
                ? t('resendCodeBtn', { seconds: countdown })
                : t('getCodeBtn')}
            </CodeButton>
          </div>
          {errors.code && (
            <p
              id="code-error"
              className="mt-1 text-xs text-red-500 flex items-center"
            >
              <AlertCircle className="h-3 w-3 mr-1" aria-hidden="true" />
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
            <Lock
              className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
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
              aria-invalid={!!errors.newPassword}
              aria-describedby={
                errors.newPassword ? 'new-password-error' : undefined
              }
            />
          </div>
          {errors.newPassword && (
            <p
              id="new-password-error"
              className="mt-1 text-xs text-red-500 flex items-center"
            >
              <AlertCircle className="h-3 w-3 mr-1" aria-hidden="true" />
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
            <Key
              className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
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
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={
                errors.confirmPassword ? 'confirm-password-error' : undefined
              }
            />
          </div>
          {errors.confirmPassword && (
            <p
              id="confirm-password-error"
              className="mt-1 text-xs text-red-500 flex items-center"
            >
              <AlertCircle className="h-3 w-3 mr-1" aria-hidden="true" />
              {errors.confirmPassword[0]}
            </p>
          )}
        </div>

        {/* API 错误提示 */}
        {apiError && (
          <div
            className="flex items-center space-x-2 text-sm text-red-500 h-5 pt-2 animate-fade-in"
            role="alert"
          >
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <span>{apiError}</span>
          </div>
        )}
      </form>
    </SectionCard>
  );
};

export default ChangePasswordSection;
