'use client';
/**
 * 认证相关模态框容器组件
 * 作用：集中管理登录弹窗(LoginModal)和注册弹窗(RegisterModal)，
 * 统一在应用中挂载这两个模态框，避免分散渲染，简化组件引用逻辑
 */

// 导入登录弹窗组件（处理用户登录逻辑与UI）
import LoginModal from './LoginModal';
// 导入注册弹窗组件（处理用户注册逻辑与UI）
import RegisterModal from './RegisterModal';

/**
 * AuthModals 组件
 * 作为登录和注册弹窗的聚合容器，无需额外逻辑，仅负责组合渲染
 * 弹窗的显示/隐藏状态由全局上下文（如 AppContext）统一控制，此处仅提供挂载点
 */
const AuthModals = () => {
  return (
    <>
      {/* 登录弹窗组件 - 由全局状态 isLoginModalOpen 控制显示/隐藏 */}
      <LoginModal />
      {/* 注册弹窗组件 - 由全局状态 isRegisterModalOpen 控制显示/隐藏 */}
      <RegisterModal />
    </>
  );
};

export default AuthModals;
