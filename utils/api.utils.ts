/*
 * @Date: 2025-10-29 10:00:00
 * @Description: 封装 Fetch API，处理 Token 续期和认证失败 (Refresh Token 模式)
 */

// 假设全局的 logout 函数已在 window 上暴露
declare global {
  interface Window {
    appContextLogout: () => void;
  }
}

export const API_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.ispell.net/api';

// --- 认证存储工具 ---
interface AuthStorage {
  getAccessToken: () => string | null;
  setAccessToken: (token: string, isPersistent: boolean) => void;
  getRefreshToken: () => string | null;
  clearTokens: () => void;
}

const authStorage: AuthStorage = {
  getAccessToken: () => {
    return (
      sessionStorage.getItem('accessToken') ||
      localStorage.getItem('accessToken')
    );
  },
  setAccessToken: (token: string, isPersistent: boolean) => {
    const storage = isPersistent ? localStorage : sessionStorage;
    storage.setItem('accessToken', token);
  },
  getRefreshToken: () => {
    return (
      sessionStorage.getItem('refreshToken') ||
      localStorage.getItem('refreshToken')
    );
  },
  // 同时清除两种存储的 tokens 和用户信息
  clearTokens: () => {
    // 清除 localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    // 清除 sessionStorage
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('user');
  },
};

// --- Token 刷新队列管理 ---
type RefreshCallback = (token: string) => void;

let isRefreshing = false;
let refreshSubscribers: RefreshCallback[] = [];

const subscribeTokenRefresh = (cb: RefreshCallback) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token: string, isPersistent: boolean) => {
  authStorage.setAccessToken(token, isPersistent);
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

/**
 * 刷新 Access Token
 * 核心逻辑：如果刷新失败，强制全局登出。
 * @returns {Promise<string>} 新的 Access Token
 */
const refreshTokenRequest = async (): Promise<string> => {
  if (isRefreshing) {
    return new Promise((resolve) => {
      subscribeTokenRefresh((token) => {
        resolve(token);
      });
    });
  }

  isRefreshing = true;
  const refreshToken = authStorage.getRefreshToken();

  // [!! 关键登出逻辑 1 !!] Refresh Token 丢失
  if (!refreshToken) {
    authStorage.clearTokens();
    if (typeof window !== 'undefined' && window.appContextLogout) {
      window.appContextLogout();
    }
    throw new Error('Refresh token missing.');
  }

  try {
    const isPersistent = !!localStorage.getItem('refreshToken');
    
    const response = await fetch(`${API_URL}/auth/token/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${refreshToken}`,
      },
    });

    const data = await response.json();
    isRefreshing = false;

    // [!! 关键登出逻辑 2 !!] 检查刷新失败状态 (403/401 或 code 不为 0)
    if (!response.ok || data.code !== 0) {
        const error = data.message || 'Token refresh failed.';

        // 强制登出
        authStorage.clearTokens();
        if (typeof window !== 'undefined' && window.appContextLogout) {
          window.appContextLogout();
        }
        throw new Error(error);
    }

    // [!! 关键修正 !!] 从 data.data 中获取 accessToken
    const newAccessToken: string = data.data.accessToken; 
    
    // 通知所有等待的请求
    onRefreshed(newAccessToken, isPersistent);
    return newAccessToken;
  } catch (error) {
    // 3. 捕获任何网络或解析错误，强制登出
    isRefreshing = false;
    authStorage.clearTokens();
    if (typeof window !== 'undefined' && window.appContextLogout) {
      window.appContextLogout();
    }
    throw error;
  }
};

/**
 * 封装的 fetch 函数，处理认证、Token 续期和刷新
 */
const apiClient = async (
  endpoint: string,
  options: RequestInit = {},
  requireAuth: boolean = true
): Promise<Response> => {
  const url = `${API_URL}${
    endpoint.startsWith('/') ? endpoint : '/' + endpoint
  }`;

  interface OriginalRequest {
    url: string;
    options: RequestInit;
    requireAuth: boolean;
    _retry?: boolean;
  }

  const originalRequest: OriginalRequest = { url, options, requireAuth };
  const accessToken = authStorage.getAccessToken();

  // 1. 设置 Access Token
  if (requireAuth && accessToken) {
    options.headers = {
      ...(options.headers as Record<string, string>),
      Authorization: `Bearer ${accessToken}`,
    };
  }

  try {
    let response = await fetch(url, options);

    // 2. 处理 Token 失效（401/403）
    if ((response.status === 401 || response.status === 403) && requireAuth) {
      if (!originalRequest._retry) {
        originalRequest._retry = true;

        // 尝试刷新 Token (如果失败，refreshTokenRequest 内部会抛出错误并执行登出)
        const newRefreshedToken = await refreshTokenRequest();

        // 刷新成功，重新设置请求头
        originalRequest.options.headers = {
          ...(originalRequest.options.headers as Record<string, string>),
          Authorization: `Bearer ${newRefreshedToken}`,
        };

        // 重新发送请求
        response = await fetch(url, originalRequest.options);
      } else {
        // [!! 关键登出逻辑 3 !!] 刷新重试失败，强制登出
         authStorage.clearTokens();
         if (typeof window !== 'undefined' && window.appContextLogout) {
           window.appContextLogout();
         }
        throw new Error(
          'Unauthorized or Forbidden access after token refresh attempt.'
        );
      }
    }

    return response;
  } catch (error) {
    // 捕获任何网络错误或由 refreshTokenRequest 抛出的错误
    throw error;
  }
};

export default apiClient;