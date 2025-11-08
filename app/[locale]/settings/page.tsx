/*
 * @Date: 2025-11-08 12:00:00
 * @LastEditTime: 2025-11-08 18:05:55
 * @Description: 系统设置页面服务器组件
 */

import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
// 导入客户端交互组件
import SettingsContent from './SettingsContent';

/**
 * 生成页面元数据（用于SEO优化）
 * 标题格式与全站保持一致：[页面名称] | 爱拼词 - 免费好用的语言学习平台
 * @param params 包含当前语言locale的Promise对象（需先解析）
 * @returns 包含标题和描述的元数据对象
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  // 解析params获取locale
  const { locale } = await params;
  // 获取Settings命名空间的翻译文本
  const t = await getTranslations({ locale, namespace: 'Settings' });
  // 获取公共metadata命名空间的翻译文本
  const tCommon = await getTranslations({ locale, namespace: 'metadata' });

  return {
    title: `${t('metadata.title')} | ${tCommon('title')}`,
    description: t('metadata.description'),
  };
}

/**
 * 系统设置页面服务器组件
 * 作为页面入口，引入客户端交互组件并传递locale参数
 */
export default function SettingsPage({
  params,
}: {
  params: { locale: string };
}) {
  return <SettingsContent locale={params.locale} />;
}