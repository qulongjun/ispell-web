/*
 * @Date: 2025-10-30 10:24:15
 * @LastEditTime: 2025-11-08 22:47:24
 * @Description: 通用确认弹窗组件，用于需要用户确认关键操作的场景（如删除、重置等），支持自定义标题、描述和按钮文本，可标记破坏性操作并展示对应样式
 */

import React from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

/**
 * 确认弹窗组件属性类型
 */
interface ConfirmationModalProps {
  /** 弹窗是否显示 */
  isOpen: boolean;
  /** 弹窗标题文本 */
  title: string;
  /** 弹窗描述文本（详细说明确认内容） */
  description: string;
  /** 确认操作的回调函数 */
  onConfirm: () => void;
  /** 取消操作的回调函数 */
  onCancel: () => void;
  /** 确认按钮的自定义文本（可选，默认使用国际化文本） */
  confirmText?: string;
  /** 是否为破坏性操作（如删除），会改变弹窗样式 */
  isDestructive?: boolean;
}

/**
 * 通用确认弹窗组件
 * 提供标准化的确认交互流程，支持关键操作的二次确认，通过动画过渡提升用户体验
 * 破坏性操作会显示警告图标和红色主题按钮，增强视觉提示
 */
const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  description,
  onConfirm,
  onCancel,
  confirmText,
  isDestructive = false,
}) => {
  // 国际化翻译：使用common命名空间
  const t = useTranslations('common');

  // 确认按钮文本：优先使用props传入值，否则使用国际化默认文本
  const finalConfirmText = confirmText || t('Confirmation.confirm');
  // 取消按钮文本：使用国际化默认文本
  const cancelText = t('Confirmation.cancel');

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩：半透明黑色，点击触发取消操作 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onCancel}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-60"
            aria-hidden="true"
          />

          {/* 弹窗主体：居中显示，带动画效果 */}
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
                {/* 破坏性操作时显示警告图标 */}
                {isDestructive && (
                  <div className="shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50 sm:mx-0 sm:h-10 sm:w-10">
                    <AlertTriangle
                      className="h-6 w-6 text-red-600 dark:text-red-400"
                      aria-hidden="true"
                    />
                  </div>
                )}

                {/* 标题和描述区域 */}
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

              {/* 操作按钮组：确认和取消 */}
              <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-2 sm:space-y-0 space-y-reverse">
                {/* 确认按钮：根据是否为破坏性操作显示不同样式 */}
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

                {/* 取消按钮 */}
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
