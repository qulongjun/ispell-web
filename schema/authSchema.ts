/*
 * @Date: 2025-11-07
 * @Description: 认证相关的 Zod 校验 Schemas
 */
'use client';

import { z } from 'zod';

// --- 基础 Schemas ---
export const emailPhoneSchema = z.string().refine(
  (val) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^1[3-9]\d{9}$/;
    return emailRegex.test(val) || phoneRegex.test(val);
  },
  { message: 'invalidFormat' }
);
export const passwordSchema = z.string().min(8, 'min8').max(16, 'max16');
export const codeSchema = z.string().length(6, 'length6');

// --- 组合 Schemas (用于表单) ---

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

export const loginPasswordSchema = z.object({
  emailOrPhone: emailPhoneSchema,
  password: passwordSchema,
  agreePolicy: z
    .boolean()
    .refine((val) => val === true, { message: 'agreePolicy' }),
});

export const loginCodeSchema = z.object({
  emailOrPhone: emailPhoneSchema,
  code: codeSchema,
  agreePolicy: z
    .boolean()
    .refine((val) => val === true, { message: 'agreePolicy' }),
});

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

// 用于 Profile 页的昵称修改
export const profileSchema = z.object({
  nickname: z
    .string()
    .min(1, { message: 'nicknameRequired' })
    .max(10, { message: 'nicknameTooLong' }),
});

// 用于 Profile 页的密码修改
export const changePasswordSchema = z
  .object({
    code: codeSchema,
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'passwordsMismatch',
    path: ['confirmPassword'],
  });
