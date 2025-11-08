/*
 * @Date: 2025-11-01 00:08:20
 * @Description: 第三方OAuth登录自定义Hook (已重构为 ApiError)
 */

import { useEffect } from 'react';
import { apiGetOAuthUrl, EXPECTED_OAUTH_ORIGIN } from '@/services/authService';
import { Tokens, User } from '@/types/auth.types';

/**
 * OAuth登录Hook入参类型
 */
type UseOAuthProps = {
  login: (user: User, tokens: Tokens, rememberMe: boolean) => void;
  closeModal: () => void;
  setIsLoading: (loading: boolean) => void;
  translateAndSetApiError: (error: unknown) => void;
};

/**
 * 第三方OAuth登录逻辑Hook
 */
export const useOAuth = ({
  login,
  closeModal,
  setIsLoading,
  translateAndSetApiError,
}: UseOAuthProps) => {
  /**
   * 监听OAuth授权页面的跨域消息回调
   */
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== EXPECTED_OAUTH_ORIGIN) {
        return;
      }

      const { type, user, accessToken, refreshToken, error } = event.data;

      if (type && type.endsWith('-login-success')) {
        login(user, { accessToken, refreshToken }, false);
        closeModal();
        translateAndSetApiError(null); // 成功后清除错误
      } else if (type && type.endsWith('-login-error')) {
        translateAndSetApiError(error || 'OAuth login failed.');
      }

      // 不管成功失败，停止加载状态
      setIsLoading(false);
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [login, closeModal, translateAndSetApiError, setIsLoading]);

  /**
   * 触发第三方OAuth登录
   * 修复了点击后立即报错的问题：错误只在 catch 块中设置。
   */
  const handleOAuthClick = async (
    provider: string,
    width: number,
    height: number
  ) => {
    // 提交前清除旧错误 (依赖 useAuthForm 的 setApiError 间接实现)
    translateAndSetApiError(null);
    setIsLoading(true);

    try {
      // 1. 获取 URL (可能在此抛出 ApiError)
      const { url } = await apiGetOAuthUrl(provider);

      // 2. 打开窗口 (如果 URL 成功获取，流程继续)
      const left = (window.innerWidth - width) / 2 + window.screenX;
      const top = (window.innerHeight - height) / 2 + window.screenY;

      window.open(
        url,
        `${provider}Login`,
        `width=${width},height=${height},top=${top},left=${left}`
      );

      // 3. 保持 isLoading = true，等待 postMessage 结果。
    } catch (error) {
      // 4. 捕获 ApiError，立即停止加载并显示错误
      translateAndSetApiError(error);
      setIsLoading(false);
    }
  };

  return {
    handleOAuthClick,
  };
};
