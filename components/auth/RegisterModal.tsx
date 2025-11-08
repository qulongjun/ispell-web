/* eslint-disable @next/next/no-img-element */
'use client';

// --- 1. Imports ---

// React Core
import React, { useState, useMemo, useEffect } from 'react';
// 全局应用上下文
import { useAppContext } from '@/contexts/app.context';
// 国际化
import { useTranslations } from 'next-intl';
// UI & 通知
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
import { ApiError } from '@/utils/error.utils';

// [!! 关键修改 1: 拆分 Imports !!]
// 从 authService 导入 API 函数
import {
  apiRegister,
  apiSendCode,
  getInitialCountdown,
  COUNTDOWN_TIMESTAMP_KEY,
  COUNTDOWN_SECONDS,
} from '@/services/authService';
// 从 authSchema 导入 Zod Schemas
import { registerSchema, emailPhoneSchema } from '@/schema/authSchema';
// [!! 修改结束 !!]

// 自定义 Hooks
import { useOAuth } from '@/hooks/useOAuth'; // 处理第三方登录逻辑
// 子组件
import ThirdPartyLogins from './ThirdPartyLogins';

// --- 2. Types ---
type FormErrors = {
  emailOrPhone?: string[];
  password?: string[];
  confirmPassword?: string[];
  code?: string[];
  agreePolicy?: string[];
};

// --- 3. Component Definition ---

