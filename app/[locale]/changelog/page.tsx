/*
 * @Date: 2025-11-06 21:11:15
 * @LastEditTime: 2025-11-08 17:59:10
 * @Description: 更新日志页面组件
 */

import React from 'react';
import type { Metadata } from 'next';
// 国际化相关工具：客户端翻译hook与服务端翻译获取函数
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
// 导入更新日志数据及变更类型定义
import {
  changelogData,
  type ChangeType,
} from '@/app/[locale]/changelog/changelog.data';

/**
 * 生成页面元数据（用于SEO优化）
 * 标题格式与全站保持一致：[页面名称] | 爱拼词 - 免费好用的语言学习平台
 * @param params 包含当前语言locale的Promise对象（需先解析）
 * @returns 包含标题和描述的元数据对象
 */
export async function generateMetadata({
  params, // params为Promise对象，需先通过await解析
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  // 解析params获取locale
  const { locale } = await params;
  // 获取Changelog命名空间的翻译文本
  const t = await getTranslations({ locale, namespace: 'Changelog' });
  // 获取公共metadata命名空间的翻译文本（用于统一标题）
  const tCommon = await getTranslations({ locale, namespace: 'metadata' });

  return {
    // 统一标题格式：页面名称 | 平台主标题
    title: `${t('metadata.title')} | ${tCommon('title')}`,
    description: t('metadata.description'),
  };
}

/**
 * 根据变更类型获取对应的徽章样式
 * 黑白灰配色：用明暗 + 填充/描边区分（新增=最深填充，修复=中灰填充，重构=描边）
 * @param type 变更类型（new/fix/refactor/perf/docs）
 * @returns Tailwind CSS类名字符串
 */
const getBadgeStyle = (type: ChangeType): string => {
  switch (type) {
    case 'new': // 新增：最深色填充，最醒目
      return 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 font-semibold';
    case 'fix': // 修复：中深灰填充，与新增明显拉开明度
      return 'bg-gray-500 text-white dark:bg-gray-600 dark:text-white font-semibold';
    case 'refactor': // 重构：描边样式，不填充，与两种填充区分
      return 'border-2 border-gray-500 text-gray-700 dark:border-gray-400 dark:text-gray-300 bg-transparent font-semibold';
    case 'perf': // 性能：浅灰填充
      return 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    case 'docs': // 文档：细描边，最弱
    default:
      return 'border border-gray-400 text-gray-600 dark:border-gray-500 dark:text-gray-400';
  }
};

/**
 * 更新日志页面主组件
 * 以时间轴形式展示应用各版本的变更记录，按发布时间倒序排列
 * 每个版本包含发布日期、版本号及具体变更项（带类型标识）
 */
export default function ChangelogPage() {
  // 获取客户端Changelog命名空间的翻译方法
  const t = useTranslations('Changelog');

  return (
    // 主容器：居中布局，限制最大宽度，适配响应式
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* 页面标题区域 */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('title')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400">{t('description')}</p>
      </div>

      {/* 时间线容器：左侧带竖线的时间轴样式 */}
      <div className="relative border-l border-gray-300 dark:border-gray-700 ml-3">
        {/* 遍历所有版本的更新记录（按时间倒序） */}
        {changelogData.map((entry) => (
          <section
            key={entry.version}
            className="mb-12 ml-8 relative" // 每个版本块与左侧竖线保持距离
          >
            {/* 时间线上的节点标记 */}
            <span
              className="absolute -left-[38.5px] mt-1.5 h-3 w-3 rounded-full bg-gray-500 dark:bg-gray-400 border-2 border-white dark:border-gray-900"
              aria-hidden="true" // 仅视觉展示，不参与无障碍阅读
            />

            {/* 版本日期与版本号 */}
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {entry.date}
            </p>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-1 mb-4">
              {entry.version}
            </h2>

            {/* 变更记录列表 */}
            <ul className="space-y-4">
              {entry.changes.map((change, index) => (
                <li
                  key={index}
                  className="flex flex-col sm:flex-row sm:items-start space-y-2 sm:space-y-0 sm:space-x-3"
                >
                  {/* 变更类型徽章 */}
                  <span
                    className={`inline-flex flex-shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold ${getBadgeStyle(
                      change.type
                    )}`}
                  >
                    {t(`types.${change.type}`)}
                  </span>
                  {/* 变更描述文本 */}
                  <span className="text-base text-gray-700 dark:text-gray-300 pt-px">
                    {t(change.descriptionKey)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
