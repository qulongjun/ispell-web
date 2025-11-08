/*
 * @Date: 2025-11-01 00:07:58
 * @LastEditTime: 2025-11-08 11:37:06
 * @Description: 认证表单通用Hook (已重构为 ApiError 和 i18n)
 */

// React核心Hooks导入
import { useState, useEffect, useCallback } from 'react';

// 国际化工具导入
import { useTranslations } from 'next-intl';

// [!! 1. 新增 !!] 导入 ApiError
import { ApiError } from '@/utils/error.utils';

// [!! 2. 修改 !!] 导入重构后的 authService 和常量
import {
  apiSendCode, // 发送验证码的API接口
  getInitialCountdown, // 初始化倒计时
  COUNTDOWN_SECONDS, // 验证码倒计时总时长（秒）
  COUNTDOWN_TIMESTAMP_KEY, // 本地存储倒计时时间戳的键名
} from '@/services/authService';

/**
 * 认证表单Hook返回值类型
 */
type UseAuthFormReturn = {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  apiError: string | null;
  setApiError: (error: string | null) => void;
  countdown: number;
  handleGetCode: (emailOrPhone: string) => Promise<string | null>; // 成功返回 null, 失败返回 string
  translateAndSetApiError: (error: unknown) => string | null; // [!!] 接收 unknown
  clearErrors: () => void;
};

/**
 * 认证表单通用逻辑Hook
 */
export const useAuthForm = (): UseAuthFormReturn => {
  // 错误信息翻译工具（基于当前语言环境）
  const t_err = useTranslations('Errors');

  // 状态管理
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(getInitialCountdown); // 立即执行函数

  /**
   * 倒计时驱动逻辑 (不变)
   */
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown <= 0) {
      localStorage.removeItem(COUNTDOWN_TIMESTAMP_KEY);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  /**
   * [!! 3. 重大修改 !!]
   * 翻译并设置API错误信息
   * 功能：将 ApiError 或 Error 翻译为当前语言，更新 apiError 状态
   * @param error - catch 块中捕获的 'unknown' 错误
   * @returns 翻译后的错误信息
   */
  const translateAndSetApiError = useCallback(
    (error: unknown): string | null => {
      let translated: string;

      if (error instanceof ApiError) {
        // 1. 是我们定义的 ApiError
        translated = t_err(`e${error.code}`, {
          defaultValue: t_err('unknownError'),
        });
      } else if (error instanceof Error) {
        // 2. 是一个标准的 Error 对象 (例如网络错误)
        const safeMessage = (error.message || '').toLowerCase();
        if (safeMessage.includes('failed to fetch')) {
          translated = t_err('unknownError');
        } else {
          translated = error.message;
        }
      } else if (typeof error === 'string') {
        // 3. 只是一个字符串 (兼容 OAuth 的 postMessage)
        translated = t_err(error, { defaultValue: error });
      } else {
        // 4. 未知类型
        translated = t_err('unknownError');
      }

      setApiError(translated);
      return translated;
    },
    [t_err] // 依赖 t_err
  );

  /**
   * [!! 4. 重大修改 !!]
   * 发送验证码
   * 功能：调用API发送验证码，处理 ApiError
   * @param emailOrPhone - 接收验证码的邮箱或手机号
   * @returns Promise<错误信息|null> - 失败时返回翻译后的错误信息，成功返回null
   */
  const handleGetCode = useCallback(
    async (emailOrPhone: string): Promise<string | null> => {
      setApiError(null); // 清除旧错误
      setIsLoading(true); // 开始加载
      let errorMsg: string | null = null;

      try {
        // [!!] apiSendCode 成功时不返回, 失败时抛出 ApiError
        await apiSendCode(emailOrPhone);

        // [!!] 成功逻辑:
        setCountdown(COUNTDOWN_SECONDS);
        localStorage.setItem(COUNTDOWN_TIMESTAMP_KEY, Date.now().toString());
        // [!!] 成功时返回 null
        return null;
      } catch (error) {
        // [!!] 失败逻辑:
        // [!!] (修复) 我们在这里只翻译错误，但不显示 Toast
        // [!!] Toast 应该由 UI 层 (Modal) 决定
        errorMsg = translateAndSetApiError(error);
      } finally {
        setIsLoading(false);
      }
      // [!!] 失败时返回翻译后的错误
      return errorMsg;
    },
    [translateAndSetApiError] // 依赖新的错误处理器
  );

  /**
   * 清除所有错误信息 (不变)
   */
  const clearErrors = useCallback(() => {
    setApiError(null);
  }, []);

  // 暴露状态与方法供外部组件使用
  return {
    isLoading,
    setIsLoading,
    apiError,
    setApiError,
    countdown,
    handleGetCode,
    translateAndSetApiError,
    clearErrors,
  };
};