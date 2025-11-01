/*
 * @Date: 2025-10-19 11:05:23
 * @LastEditTime: 2025-11-01 18:20:14
 * @Description: 国际化路由配置
 */
import { defineRouting } from 'next-intl/routing';

export const locales = [
  'en', // 英语
  'zh-CN', // 简体中文
  'zh-TW', // 繁体中文
  'ja', // 日语
];
export const defaultLocale = 'zh-CN';

export const routing = defineRouting({
  locales,
  defaultLocale,
});
