import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import DonationContent from './DonateContent';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Donation' });
  const tCommon = await getTranslations({ locale, namespace: 'metadata' });

  return {
    title: `${t('metadata.title')} | ${tCommon('title')}`,
    description: t('metadata.description'),
  };
}

/**
 * 服务器端页面组件（仅负责引入客户端组件）
 */
export default async function DonationPage({
  params,
}: {
  params: { locale: string };
}) {
  // 传递locale给客户端组件（如果需要）
  const { locale } = params;
  return <DonationContent locale={locale} />;
}