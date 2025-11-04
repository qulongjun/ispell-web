/*
 * @Date: 2025-11-03 15:12:04
 * @LastEditTime: 2025-11-04 15:05:40
 * @Description: 
 */
import React from 'react';

interface SectionCardProps {
  /** 卡片标题 */
  title: string;
  /** 卡片内容区域 */
  children: React.ReactNode;
  /** 卡片底部操作区（通常用于放置保存/提交按钮） */
  footer?: React.ReactNode;
  /** 自定义类名，用于覆盖或扩展默认样式 */
  className?: string;
}

/**
 * 设置页面通用卡片容器组件
 * 统一包裹设置页面的各个功能区块（如个人资料、密码修改等）
 * 提供一致的卡片样式、标题区和操作区布局
 */
const SectionCard: React.FC<SectionCardProps> = ({
  title,
  children,
  footer,
  className,
}) => {
  return (
    // 根容器：合并默认样式与自定义类名，添加基础卡片样式
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
        {/* 卡片标题：使用语义化h2，增强层级感 */}
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          {title}
        </h2>

        {/* 内容插槽：通过容器统一管理内容间距 */}
        <div className="space-y-6">{children}</div>
      </div>

      {/* 底部操作区：存在时显示，与内容区形成视觉区分 */}
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
