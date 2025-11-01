/*
 * @Date: 2025-10-30 10:24:15
 * @LastEditTime: 2025-11-01 15:58:04
 * @Description: 通用确认弹窗组件
 */

import React from 'react';
import { useTranslations } from 'next-intl'; // 导入国际化Hook
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string; // 仍支持自定义，优先级高于国际化默认值
  isDestructive?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  description,
  onConfirm,
  onCancel,
  confirmText, // 移除硬编码默认值，通过国际化提供默认
  isDestructive = false,
}) => {
  // 国际化命名空间：common（对应配置结构）
  const t = useTranslations('common');

  // 确认按钮文本：优先使用props传入值，否则用国际化默认值
  const finalConfirmText = confirmText || t('Confirmation.confirm');
  // 取消按钮文本：国际化默认值
  const cancelText = t('Confirmation.cancel');

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onCancel}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-60"
            aria-hidden="true"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed inset-0 z-70 flex items-center justify-center p-4"
          >
            <div
              className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-700"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="modal-title"
              aria-describedby="modal-description"
            >
              <div className="flex">
                {isDestructive && (
                  <div className="shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50 sm:mx-0 sm:h-10 sm:w-10">
                    <AlertTriangle
                      className="h-6 w-6 text-red-600 dark:text-red-400"
                      aria-hidden="true"
                    />
                  </div>
                )}
                <div
                  className={`ml-4 text-left ${isDestructive ? '' : 'w-full'}`}
                >
                  <h3
                    id="modal-title"
                    className="text-lg font-semibold text-gray-900 dark:text-white"
                  >
                    {title}
                  </h3>
                  <div className="mt-2">
                    <p
                      id="modal-description"
                      className="text-sm text-gray-500 dark:text-gray-400"
                    >
                      {description}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-2 sm:space-y-0 space-y-reverse">
                <button
                  onClick={onConfirm}
                  className={`w-full sm:w-auto px-4 py-2 rounded-md text-sm font-medium ${
                    isDestructive
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-gray-900 hover:bg-gray-700 dark:bg-gray-200 dark:hover:bg-white dark:text-gray-900 text-white'
                  }`}
                >
                  {finalConfirmText}
                </button>
                <button
                  onClick={onCancel}
                  className="w-full sm:w-auto px-4 py-2 rounded-md text-sm font-medium bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
                >
                  {cancelText}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationModal;
