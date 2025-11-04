/*
 * @Date: 2025-11-01 11:19:57
 * @LastEditTime: 2025-11-04 15:06:43
 * @Description: [!! 已更新 !!] 认证相关类型定义，以匹配安全的用户数据结构
 */

/**
 * 用户核心信息接口 (安全)
 *
 * 这是从后端 API (如 /user/profile 或 /auth/login)
 * 接收到的净化后的用户信息。
 * 它不包含敏感信息，如密码或完整的手机号（除非必要）。
 */
export interface User {
  id: number;
  email: string | null; // 用户的电子邮箱 (可能为 null)
  nickname: string | null; // 用户的昵称 (可能为 null)
  avatar: string | null; // 头像 URL (可能为 null)
  createdAt: string; // 账户创建时间 (ISO 字符串)
  updatedAt: string; // 账户更新时间 (ISO 字符串)
  status: 'ACTIVE' | 'DELETED'; // 用户状态

  // --- 特殊字段 (用于前端逻辑) ---

  /**
   * 用户的手机号。
   * 后端逻辑：仅在用户 email 为 null 时，才会填充此字段，
   * 以便 "设置/修改密码" 组件可以获取到联系方式。
   */
  phone: string | null;

  /**
   * 告知前端用户是否已设置密码。
   * true: 显示 "修改密码"
   * false: 显示 "设置密码"
   */
  hasPassword: boolean;

  /**
   * 告知前端用户是否已绑定手机号（无论 phone 字段是否为 null）。
   * (此字段主要用于未来的 UI 显示，例如 "已绑定手机：138****1234")
   */
  hasPhone: boolean;

  /**
   * 告知前端用户已绑定的所有第三方平台。
   * (例如: ['github', 'google'])
   */
  boundProviders: string[];
}

/**
 * 认证令牌接口
 * 存储访问令牌和刷新令牌，用于接口权限校验和令牌续期
 */
export interface Tokens {
  accessToken: string; // 访问令牌（接口请求时携带，短期有效）
  refreshToken: string; // 刷新令牌（用于获取新的访问令牌，长期有效）
}

/**
 * 登录响应数据接口 (可选的辅助类型)
 * 后端 /auth/login 接口的响应结构
 */
export interface LoginResponse {
  user: User; // 登录用户的安全信息
  accessToken: string;
  refreshToken: string;
}

/**
 * [已弃用]
 * 此类型仅用于后端 Prisma 内部查询，
 * 不应在前端使用，因为它包含敏感数据。
 *
 * @deprecated
 */
export interface ThirdPartyBinding {
  id: number;
  provider: string;
  providerUserId: string;
  userId: number;
  createdAt: string;
}
