/*
 * @Date: 2025-11-03 15:12:04
 * @LastEditTime: 2025-11-08 22:55:03
 * @Description: 设置页面通用卡片容器组件，用于统一包裹各类功能区块（如个人资料、密码修改等），提供标准化的标题区、内容区和底部操作区布局，适配明暗模式并包含hover交互效果
 */
import React from 'react';

/**
 * 通用设置卡片组件属性类型
 */
interface SectionCardProps {
  /** 卡片标题文本（使用h2语义化标签展示） */
  title: string;
  /** 卡片内容区域，通常为表单元素或设置项列表 */
  children: React.ReactNode;
  /** 卡片底部操作区（可选），通常用于放置保存、提交等功能性按钮 */
  footer?: React.ReactNode;
  /** 自定义样式类名，用于覆盖或扩展默认样式 */
  className?: string;
}

/**
 * 通用设置卡片容器组件
 * 提供标准化的卡片布局，包含标题区、内容区和可选的底部操作区
 * 具有统一的视觉样式（圆角、阴影、边框），支持明暗模式，hover时增强阴影效果提升交互感
 * 内容区默认使用space-y-6管理子元素间距，底部操作区与内容区通过背景色和边框形成视觉区分
 */
const SectionCard: React.FC<SectionCardProps> = ({
  title,
  children,
  footer,
  className,
}) => {
  return (
    // 根容器：基础卡片样式，合并默认样式与自定义类名
    <section
      className={`
        bg-white dark:bg-gray-800 
        rounded-lg shadow-md 
        border border-gray-100 dark:border-gray-700/50 
        transition-all duration-200 hover:shadow-lg 
        overflow-hidden
        ${className || ''}
      `}
    >
      {/* 标题与内容区域 */}
      <div className="p-6">
        {/* 卡片标题：使用h2语义化标签，突出层级关系 */}
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          {title}
        </h2>

        {/* 内容插槽：通过space-y-6统一管理子元素垂直间距 */}
        <div className="space-y-6">{children}</div>
      </div>

      {/* 底部操作区：存在时显示，与内容区视觉区分 */}
      {footer && (
        <div
          className="bg-gray-50 dark:bg-gray-900/50 
                      border-t border-gray-100 dark:border-gray-700/30 
                      px-6 py-4 
                      flex justify-end"
        >
          {footer}
        </div>
      )}
    </section>
  );
};

export default SectionCard;
