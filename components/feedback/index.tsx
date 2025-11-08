/*
 * @Date: 2025-11-06
 * @LastEditTime: 2025-11-08 22:58:12
 * @Description: 用户反馈模态框组件，支持提交多种类型的反馈。
 */
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Bug, Lightbulb, Wrench, FileText } from 'lucide-react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';

import { useAppContext } from '@/contexts/app.context';
import { FeedbackType, submitFeedback } from '@/services/feedbackService';
import { ApiError } from '@/utils/error.utils';

/**
 * 反馈类型配置：映射反馈类型与对应的图标组件
 */
const FEEDBACK_TYPE_CONFIG: { id: FeedbackType; icon: React.ElementType }[] = [
  { id: 'BUG', icon: Bug }, // 错误反馈图标
  { id: 'SUGGESTION', icon: Lightbulb }, // 建议反馈图标
  { id: 'FUNCTION', icon: Wrench }, // 功能问题反馈图标
  { id: 'WORD', icon: FileText }, // 单词相关反馈图标
];

/**
 * 用户反馈模态框组件
 * 提供交互式表单用于收集用户反馈，支持多种反馈类型选择，处理提交状态和错误提示
 * 登录用户无需填写联系方式，未登录用户需提供邮箱以便后续沟通
 * 包含平滑的打开/关闭动画，表单验证和操作反馈
 */
const FeedbackModal: React.FC = () => {
  const t = useTranslations('FeedbackModal'); // 反馈模态框国际化文本
  const t_err = useTranslations('Errors'); // 错误信息国际化文本

  // 从全局状态获取模态框状态和登录状态
  const { isLoggedIn, isFeedbackModalOpen, closeFeedbackModal } =
    useAppContext();

  // 表单状态管理
  const [type, setType] = useState<FeedbackType>('WORD'); // 反馈类型，默认单词相关
  const [content, setContent] = useState(''); // 反馈内容
  const [contactEmail, setContactEmail] = useState(''); // 联系邮箱（仅未登录用户）
  const [isSubmitting, setIsSubmitting] = useState(false); // 提交状态

  /**
   * 关闭模态框并清理表单
   * 提交中状态下禁止关闭，关闭后重置表单内容
   */
  const handleClose = () => {
    if (isSubmitting) return;
    closeFeedbackModal();
    // 延迟重置表单，避免动画过程中内容闪烁
    setTimeout(() => {
      setType('WORD');
      setContent('');
      setContactEmail('');
    }, 300);
  };

  /**
   * 提交反馈表单
   * 处理表单验证、提交状态、成功/失败提示和错误分类展示
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // 提交中或内容为空时不执行
    if (isSubmitting || !content.trim()) return;

    setIsSubmitting(true);
    try {
      // 提交反馈：登录用户无需邮箱，未登录用户需提供邮箱
      await submitFeedback(
        type,
        content,
        !isLoggedIn ? contactEmail : undefined
      );

      // 提交成功：显示成功提示并关闭模态框
      toast.success(t('submitSuccess'));
      handleClose();
    } catch (error) {
      console.error('反馈提交失败:', error);
      // 错误处理：区分API错误和普通错误
      if (error instanceof ApiError) {
        // 显示对应错误码的国际化文本，默认使用通用错误提示
        const message = t_err(`e${error.code}`, {
          defaultValue: t('submitError'),
        });
        toast.error(message);
      } else {
        // 非API错误显示通用错误提示
        toast.error(t('submitError'));
      }
    } finally {
      // 无论成功失败，结束提交状态
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isFeedbackModalOpen && (
        <>
          {/* 背景遮罩：半透明黑色，点击关闭模态框 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            aria-hidden="true"
          />

          {/* 模态框容器：居中显示，点击内部不关闭 */}
          <div
            className="fixed inset-0 z-[51] flex items-center justify-center p-4"
            onClick={handleClose}
          >
            {/* 模态框主体：带动画效果的卡片 */}
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="relative w-full max-w-2xl h-auto max-h-[90vh] bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col"
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()} // 阻止事件冒泡，避免点击内部关闭模态框
            >
              {/* 头部：标题和关闭按钮 */}
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

              {/* 反馈表单 */}
              <form
                onSubmit={handleSubmit}
                className="flex-1 flex flex-col overflow-hidden min-h-0"
              >
                {/* 表单内容滚动区 */}
                <div className="flex-1 p-5 space-y-5 overflow-y-auto">
                  {/* 1. 反馈类型选择 */}
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
                                ? 'bg-gray-100 border-gray-900 dark:bg-gray-700 dark:border-gray-200 shadow-inner' // 选中状态样式
                                : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500' // 未选中状态样式
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

                  {/* 2. 反馈内容输入 */}
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
                      maxLength={2000} // 限制最大输入长度
                    />
                  </div>

                  {/* 3. 未登录用户的联系邮箱 */}
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
                        maxLength={100} // 限制邮箱长度
                      />
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        {t('contactHint')}
                      </p>
                    </div>
                  )}
                </div>

                {/* 底部操作按钮区 */}
                <div className="p-4 shrink-0 border-t border-gray-200 dark:border-gray-700 flex justify-end items-center space-x-3">
                  {/* 取消按钮 */}
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                  >
                    {t('cancelBtn')}
                  </button>

                  {/* 提交按钮 */}
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
