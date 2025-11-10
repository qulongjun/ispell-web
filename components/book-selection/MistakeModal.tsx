/*
 * @Date: 2025-11-04
 * @LastEditTime: 2025-11-10 18:43:14
 * @Description: 错题集模态框组件
 */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Trash2, ArchiveX, Play, PartyPopper } from 'lucide-react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';

// 服务与类型
import {
  getMistakes,
  removeMistake,
  clearMistakes,
  MistakeEntry,
} from '../../services/planService';
import { useAppContext } from '../../contexts/app.context';

// 子组件
import DefinitionDisplay from '../common/DefinitionDisplay';
import ConfirmationModal from '../common/ConfirmationModal';

/**
 * 错题集模态框属性类型
 */
interface MistakeModalProps {
  /** 模态框是否打开 */
  isOpen: boolean;
  /** 学习计划ID（用于获取对应错题） */
  planId: number | undefined;
  /** 书籍名称（用于标题显示） */
  bookName: string | undefined;
  /** 关闭模态框的回调函数 */
  onClose: () => void;
  /** 开始错题复习的回调函数 */
  onStartReview: (planId: number) => void;
}

/**
 * 错题集模态框组件
 * 展示用户在指定学习计划中积累的错题，提供复习、删除单个错题和清空所有错题的功能
 * 包含完整的状态管理和用户反馈机制
 */