const RegisterModal: React.FC = () => {
  // --- 4. Hooks & Context ---
  const { isRegisterModalOpen, closeRegisterModal, openLoginModal, login } =
    useAppContext();

  const t = useTranslations('LoginModal');
  const t_reg = useTranslations('RegisterModal');
  const t_err = useTranslations('Errors');

  // 表单字段状态
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [agreePolicy, setAgreePolicy] = useState(false);

  // 认证表单逻辑 (从 useAuthForm 移入)
  const [errors, setErrors] = useState<FormErrors>({});
  const [isShaking, setIsShaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(getInitialCountdown());

  // OAuth Hook
  const { handleOAuthClick } = useOAuth({
    login,
    closeModal: closeRegisterModal,
    setIsLoading,
    translateAndSetApiError: (error: unknown) => {
      let msg = t_err('unknownError');
      if (error instanceof ApiError) {
        msg = t_err(`e${error.code}`, { defaultValue: msg });
      } else if (error instanceof Error) {
        if (error.message.includes('Invalid state')) {
          msg = t_err('e2006');
        } else {
          msg = t_err('e2007');
        }
      } else if (typeof error === 'string') {
        msg = t_err(error, { defaultValue: error });
      }
      setApiError(msg);
    },
  });

  // --- 5. Memoization ---
  // [!! 关键修改 2: 修复 !!]
  const isEmailPhoneValid = useMemo(
    () => emailPhoneSchema.safeParse(emailOrPhone).success,
    [emailOrPhone]
  );

  // --- 6. Effects ---
  // 倒计时
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 重置
  useEffect(() => {
    if (isRegisterModalOpen) {
      setTimeout(() => {
        setEmailOrPhone('');
        setPassword('');
        setConfirmPassword('');
        setCode('');
        setAgreePolicy(false);
        setErrors({});
        setApiError(null);
        setIsShaking(false);
        setCountdown(getInitialCountdown());
      }, 100);
    }
  }, [isRegisterModalOpen]);

  // ESC 键
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

  // --- 7. Render Guard ---
  if (!isRegisterModalOpen) {
    return null;
  }

  // --- 8. Event Handlers ---
  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

  // 获取验证码
  const handleGetCodeClick = async () => {
    setErrors({});
    setApiError(null);
    const emailValidation = emailPhoneSchema.safeParse(emailOrPhone);
    if (!emailValidation.success) {
      setErrors((prev) => ({
        ...prev,
        emailOrPhone: emailValidation.error.issues.map((i) => t_err(i.message)),
      }));
      return;
    }

    setIsLoading(true);
    try {
      await apiSendCode(emailOrPhone);
      toast.success(t_err('sendCodeSuccess'));
      setCountdown(COUNTDOWN_SECONDS);
      localStorage.setItem(COUNTDOWN_TIMESTAMP_KEY, Date.now().toString());
    } catch (error) {
      console.error('Send code failed:', error);
      if (error instanceof ApiError) {
        const message = t_err(`e${error.code}`, {
          defaultValue: t_err('unknownError'),
        });
        toast.error(message);
      } else {
        toast.error(t_err('unknownError'));
      }
    } finally {
      setIsLoading(false);
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
    setApiError(null);

    // 2. 客户端 Zod 校验
    const formData = {
      emailOrPhone,
      password,
      confirmPassword,
      code,
      agreePolicy,
    };
    const validation = registerSchema.safeParse(formData);

    // 3. 客户端校验失败
    if (!validation.success) {
      const fieldErrors: FormErrors = {};
      for (const issue of validation.error.issues) {
        const path = issue.path[0] as keyof FormErrors;
        if (!fieldErrors[path]) {
          fieldErrors[path] = [];
        }
        fieldErrors[path].push(t_err(issue.message));
      }
      setErrors(fieldErrors);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    // 4. 客户端校验成功
    setIsLoading(true);
    const payload = {
      emailOrPhone: validation.data.emailOrPhone,
      password: validation.data.password,
      code: validation.data.code,
    };

    // 5. 执行 API 调用
    try {
      await apiRegister(payload);
      // 6. API 成功
      toast.success(t_reg('registerSuccess'));
      setTimeout(() => {
        switchToLogin();
      }, 1000);
    } catch (error) {
      // 7. API 失败
      console.error('Registration failed:', error);
      if (error instanceof ApiError) {
        const message = t_err(`e${error.code}`, {
          defaultValue: t_err('unknownError'),
        });
        setApiError(message);
      } else {
        setApiError(t_err('unknownError'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // --- 9. JSX Render ---
  return (
    // ... (其余 JSX 代码与您提供的文件 100% 相同) ...
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm"
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
          className="absolute top-4 right-4 rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
          aria-label={t_reg('title')}
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
                    ? 'border-red-500 focus:ring-red-500' // 错误样式
                    : 'border-gray-300 focus:border-gray-500 focus:ring-gray-500 dark:border-gray-700' // 默认样式
                }`}
              />
            </div>
            {/* 行内错误提示 */}
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
            {/* 行内错误提示 */}
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">{errors.password[0]}</p>
            )}
          </div>

          {/* 重复密码 */}
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
            {/* 行内错误提示 */}
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
              {/* 获取验证码按钮，带倒计时 */}
              <button
                type="button"
                onClick={handleGetCodeClick}
                disabled={!isEmailPhoneValid || isLoading || countdown > 0}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-3 py-1 text-sm text-gray-600 transition-opacity hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent dark:text-gray-300 dark:hover:bg-gray-700 dark:disabled:text-gray-600 dark:disabled:hover:bg-transparent"
              >
                {countdown > 0
                  ? t('resendCode', { seconds: countdown })
                  : t('getCode')}
              </button>
            </div>
            {/* 行内错误提示 */}
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
              {/* 复选框图标 */}
              {agreePolicy ? (
                <CheckSquare className="h-4 w-4 text-gray-900 dark:text-white" />
              ) : (
                <Square className="h-4 w-4 text-gray-400" />
              )}
              {/* 协议文本 */}
              <span>
                {t('agreePolicyPrefix')}
                <a
                  href="/terms"
                  target="_blank"
                  className="underline hover:text-gray-800 dark:hover:text-gray-200"
                >
                  {t('terms')}
                </a>
                {t('and')}
                <a
                  href="/privacy"
                  target="_blank"
                  className="underline hover:text-gray-800 dark:hover:text-gray-200"
                >
                  {t('privacy')}
                </a>
              </span>
            </button>
            {/* 协议的行内错误提示 */}
            {errors.agreePolicy && (
              <p className="mt-2 text-xs text-red-500">
                {errors.agreePolicy[0]}
              </p>
            )}
          </div>

          {/* API 错误提示槽 */}
          <div className="flex items-center justify-center space-x-2 text-sm text-red-500 h-5">
            {apiError && (
              <>
                <AlertCircle className="h-4 w-4" />
                <span>{apiError}</span>
              </>
            )}
          </div>

          {/* 注册按钮 */}
          <button
            type="submit"
            disabled={isLoading}
            className={`flex w-full items-center justify-center rounded-lg bg-gray-900 py-3 font-semibold text-white transition-colors hover:bg-gray-700 disabled:opacity-70 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-300 ${
              isShaking ? 'animate-shake' : '' // 震动效果
            }`}
          >
            {/* 加载中图标 */}
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

        {/* 第三方登录组件 */}
        <ThirdPartyLogins
          handleOAuthClick={handleOAuthClick}
          isLoading={isLoading}
        />

        {/* 切换到登录 */}
        <div>
          <p className="pt-1 text-center text-sm text-gray-500">
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
