/*
 * @Date: 2025-11-01 00:07:06
 * @LastEditTime: 2025-11-04 14:06:41
 * @Description: 认证及用户 API 服务 (已更新)
 */

import { z } from 'zod';
import apiClient, { API_URL } from '@/utils/api.utils';
import { handleApiError } from '@/utils/error.utils';
import { User } from '@/types/auth.types';

// 错误信息翻译函数类型定义
export type TErrorFunction = (key: string) => string;

// --- 常量定义 ---
export const EXPECTED_OAUTH_ORIGIN = new URL(API_URL).origin;
export const COUNTDOWN_TIMESTAMP_KEY = 'ispell_code_timestamp';
export const COUNTDOWN_SECONDS = 60;

// --- Zod 表单校验规则 (保持不变) ---
/** 邮箱/手机号校验规则（支持标准邮箱格式或11位手机号） */
export const emailPhoneSchema = z.string().refine(
  (val) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^1[3-9]\d{9}$/;
    return emailRegex.test(val) || phoneRegex.test(val);
  },
  { message: 'invalidFormat' }
);
/** 密码校验规则（8-16位字符） */
export const passwordSchema = z.string().min(8, 'min8').max(16, 'max16');
/** 验证码校验规则（固定6位） */
export const codeSchema = z.string().length(6, 'length6');
/** 注册表单校验规则 */
export const registerSchema = z
  .object({
    emailOrPhone: emailPhoneSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    code: codeSchema,
    agreePolicy: z
      .boolean()
      .refine((val) => val === true, { message: 'agreePolicy' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'passwordsMismatch',
    path: ['confirmPassword'],
  });
/** 密码登录表单校验规则 */
export const loginPasswordSchema = z.object({
  emailOrPhone: emailPhoneSchema,
  password: passwordSchema,
  agreePolicy: z
    .boolean()
    .refine((val) => val === true, { message: 'agreePolicy' }),
});
/** 验证码登录表单校验规则 */
export const loginCodeSchema = z.object({
  emailOrPhone: emailPhoneSchema,
  code: codeSchema,
  agreePolicy: z
    .boolean()
    .refine((val) => val === true, { message: 'agreePolicy' }),
});
/** 密码重置表单校验规则（无需同意协议） */
export const resetPasswordSchema = z
  .object({
    emailOrPhone: emailPhoneSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    code: codeSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'passwordsMismatch',
    path: ['confirmPassword'],
  });

// --- 辅助函数 (保持不变) ---
export const getInitialCountdown = (): number => {
  /* ... (代码无变化) ... */
  if (typeof window === 'undefined') return 0;
  const storedTimestamp = localStorage.getItem(COUNTDOWN_TIMESTAMP_KEY);
  if (!storedTimestamp) return 0;
  const elapsedMs = Date.now() - parseInt(storedTimestamp, 10);
  const remainingSec = Math.ceil((COUNTDOWN_SECONDS * 1000 - elapsedMs) / 1000);
  if (remainingSec > 0) return remainingSec;
  localStorage.removeItem(COUNTDOWN_TIMESTAMP_KEY);
  return 0;
};
export const translateApiError = (
  message: string,
  t_err: TErrorFunction
): string => {
  /* ... (代码无变化) ... */
  const safeMessage = String(message || '').toLowerCase();
  if (safeMessage.includes('invalid or expired verification code'))
    return t_err('invalidCode');
  if (safeMessage.includes('user already exists'))
    return t_err('userAlreadyExists');
  if (safeMessage.includes('invalid identifier or password'))
    return t_err('invalidCredentials');
  if (safeMessage.includes('user not found')) return t_err('userNotFound');
  if (safeMessage.includes('password login not supported'))
    return t_err('passwordNotSupported');
  if (safeMessage.includes('failed to send code'))
    return t_err('sendCodeFailed');
  if (
    safeMessage.includes('failed to exchange code for token') ||
    safeMessage.includes('failed to fetch user info')
  ) {
    return t_err('oauthFailed');
  }
  if (safeMessage.includes('invalid state')) return t_err('oauthStateMismatch');
  return t_err('unknownError');
};

// --- API 调用函数 (Auth) ---
/** 发送验证码 */
export const apiSendCode = async (emailOrPhone: string): Promise<void> => {
  console.log(`[Auth Service] Sending code to: ${emailOrPhone}`);
  const response = await apiClient(
    '/auth/send-code',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrPhone }),
    },
    false // false = 不需要 token
  );
  if (!response.ok) {
    await handleApiError(response, 'Failed to send code.');
  }
};

