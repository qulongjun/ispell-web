/*
 * @Date: 2025-11-04 14:06:53
 * @LastEditTime: 2025-11-08 23:11:42
 * @Description: 删除账户组件 
 */
'use client';

import React, { useState } from 'react';
import { Loader2, ShieldAlert, Trash2, AlertTriangle } from 'lucide-react';
import { useAppContext } from '@/contexts/app.context';
import { apiDeleteAccount } from '@/services/authService';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { User } from '@/types/auth.types';
import SectionCard from '../common/SectionCard';
import { useTranslations } from 'next-intl';

/**
 * 危险操作按钮组件
 * 用于删除账户等高危操作
 */
const ButtonDanger: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
  children,
  className,
  ...props
}) => (
  <button
    type="button"
    className={`inline-flex items-center justify-center rounded-lg border border-transparent bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 dark:hover:bg-red-500 transition-colors duration-200 ${className}`}
    {...props}
  >
    {children}
  </button>
);

/**
 * 普通按钮组件
 * 用于取消等操作
 */
const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
  children,
  className,
  ...props
}) => (
  <button
    type="button"
    className={`inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700 transition-colors duration-200 ${className}`}
    {...props}
  >
    {children}
  </button>
);

/**
 * 确认删除模态框组件
 * 提供二次确认机制，防止误操作
 */
const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  userNickname,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  userNickname: string;
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const t = useTranslations('Profile.deleteAccount');
  const tCommon = useTranslations('common');

  if (!isOpen) return null;

  // 确认按钮是否启用
  const isDeleteEnabled = confirmText === userNickname;

  /**
   * 处理确认文本输入
   */
  const handleConfirmInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmText(e.target.value);
    if (isShaking) setIsShaking(false);
  };

  /**
   * 处理确认删除点击
   */
  const handleConfirmClick = () => {
    if (!isDeleteEnabled) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }
    onConfirm();
  };

  return (
    // 遮罩层
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      {/* 模态框 */}
      <div
        className="relative m-4 w-full max-w-lg rounded-lg bg-white p-6 shadow-2xl dark:bg-gray-900 transform transition-all duration-300 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start mb-4">
          <AlertTriangle className="h-6 w-6 text-red-500 mr-2 flex-shrink-0" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('modalTitle')}
          </h3>
        </div>

        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-3">
          <p className="font-medium text-red-600 dark:text-red-400 flex items-center">
            <ShieldAlert className="h-4 w-4 mr-1 inline" />
            {t('warning')}
          </p>
          <p>{t('deleteInfo1')}</p>
          <p>{t('deleteInfo2')}</p>
          <p
            dangerouslySetInnerHTML={{
              __html: t('confirmInputLabel', { nickname: userNickname }),
            }}
          />
        </div>

        {/* 确认输入框 */}
        <input
          type="text"
          value={confirmText}
          onChange={handleConfirmInput}
          disabled={isLoading}
          placeholder={t('confirmInputPlaceholder')}
          className={`mt-4 w-full rounded-lg border py-3 px-4 text-gray-900 focus:outline-none dark:bg-gray-800 dark:text-white transition-all duration-200 ${
            isShaking
              ? 'border-red-500 animate-shake'
              : confirmText && !isDeleteEnabled
              ? 'border-amber-500'
              : isDeleteEnabled
              ? 'border-green-500'
              : 'border-gray-300 dark:border-gray-700'
          } focus:ring-1 ${
            confirmText && !isDeleteEnabled
              ? 'focus:ring-amber-500'
              : isDeleteEnabled
              ? 'focus:ring-green-500'
              : 'focus:ring-gray-500'
          }`}
        />

        {/* 操作按钮 */}
        <div className="mt-6 flex justify-end space-x-3">
          <Button onClick={onClose} disabled={isLoading}>
            {tCommon('buttons.cancel')}
          </Button>
          <ButtonDanger onClick={handleConfirmClick} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('confirmDeleteBtn')}
          </ButtonDanger>
        </div>
      </div>
    </div>
  );
};

/**
 * 账户删除组件
 * 提供账户删除功能，包含多重确认机制
 */
const DeleteAccountSection: React.FC<{ user: User }> = ({ user }) => {
  const { logout } = useAppContext();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations('Profile.deleteAccount');

  /**
   * 处理账户删除
   */
  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await apiDeleteAccount();
      toast.success(t('deleteSuccess'));
      // 成功后立即登出并跳转
      logout();
      router.push('/');
    } catch (error) {
      toast.error((error as Error).message || t('deleteFailed'));
      setIsLoading(false);
    }
    setIsModalOpen(false);
  };

  return (
    <SectionCard
      title={t('title')}
      className="border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10"
    >
      <div className="flex">
        <div className="flex-shrink-0 mr-4">
          <ShieldAlert className="h-8 w-8 text-red-500" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">
            {t('sectionTitle')}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {t('description')}
          </p>
          <ButtonDanger onClick={() => setIsModalOpen(true)} className="mt-2">
            <Trash2 className="mr-2 h-4 w-4" />
            {t('deleteBtn')}
          </ButtonDanger>
        </div>
      </div>

      {/* 确认模态框 */}
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleDelete}
        isLoading={isLoading}
        userNickname={user.nickname || ''}
      />
    </SectionCard>
  );
};

export default DeleteAccountSection;
