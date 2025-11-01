/*
 * @Date: 2025-10-18 22:01:26
 * @LastEditTime: 2025-11-01 18:18:48
 * @Description: 国际化中间件配置
 */
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
};
