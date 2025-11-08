/*
 * @Date: 2025-11-01 00:07:06
 * @LastEditTime: 2025-11-08 23:47:04
 * @Description: 认证及用户 API 服务
 */

import apiClient, { API_URL } from '@/utils/api.utils';
import { handleApiError, ApiError } from '@/utils/error.utils';
import { User } from '@/types/auth.types';

// 错误信息翻译函数类型定义
export type TErrorFunction = (key: string) => string;

// --- 常量定义 ---
/** OAuth 授权源验证常量 */
export const EXPECTED_OAUTH_ORIGIN = new URL(API_URL).origin;
/** 验证码倒计时本地存储键 */
export const COUNTDOWN_TIMESTAMP_KEY = 'ispell_code_timestamp';
/** 验证码倒计时时长（秒） */
export const COUNTDOWN_SECONDS = 60;

// --- 辅助函数 ---
/**
 * 计算验证码倒计时初始剩余时间
 * @returns 剩余秒数（0表示倒计时已结束）
 */
export const getInitialCountdown = (): number => {
  if (typeof window === 'undefined') return 0;

  const storedTimestamp = localStorage.getItem(COUNTDOWN_TIMESTAMP_KEY);
  if (!storedTimestamp) return 0;

  const elapsedMs = Date.now() - parseInt(storedTimestamp, 10);
  const remainingSec = Math.ceil((COUNTDOWN_SECONDS * 1000 - elapsedMs) / 1000);

  // 清理过期的倒计时记录
  if (remainingSec <= 0) {
    localStorage.removeItem(COUNTDOWN_TIMESTAMP_KEY);
    return 0;
  }

  return remainingSec;
};

// --- 认证相关 API ---

/**
 * 发送验证码（短信/邮件）
 * @param emailOrPhone 接收验证码的邮箱或手机号
 * @throws {ApiError} 接口调用失败时抛出错误
 */
export const apiSendCode = async (emailOrPhone: string): Promise<void> => {
  console.log(`[Auth Service] 发送验证码至: ${emailOrPhone}`);

  const response = await apiClient(
    '/auth/send-code',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrPhone }),
    },
    false
  );

  // 先检查 HTTP 响应状态
  if (!response.ok) {
    await handleApiError(response, '发送验证码失败');
  }

  // 状态正常时解析响应数据
  const data = await response.json();

  // 检查业务逻辑状态码
  if (data.code !== 0) {
    throw new ApiError(data.message, data.code, response.status);
  }
};

/**
 * 用户登录（密码/验证码模式）
 * @param payload 登录参数
 * @param payload.emailOrPhone 邮箱或手机号
 * @param payload.mode 登录模式（password/code）
 * @param payload.password 密码（mode为password时必填）
 * @param payload.code 验证码（mode为code时必填）
 * @returns 包含用户信息和令牌的对象
 * @throws {ApiError} 登录失败时抛出错误
 */
export const apiLogin = async (payload: {
  emailOrPhone: string;
  mode: 'password' | 'code';
  password?: string;
  code?: string;
}): Promise<{ user: User; accessToken: string; refreshToken: string }> => {
  console.log(
    `[Auth Service] 用户登录: ${payload.emailOrPhone}, 模式: ${payload.mode}`
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
    await handleApiError(response, '登录失败');
  }

  const data = await response.json();

  if (data.code !== 0) {
    throw new ApiError(data.message, data.code, response.status);
  }

  return data.data;
};

/**
 * 用户注册
 * @param payload 注册参数
 * @param payload.emailOrPhone 邮箱或手机号
 * @param payload.password 密码
 * @param payload.code 验证码
 * @returns 注册结果数据
 * @throws {ApiError} 注册失败时抛出错误
 */
export const apiRegister = async (payload: {
  emailOrPhone: string;
  password: string;
  code: string;
}): Promise<{ user: User; accessToken: string; refreshToken: string }> => {
  console.log(`[Auth Service] 用户注册: ${payload.emailOrPhone}`);

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
    await handleApiError(response, '注册失败');
  }

  const data = await response.json();

  if (data.code !== 0) {
    throw new ApiError(data.message, data.code, response.status);
  }

  return data.data;
};

/**
 * 密码重置
 * @param payload 重置参数
 * @param payload.emailOrPhone 邮箱或手机号
 * @param payload.password 新密码
 * @param payload.confirmPassword 确认新密码
 * @param payload.code 验证码
 * @returns 重置结果
 * @throws {ApiError} 重置失败时抛出错误
 */
