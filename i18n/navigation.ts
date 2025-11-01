/*
 * @Date: 2025-10-19 11:09:01
 * @LastEditTime: 2025-11-01 18:19:58
 * @Description: 导航国际化配置
 */

import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
