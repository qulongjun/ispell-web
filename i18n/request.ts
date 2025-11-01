/*
 * @Date: 2025-10-18 23:47:39
 * @LastEditTime: 2025-11-01 18:20:08
 * @Description: 国际化请求配置
 */

import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  if (!routing.locales.includes(locale as string)) notFound();

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
