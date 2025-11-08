/*
 * @Date: 2025-11-01 10:40:35
 * @LastEditTime: 2025-11-08 22:19:13
 * @Description: 注册弹窗组件
 * 提供用户注册功能，支持邮箱/手机号+验证码+密码的注册流程
 * 包含表单验证、验证码发送、注册提交及第三方登录集成
 */
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '@/contexts/app.context';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import {
  X,
  Mail,
  Lock,
  MessageSquare,
  CheckSquare,
  Square,
  AlertCircle,
  Key,
} from 'lucide-react';

// 业务依赖
import { apiRegister } from '@/services/authService';
import { registerSchema, emailPhoneSchema } from '@/schema/authSchema';
import { useAuthForm } from '@/hooks/useAuthForm';
import { useOAuth } from '@/hooks/useOAuth';
import ThirdPartyLogins from './ThirdPartyLogins';

// 表单错误类型定义
type FormErrors = {
  emailOrPhone?: string[];
  password?: string[];
  confirmPassword?: string[];
  code?: string[];
  agreePolicy?: string[];
};

const RegisterModal: React.FC = () => {
  // 全局状态
  const { isRegisterModalOpen, closeRegisterModal, openLoginModal, login } =
    useAppContext();

  // 国际化翻译
  const t = useTranslations('LoginModal');
  const t_reg = useTranslations('RegisterModal');
  const t_err = useTranslations('Errors');

  // 表单状态
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [agreePolicy, setAgreePolicy] = useState(false);

  // 错误与状态管理
  const [errors, setErrors] = useState<FormErrors>({});
  const [isShaking, setIsShaking] = useState(false);

  // 认证表单共享逻辑
  const {
    isLoading,
    setIsLoading,
    apiError,
    countdown,
    handleGetCode,
    translateAndSetApiError,
    clearErrors,
  } = useAuthForm();

  // 第三方登录逻辑
  const { handleOAuthClick } = useOAuth({
    login,
    closeModal: closeRegisterModal,
    setIsLoading,
    translateAndSetApiError,
  });

  // 邮箱/手机号验证缓存
  const isEmailPhoneValid = useMemo(
    () => emailPhoneSchema.safeParse(emailOrPhone).success,
    [emailOrPhone]
  );

  // 弹窗打开时重置表单
  useEffect(() => {
    if (isRegisterModalOpen) {
      const resetForm = () => {
        setEmailOrPhone('');
        setPassword('');
        setConfirmPassword('');
        setCode('');
        setAgreePolicy(false);
        setErrors({});
        clearErrors();
        setIsShaking(false);
      };
      // 延迟重置避免动画冲突
      const timer = setTimeout(resetForm, 100);
      return () => clearTimeout(timer); // 清除定时器防止内存泄漏
    }
  }, [isRegisterModalOpen, clearErrors]);

  // ESC键关闭弹窗
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeRegisterModal();
      }
    };
    if (isRegisterModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isRegisterModalOpen, closeRegisterModal]);

  // 弹窗未打开时不渲染
  if (!isRegisterModalOpen) {
    return null;
  }

  // 阻止事件冒泡
  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

  // 发送验证码
  const handleGetCodeClick = async () => {
    setErrors({});
    clearErrors();

    const validation = emailPhoneSchema.safeParse(emailOrPhone);
    if (!validation.success) {
      setErrors({
        emailOrPhone: validation.error.issues.map((i) => t_err(i.message)),
      });
      return;
    }

    const errorMsg = await handleGetCode(emailOrPhone);
    if (errorMsg === null) {
      toast.success(t_err('sendCodeSuccess'));
    } else {
      toast.error(errorMsg);
    }
  };

  // 切换到登录
  const switchToLogin = () => {
    closeRegisterModal();
    openLoginModal();
  };

  // 提交注册
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    clearErrors();

    // 表单验证
    const formData = {
      emailOrPhone,
      password,
      confirmPassword,
      code,
      agreePolicy,
    };
    const validation = registerSchema.safeParse(formData);

    if (!validation.success) {
      const fieldErrors: FormErrors = {};
      validation.error.issues.forEach((issue) => {
        const path = issue.path[0] as keyof FormErrors;
        if (!fieldErrors[path]) fieldErrors[path] = [];
        fieldErrors[path].push(t_err(issue.message));
      });
      setErrors(fieldErrors);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    // 提交注册
    setIsLoading(true);
    try {
      await apiRegister({
        emailOrPhone: validation.data.emailOrPhone,
        password: validation.data.password,
        code: validation.data.code,
      });
      toast.success(t_reg('registerSuccess'));
      setTimeout(switchToLogin, 1000);
    } catch (error) {
      translateAndSetApiError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={closeRegisterModal}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="relative m-4 w-full max-w-md rounded-lg bg-white p-8 shadow-2xl dark:bg-gray-900"
        onClick={stopPropagation}
      >
        {/* 关闭按钮 */}
        <button
          onClick={closeRegisterModal}
          className="absolute top-4 right-4 rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          <X className="h-5 w-5" />
        </button>

        {/* 标题 */}
        <h2 className="mb-6 text-center text-2xl font-semibold text-gray-900 dark:text-white">
          {t_reg('title')}
        </h2>

        {/* 注册表单 */}
        <form onSubmit={handleRegister} className="space-y-4">
          {/* 邮箱/手机号 */}
          <div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t('emailOrPhone')}
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                disabled={isLoading}
                className={`w-full rounded-md border py-3 pl-10 pr-4 text-gray-900 focus:outline-none dark:bg-gray-800 dark:text-white ${
                  errors.emailOrPhone
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-gray-500 focus:ring-gray-500 dark:border-gray-700'
                }`}
              />
            </div>
            {errors.emailOrPhone && (
              <p className="mt-1 text-xs text-red-500">
                {errors.emailOrPhone[0]}
              </p>
            )}
          </div>

          {/* 密码 */}
          <div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                placeholder={t('password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className={`w-full rounded-md border py-3 pl-10 pr-4 text-gray-900 focus:outline-none dark:bg-gray-800 dark:text-white ${
                  errors.password
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-gray-500 focus:ring-gray-500 dark:border-gray-700'
                }`}
              />
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">{errors.password[0]}</p>
            )}
          </div>

          {/* 确认密码 */}
          <div>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                placeholder={t_reg('confirmPassword')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                className={`w-full rounded-md border py-3 pl-10 pr-4 text-gray-900 focus:outline-none dark:bg-gray-800 dark:text-white ${
                  errors.confirmPassword
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-gray-500 focus:ring-gray-500 dark:border-gray-700'
                }`}
              />
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-500">
                {errors.confirmPassword[0]}
              </p>
            )}
          </div>

          {/* 验证码 */}
          <div>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t('verificationCode')}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={isLoading}
                className={`w-full rounded-md border py-3 pl-10 pr-4 text-gray-900 focus:outline-none dark:bg-gray-800 dark:text-white ${
                  errors.code
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-gray-500 focus:ring-gray-500 dark:border-gray-700'
                }`}
              />
              <button
                type="button"
                onClick={handleGetCodeClick}
                disabled={!isEmailPhoneValid || isLoading || countdown > 0}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-3 py-1 text-sm text-gray-600 transition-opacity hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {countdown > 0
                  ? t('resendCode', { seconds: countdown })
                  : t('getCode')}
              </button>
            </div>
            {errors.code && (
              <p className="mt-1 text-xs text-red-500">{errors.code[0]}</p>
            )}
          </div>

          {/* 服务协议 */}
          <div>
            <button
              type="button"
              onClick={() => setAgreePolicy(!agreePolicy)}
              disabled={isLoading}
              className="flex items-center space-x-1.5 text-sm text-gray-600 dark:text-gray-300"
            >
              {agreePolicy ? (
                <CheckSquare className="h-4 w-4 text-gray-900 dark:text-white" />
              ) : (
                <Square className="h-4 w-4 text-gray-400" />
              )}
              <span>
                {t('agreePolicyPrefix')}
                <a
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-gray-800 dark:hover:text-gray-200"
                >
                  {t('terms')}
                </a>
                {t('and')}
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-gray-800 dark:hover:text-gray-200"
                >
                  {t('privacy')}
                </a>
              </span>
            </button>
            {errors.agreePolicy && (
              <p className="mt-2 text-xs text-red-500">
                {errors.agreePolicy[0]}
              </p>
            )}
          </div>

          {/* 接口错误提示 */}
          {apiError && (
            <div className="flex items-center justify-center space-x-2 text-sm text-red-500">
              <AlertCircle className="h-4 w-4" />
              <span>{apiError}</span>
            </div>
          )}

          {/* 注册按钮 */}
          <button
            type="submit"
            disabled={isLoading}
            className={`flex w-full items-center justify-center rounded-lg bg-gray-900 py-3 font-semibold text-white transition-colors hover:bg-gray-700 disabled:opacity-70 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-300 ${
              isShaking ? 'animate-shake' : ''
            }`}
          >
            {isLoading && (
              <svg
                className="mr-2 h-5 w-5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            )}
            {t_reg('registerSubmit')}
          </button>
        </form>

        {/* 第三方登录 */}
        <ThirdPartyLogins
          handleOAuthClick={handleOAuthClick}
          isLoading={isLoading}
        />

        {/* 切换到登录 */}
        <div>
          <p className="pt-1 text-center text-sm text-gray-500 dark:text-gray-400">
            {t_reg('alreadyHaveAccount')}{' '}
            <button
              onClick={switchToLogin}
              className="font-semibold text-gray-800 underline hover:text-gray-600 dark:text-gray-200"
            >
              {t_reg('loginNow')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterModal;
