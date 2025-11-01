/*
 * @Date: 2025-10-30 10:23:51
 * @LastEditTime: 2025-11-01 14:33:16
 * @Description: 书籍卡片组件（支持国际化，嵌套在 BookSelection 命名空间下）
 * 功能：展示单本书籍信息，支持选中状态显示，点击触发选择事件
 */

import React from 'react';
import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl'; // 导入国际化Hook
import type { Book } from '@/types/book.types';

interface BookCardProps {
  book: Book;
  isActive: boolean;
  onSelect: (book: Book) => void;
}

const BookCard: React.FC<BookCardProps> = ({ book, isActive, onSelect }) => {
  // 国际化翻译Hook：指向 BookSelection 命名空间（BookCard 嵌套其中）
  const t = useTranslations('BookSelection');

  return (
    <button
      onClick={() => onSelect(book)}
      className={`relative w-full text-left p-3 rounded-lg border-2 transition-all duration-200 ${
        isActive
          ? 'bg-gray-200 border-gray-400 dark:bg-gray-700 dark:border-gray-500'
          : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
      }`}
      role="radio"
      aria-checked={isActive}
    >
      {/* 书籍名称（来自book数据，无需翻译） */}
      <p
        className={`font-medium ${
          isActive
            ? 'text-gray-900 dark:text-gray-100'
            : 'text-gray-800 dark:text-gray-100'
        }`}
      >
        {book.name}
      </p>

      {/* 书籍描述（来自book数据，无需翻译） */}
      {book.description && (
        <p
          className={`text-xs mt-0.5 ${
            isActive
              ? 'text-gray-600 dark:text-gray-400'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          {book.description}
        </p>
      )}

      {/* 单词总数（翻译键对应嵌套路径：BookCard.totalWords） */}
      <p
        className={`text-sm mt-1 ${
          isActive
            ? 'text-gray-700 dark:text-gray-300'
            : 'text-gray-500 dark:text-gray-400'
        }`}
      >
        {t('BookCard.totalWords', { count: book.totalWords })}
      </p>

      {/* 选中状态图标（无文本，无需翻译） */}
      {isActive && (
        <Check className="absolute top-3 right-3 w-5 h-5 text-gray-900 dark:text-gray-100" />
      )}
    </button>
  );
};

export default BookCard;
