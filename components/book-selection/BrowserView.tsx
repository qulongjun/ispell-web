/*
 * @Date: 2025-10-30 10:24:39
 * @LastEditTime: 2025-11-08 22:34:49
 * @Description: 书籍浏览视图组件
 */
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';

// 类型定义
import type {
  Book,
  Category,
  LearningPlan,
  PlanDetails,
} from '@/types/book.types';

// 子组件
import BookCard from './BookCard';
import PlanSetupView from './PlanSetupView';

/**
 * 浏览视图组件属性类型
 */
interface BrowserViewProps {
  /** 当前语言下的所有系列分类 */
  currentSeriesList: Category[];
  /** 当前选中的系列数据 */
  currentSeriesData: Category | undefined;
  /** 当前系列下的所有书籍列表 */
  currentBookList: Book[];
  /** 当前预览的书籍（用于展开计划设置） */
  previewBook: Book | null;
  /** 当前激活的系列ID */
  activeSeriesId: string;
  /** 更新激活系列ID的回调 */
  setActiveSeriesId: (id: string) => void;
  /** 处理书籍卡片点击的回调（用于切换预览状态） */
  handleBookCardClick: (book: Book) => void;
  /** 开始学习的回调（提交计划设置） */
  handleStartLearning: (plan: PlanDetails) => void;
  /** 更新预览书籍的回调 */
  setPreviewBook: (book: Book | null) => void;
  /** 用户的学习计划列表（用于判断书籍是否已在学习中） */
  learningList: LearningPlan[];
}

/**
 * 将数组按指定大小分块
 * 用于将书籍列表分成每行显示的组（每行3本）
 * @param arr 要分块的数组
 * @param size 每块的大小
 * @returns 分块后的二维数组
 */
