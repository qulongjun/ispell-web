/*
 * @Date: 2025-11-01 11:19:57
 * @LastEditTime: 2025-11-08 23:48:36
 * @Description: 认证相关类型定义
 */

/**
 * 用户核心信息接口 (安全)
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
