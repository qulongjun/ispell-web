/*
 * @Date: 2025-10-23 09:38:39
 * @LastEditTime: 2025-11-08 18:10:24
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
import { AppProvider } from '@/contexts/app.context'; // 管理应用全局状态（用户、认证等）
import { SpellingProvider } from '@/contexts/spelling.context'; // 拼写练习功能上下文

// 全局组件导入
import AuthModals from '@/components/auth'; // 统一管理登录/注册等认证弹窗
import { getMessages } from 'next-intl/server';
import Logo from '@/components/logo'; // 应用Logo组件
import HeaderActions from '@/components/header-actions'; // 头部操作区（登录/用户菜单等）
import DonateBanner from '@/components/banners/DonateBanner'; // 捐赠提示横幅
import Footer from '@/components/common/Footer'; // 页脚组件
import FeedbackModal from '@/components/feedback'; // 反馈弹窗组件

// 字体配置：引入JetBrains Mono字体，定义可用字重、样式及变量
const jetbrainsMono = JetBrains_Mono({
  weight: ['400', '500', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
});

// 生成全局元数据：基于当前语言环境动态配置页面标题、描述、图标等
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = await getMessages({ locale });

  return {
    title: messages.metadata.title,
    description: messages.metadata.description,
    openGraph: {
      title: messages.metadata.title,
      description: messages.metadata.description,
      siteName: messages.metadata.siteName,
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
    manifest: '/site.webmanifest',
  };
}

// 根布局组件：定义应用整体结构和全局上下文
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
    <html lang={locale}>
      <body className={jetbrainsMono.variable}>
        {/* 多语言支持提供者 */}
        <NextIntlClientProvider messages={messages}>
          {/* 应用全局状态提供者 */}
          <AppProvider>
            {/* 拼写练习功能上下文 */}
            <SpellingProvider>
              {/* 主容器：实现固定页脚布局 */}
              <div className="min-h-screen bg-linear-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col">
                {/* 头部区域：固定在顶部，包含捐赠横幅和导航 */}
                <div className="sticky top-0 z-10 w-full">
                  <DonateBanner />
                  <header className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-900">
                    <Logo />
                    <HeaderActions />
                  </header>
                </div>

                {/* 主内容区：自动填充剩余空间，底部预留页脚高度 */}
                <main className="flex-1 flex flex-col items-center p-4 pb-16">
                  {children}
                </main>
              </div>

              {/* 固定页脚：定位在视口底部 */}
              <Footer />

              {/* 全局弹窗组件 */}
              <AuthModals />
              <FeedbackModal />

              {/* 通知提示组件 */}
              <Toaster position="top-center" />
            </SpellingProvider>
          </AppProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
