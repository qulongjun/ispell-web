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
// 认证服务 & Zod 验证
import {
  apiRegister,
  registerSchema,
  emailPhoneSchema,
} from '@/services/authService';
// 自定义 Hooks
import { useAuthForm } from '@/hooks/useAuthForm'; // 处理 API 加载、错误、验证码倒计时
import { useOAuth } from '@/hooks/useOAuth'; // 处理第三方登录逻辑
// 子组件
import ThirdPartyLogins from './ThirdPartyLogins';

// --- 2. Types ---

/**
 * 定义表单的行内错误状态类型
 * 键名需要与 Zod 模式和 `useState` 中的字段名匹配
 */
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

  // 从全局上下文获取状态和方法
  const { isRegisterModalOpen, closeRegisterModal, openLoginModal, login } =
    useAppContext();

  // 国际化翻译函数
  const t = useTranslations('LoginModal'); // 通用翻译
  const t_reg = useTranslations('RegisterModal'); // 注册专用翻译
  const t_err = useTranslations('Errors'); // 错误信息翻译

  // 表单字段状态
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [agreePolicy, setAgreePolicy] = useState(false);

  // 客户端行内校验错误状态
  const [errors, setErrors] = useState<FormErrors>({});
  // 表单震动效果状态
  const [isShaking, setIsShaking] = useState(false);

  // 自定义 Hook: 共享认证表单逻辑
  const {
    isLoading, // API 请求加载状态
    setIsLoading,
    apiError, // *仅用于* API 返回的错误
    setApiError,
    countdown, // 验证码倒计时
    handleGetCode, // 获取验证码的方法
    translateAndSetApiError, // 翻译 API 错误
    clearErrors, // 清除 API 错误
  } = useAuthForm();

  // 自定义 Hook: 共享 OAuth 登录逻辑
  const { handleOAuthClick } = useOAuth({
    login, // 登录成功后的回调
    closeModal: closeRegisterModal,
    setIsLoading,
    translateAndSetApiError,
  });

  // --- 5. Memoization ---

  // 缓存邮箱/手机号字段的有效性，用于控制 "获取验证码" 按钮的禁用状态
  const isEmailPhoneValid = useMemo(
    () => emailPhoneSchema.safeParse(emailOrPhone).success,
    [emailOrPhone]
  );

  // --- 6. Effects ---

  /**
   * 效果: 每次弹窗打开时，重置所有表单状态。
   * 使用 setTimeout 避免在关闭动画中看到状态重置的闪烁。
   */
  useEffect(() => {
    if (isRegisterModalOpen) {
      setTimeout(() => {
        setEmailOrPhone('');
        setPassword('');
        setConfirmPassword('');
        setCode('');
        setAgreePolicy(false);
        setErrors({});
        clearErrors(); // 清除 `useAuthForm` 中的 `apiError`
        setIsShaking(false);
      }, 100); // 延迟 100ms
    }
  }, [isRegisterModalOpen, clearErrors]); // `clearErrors` 已在 useAuthForm 中 memoized

  /**
   * 效果: 允许用户按 'Escape' 键关闭弹窗。
   */
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

  // 如果弹窗未打开，不渲染任何内容
  if (!isRegisterModalOpen) {
    return null;
  }

  // --- 8. Event Handlers ---

  /**
   * 阻止事件冒泡到父级 `div` (背景遮罩)
   * 防止点击弹窗内容时触发 `closeRegisterModal`
   */
  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

  /**
   * 处理 "获取验证码" 按钮点击
   */
  const handleGetCodeClick = async () => {
    setErrors({}); // 清除旧的行内错误
    // 1. 客户端校验邮箱/手机号
    const emailValidation = emailPhoneSchema.safeParse(emailOrPhone);
    if (!emailValidation.success) {
      setErrors((prev) => ({
        ...prev,
        emailOrPhone: emailValidation.error.issues.map((i) => t_err(i.message)),
      }));
      return;
    }
    // 2. 调用 `useAuthForm` 中的方法
    const errorMsg = await handleGetCode(emailOrPhone);

    // 3. 根据结果显示 Toast
    if (errorMsg) {
      toast.error(errorMsg); // API 错误 Toast
    } else {
      toast.success(t_err('sendCodeSuccess')); // 成功 Toast
    }
  };

  /**
   * 切换到登录弹窗
   */
  const switchToLogin = () => {
    closeRegisterModal();
    openLoginModal();
  };

  /**
   * 处理注册表单提交
   */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); // 阻止表单默认的 HTML 提交行为

    // 1. 重置状态
    setErrors({}); // 清除所有客户端行内错误
    setApiError(null); // 清除所有旧的 *API* 错误

    // 2. 客户端 Zod 校验
    const formData = {
      emailOrPhone,
      password,
      confirmPassword,
      code,
      agreePolicy,
    };
    const validation = registerSchema.safeParse(formData);

    // 3. 处理客户端校验失败
    if (!validation.success) {
      const fieldErrors: FormErrors = {};
      // 格式化 Zod 错误，以便设置到 `errors` 状态
      for (const issue of validation.error.issues) {
        const path = issue.path[0] as keyof FormErrors;
        if (!fieldErrors[path]) {
          fieldErrors[path] = [];
        }
        fieldErrors[path].push(t_err(issue.message));
      }

      // 关键: 只设置 `errors` 状态，用于显示行内错误
      setErrors(fieldErrors);

      // 触发 "震动" 效果
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return; // 终止提交
    }

    // 4. 客户端校验成功，准备 API 调用
    setIsLoading(true);
    const payload = {
      emailOrPhone: validation.data.emailOrPhone,
      password: validation.data.password,
      code: validation.data.code,
    };

    // 5. 执行 API 调用
    try {
      await apiRegister(payload);

      // 6. 处理 API 成功
      toast.success(t_reg('registerSuccess'));
      // 延迟 1 秒后切换到登录弹窗
      setTimeout(() => {
        switchToLogin();
      }, 1000);
    } catch (error) {
      // 7. 处理 API 失败
      let errorMessage = 'An unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      // 关键: 将 *API* 错误设置到按钮上方的 `apiError` 槽中
      translateAndSetApiError(errorMessage);
    } finally {
      // 8. 无论成功失败，都停止加载状态
      setIsLoading(false);
    }
  };

  // --- 9. JSX Render ---

  return (
    // 背景遮罩，点击时关闭弹窗
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={closeRegisterModal}
      aria-modal="true"
      role="dialog"
    >
      {/* 弹窗容器，通过 stopPropagation 阻止点击时关闭 */}
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
          {/* 这个位置 *只* 显示来自服务器的错误 (例如 "用户已存在") */}
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
