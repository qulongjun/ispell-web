/*
 * @Date: 2025-11-01 22:31:03
 * @LastEditTime: 2025-11-08 17:39:40
 * @Description: 服务条款页面组件
 */
import React from 'react';
import type { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';

/**
 * 生成页面元数据（用于SEO优化）
 * 统一标题格式为：[页面名称] - 爱拼词 - 免费好用的语言学习平台
 * @param params 包含当前语言 locale 的参数对象
 * @returns 包含标题和描述的元数据对象
 */
export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'Terms' });
  const tCommon = await getTranslations({ locale, namespace: 'metadata' });

  return {
    // 统一标题格式，与首页保持一致
    title: `${t('metadata.title')} | ${tCommon('title')}`,
    description: t('metadata.description'),
  };
}

/**
 * 章节标题组件
 * 统一各章节标题的样式，包括字体大小、粗细、颜色和间距
 * @param children 标题文本内容
 */
const SectionTitle: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-10 mb-4">
    {children}
  </h2>
);

/**
 * 段落文本组件
 * 统一条款内容段落的样式，包括字体大小、行高、颜色和底部间距
 * @param children 段落文本内容
 */
const Paragraph: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-base leading-relaxed text-gray-700 dark:text-gray-300 mb-4">
    {children}
  </p>
);

/**
 * 列表项组件
 * 统一条款中列表项的文本样式，包括颜色和行高
 * @param children 列表项文本内容
 */
const ListItem: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <li className="text-gray-700 dark:text-gray-300 leading-relaxed">
    {children}
  </li>
);

/**
 * 服务条款页面主组件（已接入i18n国际化）
 * 展示iSpell平台的完整服务条款内容
 * 路径: /terms
 */
export default function TermsPage() {
  const t = useTranslations('Terms');

  return (
    <div className="w-full py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
          {t('title')}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          {t('lastUpdated', { date: '2025年11月1日' })}
        </p>

        <Paragraph>{t('welcome')}</Paragraph>
        <Paragraph>{t('acceptance')}</Paragraph>

        <SectionTitle>{t('section1.title')}</SectionTitle>
        <Paragraph>{t('section1.p1')}</Paragraph>
        <Paragraph>{t('section1.p2')}</Paragraph>
        <Paragraph>{t('section1.p3')}</Paragraph>

        <SectionTitle>{t('section2.title')}</SectionTitle>
        <Paragraph>{t('section2.intro')}</Paragraph>
        <ul className="list-disc list-inside space-y-2 mb-4 pl-4">
          <ListItem>{t('section2.list1')}</ListItem>
          <ListItem>{t('section2.list2')}</ListItem>
          <ListItem>{t('section2.list3')}</ListItem>
          <ListItem>{t('section2.list4')}</ListItem>
        </ul>
        <Paragraph>{t('section2.freeService')}</Paragraph>

        <SectionTitle>{t('section3.title')}</SectionTitle>
        <Paragraph>{t('section3.intro')}</Paragraph>
        <ul className="list-disc list-inside space-y-2 mb-4 pl-4">
          <ListItem>{t('section3.list1')}</ListItem>
          <ListItem>{t('section3.list2')}</ListItem>
          <ListItem>{t('section3.list3')}</ListItem>
          <ListItem>{t('section3.list4')}</ListItem>
          <ListItem>{t('section3.list5')}</ListItem>
        </ul>

        <SectionTitle>{t('section4.title')}</SectionTitle>
        <Paragraph>{t('section4.p1')}</Paragraph>
        <Paragraph>{t('section4.p2')}</Paragraph>

        <SectionTitle>{t('section5.title')}</SectionTitle>
        <Paragraph>{t('section5.p1')}</Paragraph>

        <SectionTitle>{t('section6.title')}</SectionTitle>
        <Paragraph>{t('section6.p1')}</Paragraph>
        <Paragraph>{t('section6.p2')}</Paragraph>

        <SectionTitle>{t('section7.title')}</SectionTitle>
        <Paragraph>{t('section7.p1')}</Paragraph>

        <SectionTitle>{t('section8.title')}</SectionTitle>
        <Paragraph>{t('section8.p1')}</Paragraph>
        <Paragraph>
          {t('section8.contactLabel')}
          <a
            href="mailto:support@ispell.com"
            className="text-indigo-600 hover:underline dark:text-indigo-400"
          >
            {t('section8.email')}
          </a>
        </Paragraph>
      </div>
    </div>
  );
}
