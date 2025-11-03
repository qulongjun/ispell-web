/*
 * @Date: 2025-10-28 21:48:48
 * @LastEditTime: 2025-11-03 10:25:02
 * @Description: 
 */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useAppContext } from '@/contexts/app.context';
import { Settings, UserCog, LogOut } from 'lucide-react';
import Link from 'next/link';

const UserAvatar: React.FC = () => {
  const { user, logout } = useAppContext();
  const t = useTranslations('UserMenu');

  // [新] 状态：控制下拉菜单的显示/隐藏
  const [isOpen, setIsOpen] = useState(false);
  // [新] Ref：用于检测点击外部
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 1. [新] 监听 Escape 键
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen]);

  // 2. [新] 监听点击外部
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // 处理退出登录
  const handleLogout = () => {
    setIsOpen(false);
    logout();
  };

  // 检查头像 URL，如果为空或不存在，使用默认头像
  const avatarSrc = user?.avatar || '/images/user/default.png';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 触发器 (头像按钮) */}
      <button
        onClick={() => setIsOpen(!isOpen)} // 切换下拉菜单
        aria-label={t('label')}
        className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 hover:ring-2 hover:ring-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarSrc}
          alt={user?.nickname || 'User Avatar'}
          width={40}
          height={40}
          className="rounded-full object-cover"
          // 处理加载失败，再次回退到默认头像
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/images/user/default.png';
          }}
        />
      </button>

      {/* 下拉菜单 (使用 isOpen 控制显示) */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-56 z-20 origin-top-right">
          <ul className="py-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5">
            {/* 1. 欢迎信息 (修正：合并到一行，增加逗号) */}
            <li className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-900 dark:text-white truncate">
                {/* "你好, " */}
                <span className="font-medium text-gray-500 dark:text-gray-400">
                  {t('hello')},
                </span>
                {/* " 昵称" */}
                <span className="font-medium">
                  {' '}{user?.nickname || 'iSpell User'}
                </span>
              </p>
            </li>

            {/* 2. 菜单项 (使用您提供的 i18n 键) */}
            <li className="mt-1">
              <Link
                href="/profile"
                onClick={() => setIsOpen(false)}
                className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <UserCog className="w-5 h-5 mr-3" />
                {t('profileSettings')}
              </Link>
            </li>
            <li>
              <Link
                href="/settings"
                onClick={() => setIsOpen(false)}
                className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Settings className="w-5 h-5 mr-3" />
                {t('systemSettings')}
              </Link>
            </li>
            
            {/* 3. 退出登录 */}
            <li className="mt-1 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <LogOut className="w-5 h-5 mr-3" />
                {t('logout')}
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default UserAvatar;

