/*
 * @Date: 2025-11-01 00:07:06
 * @LastEditTime: 2025-11-01 11:35:17
 * @Description: 认证相关 API 服务
 */

import { z } from 'zod';
import apiClient from '@/utils/api.utils';
import { handleApiError } from '@/utils/error.utils';
import { User } from '@/types/auth.types';

// 错误信息翻译函数类型定义
export type TErrorFunction = (key: string) => string;

// --- 常量定义 ---
export const API_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';
export const EXPECTED_OAUTH_ORIGIN = new URL(API_URL).origin;
export const COUNTDOWN_TIMESTAMP_KEY = 'ispell_code_timestamp';
export const COUNTDOWN_SECONDS = 60;

// --- Zod 表单校验规则 ---
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

// --- 辅助函数 ---
/**
 * 初始化验证码倒计时（从本地存储恢复或重置为0）
 * @returns 剩余倒计时秒数
 */
export const getInitialCountdown = (): number => {
  if (typeof window === 'undefined') return 0;

  const storedTimestamp = localStorage.getItem(COUNTDOWN_TIMESTAMP_KEY);
  if (!storedTimestamp) return 0;

  const elapsedMs = Date.now() - parseInt(storedTimestamp, 10);
  const remainingSec = Math.ceil((COUNTDOWN_SECONDS * 1000 - elapsedMs) / 1000);

  if (remainingSec > 0) return remainingSec;

  // 倒计时已结束，清除本地存储
  localStorage.removeItem(COUNTDOWN_TIMESTAMP_KEY);
  return 0;
};

/**
 * 翻译 API 错误信息（适配多语言）
 * @param message - 原始错误信息
 * @param t_err - 多语言翻译函数
 * @returns 翻译后的错误提示
 */
export const translateApiError = (
  message: string,
  t_err: TErrorFunction
): string => {
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

  // 默认错误提示
  return t_err('unknownError');
};

// --- API 调用函数 ---
/**
 * 发送验证码（用于登录/注册/密码重置）
 * @param emailOrPhone - 接收验证码的邮箱或手机号
 * @throws {Error} - 接口调用失败时抛出错误
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

  if (!response.ok) {
    await handleApiError(response, 'Failed to send code.');
  }
};

/**
 * 用户登录（支持密码登录/验证码登录）
 * @param payload - 登录参数（包含邮箱/手机号、登录模式、密码/验证码）
 * @returns 登录成功后的用户信息和令牌
 * @throws {Error} - 接口调用失败时抛出错误
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

  if (!response.ok) {
    await handleApiError(response, 'Login failed.');
  }

  return response.json();
};

/**
 * 用户注册
 * @param payload - 注册参数（包含邮箱/手机号、密码、验证码）
 * @returns 注册成功后的响应数据
 * @throws {Error} - 接口调用失败时抛出错误
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

  if (!response.ok) {
    await handleApiError(response, 'Registration failed.');
  }

  return response.json();
};

/**
 * 密码重置
 * @param payload - 重置参数（包含邮箱/手机号、新密码、确认密码、验证码）
 * @returns 重置成功后的响应数据
 * @throws {Error} - 接口调用失败时抛出错误
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

  if (!response.ok) {
    await handleApiError(response, 'Password reset failed.');
  }

  return response.json();
};

/**
 * 获取第三方 OAuth 授权链接（微信/QQ/谷歌等）
 * @param provider - 第三方服务商标识（如 wechat/qq/google/github）
 * @returns 授权链接
 * @throws {Error} - 接口调用失败时抛出错误
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

  if (!response.ok) {
    await handleApiError(response, `Failed to get ${provider} OAuth URL.`);
  }

  return response.json();
};
