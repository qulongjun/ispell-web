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

const API_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

// --- 认证存储工具（核心修复：兼容 localStorage/sessionStorage） ---
interface AuthStorage {
  getAccessToken: () => string | null;
  setAccessToken: (token: string, isPersistent: boolean) => void;
  getRefreshToken: () => string | null;
  clearTokens: () => void;
}

const authStorage: AuthStorage = {
  // 优先从 sessionStorage 读取（未勾选记住我），再读 localStorage（勾选记住我）
  getAccessToken: () => {
    return (
      sessionStorage.getItem('accessToken') ||
      localStorage.getItem('accessToken')
    );
  },
  // 根据是否持久化选择存储方式（登录时传递的 rememberMe 决定）
  setAccessToken: (token: string, isPersistent: boolean) => {
    const storage = isPersistent ? localStorage : sessionStorage;
    storage.setItem('accessToken', token);
  },
  // 优先从 sessionStorage 读取 refreshToken
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
  // 刷新后同步更新存储的 token（保持原存储方式）
  authStorage.setAccessToken(token, isPersistent);
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

/**
 * 刷新 Access Token
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

  if (!refreshToken) {
    authStorage.clearTokens();
    // 强制全局退出
    if (typeof window !== 'undefined' && window.appContextLogout) {
      window.appContextLogout();
    }
    // 核心修复：async 函数中直接 throw 错误，而非 return Promise.reject
    throw new Error('Refresh token missing.');
  }

  try {
    // 检查当前 token 存储在哪个位置（判断是否持久化）
    const isPersistent = !!localStorage.getItem('refreshToken');
    // 调用后端 /auth/token/refresh 接口
    const response = await fetch(`${API_URL}/auth/token/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${refreshToken}`,
      },
    });

    const data = await response.json();
    isRefreshing = false;

    if (!response.ok) {
      throw new Error(data.error || 'Token refresh failed.');
    }

    const newAccessToken: string = data.accessToken;
    // 通知所有等待的请求（传递持久化状态）
    onRefreshed(newAccessToken, isPersistent);
    return newAccessToken;
  } catch (error) {
    // 刷新失败，强制登出
    isRefreshing = false;
    authStorage.clearTokens();
    if (typeof window !== 'undefined' && window.appContextLogout) {
      window.appContextLogout();
    }
    // 直接 throw 错误，保持 async 函数错误处理逻辑
    throw error;
  }
};

/**
 * 封装的 fetch 函数，处理认证、Token 续期和刷新
 * @param {string} endpoint - API 路径 (相对于 /api)
 * @param {RequestInit} options - Fetch 选项
 * @param {boolean} requireAuth - 是否需要认证 (默认 true)
 * @returns {Promise<Response>}
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

        // 尝试刷新 Token
        const newRefreshedToken = await refreshTokenRequest();

        // 重新设置请求头
        originalRequest.options.headers = {
          ...(originalRequest.options.headers as Record<string, string>),
          Authorization: `Bearer ${newRefreshedToken}`,
        };

        // 重新发送请求
        response = await fetch(url, originalRequest.options);
      } else {
        throw new Error(
          'Unauthorized or Forbidden access after token refresh attempt.'
        );
      }
    }

    return response;
  } catch (error) {
    throw error;
  }
};

export default apiClient;
