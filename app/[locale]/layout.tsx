/*
 * @Date: 2025-10-23 09:38:39
 * @LastEditTime: 2025-11-01 18:44:59
 * @Description: 应用根布局组件
 */

// 外部类型与库导入
import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { Toaster } from 'react-hot-toast';

// 全局样式导入
import './globals.css';

// 上下文提供者导入
import { AppProvider } from '@/contexts/app.context'; // 应用全局状态（用户、认证等）
import { SpellingProvider } from '@/contexts/spelling.context'; // 拼写练习上下文

// 全局组件导入
import AuthModals from '@/components/auth'; // 认证相关弹窗（登录/注册）
import { getMessages } from 'next-intl/server';
import Logo from '@/components/logo';
import HeaderActions from '@/components/header-actions';

// --- 字体配置 ---
/**
 * 配置JetBrains Mono等宽字体
 * 用途：用于代码展示、特殊文本排版，通过变量暴露给Tailwind使用
 */
const jetbrainsMono = JetBrains_Mono({
  weight: ['400', '500', '700'], // 加载常用字重（常规、中等、粗体）
  style: ['normal', 'italic'], // 加载常规和斜体样式
  subsets: ['latin'], // 只加载拉丁字符集，减小字体文件体积
  variable: '--font-jetbrains-mono', // 定义CSS变量，供Tailwind配置引用
});

/**
 * 动态生成国际化的元数据
 * 接收locale参数，根据当前语言返回对应的标题和描述
 */
export async function generateMetadata({
  params, // params 是 Promise，需解包
}: {
  params: Promise<{ locale: string }>; // 明确类型为Promise
}): Promise<Metadata> {
  // 第一步：解包 params（关键修复）
  const { locale } = await params;
  // 第二步：获取对应语言的消息
  const messages = await getMessages({ locale });

  // 返回国际化元数据（融入“爱拼词”品牌名）
  return {
    title: messages.metadata.title,
    description: messages.metadata.description,
    openGraph: {
      title: messages.metadata.title,
      description: messages.metadata.description,
      siteName: '爱拼词', // 固定品牌名，增强识别
    },
    icons: {
      icon: '/favicon.ico',
      shortcut: '/favicon-32x32.png',
      apple: '/apple-touch-icon.png',
      other: [
        {
          rel: 'icon',
          url: '/favicon-16x16.png',
          sizes: '16x16',
          type: 'image/png',
        },
        {
          rel: 'icon',
          url: '/android-chrome-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          rel: 'icon',
          url: '/android-chrome-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
      ],
    },
    manifest: '/site.webmanifest', // 关联 PWA 配置
  };
}

// --- 根布局组件 ---
/**
 * 应用根布局组件
 * 负责整合全局依赖，包括：
 * - 国际化支持（NextIntlClientProvider）
 * - 全局状态管理（AppProvider）
 * - 拼写练习上下文（SpellingProvider）
 * - 全局字体应用
 * - 认证弹窗与消息提示组件挂载
 */
export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const messages = await getMessages({ locale });

  return (
    <html lang="en">
      {/* 应用全局字体变量，使JetBrains Mono可通过Tailwind类引用 */}
      <body className={`${jetbrainsMono.variable}`}>
        {/* 国际化提供者：支持多语言文本翻译 */}
        <NextIntlClientProvider messages={messages}>
          {/* 应用全局状态提供者：管理用户信息、认证状态等 */}
          <AppProvider>
            {/* 拼写练习上下文提供者：管理拼写练习相关状态 */}
            <SpellingProvider>
              {/* 主容器：背景渐变，垂直居中布局，响应式内边距 */}
              <div className="min-h-screen relative bg-linear-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center p-4 sm:p-6">
                {/* 左上角Logo */}
                <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10">
                  <Logo />
                </div>

                {/* 右上角操作区（用户信息、设置等） */}
                <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10">
                  <HeaderActions />
                </div>
                {/* 页面内容（各路由组件） */}
                {children}
              </div>

              {/* 认证相关弹窗（登录/注册）：全局挂载，通过状态控制显示 */}
              <AuthModals />

              {/* 全局消息提示组件：用于展示成功/错误提示 */}
              <Toaster position="top-center" />
            </SpellingProvider>
          </AppProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