/** 用户登录 */
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
  if (!response.ok) {
    await handleApiError(response, 'Login failed.');
  }
  return response.json();
};

/** 用户注册 */
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
  if (!response.ok) {
    await handleApiError(response, 'Registration failed.');
  }
  return response.json();
};

/** 密码重置 */
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
  if (!response.ok) {
    await handleApiError(response, 'Password reset failed.');
  }
  return response.json();
};

/** 获取 OAuth 授权链接 */
export const apiGetOAuthUrl = async (
  provider: string
): Promise<{ url: string }> => {
  console.log(`[Auth Service] Get OAuth URL for provider: ${provider}`);
  const response = await apiClient(
    `/auth/${provider}/url`,
    {
      method: 'GET',
      credentials: 'include', // 必须携带 cookie (用于 state 校验)
      headers: { Accept: 'application/json' },
    },
    false
  );
  if (!response.ok) {
    await handleApiError(response, `Failed to get ${provider} OAuth URL.`);
  }
  return response.json();
};

// --- [新] API 调用函数 (User) ---

/**
 * [新] 获取当前登录用户的个人资料
 * (用于 AppContext 初始化和 profile 页面)
 * @returns {Promise<User>} 最新的用户信息
 */
export const apiFetchProfile = async (): Promise<User> => {
  console.log('[User Service] Fetching current user profile (no-cache)...');
  const response = await apiClient('/user/profile', {
    method: 'GET',
    cache: 'no-store', // [!!!! 关键修复 !!!!] 禁用缓存
  });
  if (!response.ok) {
    await handleApiError(response, 'Failed to fetch profile.');
  }
  return response.json();
};

/**
 * [新] 更新用户昵称
 * @param payload - { nickname: string }
 * @returns {Promise<User>} 更新后的用户信息
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
  if (!response.ok) {
    await handleApiError(response, 'Failed to update profile.');
  }
  return response.json();
};

/**
 * [新] 更新用户头像
 * @param formData - 包含 'avatar' 文件的 FormData
 * @returns {Promise<User>} 更新后的用户信息 (含新头像 URL)
 */
export const apiUpdateAvatar = async (formData: FormData): Promise<User> => {
  console.log('[User Service] Updating avatar...');
  // 注意：当 body 是 FormData 时，不需要设置 Content-Type
  // 并且 apiClient 的第三个参数需要为 true (表示 formData)
  const response = await apiClient(
    '/user/avatar',
    {
      method: 'POST',
      body: formData,
    },
    true // true = 是 FormData，不需要 'Content-Type'
  );
  if (!response.ok) {
    await handleApiError(response, 'Failed to update avatar.');
  }
  return response.json();
};

/**
 * [新] 修改密码
 * @param payload - { currentPassword: string, newPassword: string }
 */
export const apiChangePassword = async (payload: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> => {
  console.log('[User Service] Changing password...');
  const response = await apiClient('/auth/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    await handleApiError(response, 'Failed to change password.');
  }
  // 成功时后端返回 200/204，没有 body
};

/**
 * [新] 解除第三方账号绑定
 * @param provider - 'github' | 'google'
 * @returns {Promise<User>} 更新后的用户信息 (bindings 减少)
 */
export const apiUnlinkOAuth = async (provider: string): Promise<User> => {
  console.log(`[User Service] Unlinking provider: ${provider}`);
  const response = await apiClient(`/auth/bindings/${provider}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    await handleApiError(response, 'Failed to unlink account.');
  }
  return response.json();
};

/**
 * [!! 新增 !!] 删除（软删除）当前用户的账户
 */
export const apiDeleteAccount = async (): Promise<void> => {
  console.log('[User Service] Deleting current user account...');
  // apiClient 默认携带 token
  const response = await apiClient('/user/delete-account', {
    method: 'DELETE',
  });
  if (!response.ok) {
    await handleApiError(response, 'Failed to delete account.');
  }
  // 成功时返回 200
};
