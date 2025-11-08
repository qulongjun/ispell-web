/*
 * @Date: 2025-10-29 10:00:00
 * @LastEditTime: 2025-11-08 23:56:50
 * @Description: 封装 Fetch API，处理 Token 续期和认证失败，提供类型安全的 HTTP 请求工具
 */

// 声明全局 logout 函数类型
declare global {
  interface Window {
    appContextLogout: () => void;
  }
}

/** API 基础地址 */
export const API_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.ispell.net/api';

// --- 认证存储工具类型与实现 ---
interface AuthStorage {
  getAccessToken: () => string | null;
  setAccessToken: (token: string, isPersistent: boolean) => void;
  getRefreshToken: () => string | null;
  clearTokens: () => void;
}

/** 认证存储工具，处理 Token 的持久化与读取 */
const authStorage: AuthStorage = {
  getAccessToken: (): string | null => {
    return (
      sessionStorage.getItem('accessToken') ||
      localStorage.getItem('accessToken')
    );
  },
  setAccessToken: (token: string, isPersistent: boolean): void => {
    const storage = isPersistent ? localStorage : sessionStorage;
    storage.setItem('accessToken', token);
  },
  getRefreshToken: (): string | null => {
    return (
      sessionStorage.getItem('refreshToken') ||
      localStorage.getItem('refreshToken')
    );
  },
  clearTokens: (): void => {
    // 清除 localStorage 中的认证信息
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    // 清除 sessionStorage 中的认证信息
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('user');
  },
};

// --- Token 刷新相关类型定义 ---
type RefreshCallback = (token: string) => void;

/** Token 刷新响应数据结构 */
interface TokenRefreshResponse {
  code: number;
  message: string;
  data: {
    accessToken: string;
  };
}

// --- Token 刷新队列管理 ---
let isRefreshing = false;
let refreshSubscribers: RefreshCallback[] = [];

/**
 * 订阅 Token 刷新事件
 * @param cb 刷新成功后的回调函数
 */
const subscribeTokenRefresh = (cb: RefreshCallback): void => {
  refreshSubscribers.push(cb);
};

/**
 * 通知所有订阅者 Token 已刷新
 * @param token 新的 Access Token
 * @param isPersistent 是否持久化存储
 */
const onRefreshed = (token: string, isPersistent: boolean): void => {
  authStorage.setAccessToken(token, isPersistent);
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = []; // 清空订阅队列
};

/**
 * 刷新 Access Token
 * 核心逻辑：刷新失败时强制全局登出
 * @returns 新的 Access Token
 * @throws {Error} 刷新失败时抛出错误
 */
const refreshTokenRequest = async (): Promise<string> => {
  // 如果正在刷新，加入等待队列
  if (isRefreshing) {
    return new Promise((resolve) => {
      subscribeTokenRefresh((token) => resolve(token));
    });
  }

  isRefreshing = true;
  const refreshToken = authStorage.getRefreshToken();

  // 处理 Refresh Token 丢失情况
  if (!refreshToken) {
    authStorage.clearTokens();
    if (typeof window !== 'undefined' && window.appContextLogout) {
      window.appContextLogout();
    }
    throw new Error('刷新令牌不存在，无法续期');
  }

  try {
    // 判断刷新令牌是否来自持久化存储
    const isPersistent = !!localStorage.getItem('refreshToken');

    const response = await fetch(`${API_URL}/auth/token/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${refreshToken}`,
      },
    });

    const data: TokenRefreshResponse = await response.json();
    isRefreshing = false;

    // 处理刷新失败（HTTP 状态异常或业务代码错误）
    if (!response.ok || data.code !== 0) {
      const errorMsg = data.message || '令牌刷新失败';

      authStorage.clearTokens();
      if (typeof window !== 'undefined' && window.appContextLogout) {
        window.appContextLogout();
      }
      throw new Error(errorMsg);
    }

    // 提取新的 Access Token 并通知订阅者
    const newAccessToken: string = data.data.accessToken;
    onRefreshed(newAccessToken, isPersistent);
    return newAccessToken;
  } catch (error) {
    // 捕获网络错误或解析错误，强制登出
    isRefreshing = false;
    authStorage.clearTokens();
    if (typeof window !== 'undefined' && window.appContextLogout) {
      window.appContextLogout();
    }
    throw error;
  }
};

/**
 * 原始请求信息类型
 */
interface OriginalRequest {
  url: string;
  options: RequestInit;
  requireAuth: boolean;
  _retry?: boolean; // 标记是否已重试过
}

/**
 * 封装的 fetch 函数，处理认证、Token 续期和刷新逻辑
 * @param endpoint API 端点路径
 * @param options fetch 请求配置
 * @param requireAuth 是否需要认证（默认 true）
 * @returns fetch 响应对象
 */
const apiClient = async (
  endpoint: string,
  options: RequestInit = {},
  requireAuth: boolean = true
): Promise<Response> => {
  // 构建完整 URL，处理斜杠拼接
  const url = `${API_URL}${
    endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  }`;

  const originalRequest: OriginalRequest = { url, options, requireAuth };
  const accessToken = authStorage.getAccessToken();

  // 设置认证头（如果需要且存在 Token）
  if (requireAuth && accessToken) {
    originalRequest.options.headers = {
      ...originalRequest.options.headers, // 保留原有 headers
      Authorization: `Bearer ${accessToken}`,
    };
  }

  try {
    let response = await fetch(originalRequest.url, originalRequest.options);

    // 处理 Token 失效（401 未授权 / 403 禁止访问）
    if ((response.status === 401 || response.status === 403) && requireAuth) {
      if (!originalRequest._retry) {
        // 首次重试：刷新 Token 后重新请求
        originalRequest._retry = true;

        try {
          const newRefreshedToken = await refreshTokenRequest();

          // 更新请求头的 Token
          originalRequest.options.headers = {
            ...originalRequest.options.headers,
            Authorization: `Bearer ${newRefreshedToken}`,
          };

          // 重新发送请求
          response = await fetch(originalRequest.url, originalRequest.options);
        } catch (refreshError) {
          // 刷新 Token 失败，直接抛出错误
          throw refreshError;
        }
      } else {
        // 重试后仍失败：强制登出
        authStorage.clearTokens();
        if (typeof window !== 'undefined' && window.appContextLogout) {
          window.appContextLogout();
        }
        throw new Error('令牌刷新后仍无法访问，已强制登出');
      }
    }

    return response;
  } catch (error) {
    // 捕获所有请求相关错误（网络错误、认证错误等）
    throw error;
  }
};

export default apiClient;
