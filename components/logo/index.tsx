/*
 * @Date: 2025-10-28 20:25:06
 * @LastEditTime: 2025-11-01 16:55:13
 * @Description: 网站的品牌 Logo 组件 (已添加图标)
 */
import React from 'react';
import Link from 'next/link';
// 注意：这里使用 <img> 而不是 next/image，以便使用 Tailwind 的 h/w 类进行缩放
// 如果您更倾向于使用 next/image，请确保提供 width 和 height 属性
// import Image from 'next/image'; 

/**
 * @interface LogoProps
 * @description Logo 组件的属性定义。
 *
 * @property {string} [className] - 允许从外部传入额外的 Tailwind CSS 类名，
 * 用于自定义 Logo 容器的样式（例如边距、定位等）。
 */
interface LogoProps {
  className?: string;
}

/**
 * @component Logo
 * @description
 * 渲染 "iSpell" 品牌 Logo，包含一个图标和品牌文字。
 *
 * 核心设计：
 * 1.  **[!!! 新增 !!!] 图标支持暗色模式**：
 * - 亮色模式下显示 `/logo/logo.svg`。
 * - 暗色模式下显示 `/logo/logo-dark.svg`。
 * 2.  **黑白灰色调**：使用中性灰色 (`text-gray-500`) 渲染 "i"，
 * 使用标准文本色（`text-gray-900` / `dark:text-gray-100`）渲染 "Spell"。
 * 3.  **视觉冲击力**：使用 `font-extrabold` (超粗体) 和大字体
 * (`text-2xl sm:text-3xl`) 来增加视觉重量。
 * 4.  **功能性**：整个组件是一个指向首页 (`/`) 的链接 (`<Link>`)。
 *
 * @param {LogoProps} props - 组件的属性，包含可选的 `className`。
 * @returns {React.ReactElement}
 */
const Logo: React.FC<LogoProps> = ({ className = '' }) => {
  return (
    // Link 组件使整个 Logo 可点击，并导航至首页 "/"。
    <Link
      href="/"
      // 合并传入的 className，并应用基本样式：
      // - [!!! 修改 !!!] flex items-center: 使图标和文字水平居中对齐。
      // - transition-opacity: 为悬停效果添加过渡。
      // - hover:opacity-80: 鼠标悬停时降低透明度，提供视觉反馈。
      className={`
        flex items-center
        transition-opacity duration-200
        hover:opacity-80
        ${className}
      `}
      // 为辅助功能（如屏幕阅读器）提供清晰的链接说明。
      aria-label="iSpell - 返回首页"
    >
      {/* [!!! 新增 !!!] Logo 图标容器 
        - mr-2: 在图标和文字之间添加右边距。
        - flex-shrink-0: 防止图标在空间不足时被压缩变形。
        - h-7 w-7 / sm:h-8 sm:w-8: 设置图标大小以匹配响应式的字体大小。
      */}
      <div className="mr-2 flex-shrink-0">
        {/* 亮色模式 Logo (默认显示, 暗色模式隐藏) */}
        <img
          src="/logo/logo.svg"
          alt="iSpell Logo"
          className="h-7 w-7 sm:h-10 sm:w-10 dark:hidden"
        />
        {/* 暗色模式 Logo (默认隐藏, 暗色模式显示) */}
        <img
          src="/logo/logo-dark.svg"
          alt="iSpell Logo"
          className="hidden h-7 w-7 sm:h-10 sm:w-10 dark:block"
        />
      </div>

      {/* 文本内容的容器，设置字体大小、粗细和字间距 */}
      <span className="text-2xl sm:text-3xl font-extrabold tracking-tight">
        {/* "i" 部分：使用中性灰色调，使其在视觉上与 "Spell" 区分 */}
        <span className="text-gray-500 dark:text-gray-400">i</span>

        {/* "Spell" 部分：使用标准的正文颜色，确保在不同主题下都清晰可见 */}
        <span className="text-gray-900 dark:text-gray-100">Spell</span>
      </span>
    </Link>
  );
};

export default Logo;