function chunk<T>(arr: T[], size: number): T[][] {
  if (size <= 0) throw new Error('分块大小必须大于0');
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

/**
 * 书籍浏览视图组件
 * 提供按系列分类和标签筛选的书籍浏览功能，支持点击书籍卡片展开计划设置面板
 */
const BrowserView: React.FC<BrowserViewProps> = ({
  currentSeriesList,
  currentSeriesData,
  currentBookList,
  previewBook,
  activeSeriesId,
  setActiveSeriesId,
  handleBookCardClick,
  handleStartLearning,
  setPreviewBook,
  learningList,
}) => {
  const t = useTranslations('BookSelection'); // 国际化翻译

  // 标签筛选状态：默认显示"全部"标签
  const [activeTag, setActiveTag] = useState<string>('全部');

  /**
   * 系列切换时重置标签筛选
   * 当用户切换系列分类时，自动选中"全部"标签，显示该系列下所有书籍
   */
  useEffect(() => {
    setActiveTag('全部');
  }, [activeSeriesId]);

  /**
   * 提取当前系列下的所有唯一标签
   * 包含"全部"选项，用于筛选该系列下的书籍
   */
  const uniqueTags = useMemo(() => {
    const orderedTags: string[] = [];
    currentBookList.forEach((book) => {
      if (book.tags && Array.isArray(book.tags)) {
        book.tags.forEach((tag) => {
          if (!orderedTags.includes(tag)) {
            orderedTags.push(tag);
          }
        });
      }
    });
    return ['全部', ...orderedTags]; // "全部"始终作为第一个选项
  }, [currentBookList]);

  /**
   * 根据当前激活的标签筛选书籍
   * "全部"标签显示所有书籍，其他标签显示包含对应标签的书籍
   */
  const filteredBookList = useMemo(() => {
    if (activeTag === '全部') {
      return currentBookList;
    }
    return currentBookList.filter(
      (book) => book.tags && book.tags.includes(activeTag)
    );
  }, [currentBookList, activeTag]);

  /**
   * 将筛选后的书籍列表分块
   * 每3本为一行，确保网格布局与分块逻辑匹配
   */
  const bookRows = useMemo(
    () => chunk(filteredBookList, 3),
    [filteredBookList]
  );

  return (
    <motion.div
      key="browser"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="flex-1 flex flex-col overflow-hidden"
    >
      {/* 1. 系列分类标签栏 */}
      <div className="shrink-0 border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-4 p-4 pb-0 overflow-x-auto whitespace-nowrap">
          {currentSeriesList.map((series) => (
            <button
              key={series.id}
              onClick={() => setActiveSeriesId(series.id.toString())}
              className={`pb-2 px-1 text-sm font-medium transition-colors ${
                activeSeriesId === series.id.toString()
                  ? 'border-b-2 border-gray-900 text-gray-900 dark:border-gray-100 dark:text-gray-100'
                  : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
              role="tab"
              aria-selected={activeSeriesId === series.id.toString()}
              aria-label={t('BrowserView.aria.tabLabel', {
                categoryName: series.name,
              })}
            >
              {series.name}
            </button>
          ))}
        </nav>
      </div>

      {/* 2. 标签筛选栏（当存在多个标签时显示） */}
      {uniqueTags.length > 1 && (
        <div className="shrink-0">
          <nav className="flex space-x-2 px-4 pt-3 pb-2 overflow-x-auto whitespace-nowrap">
            {uniqueTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-all duration-150 ease-in-out border ${
                  activeTag === tag
                    ? 'bg-gray-900 text-white border-gray-900 dark:bg-gray-100 dark:text-gray-900 dark:border-gray-100 shadow-sm'
                    : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50 hover:border-gray-400 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-500'
                }`}
                role="tab"
                aria-selected={activeTag === tag}
              >
                {tag}
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* 3. 书籍列表区域（带滚动条） */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {currentSeriesData ? (
          <section>
            <div className="space-y-3">
              {filteredBookList.length > 0 ? (
                // 遍历分块后的书籍行，每行显示3本
                bookRows.map((row, rowIndex) => (
                  <div key={rowIndex}>
                    {/* 书籍卡片网格：移动端1列，平板及以上3列 */}
                    <div
                      className="grid grid-cols-1 md:grid-cols-3 gap-3"
                      role="radiogroup"
                      aria-label={t('BrowserView.aria.bookRadiogroupLabel')}
                    >
                      {row.map((book) => (
                        <BookCard
                          key={book.listCode}
                          book={book}
                          isActive={previewBook?.listCode === book.listCode}
                          onSelect={handleBookCardClick}
                        />
                      ))}
                    </div>

                    {/* 行内展开的计划设置视图（当前行有预览书籍时显示） */}
                    <AnimatePresence>
                      {previewBook &&
                        row.some(
                          (book) => book.listCode === previewBook.listCode
                        ) && (
                          <motion.div
                            key="plan-setup-inline"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{
                              type: 'spring',
                              damping: 25,
                              stiffness: 180,
                            }}
                            className="overflow-hidden"
                          >
                            <div className="pt-3">
                              <PlanSetupView
                                book={previewBook}
                                // 若书籍已在学习中，加载已有计划
                                initialPlan={
                                  learningList.find(
                                    (p) => p.listCode === previewBook.listCode
                                  )?.plan
                                }
                                onStart={handleStartLearning}
                                onCancel={() => setPreviewBook(null)}
                              />
                            </div>
                          </motion.div>
                        )}
                    </AnimatePresence>
                  </div>
                ))
              ) : (
                // 空状态：当前分类/标签下无书籍
                <p className="text-gray-500 dark:text-gray-400 text-center py-10">
                  {t('BrowserView.noBooksInCategory')}
                </p>
              )}
            </div>
          </section>
        ) : (
          // 空状态：无当前系列数据
          <p className="text-gray-500 dark:text-gray-400 text-center py-10">
            {t('BrowserView.noBooksInCategory')}
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default BrowserView;
