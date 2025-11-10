/*
 * @Date: 2025-11-05 14:30:00
 * @LastEditTime: 2025-11-10 18:59:30
 * @Description: 书籍单词列表模态框组件
 */
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';

// 服务与类型
import { getWordsByBook } from '../../services/bookService';
import { SimpleWord } from '@/types/word.types';
import { ApiError } from '../../utils/error.utils';

// 子组件
import DefinitionDisplay from '../common/DefinitionDisplay';

/**
 * 书籍单词列表模态框属性类型
 */
interface BookWordsModalProps {
  /** 模态框是否打开 */
  isOpen: boolean;
  /** 书籍列表编码（用于获取单词数据） */
  listCode: string | undefined;
  /** 书籍名称（用于标题显示） */
  bookName: string | undefined;
  /** 关闭模态框的回调函数 */
  onClose: () => void;
}

/**
 * 书籍单词列表模态框组件
 * 用于展示指定书籍包含的所有单词，支持搜索过滤，提供加载、错误和空状态反馈
 */
const BookWordsModal: React.FC<BookWordsModalProps> = ({
  isOpen,
  listCode,
  bookName,
  onClose,
}) => {
  // 国际化翻译
  const t = useTranslations('BookSelection.PlanWordsModal'); // 模态框专属翻译
  const t_err = useTranslations('Errors'); // 错误信息翻译

  // 状态管理
  const [isLoading, setIsLoading] = useState(false); // 数据加载状态
  const [error, setError] = useState<string | null>(null); // 错误信息
  const [words, setWords] = useState<SimpleWord[]>([]); // 单词列表数据
  const [searchQuery, setSearchQuery] = useState(''); // 搜索关键词

  /**
   * 加载书籍单词数据
   * 当模态框打开且listCode存在时触发，处理加载状态和错误捕获
   */
  useEffect(() => {
    if (isOpen && listCode) {
      const fetchWords = async () => {
        // 重置状态：开始加载
        setIsLoading(true);
        setError(null);
        setWords([]);
        setSearchQuery('');

        try {
          // 调用接口获取单词数据
          const data = await getWordsByBook(listCode);
          setWords(data);
        } catch (err) {
          console.error('获取书籍单词失败:', err);
          // 错误处理：区分API错误和其他错误
          if (err instanceof ApiError) {
            // API错误：使用错误码匹配国际化翻译
            setError(
              t_err(`e${err.code}`, {
                defaultValue: t('error'), // 翻译缺失时的默认文本
              })
            );
          } else {
            // 其他错误（如网络问题）：使用通用错误文本
            setError(t('error'));
          }
        } finally {
          // 结束加载状态
          setIsLoading(false);
        }
      };

      fetchWords();
    }
  }, [isOpen, listCode, t, t_err]); // 依赖包含翻译函数，确保语言切换时更新

  /**
   * 根据搜索关键词过滤单词列表
   * 不区分大小写，匹配单词的完整或部分字符
   */
  const filteredWords = searchQuery
    ? words.filter((word) =>
        word.word.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : words;

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

          {/* 模态框主体：带动画的卡片，包含标题、搜索和单词列表 */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed inset-0 m-auto w-11/12 md:w-2/3 lg:w-1/2 max-w-2xl h-[80vh] bg-white dark:bg-gray-800 rounded-lg shadow-2xl z-50 flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-labelledby="book-words-modal-title"
          >
            {/* 头部：标题和关闭按钮 */}
            <div className="flex items-center justify-between p-4 shrink-0 border-b border-gray-200 dark:border-gray-700">
              <h2
                id="book-words-modal-title"
                className="text-lg font-semibold text-gray-900 dark:text-white"
              >
                {t('title', { bookName: bookName || '...' })}
              </h2>
              <button
                onClick={onClose}
                className="p-1 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label={t('close')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 搜索栏：用于过滤单词列表 */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('searchPlaceholder', { count: words.length })}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                />
              </div>
            </div>

            {/* 单词列表区域：带滚动条，展示加载/错误/空状态 */}
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

              {/* 单词列表（加载完成且无错误） */}
              {!isLoading && !error && (
                <div className="space-y-2">
                  <ul className="divide-y divide-gray-200 dark:divide-gray-600">
                    {filteredWords.map((word) => (
                      <li
                        key={word.id}
                        className="flex justify-between items-start p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-md transition-colors"
                      >
                        <span className="font-medium text-gray-900 dark:text-gray-100 pt-1">
                          {word.word}
                        </span>
                        <DefinitionDisplay
                          definitions={word.definitions}
                          mode="single-line"
                          className="text-sm text-right max-w-[70%]"
                        />
                      </li>
                    ))}
                  </ul>

                  {/* 空状态：书籍无单词 */}
                  {words.length === 0 && !isLoading && (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-10">
                      {t('empty')}
                    </p>
                  )}

                  {/* 空状态：搜索无结果 */}
                  {words.length > 0 && filteredWords.length === 0 && (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-10">
                      {t('noResults', { query: searchQuery })}
                    </p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default BookWordsModal;
