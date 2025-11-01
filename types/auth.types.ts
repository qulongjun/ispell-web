/*
 * @Date: 2025-11-01 11:19:57
 * @LastEditTime: 2025-11-01 11:40:38
 * @Description:
 */

/**
 * 用户核心信息接口
 * 存储用户基础身份信息，用于全局状态管理和页面展示
 */
export interface User {
  id: number; // 用户唯一标识ID（后端自增主键）
  name: string; // 用户名（通常与账号名一致）
  email: string; // 绑定邮箱（用于登录、找回密码）
  nickname: string; // 昵称（页面展示用，可自定义）
  avatar?: string; // 头像图片URL（可选，默认使用占位图）
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
 * 登录响应数据接口
 * 后端返回的登录成功结果，包含用户信息和认证令牌
 */
export interface Login {
  user: User; // 登录用户的核心信息
  tokens: Tokens; // 认证所需的令牌对
}