export const apiResetPassword = async (payload: {
  emailOrPhone: string;
  password: string;
  confirmPassword: string;
  code: string;
}): Promise<void> => {
  console.log(`[Auth Service] 密码重置: ${payload.emailOrPhone}`);

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
    await handleApiError(response, '密码重置失败');
  }

  const data = await response.json();

  if (data.code !== 0) {
    throw new ApiError(data.message, data.code, response.status);
  }
};

/**
 * 获取第三方 OAuth 授权链接
 * @param provider 第三方平台标识（如google、facebook等）
 * @returns 包含授权链接的对象
 * @throws {ApiError} 获取链接失败时抛出错误
 */
export const apiGetOAuthUrl = async (
  provider: string
): Promise<{ url: string }> => {
  console.log(`[Auth Service] 获取 OAuth 授权链接: ${provider}`);

  const response = await apiClient(
    `/auth/${provider}/url`,
    {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    },
    false
  );

  if (!response.ok) {
    await handleApiError(response, `获取${provider}授权链接失败`);
  }

  const data = await response.json();

  if (data.code !== 0) {
    throw new ApiError(data.message, data.code, response.status);
  }

  return data.data;
};

// --- 用户相关 API ---

/**
 * 获取当前登录用户的个人资料
 * @returns 用户信息对象
 * @throws {ApiError} 获取失败时抛出错误
 */
export const apiFetchProfile = async (): Promise<User> => {
  console.log('[User Service] 获取当前用户资料（无缓存）');

  const response = await apiClient('/user/profile', {
    method: 'GET',
    cache: 'no-store',
  });

  if (!response.ok) {
    await handleApiError(response, '获取个人资料失败');
  }

  const data = await response.json();

  if (data.code !== 0) {
    throw new ApiError(data.message, data.code, response.status);
  }

  return data.data;
};

/**
 * 更新用户昵称
 * @param payload 更新参数
 * @param payload.nickname 新昵称
 * @returns 更新后的用户信息
 * @throws {ApiError} 更新失败时抛出错误
 */
export const apiUpdateProfile = async (payload: {
  nickname: string;
}): Promise<User> => {
  console.log('[User Service] 更新用户昵称');

  const response = await apiClient('/user/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    await handleApiError(response, '更新个人资料失败');
  }

  const data = await response.json();

  if (data.code !== 0) {
    throw new ApiError(data.message, data.code, response.status);
  }

  return data.data;
};

/**
 * 更新用户头像
 * @param formData 包含头像文件的表单数据
 * @returns 更新后的用户信息
 * @throws {ApiError} 更新失败时抛出错误
 */
export const apiUpdateAvatar = async (formData: FormData): Promise<User> => {
  console.log('[User Service] 更新用户头像');

  const response = await apiClient(
    '/user/avatar',
    {
      method: 'POST',
      body: formData,
    },
    true
  );

  if (!response.ok) {
    await handleApiError(response, '更新头像失败');
  }

  const data = await response.json();

  if (data.code !== 0) {
    throw new ApiError(data.message, data.code, response.status);
  }

  return data.data;
};

/**
 * 解除第三方账号绑定
 * @param provider 第三方平台标识
 * @returns 更新后的用户信息
 * @throws {ApiError} 解除绑定失败时抛出错误
 */
export const apiUnlinkOAuth = async (provider: string): Promise<User> => {
  console.log(`[User Service] 解除第三方绑定: ${provider}`);

  const response = await apiClient(`/auth/bindings/${provider}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    await handleApiError(response, '解除账号绑定失败');
  }

  const data = await response.json();

  if (data.code !== 0) {
    throw new ApiError(data.message, data.code, response.status);
  }

  return data.data;
};

/**
 * 软删除当前用户账户
 * @throws {ApiError} 删除失败时抛出错误
 */
export const apiDeleteAccount = async (): Promise<void> => {
  console.log('[User Service] 执行账户软删除');

  const response = await apiClient('/user/delete-account', {
    method: 'DELETE',
  });

  if (!response.ok) {
    await handleApiError(response, '删除账户失败');
  }

  const data = await response.json();

  if (data.code !== 0) {
    throw new ApiError(data.message, data.code, response.status);
  }
};
