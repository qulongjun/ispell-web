/*
 * @Date: 2025-11-01 00:08:20
 * @LastEditTime: 2025-11-08 10:31:22
 * @Description: 第三方OAuth登录自定义Hook (已重构为 ApiError)
 */

//  React核心Hook导入
import { useEffect } from 'react';

// [!! 修改 !!] 导入 ApiError
import { ApiError } from '@/utils/error.utils';

//  认证相关服务与常量导入
import { apiGetOAuthUrl, EXPECTED_OAUTH_ORIGIN } from '@/services/authService';

//  类型定义导入
import { Tokens, User } from '@/types/auth.types';

/**
 * OAuth登录Hook入参类型
 */
type UseOAuthProps = {
  login: (user: User, tokens: Tokens, rememberMe: boolean) => void;
  closeModal: () => void;
  setIsLoading: (loading: boolean) => void;
  // [!! 修改 !!] 明确 translateAndSetApiError 接收 'unknown'
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
   * (保持不变，因为 auth.controller 失败时仍发送 'error' 字符串)
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
      } else if (type && type.endsWith('-login-error')) {
        // [!!] 这里收到的 'error' 是一个字符串
        // 传入的 translateAndSetApiError (来自 useAuthForm)
        // 现在可以处理字符串或 ApiError 对象
        translateAndSetApiError(error || 'OAuth login failed.');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [login, closeModal, translateAndSetApiError]);

  /**
   * [!! 重大修改 !!]
   * 触发第三方OAuth登录
   * @param provider - 第三方登录服务商标识
   * @param width - 登录弹窗宽度
   * @param height - 登录弹窗高度
   */
  const handleOAuthClick = async (
    provider: string,
    width: number,
    height: number
  ) => {
    translateAndSetApiError(null); // 清除旧错误
    setIsLoading(true);

    try {
      // [!! 修改 !!] apiGetOAuthUrl 现在会解析 {code, data}
      // 成功时返回 data (即 { url })
      // 失败时抛出 ApiError
      const { url } = await apiGetOAuthUrl(provider);

      // 计算弹窗居中位置
      const left = (window.innerWidth - width) / 2 + window.screenX;
      const top = (window.innerHeight - height) / 2 + window.screenY;

      // 打开第三方登录弹窗
      window.open(
        url,
        `${provider}Login`,
        `width=${width},height=${height},top=${top},left=${left}`
      );
    } catch (error) {
      // [!! 修改 !!] 捕获 apiGetOAuthUrl 抛出的 ApiError
      // 并将其传递给 useAuthForm 的错误处理器
      translateAndSetApiError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // 暴露第三方登录触发方法供组件调用
  return {
    handleOAuthClick,
  };
};
