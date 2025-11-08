'use client';

/**
 * 登录弹窗组件
 * (已更新为从 authSchema.ts 导入 schemas)
 */

// 外部库导入
import React, { useState, useMemo, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';

// 图标组件导入
import {
  X,
  Mail,
  Lock,
  MessageSquare,
  CheckSquare,
  Square,
  AlertCircle,
} from 'lucide-react';

// 全局上下文导入
import { useAppContext } from '@/contexts/app.context';
import { ApiError } from '@/utils/error.utils';

// [!! 关键修改 1: 拆分 Imports !!]
// 从 authService 导入 API 函数
import {
  apiLogin,
  apiSendCode,
  getInitialCountdown,
  COUNTDOWN_TIMESTAMP_KEY,
  COUNTDOWN_SECONDS,
} from '@/services/authService';
// 从 authSchema 导入 Zod Schemas
import {
  loginCodeSchema,
  loginPasswordSchema,
  emailPhoneSchema,
} from '@/schema/authSchema';
// [!! 修改结束 !!]

// 自定义Hooks导入
import { useOAuth } from '@/hooks/useOAuth';

// 本地组件导入
import ThirdPartyLogins from './ThirdPartyLogins';

// 登录模式类型：支持验证码登录/密码登录
type LoginMode = 'password' | 'code';

// 表单字段错误提示类型：对应各表单字段的校验错误
type FormErrors = {
  emailOrPhone?: string[];
  password?: string[];
  code?: string[];
  agreePolicy?: string[];
};

const LoginModal: React.FC = () => {
  // 全局状态
  const { isLoginModalOpen, closeLoginModal, openRegisterModal, login } =
    useAppContext();

  // 多语言翻译
  const t = useTranslations('LoginModal');
  const t_err = useTranslations('Errors');

  // 表单模式状态
  const [mode, setMode] = useState<LoginMode>('code');

  // 表单字段状态
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [agreePolicy, setAgreePolicy] = useState(false);

  // 表单校验错误状态
  const [errors, setErrors] = useState<FormErrors>({});
  const [isShaking, setIsShaking] = useState(false);
  
  // 认证表单共享逻辑 (从 useAuthForm 移入)
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(getInitialCountdown());

  // OAuth Hook
  const { handleOAuthClick } = useOAuth({
    login,
    closeModal: closeLoginModal,
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

  // [!! 关键修改 2: 修复 !!]
  // 这里的 useMemo 现在可以正常工作，因为它导入的 emailPhoneSchema
  // 来自一个 'use client' 文件
  const isEmailPhoneValid = useMemo(
    () => emailPhoneSchema.safeParse(emailOrPhone).success,
    [emailOrPhone]
  );
  
  // 倒计时
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 弹窗打开时重置表单状态
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
        setApiError(null);
        setIsShaking(false);
        setCountdown(getInitialCountdown());
      }, 100);
    }
  }, [isLoginModalOpen]);

  // 键盘快捷键：ESC键关闭弹窗
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

  // 阻止事件冒泡
  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

  // 发送验证码
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

  // 切换到注册弹窗
  const switchToRegister = () => {
    closeLoginModal();
    openRegisterModal();
  };

  // 登录表单提交
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setApiError(null);

    // 1. 客户端表单校验
    const formData = { emailOrPhone, password, code, agreePolicy };
    const schema = mode === 'password' ? loginPasswordSchema : loginCodeSchema;
    const validation = schema.safeParse(formData);

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

      // 4. 登录成功
      login(user, { accessToken, refreshToken }, rememberMe);

      setTimeout(() => {
        closeLoginModal();
      }, 1000);
    } catch (error) {
      // 5. 处理接口错误
      console.error('Login failed:', error);
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

  return (
    // 核心修改：z-40 → z-60
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={closeLoginModal}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="relative m-4 w-full max-w-md rounded-lg bg-white p-8 shadow-2xl dark:bg-gray-900"
        onClick={stopPropagation}
      >
        {/* ... (其余 JSX 代码与您提供的文件 100% 相同) ... */}
        {/* 关闭按钮 */}
        <button
          onClick={closeLoginModal}
          className="absolute top-4 right-4 rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
        >
          <X className="h-5 w-5" />
        </button>

        {/* 标题 */}
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
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-3 py-1 text-sm text-gray-600 transition-opacity hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent dark:text-gray-300 dark:hover:bg-gray-700 dark:disabled:text-gray-600 dark:disabled:hover:bg-transparent"
                  >
                    {countdown > 0
                      ? t('resendCode', { seconds: countdown })
                      : t('getCode')}
                  </button>
                </>
              )}
            </div>
            {/* 密码错误提示 */}
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">{errors.password[0]}</p>
            )}
            {/* 验证码错误提示 */}
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

          {/* 接口错误提示 */}
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