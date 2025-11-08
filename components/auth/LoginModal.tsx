/*
 * @Date: 2025-11-01 10:40:35
 * @LastEditTime: 2025-11-08 22:19:26
 * @Description: 登录弹窗组件
 */
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';

// 图标组件：用于表单和交互元素
import {
  X,
  Mail,
  Lock,
  MessageSquare,
  CheckSquare,
  Square,
  AlertCircle,
} from 'lucide-react';

// 全局上下文：获取登录状态、弹窗控制方法和登录逻辑
import { useAppContext } from '@/contexts/app.context';

// 登录接口：处理登录请求
import { apiLogin } from '@/services/authService';
// 表单校验规则：使用Zod进行客户端表单验证
import {
  loginCodeSchema,
  loginPasswordSchema,
  emailPhoneSchema,
} from '@/schema/authSchema';

// 自定义Hooks：复用认证表单逻辑（验证码倒计时、错误处理等）
import { useAuthForm } from '@/hooks/useAuthForm';
// 自定义Hooks：复用第三方登录逻辑
import { useOAuth } from '@/hooks/useOAuth';

// 第三方登录组件：集成社交账号登录功能
import ThirdPartyLogins from './ThirdPartyLogins';

// 登录模式类型：支持验证码登录和密码登录两种模式
type LoginMode = 'password' | 'code';

// 表单字段错误提示类型：存储各字段的校验错误信息
type FormErrors = {
  emailOrPhone?: string[];
  password?: string[];
  code?: string[];
  agreePolicy?: string[];
};

/**
 * 登录弹窗组件
 * 提供用户登录界面，支持两种登录模式切换，包含表单验证、登录逻辑和状态管理
 * 依赖全局上下文控制显示状态，登录成功后更新全局登录状态
 */
