'use client';
/*
 * @Date: 2025-11-06
 * @Description: 用户反馈模态框 (已更新为 i18n 错误处理)
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Loader2,
  MessageSquareWarning,
  Bug,
  Lightbulb,
  Wrench,
  FileText,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';

import { useAppContext } from '@/contexts/app.context';
import { FeedbackType, submitFeedback } from '@/services/feedbackService';

// [!! 新增 !!] 导入 ApiError
import { ApiError } from '@/utils/error.utils';

const FEEDBACK_TYPE_CONFIG: { id: FeedbackType; icon: React.ElementType }[] = [
  { id: 'BUG', icon: Bug },
  { id: 'SUGGESTION', icon: Lightbulb },
  { id: 'FUNCTION', icon: Wrench },
  { id: 'WORD', icon: FileText },
];

const FeedbackModal: React.FC = () => {
  const t = useTranslations('FeedbackModal');
  // [!! 新增 !!] 导入 Errors 翻译
  const t_err = useTranslations('Errors');

  const { isLoggedIn, isFeedbackModalOpen, closeFeedbackModal } =
    useAppContext();

  const [type, setType] = useState<FeedbackType>('WORD');
  const [content, setContent] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 清理表单 (不变)
  const handleClose = () => {
    if (isSubmitting) return;
    closeFeedbackModal();
    setTimeout(() => {
      setType('WORD');
      setContent('');
      setContactEmail('');
    }, 300);
  };

  /**
   * [!! 重大修改 !!]
   * 提交表单
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !content.trim()) return;

    setIsSubmitting(true);
    try {
      // [!!] submitFeedback 现在会抛出 ApiError
      await submitFeedback(
        type,
        content,
        !isLoggedIn ? contactEmail : undefined
      );

      // 成功
      toast.success(t('submitSuccess'));
      handleClose();
    } catch (error) {
      // [!! 失败 !!]
      console.error('Feedback submission failed:', error);
      if (error instanceof ApiError) {
        // e.g. code 6000 -> t_err('e6000')
        const message = t_err(`e${error.code}`, {
          defaultValue: t('submitError'),
        });
        toast.error(message);
      } else {
        toast.error(t('submitError'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isFeedbackModalOpen && (
        <>
          {/* 遮罩层 (z-50) (不变) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            aria-hidden="true"
          />

          {/* 居中容器 (z-[51]) (不变) */}
          <div
            className="fixed inset-0 z-[51] flex items-center justify-center p-4"
            onClick={handleClose}
          >
            {/* 模态框面板 (不变) */}
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="relative w-full max-w-2xl h-auto max-h-[90vh] bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col"
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 头部 (不变) */}
              <div className="flex items-center justify-between p-4 pl-5 shrink-0 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t('title')}
                  </h2>
                </div>
                <button
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="p-1 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                  aria-label={t('close')}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 表单 (不变) */}
              <form
                onSubmit={handleSubmit}
                className="flex-1 flex flex-col overflow-hidden min-h-0"
              >
                {/* 内部滚动区 (不变) */}
                <div className="flex-1 p-5 space-y-5 overflow-y-auto">
                  {/* 1. 反馈类型 (不变) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      {t('typeLabel')}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {FEEDBACK_TYPE_CONFIG.map(({ id, icon: Icon }) => (
                        <button
                          type="button"
                          key={id}
                          onClick={() => setType(id)}
                          disabled={isSubmitting}
                          className={`
                            p-3 rounded-lg border-2 flex flex-col items-center justify-center text-center transition-colors duration-150 disabled:opacity-50
                            ${
                              type === id
                                ? 'bg-gray-100 border-gray-900 dark:bg-gray-700 dark:border-gray-200 shadow-inner' // 选中
                                : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500' // 未选中
                            }
                          `}
                        >
                          <Icon
                            className={`w-5 h-5 mb-1.5 ${
                              type === id
                                ? 'text-gray-900 dark:text-white'
                                : 'text-gray-500'
                            }`}
                          />
                          <span
                            className={`font-medium text-sm ${
                              type === id
                                ? 'text-gray-900 dark:text-white'
                                : 'text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {t(`types.${id}`)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. 反馈内容 (不变) */}
                  <div>
                    <label
                      htmlFor="feedbackContent"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      {t('contentLabel')}
                    </label>
                    <textarea
                      id="feedbackContent"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      disabled={isSubmitting}
                      rows={5}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={t('contentPlaceholder')}
                      maxLength={2000}
                    />
                  </div>

                  {/* 3. 匿名用户的联系邮箱 (不变) */}
                  {!isLoggedIn && (
                    <div>
                      <label
                        htmlFor="contactEmail"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        {t('contactLabel')}
                      </label>
                      <input
                        id="contactEmail"
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        disabled={isSubmitting}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={t('contactPlaceholder')}
                        maxLength={100}
                      />
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        {t('contactHint')}
                      </p>
                    </div>
                  )}
                </div>

                {/* 底部操作栏 (不变) */}
                <div className="p-4 shrink-0 border-t border-gray-200 dark:border-gray-700 flex justify-end items-center space-x-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                  >
                    {t('cancelBtn')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !content.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 rounded-lg shadow-sm hover:bg-gray-700 dark:hover:bg-gray-300 disabled:opacity-50 flex items-center"
                  >
                    {isSubmitting && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    {isSubmitting ? t('submitting') : t('submitBtn')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FeedbackModal;
