/*
 * @Date: 2025-11-01 10:40:35
 * @LastEditTime: 2025-11-08 21:15:52
 * @Description: 认证弹窗聚合容器组件
 */

// 登录弹窗组件：处理用户登录表单与验证逻辑
import LoginModal from './LoginModal';
// 注册弹窗组件：处理用户注册表单与提交逻辑
import RegisterModal from './RegisterModal';

/**
 * 认证弹窗容器组件
 * 作为登录和注册弹窗的统一挂载点，负责组合渲染两个弹窗
 * 弹窗的显示状态由全局上下文（如isLoginModalOpen、isRegisterModalOpen）控制
 * 本身不管理状态，仅提供UI容器功能
 */
const AuthModals = () => {
  return (
    <>
      {/* 登录弹窗：由全局状态isLoginModalOpen控制显示/隐藏 */}
      <LoginModal />
      {/* 注册弹窗：由全局状态isRegisterModalOpen控制显示/隐藏 */}
      <RegisterModal />
    </>
  );
};

export default AuthModals;
