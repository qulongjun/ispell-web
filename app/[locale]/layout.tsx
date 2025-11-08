/*
 * @Date: 2025-10-23 09:38:39
 * @LastEditTime: 2025-11-07 23:13:50
 * @Description: 应用根布局 (已添加 DonateBanner 和 固定 Footer)
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
import DonateBanner from '@/components/banners/DonateBanner'; // [!! 1. 导入 Banner !!]
import Footer from '@/components/common/Footer'; // [!! 2. 导入 Footer !!]
import FeedbackModal from '@/components/feedback';

// --- 字体配置 ---
const jetbrainsMono = JetBrains_Mono({
  weight: ['400', '500', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
});

// --- 元数据生成 (无需修改) ---
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
      siteName: '爱拼词',
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

// --- 根布局组件 ---
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
      <body className={`${jetbrainsMono.variable}`}>
        <NextIntlClientProvider messages={messages}>
          <AppProvider>
            <SpellingProvider>
              {/* [!! 布局说明 !!]
                这是一个 "固定页脚" 布局。
                1. div.min-h-screen (主容器) 确保内容至少占满一屏。
                2. main (内容区) 通过 pb-16 (padding-bottom: 4rem) 为下方的
                   固定 Footer (高度 h-16) 腾出空间，防止内容被遮挡。
                3. Footer 组件使用 fixed bottom-0 定位在视口底部。
              */}
              <div className="min-h-screen bg-linear-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col">
                {/* [!! 关键修改 1 !!]
                 * 创建一个新的 div 来包裹 Banner 和 Header
                 * 将 sticky top-0 z-10 移到这个包裹 div 上
                 */}
                <div className="sticky top-0 z-10 w-full">
                  {/* 1. 捐赠 Banner (它有自己的显示/隐藏逻辑) */}
                  <DonateBanner />

                  {/* 2. 原始 Header (移除了 sticky) */}
                  <header className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-900">
                    <Logo />
                    <HeaderActions />
                  </header>
                </div>

                {/* [!! 关键修改 2 !!]
                 * main 元素添加 pb-16 (padding-bottom: 4rem)
                 * 4rem (h-16) 是 Footer 的高度，为固定页脚腾出空间
                 */}
                <main className="flex-1 flex flex-col items-center p-4 pb-16">
                  {children}
                </main>
              </div>

              <Footer />

              <AuthModals />
              <FeedbackModal />
              <Toaster position="top-center" />
            </SpellingProvider>
          </AppProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
