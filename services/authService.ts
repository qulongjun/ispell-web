/*
 * @Date: 2025-11-01 00:07:06
 * @Description: 认证及用户 API 服务 (已修复 response.json() Bug)
 */

// [!!] z 导入已移至 authSchema.ts
import apiClient, { API_URL } from '@/utils/api.utils';
import { handleApiError, ApiError } from '@/utils/error.utils';
import { User } from '@/types/auth.types';

// 错误信息翻译函数类型定义
export type TErrorFunction = (key: string) => string;

// --- 常量定义 (保持不变) ---
export const EXPECTED_OAUTH_ORIGIN = new URL(API_URL).origin;
export const COUNTDOWN_TIMESTAMP_KEY = 'ispell_code_timestamp';
export const COUNTDOWN_SECONDS = 60;

// --- 辅助函数 (保持不变) ---
export const getInitialCountdown = (): number => {
  if (typeof window === 'undefined') return 0;
  const storedTimestamp = localStorage.getItem(COUNTDOWN_TIMESTAMP_KEY);
  if (!storedTimestamp) return 0;
  const elapsedMs = Date.now() - parseInt(storedTimestamp, 10);
  const remainingSec = Math.ceil((COUNTDOWN_SECONDS * 1000 - elapsedMs) / 1000);
  if (remainingSec > 0) return remainingSec;
  localStorage.removeItem(COUNTDOWN_TIMESTAMP_KEY);
  return 0;
};

// --- API 调用函数 (Auth) ---

/**
 * [!! 已修复 !!]
 * 发送验证码
 */
export const apiSendCode = async (emailOrPhone: string): Promise<void> => {
  console.log(`[Auth Service] Sending code to: ${emailOrPhone}`);
  const response = await apiClient(
    '/auth/send-code',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrPhone }),
    },
    false
  );

  // [!! 1. 关键修复 !!] 先检查 response.ok
  if (!response.ok) {
    // [!!] response.json() 还没有被调用
    await handleApiError(response, 'Failed to send code.');
  }

  // [!! 2. 关键修复 !!] 只有在 OK 之后才调用 .json()
  const data = await response.json();

  if (data.code === 0) {
    return data.data; // 成功
  } else {
    // 业务错误 (虽然此接口不应该有)
    throw new ApiError(data.message, data.code, response.status);
  }
};

/**
 * [!! 已修复 !!]
 * 用户登录
 */
export const apiLogin = async (payload: {
  emailOrPhone: string;
  mode: 'password' | 'code';
  password?: string;
  code?: string;
}): Promise<{ user: User; accessToken: string; refreshToken: string }> => {
  console.log(
    `[Auth Service] User login: ${payload.emailOrPhone}, mode: ${payload.mode}`
  );
  const response = await apiClient(
    '/auth/login',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    false
  );

  // [!! 1. 关键修复 !!] 先检查 response.ok
  if (!response.ok) {
    // [!!] 此时 response.status 是 401 或 400
    // [!!] response.json() 还没有被调用
    await handleApiError(response, 'Login failed.');
  }

  // [!! 2. 关键修复 !!] 只有在 OK 之后才调用 .json()
  const data = await response.json();

  if (data.code === 0) {
    return data.data; // 返回 { user, accessToken, refreshToken }
  } else {
    // 业务逻辑错误 (例如，response.ok 是 true, 但 code 是 3001)
    throw new ApiError(data.message, data.code, response.status);
  }
};

/**
 * [!! 已修复 !!]
 * 用户注册
 */
export const apiRegister = async (payload: {
  emailOrPhone: string;
  password: string;
  code: string;
}) => {
  console.log(`[Auth Service] User register: ${payload.emailOrPhone}`);
  const response = await apiClient(
    '/auth/register',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    false
  );

  // [!! 1. 关键修复 !!]
  if (!response.ok) {
    // e.g. 409 Conflict (User exists) or 400 (Validation failed)
    await handleApiError(response, 'Registration failed.');
  }

  // [!! 2. 关键修复 !!]
  const data = await response.json();

  if (data.code === 0) {
    return data.data; // 注册成功
  } else {
    // 业务逻辑错误
    throw new ApiError(data.message, data.code, response.status);
  }
};

/**
 * [!! 已修复 !!]
 * 密码重置
 */
export const apiResetPassword = async (payload: {
  emailOrPhone: string;
  password: string;
  confirmPassword: string;
  code: string;
}) => {
  console.log(`[Auth Service] Reset password for: ${payload.emailOrPhone}`);
  const response = await apiClient(
    '/auth/reset-password',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    false
  );

  // [!! 1. 关键修复 !!]
  if (!response.ok) {
    // e.g. 404 (User not found) or 400 (Invalid code)
    await handleApiError(response, 'Password reset failed.');
  }

  // [!! 2. 关键修复 !!]
  const data = await response.json();

  if (data.code === 0) {
    return data.data;
  } else {
    throw new ApiError(data.message, data.code, response.status);
  }
};

