/*
 * @Date: 2025-11-01 22:31:03
 * @LastEditTime: 2025-11-08 17:38:32
 * @Description: 隐私政策页面组件
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
  const t = await getTranslations({ locale, namespace: 'Privacy' });
  const tCommon = await getTranslations({ locale, namespace: 'metadata' });

  return {
    // 统一标题格式，与首页保持一致
    title: `${t('metadata.title')} | ${tCommon('title')}`,
    description: t('metadata.description'),
  };
}

/**
 * 章节标题组件
 * 统一各章节标题的样式，保持页面风格一致性
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
 * 统一政策内容段落的样式，包括行高、颜色和间距
 * @param children 段落文本内容
 */
const Paragraph: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-base leading-relaxed text-gray-700 dark:text-gray-300 mb-4">
    {children}
  </p>
);

/**
 * 列表项组件
 * 统一政策中列表项的样式，包括缩进和文本样式
 * @param children 列表项文本内容
 */
const ListItem: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <li className="text-gray-700 dark:text-gray-300 leading-relaxed ml-4">
    {children}
  </li>
);

/**
 * 隐私政策页面主组件（已接入i18n国际化）
 * 展示iSpell平台的完整隐私政策内容
 * 路径: /privacy
 */
export default function PrivacyPolicyPage() {
  const t = useTranslations('Privacy');

  return (
    <div className="w-full py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
          {t('title')}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          {t('lastUpdated', { date: '2025年11月1日' })}
        </p>

        <Paragraph>{t('intro.p1')}</Paragraph>
        <Paragraph>{t('intro.p2')}</Paragraph>

        <SectionTitle>{t('section1.title')}</SectionTitle>
        <Paragraph>{t('section1.intro')}</Paragraph>
        <ul className="list-disc list-inside space-y-2 mb-4">
          <ListItem>
            <strong>{t('section1.list1.title')}</strong>：
            {t('section1.list1.content')}
          </ListItem>
          <ListItem>
            <strong>{t('section1.list2.title')}</strong>：
            {t('section1.list2.content')}
          </ListItem>
          <ListItem>
            <strong>{t('section1.list3.title')}</strong>：
            {t('section1.list3.content')}
          </ListItem>
          <ListItem>
            <strong>{t('section1.list4.title')}</strong>：
            {t('section1.list4.content')}
          </ListItem>
        </ul>

        <SectionTitle>{t('section2.title')}</SectionTitle>
        <Paragraph>{t('section2.intro')}</Paragraph>
        <ul className="list-disc list-inside space-y-2 mb-4">
          <ListItem>
            <strong>{t('section2.list1.title')}</strong>：
            {t('section2.list1.content')}
          </ListItem>
          <ListItem>
            <strong>{t('section2.list2.title')}</strong>：
            {t('section2.list2.content')}
          </ListItem>
          <ListItem>
            <strong>{t('section2.list3.title')}</strong>：
            {t('section2.list3.content')}
          </ListItem>
          <ListItem>
            <strong>{t('section2.list4.title')}</strong>：
            {t('section2.list4.content')}
          </ListItem>
        </ul>

        <SectionTitle>{t('section3.title')}</SectionTitle>
        <Paragraph>{t('section3.p1')}</Paragraph>
        <Paragraph>{t('section3.intro')}</Paragraph>
        <ul className="list-disc list-inside space-y-2 mb-4">
          <ListItem>
            <strong>{t('section3.list1.title')}</strong>：
            {t('section3.list1.content')}
          </ListItem>
          <ListItem>
            <strong>{t('section3.list2.title')}</strong>：
            {t('section3.list2.content')}
          </ListItem>
          <ListItem>
            <strong>{t('section3.list3.title')}</strong>：
            {t('section3.list3.content')}
          </ListItem>
        </ul>

        <SectionTitle>{t('section4.title')}</SectionTitle>
        <Paragraph>{t('section4.intro')}</Paragraph>
        <ul className="list-disc list-inside space-y-2 mb-4">
          <ListItem>
            <strong>{t('section4.list1.title')}</strong>：
            {t('section4.list1.content')}
          </ListItem>
          <ListItem>
            <strong>{t('section4.list2.title')}</strong>：
            {t('section4.list2.content')}
          </ListItem>
          <ListItem>
            <strong>{t('section4.list3.title')}</strong>：
            {t('section4.list3.content')}
          </ListItem>
        </ul>

        <SectionTitle>{t('section5.title')}</SectionTitle>
        <Paragraph>{t('section5.p1')}</Paragraph>
        <Paragraph>{t('section5.p2')}</Paragraph>

        <SectionTitle>{t('section6.title')}</SectionTitle>
        <Paragraph>{t('section6.p1')}</Paragraph>

        <SectionTitle>{t('section7.title')}</SectionTitle>
        <Paragraph>{t('section7.p1')}</Paragraph>

        <SectionTitle>{t('section8.title')}</SectionTitle>
        <Paragraph>{t('section8.p1')}</Paragraph>
        <Paragraph>
          {t('section8.contactLabel')}
          <a
            href="mailto:privacy@ispell.com"
            className="text-indigo-600 hover:underline dark:text-indigo-400"
          >
            {t('section8.email')}
          </a>
        </Paragraph>
      </div>
    </div>
  );
}
