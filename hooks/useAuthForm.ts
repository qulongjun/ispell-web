/*
 * @Date: 2025-11-01 00:07:58
 * @LastEditTime: 2025-11-01 11:27:27
 * @Description: 认证表单通用Hook
 */

// React核心Hooks导入
import { useState, useEffect, useCallback } from 'react';

// 国际化工具导入
import { useTranslations } from 'next-intl';

// 认证服务与常量导入
import {
  apiSendCode, // 发送验证码的API接口
  getInitialCountdown, // 初始化倒计时（从本地存储恢复或设为0）
  translateApiError, // 错误信息翻译工具函数
  COUNTDOWN_SECONDS, // 验证码倒计时总时长（秒）
  COUNTDOWN_TIMESTAMP_KEY, // 本地存储倒计时时间戳的键名
} from '@/services/authService';

/**
 * 认证表单Hook返回值类型
 * 包含状态管理、方法及交互所需的核心数据
 */
type UseAuthFormReturn = {
  isLoading: boolean; // 加载状态（验证码发送中/登录中）
  setIsLoading: (loading: boolean) => void; // 手动设置加载状态
  apiError: string | null; // API返回的错误信息（已翻译）
  setApiError: (error: string | null) => void; // 手动设置API错误信息
  countdown: number; // 验证码重发倒计时（秒）
  handleGetCode: (emailOrPhone: string) => Promise<string | null>; // 发送验证码方法
  translateAndSetApiError: (message: string | null) => string | null; // 翻译并设置错误信息
  clearErrors: () => void; // 清除所有错误信息
};

/**
 * 认证表单通用逻辑Hook
 * 统一处理验证码发送、倒计时、错误翻译及状态管理，减少重复代码
 */
export const useAuthForm = (): UseAuthFormReturn => {
  // 错误信息翻译工具（基于当前语言环境）
  const t_err = useTranslations('Errors');

  // 状态管理
  const [isLoading, setIsLoading] = useState(false); // 加载状态：控制按钮禁用与加载动画
  const [apiError, setApiError] = useState<string | null>(null); // 存储API返回的错误信息（已翻译）
  const [countdown, setCountdown] = useState(getInitialCountdown); // 验证码倒计时：从本地存储恢复或初始化为0

  /**
   * 倒计时驱动逻辑
   * 作用：每秒更新倒计时，结束后清除本地存储的时间戳
   * 依赖：countdown变化时重新执行
   */
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      // 倒计时未结束：每秒减1
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown <= 0) {
      // 倒计时结束：清除本地存储的时间戳（避免刷新后重新显示倒计时）
      localStorage.removeItem(COUNTDOWN_TIMESTAMP_KEY);
    }
    // 组件卸载或倒计时变化时清除定时器，避免内存泄漏
    return () => clearInterval(timer);
  }, [countdown]);

  /**
   * 翻译并设置API错误信息
   * 功能：将原始错误信息翻译为当前语言，更新apiError状态
   * 记忆化：依赖t_err（翻译工具），避免不必要的重渲染
   * @param message - 原始错误信息（可能为null）
   * @returns 翻译后的错误信息（便于toast等外部使用）
   */
  const translateAndSetApiError = useCallback(
    (message: string | null): string | null => {
      if (message === null) {
        setApiError(null);
        return null;
      }
      // 调用工具函数翻译错误信息，更新状态并返回
      const translated = translateApiError(message, t_err);
      setApiError(translated);
      return translated;
    },
    [t_err]
  );

  /**
   * 发送验证码
   * 功能：调用API发送验证码，处理成功/失败逻辑，更新倒计时
   * 记忆化：依赖translateAndSetApiError，确保引用稳定
   * @param emailOrPhone - 接收验证码的邮箱或手机号
   * @returns Promise<错误信息|null> - 失败时返回翻译后的错误信息，成功返回null
   */
  const handleGetCode = useCallback(
    async (emailOrPhone: string): Promise<string | null> => {
      setApiError(null); // 清除旧错误
      setIsLoading(true); // 开始加载
      let errorMsg: string | null = null;

      try {
        // 调用API发送验证码
        await apiSendCode(emailOrPhone);
        // 成功：设置倒计时，记录时间戳到本地存储（刷新页面后可恢复倒计时）
        setCountdown(COUNTDOWN_SECONDS);
        localStorage.setItem(COUNTDOWN_TIMESTAMP_KEY, Date.now().toString());
      } catch (error) {
        // 失败：提取错误信息，翻译并记录
        const errorMessage = (error as Error).message;
        errorMsg = translateAndSetApiError(errorMessage);
      } finally {
        // 无论成功失败，结束加载状态
        setIsLoading(false);
      }
      return errorMsg;
    },
    [translateAndSetApiError]
  );

  /**
   * 清除所有错误信息
   * 功能：重置apiError状态，用于表单重置或切换场景
   * 记忆化：无依赖，确保引用稳定
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
