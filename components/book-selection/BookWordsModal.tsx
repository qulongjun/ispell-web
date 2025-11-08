/*
 * @Description: 用于显示书本完整单词列表的模态框 (已更新 i18n 错误处理)
 */
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { getWordsByBook } from '../../services/bookService';
import DefinitionDisplay from '../common/DefinitionDisplay';
import { Definition, SimpleWord } from '@/types/word.types';

// [!! 新增 !!] 导入 ApiError
import { ApiError } from '../../utils/error.utils';

interface BookWordsModalProps {
  isOpen: boolean;
  listCode: string | undefined;
  bookName: string | undefined;
  onClose: () => void;
}

const BookWordsModal: React.FC<BookWordsModalProps> = ({
  isOpen,
  listCode,
  bookName,
  onClose,
}) => {
  const t = useTranslations('BookSelection.PlanWordsModal');
  // [!! 新增 !!] 导入 Errors 翻译
  const t_err = useTranslations('Errors');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [words, setWords] = useState<SimpleWord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen && listCode) {
      const fetchWords = async () => {
        setIsLoading(true);
        setError(null);
        setWords([]);
        setSearchQuery('');
        try {
          const data = await getWordsByBook(listCode);
          setWords(data);
        } catch (err) {
          // [!! 关键修改 !!]
          console.error('Fetch book words failed:', err);
          if (err instanceof ApiError) {
            // 如果是 ApiError, 使用 code 查找 i18n
            // e.g. e4001 (WORD_LIST_NOT_FOUND)
            setError(
              t_err(`e${err.code}`, {
                defaultValue: t('error'), // 备用
              })
            );
          } else {
            // 其他错误 (网络等)
            setError(t('error'));
          }
          // [!! 修改结束 !!]
        }
        setIsLoading(false);
      };
      fetchWords();
    }
  }, [isOpen, listCode, t, t_err]); // [!!] 添加 t_err 依赖

  // (过滤逻辑不变)
  const filteredWords = searchQuery
    ? words.filter((word) =>
        word.word.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : words;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop (不变) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            aria-hidden="true"
          />

          {/* Modal Panel (不变) */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed inset-0 m-auto w-11/12 md:w-2/3 lg:w-1/2 max-w-2xl h-[80vh] bg-white dark:bg-gray-800 rounded-lg shadow-2xl z-50 flex flex-col"
            role="dialog"
            aria-modal="true"
          >
            {/* Header (不变) */}
            <div className="flex items-center justify-between p-4 shrink-0 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
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

            {/* 搜索栏 (不变) */}
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

            {/* 列表区域 (不变) */}
            <div className="flex-1 p-4 overflow-y-auto">
              {isLoading && (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
                  <span className="ml-2 text-gray-500">{t('loading')}</span>
                </div>
              )}

              {/* [!! 修改 !!] 错误提示现在由 state.error 驱动 */}
              {error && (
                <div className="flex items-center justify-center h-full text-red-600">
                  {error}
                </div>
              )}

              {!isLoading && !error && (
                <div className="space-y-2">
                  <ul className="divide-y divide-gray-200 dark:divide-gray-600">
                    {filteredWords.map((word) => (
                      <li
                        key={word.id}
                        className="flex justify-between items-start p-3"
                      >
                        <span className="font-medium text-gray-900 dark:text-gray-100 pt-1">
                          {word.word}
                        </span>
                        <DefinitionDisplay
                          definitions={word.definitions as Definition[]}
                          mode="single-line"
                          className="text-sm text-right max-w-[70%]"
                        />
                      </li>
                    ))}
                  </ul>

                  {/* 空状态 (不变) */}
                  {words.length === 0 && !isLoading && (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-10">
                      {t('empty')}
                    </p>
                  )}

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
