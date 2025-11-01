/*
 * @Date: 2025-11-01 00:08:20
 * @LastEditTime: 2025-11-01 11:25:18
 * @Description: 第三方OAuth登录自定义Hook
 */

//  React核心Hook导入
import { useEffect } from 'react';

//  认证相关服务与常量导入
import { apiGetOAuthUrl, EXPECTED_OAUTH_ORIGIN } from '@/services/authService';

//  类型定义导入
import { Tokens, User } from '@/types/auth.types';

/**
 * OAuth登录Hook入参类型
 * @param login - 登录成功后更新全局状态的方法
 * @param closeModal - 关闭登录弹窗的方法
 * @param setIsLoading - 设置加载状态的方法
 * @param translateAndSetApiError - 错误信息翻译并设置的方法
 */
type UseOAuthProps = {
  login: (user: User, tokens: Tokens) => void; // 登录成功回调：接收用户信息和令牌
  closeModal: () => void; // 关闭当前登录弹窗
  setIsLoading: (loading: boolean) => void; // 控制登录按钮加载状态
  translateAndSetApiError: (message: string | null) => void; // 处理并显示错误信息
};

/**
 * 第三方OAuth登录逻辑Hook
 * @param props - 登录相关回调与状态控制方法
 * @returns {Object} 第三方登录触发方法
 */
export const useOAuth = ({
  login,
  closeModal,
  setIsLoading,
  translateAndSetApiError,
}: UseOAuthProps) => {
  /**
   * 监听OAuth授权页面的跨域消息回调
   * 作用：接收第三方登录页面的登录结果（成功/失败），并触发对应处理逻辑
   * 安全校验：仅处理来自预期域名（EXPECTED_OAUTH_ORIGIN）的消息，防止恶意跨域请求
   */
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // 验证消息来源合法性：仅处理OAuth授权服务器的消息，避免跨域安全风险
      if (event.origin !== EXPECTED_OAUTH_ORIGIN) {
        return;
      }

      const { type, user, accessToken, refreshToken, error } = event.data;

      // 处理登录成功：调用全局登录方法更新状态，关闭弹窗
      if (type && type.endsWith('-login-success')) {
        login(user, { accessToken, refreshToken });
        closeModal();
      }
      // 处理登录失败：传递错误信息并显示
      else if (type && type.endsWith('-login-error')) {
        translateAndSetApiError(error || 'OAuth login failed.');
      }
    };

    // 绑定消息监听事件
    window.addEventListener('message', handleMessage);

    // 组件卸载时移除监听，避免内存泄漏
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [login, closeModal, translateAndSetApiError]); // 依赖项变化时重新绑定监听

  /**
   * 触发第三方OAuth登录
   * @param provider - 第三方登录服务商标识（如wechat/qq/google/github）
   * @param width - 登录弹窗宽度
   * @param height - 登录弹窗高度
   * 逻辑：获取授权链接 → 计算弹窗居中位置 → 打开新窗口 → 处理异常
   */
  const handleOAuthClick = async (
    provider: string,
    width: number,
    height: number
  ) => {
    // 清除之前的错误提示，避免干扰本次操作
    translateAndSetApiError(null);
    // 开始加载状态，禁用按钮防止重复点击
    setIsLoading(true);

    try {
      // 调用接口获取第三方授权登录链接
      const { url } = await apiGetOAuthUrl(provider);

      // 计算弹窗居中位置（基于当前窗口大小和屏幕位置）
      const left = (window.innerWidth - width) / 2 + window.screenX;
      const top = (window.innerHeight - height) / 2 + window.screenY;

      // 打开第三方登录弹窗，指定名称和尺寸位置
      window.open(
        url,
        `${provider}Login`,
        `width=${width},height=${height},top=${top},left=${left}`
      );
    } catch (error) {
      // 捕获接口调用异常（如获取授权链接失败）
      const errorMessage = (error as Error).message;
      translateAndSetApiError(errorMessage);
    } finally {
      // 无论成功失败，结束加载状态，恢复按钮可用
      setIsLoading(false);
    }
  };

  // 暴露第三方登录触发方法供组件调用
  return {
    handleOAuthClick,
  };
};
