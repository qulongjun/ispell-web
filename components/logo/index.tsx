/*
 * @Date: 2025-10-28 20:25:06
 * @LastEditTime: 2025-11-08 23:05:52
 * @Description: 网站的品牌 Logo 组件
 */
import React from 'react';
import Link from 'next/link';

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
 * @param {LogoProps} props - 组件的属性，包含可选的 `className`。
 * @returns {React.ReactElement}
 */
const Logo: React.FC<LogoProps> = ({ className = '' }) => {
  return (
    <Link
      href="/"
      className={`
        flex items-center
        transition-opacity duration-200
        hover:opacity-80
        ${className}
      `}
      aria-label="iSpell - 返回首页"
    >
      <div className="mr-2 flex-shrink-0">
        {/* 亮色模式 Logo (默认显示, 暗色模式隐藏) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo/logo.svg"
          alt="iSpell Logo"
          className="h-7 w-7 sm:h-10 sm:w-10 dark:hidden"
        />
        {/* 暗色模式 Logo (默认隐藏, 暗色模式显示) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo/logo-dark.svg"
          alt="iSpell Logo"
          className="hidden h-7 w-7 sm:h-10 sm:w-10 dark:block"
        />
      </div>

      {/* 文本内容的容器，设置字体大小、粗细和字间距 */}
      <span className="text-2xl sm:text-3xl font-extrabold tracking-tight">
        <span className="text-gray-500 dark:text-gray-400">i</span>

        <span className="text-gray-900 dark:text-gray-100">Spell</span>
      </span>
    </Link>
  );
};

export default Logo;