const MistakeModal: React.FC<MistakeModalProps> = ({
  isOpen,
  planId,
  bookName,
  onClose,
  onStartReview,
}) => {
  // 国际化翻译
  const t = useTranslations('BookSelection.MistakeModal');
  
  // 全局状态
  const { accessToken } = useAppContext();

  // 状态管理
  const [isLoading, setIsLoading] = useState(false); // 数据加载状态
  const [error, setError] = useState<string | null>(null); // 错误信息
  const [mistakes, setMistakes] = useState<MistakeEntry[]>([]); // 错题列表数据
  const [isClearing, setIsClearing] = useState<'single' | 'all' | null>(null); // 清除操作状态
  const [confirmClearAll, setConfirmClearAll] = useState(false); // 清空全部确认弹窗状态

  /**
   * 获取错题列表数据
   * 当模态框打开、计划ID或访问令牌变化时触发，处理加载状态和错误捕获
   */
  const fetchMistakes = useCallback(async () => {
    if (!isOpen || !planId || !accessToken) return;
    
    // 开始加载
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getMistakes(planId);
      setMistakes(data);
    } catch (err) {
      console.error('获取错题列表失败:', err);
      setError(t('error'));
    } finally {
      // 结束加载
      setIsLoading(false);
    }
  }, [isOpen, planId, accessToken, t]);

  /**
   * 监听模态框状态和依赖变化，触发数据加载
   */
  useEffect(() => {
    if (isOpen) {
      fetchMistakes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, planId, accessToken]);

  /**
   * 移除单个错题
   * 调用接口删除指定错题，更新本地列表并反馈结果
   */
  const handleRemove = async (wordId: number) => {
    if (!planId) return;
    
    setIsClearing('single');
    try {
      await removeMistake(planId, wordId);
      // 本地更新：过滤掉已删除的错题
      setMistakes((prev) => prev.filter((m) => m.word.id !== wordId));
      toast.success(t('removeSuccess'));
    } catch (err) {
      console.error('移除单个错题失败:', err);
      toast.error(t('removeError'));
    } finally {
      setIsClearing(null);
    }
  };

  /**
   * 清空所有错题
   * 调用接口删除该计划下所有错题，清空本地列表并反馈结果
   */
  const handleClearAll = async () => {
    if (!planId) return;
    
    setIsClearing('all');
    try {
      await clearMistakes(planId);
      setMistakes([]);
      toast.success(t('clearAllSuccess'));
    } catch (err) {
      console.error('清空所有错题失败:', err);
      toast.error(t('clearAllError'));
    } finally {
      setIsClearing(null);
      setConfirmClearAll(false);
    }
  };

  /**
   * 开始错题复习
   * 检查错题列表是否为空，非空则调用复习回调
   */
  const handleReview = () => {
    if (!planId) return;
    if (mistakes.length === 0) {
      toast.error(t('emptyReview'));
      return;
    }
    onStartReview(planId);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩：半透明黑色，点击关闭模态框 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            aria-hidden="true"
          />

          {/* 模态框主体：包含头部、内容区和底部操作栏 */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed inset-0 m-auto w-11/12 md:w-2/3 lg:w-1/2 max-w-2xl h-[80vh] bg-white dark:bg-gray-800 rounded-lg shadow-2xl z-[51] flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mistake-modal-title"
          >
            {/* 头部：标题和关闭按钮 */}
            <div className="flex items-center justify-between p-4 pl-5 shrink-0 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="p-1.5 bg-red-100 dark:bg-red-900/50 rounded-full">
                  <ArchiveX className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <h2
                  id="mistake-modal-title"
                  className="text-lg font-semibold text-gray-900 dark:text-white"
                >
                  {t('title', { bookName: bookName || '...' })}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label={t('close')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 内容区：显示加载状态、错误信息或错题列表 */}
            <div className="flex-1 p-4 overflow-y-auto">
              {/* 加载状态 */}
              {isLoading && (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
                  <span className="ml-2 text-gray-500">{t('loading')}</span>
                </div>
              )}

              {/* 错误状态 */}
              {error && (
                <div className="flex items-center justify-center h-full text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}

              {/* 错题列表（加载完成且无错误） */}
              {!isLoading && !error && (
                <>
                  {mistakes.length > 0 ? (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                      {mistakes.map((mistake) => (
                        <li
                          key={mistake.id}
                          className="flex justify-between items-center py-4 transition-colors duration-150 hover:bg-gray-50 dark:hover:bg-gray-800/60"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {mistake.word.text}
                              </span>
                              <span className="text-xs text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50 px-1.5 py-0.5 rounded">
                                {t('mistakeCount', {
                                  count: mistake.mistakeCount,
                                })}
                              </span>
                            </div>
                            <DefinitionDisplay
                              definitions={mistake.word.definitions}
                              mode="single-line"
                              className="text-sm text-gray-500 dark:text-gray-400 mt-1"
                            />
                          </div>
                          <button
                            onClick={() => handleRemove(mistake.word.id)}
                            disabled={isClearing === 'single'}
                            className="ml-4 p-1.5 rounded-full text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                            aria-label={t('removeAria')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    // 空状态：无错题时显示
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                      <PartyPopper className="w-16 h-16 stroke-1 text-gray-300 dark:text-gray-600" />
                      <p className="mt-4 text-center">{t('empty')}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* 底部操作栏：包含提示信息和功能按钮 */}
            <div className="p-4 shrink-0 border-t border-gray-200 dark:border-gray-700">
              {/* 学习提示栏 */}
              <div className="pb-3 mb-3 border-b border-gray-200 dark:border-gray-600">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('strategyHint')}
                </p>
              </div>

              {/* 操作按钮组 */}
              <div className="flex justify-between items-center">
                {/* 清空全部按钮 */}
                <button
                  onClick={() => setConfirmClearAll(true)}
                  disabled={mistakes.length === 0 || isClearing === 'all'}
                  className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-md disabled:opacity-50"
                >
                  {isClearing === 'all' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  <span>{t('clearAll')}</span>
                </button>

                {/* 开始复习按钮 */}
                <button
                  onClick={handleReview}
                  disabled={mistakes.length === 0 || isLoading}
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 rounded-lg shadow-sm hover:bg-gray-700 dark:hover:bg-gray-300 disabled:opacity-50"
                >
                  <Play className="w-4 h-4" />
                  <span>{t('reviewAll', { count: mistakes.length || 0 })}</span>
                </button>
              </div>
            </div>
          </motion.div>

          {/* 清空全部确认弹窗 */}
          <ConfirmationModal
            isOpen={confirmClearAll}
            title={t('clearAllConfirmTitle')}
            description={t('clearAllConfirmDesc', {
              bookName: bookName || '...',
            })}
            confirmText={t('clearAllConfirmBtn')}
            isDestructive={true}
            onConfirm={handleClearAll}
            onCancel={() => setConfirmClearAll(false)}
          />
        </>
      )}
    </AnimatePresence>
  );
};

export default MistakeModal;