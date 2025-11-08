/*
 * @Date: 2025-11-01 00:07:58
 * @Description: 认证表单通用Hook
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { ApiError } from '@/utils/error.utils';

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
  translateAndSetApiError: (error: unknown) => string | null;
  clearErrors: () => void;
};

/**
 * 认证表单通用逻辑Hook
 */
export const useAuthForm = (): UseAuthFormReturn => {
  const t_err = useTranslations('Errors');

  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(getInitialCountdown);

  // 倒计时驱动逻辑
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
   * 翻译并设置API错误信息。
   * (将 'unknown' error 转化为可显示的 string)
   */
  const translateAndSetApiError = useCallback(
    (error: unknown): string | null => {
      if (error === null || typeof error === 'undefined') {
        setApiError(null);
        return null;
      }

      let translated: string;

      if (error instanceof ApiError) {
        // 1. 是我们定义的 ApiError (从 code 查找 i18n)
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

      setApiError(translated); // 只有在有错误时才设置
      return translated;
    },
    [t_err]
  );

  /**
   * 发送验证码
   * @returns Promise<错误信息|null> - 失败时返回翻译后的错误信息，成功返回null
   */
  const handleGetCode = useCallback(
    async (emailOrPhone: string): Promise<string | null> => {
      setApiError(null);
      setIsLoading(true);
      let errorMsg: string | null = null;

      try {
        await apiSendCode(emailOrPhone);
        setCountdown(COUNTDOWN_SECONDS);
        localStorage.setItem(COUNTDOWN_TIMESTAMP_KEY, Date.now().toString());
        return null;
      } catch (error) {
        errorMsg = translateAndSetApiError(error);
      } finally {
        setIsLoading(false);
      }
      return errorMsg;
    },
    [translateAndSetApiError]
  );

  /**
   * 清除所有错误信息
   */
  const clearErrors = useCallback(() => {
    setApiError(null);
  }, []);

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