/**
 * [!! 已修复 !!]
 * 获取 OAuth 授权链接
 */
export const apiGetOAuthUrl = async (
  provider: string
): Promise<{ url: string }> => {
  console.log(`[Auth Service] Get OAuth URL for provider: ${provider}`);
  const response = await apiClient(
    `/auth/${provider}/url`,
    {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    },
    false
  );

  // [!! 1. 关键修复 !!]
  if (!response.ok) {
    await handleApiError(response, `Failed to get ${provider} OAuth URL.`);
  }

  // [!! 2. 关键修复 !!]
  const data = await response.json();

  if (data.code === 0) {
    return data.data; // 返回 { url: "..." }
  } else {
    throw new ApiError(data.message, data.code, response.status);
  }
};

// --- API 调用函数 (User) ---
// [!!] 您需要将此修复模式应用到所有其他函数中

/**
 * [!! 已修复 !!]
 * 获取当前登录用户的个人资料
 */
export const apiFetchProfile = async (): Promise<User> => {
  console.log('[User Service] Fetching current user profile (no-cache)...');
  const response = await apiClient('/user/profile', {
    method: 'GET',
    cache: 'no-store',
  });

  // [!! 1. 关键修复 !!]
  if (!response.ok) {
    // 401/403 (token invalid) or 404 (user not found)
    await handleApiError(response, 'Failed to fetch profile.');
  }

  // [!! 2. 关键修复 !!]
  const data = await response.json();

  if (data.code === 0) {
    return data.data; // 返回 User 对象
  } else {
    throw new ApiError(data.message, data.code, response.status);
  }
};

/**
 * [!! 已修复 !!]
 * 更新用户昵称
 */
export const apiUpdateProfile = async (payload: {
  nickname: string;
}): Promise<User> => {
  console.log('[User Service] Updating profile...');
  const response = await apiClient('/user/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  // [!! 1. 关键修复 !!]
  if (!response.ok) {
    // 400 (invalid nickname)
    await handleApiError(response, 'Failed to update profile.');
  }

  // [!! 2. 关键修复 !!]
  const data = await response.json();

  if (data.code === 0) {
    return data.data; // 返回更新后的 User 对象
  } else {
    throw new ApiError(data.message, data.code, response.status);
  }
};

/**
 * [!! 已修复 !!]
 * 更新用户头像
 */
export const apiUpdateAvatar = async (formData: FormData): Promise<User> => {
  console.log('[User Service] Updating avatar...');
  const response = await apiClient(
    '/user/avatar',
    {
      method: 'POST',
      body: formData,
    },
    true
  );

  // [!! 1. 关键修复 !!]
  if (!response.ok) {
    // 400 (file missing, wrong type, too large)
    await handleApiError(response, 'Failed to update avatar.');
  }

  // [!! 2. 关键修复 !!]
  const data = await response.json();

  if (data.code === 0) {
    return data.data;
  } else {
    throw new ApiError(data.message, data.code, response.status);
  }
};

/**
 * [!! 已修复 !!]
 * 解除第三方账号绑定
 */
export const apiUnlinkOAuth = async (provider: string): Promise<User> => {
  console.log(`[User Service] Unlinking provider: ${provider}`);
  const response = await apiClient(`/auth/bindings/${provider}`, {
    method: 'DELETE',
  });

  // [!! 1. 关键修复 !!]
  if (!response.ok) {
    // 400 (cannot unlink last method)
    await handleApiError(response, 'Failed to unlink account.');
  }

  // [!! 2. 关键修复 !!]
  const data = await response.json();

  if (data.code === 0) {
    return data.data;
  } else {
    throw new ApiError(data.message, data.code, response.status);
  }
};

/**
 * [!! 已修复 !!]
 * 删除（软删除）当前用户的账户
 */
export const apiDeleteAccount = async (): Promise<void> => {
  console.log('[User Service] Deleting current user account...');
  const response = await apiClient('/user/delete-account', {
    method: 'DELETE',
  });

  // [!! 1. 关键修复 !!]
  if (!response.ok) {
    await handleApiError(response, 'Failed to delete account.');
  }

  // [!! 2. 关键修复 !!]
  const data = await response.json();

  if (data.code === 0) {
    return data.data;
  } else {
    throw new ApiError(data.message, data.code, response.status);
  }
};