const LoginModal: React.FC = () => {
  // 从全局上下文获取弹窗状态控制和登录相关方法
  const { isLoginModalOpen, closeLoginModal, openRegisterModal, login } =
    useAppContext();

  // 多语言翻译：分别获取登录弹窗和错误信息的翻译
  const t = useTranslations('LoginModal');
  const t_err = useTranslations('Errors');

  // 登录模式状态：默认验证码登录
  const [mode, setMode] = useState<LoginMode>('code');

  // 表单字段状态管理
  const [emailOrPhone, setEmailOrPhone] = useState(''); // 邮箱/手机号
  const [password, setPassword] = useState(''); // 密码（仅密码登录模式）
  const [code, setCode] = useState(''); // 验证码（仅验证码登录模式）
  const [rememberMe, setRememberMe] = useState(false); // 记住登录状态（控制持久化）
  const [agreePolicy, setAgreePolicy] = useState(false); // 服务协议勾选状态

  // 表单校验错误状态：存储各字段的验证错误信息
  const [errors, setErrors] = useState<FormErrors>({});

  // 表单震动动画状态：验证失败时触发表单震动提示
  const [isShaking, setIsShaking] = useState(false);

  // 认证表单共享逻辑：加载状态、验证码倒计时、错误处理等
  const {
    isLoading, // 操作加载状态
    setIsLoading, // 更新加载状态
    apiError, // 接口返回的错误信息
    setApiError, // 更新接口错误信息
    countdown, // 验证码倒计时
    handleGetCode, // 发送验证码接口调用
    translateAndSetApiError, // 转换并设置接口错误信息
    clearErrors, // 清除错误信息
  } = useAuthForm();

  // 第三方登录逻辑：处理社交账号登录
  const { handleOAuthClick } = useOAuth({
    login, // 全局登录方法
    closeModal: closeLoginModal, // 关闭弹窗方法
    setIsLoading, // 更新加载状态
    translateAndSetApiError, // 错误信息处理
  });

  // 缓存邮箱/手机号字段校验结果：避免输入时频繁解析schema，优化性能
  const isEmailPhoneValid = useMemo(
    () => emailPhoneSchema.safeParse(emailOrPhone).success,
    [emailOrPhone]
  );

  /**
   * 弹窗打开时重置表单状态
   * 确保每次打开弹窗时表单为空且无残留错误信息
   */
  useEffect(() => {
    if (isLoginModalOpen) {
      setTimeout(() => {
        setMode('code');
        setEmailOrPhone('');
        setPassword('');
        setCode('');
        setAgreePolicy(false);
        setRememberMe(false);
        setErrors({});
        clearErrors();
        setIsShaking(false);
      }, 100);
    }
  }, [isLoginModalOpen, clearErrors]);

  /**
   * 键盘快捷键：ESC键关闭弹窗
   * 提升用户操作便捷性
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeLoginModal();
      }
    };

    if (isLoginModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLoginModalOpen, closeLoginModal]);

  // 弹窗未打开时不渲染组件
  if (!isLoginModalOpen) {
    return null;
  }

  // 阻止事件冒泡：避免点击弹窗内部触发遮罩层的关闭逻辑
  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

  /**
   * 发送验证码处理
   * 先校验邮箱/手机号格式，通过后调用接口发送验证码
   */
  const handleGetCodeClick = async () => {
    setErrors({});
    setApiError(null);
    // 校验邮箱/手机号格式
    const emailValidation = emailPhoneSchema.safeParse(emailOrPhone);
    if (!emailValidation.success) {
      // 整理并显示格式错误
      setErrors((prev) => ({
        ...prev,
        emailOrPhone: emailValidation.error.issues.map((i) => t_err(i.message)),
      }));
      return;
    }

    // 调用发送验证码接口
    const errorMsg = await handleGetCode(emailOrPhone);
    if (errorMsg === null) {
      toast.success(t_err('sendCodeSuccess'));
    } else {
      toast.error(errorMsg);
    }
  };

  /**
   * 切换到注册弹窗
   * 关闭当前登录弹窗，打开注册弹窗
   */
  const switchToRegister = () => {
    closeLoginModal();
    openRegisterModal();
  };

  /**
   * 登录表单提交处理
   * 1. 客户端表单验证（根据当前登录模式选择校验规则）
   * 2. 准备请求参数并调用登录接口
   * 3. 处理登录成功/失败逻辑
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setApiError(null);

    // 1. 客户端表单验证
    const formData = { emailOrPhone, password, code, agreePolicy };
    const schema = mode === 'password' ? loginPasswordSchema : loginCodeSchema;
    const validation = schema.safeParse(formData);

    // 校验失败：显示错误并触发表单震动
    if (!validation.success) {
      const fieldErrors: FormErrors = {};
      for (const issue of validation.error.issues) {
        const path = issue.path[0] as keyof FormErrors;
        if (!fieldErrors[path]) fieldErrors[path] = [];
        fieldErrors[path].push(t_err(issue.message));
      }
      setErrors(fieldErrors);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    // 2. 准备接口请求参数
    setIsLoading(true);
    const payload = {
      emailOrPhone,
      mode,
      password:
        mode === 'password'
          ? 'password' in validation.data
            ? validation.data.password
            : undefined
          : undefined,
      code:
        mode === 'code'
          ? 'code' in validation.data
            ? validation.data.code
            : undefined
          : undefined,
    };

    try {
      // 3. 调用登录接口
      const { user, accessToken, refreshToken } = await apiLogin(payload);
      toast.success(t('loginSuccess'));

      // 登录成功：更新全局登录状态（传递rememberMe控制持久化）
      login(user, { accessToken, refreshToken }, rememberMe);

      // 延迟关闭弹窗，确保用户看到成功提示
      setTimeout(() => closeLoginModal(), 1000);
    } catch (error) {
      // 处理接口错误
      translateAndSetApiError(error);
    } finally {
      // 结束加载状态
      setIsLoading(false);
    }
  };

  return (
    // 弹窗遮罩层：固定全屏，半透明背景，居中对齐
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={closeLoginModal}
      aria-modal="true"
      role="dialog"
    >
      {/* 弹窗主体：白色背景，阴影效果，限制最大宽度 */}
      <div
        className="relative m-4 w-full max-w-md rounded-lg bg-white p-8 shadow-2xl dark:bg-gray-900"
        onClick={stopPropagation}
      >
        {/* 关闭按钮：右上角，点击关闭弹窗 */}
        <button
          onClick={closeLoginModal}
          className="absolute top-4 right-4 rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
        >
          <X className="h-5 w-5" />
        </button>

        {/* 弹窗标题 */}
        <h2 className="mb-6 text-center text-2xl font-semibold text-gray-900 dark:text-white">
          {t('title')}
        </h2>

        {/* 登录表单 */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* 邮箱/手机号输入框 */}
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
            {/* 邮箱/手机号错误提示 */}
            {errors.emailOrPhone && (
              <p className="mt-1 text-xs text-red-500">
                {errors.emailOrPhone[0]}
              </p>
            )}
          </div>

          {/* 密码/验证码输入框（根据模式切换） */}
          <div>
            <div className="relative">
              {mode === 'password' ? (
                // 密码登录模式
                <>
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
                </>
              ) : (
                // 验证码登录模式
                <>
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
                  {/* 获取验证码按钮 */}
                  <button
                    type="button"
                    onClick={handleGetCodeClick}
                    disabled={!isEmailPhoneValid || isLoading || countdown > 0}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-3 py-1 text-sm text-gray-600 transition-opacity hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent dark:text-gray-300 dark:hover:bg-gray-700 dark:disabled:text-gray-600"
                  >
                    {countdown > 0
                      ? t('resendCode', { seconds: countdown })
                      : t('getCode')}
                  </button>
                </>
              )}
            </div>
            {/* 密码/验证码错误提示 */}
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">{errors.password[0]}</p>
            )}
            {errors.code && (
              <p className="mt-1 text-xs text-red-500">{errors.code[0]}</p>
            )}
          </div>

          {/* 功能选项：记住我 + 登录模式切换 */}
          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => setRememberMe(!rememberMe)}
              disabled={isLoading}
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-300"
            >
              {rememberMe ? (
                <CheckSquare className="h-4 w-4 text-gray-900 dark:text-white" />
              ) : (
                <Square className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              )}
              <span>{t('rememberMe')}</span>
            </button>
            <button
              type="button"
              onClick={() => setMode(mode === 'password' ? 'code' : 'password')}
              disabled={isLoading}
              className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              {mode === 'password' ? t('useCode') : t('usePassword')}
            </button>
          </div>

          {/* 服务协议勾选 */}
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
                <Square className="h-4 w-4 text-gray-400 dark:text-gray-500" />
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

          {/* 接口错误提示（如账号密码错误、验证码失效等） */}
          <div className="flex items-center justify-center space-x-2 text-sm text-red-500 h-5">
            {apiError && (
              <>
                <AlertCircle className="h-4 w-4" />
                <span>{apiError}</span>
              </>
            )}
          </div>

          {/* 登录按钮 */}
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
            {t('loginSubmit')}
          </button>
        </form>

        {/* 第三方登录入口 */}
        <ThirdPartyLogins
          handleOAuthClick={handleOAuthClick}
          isLoading={isLoading}
        />

        {/* 注册入口：引导新用户跳转注册 */}
        <div>
          <p className="pt-1 text-center text-sm text-gray-500 dark:text-gray-400">
            {t('newUserHint')}{' '}
            <button
              onClick={switchToRegister}
              className="font-semibold text-gray-800 underline hover:text-gray-600 dark:text-gray-200"
            >
              {t('registerNow')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
