/*
 * @Date: 2025-10-30 10:24:39
 * @LastEditTime: 2025-11-01 15:34:21
 * @Description: 书籍浏览视图组件（支持国际化，嵌套在 BookSelection 命名空间下）
 * 功能：按分类展示书籍列表，支持切换分类、选择书籍、创建学习计划
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl'; // 导入国际化Hook
import type {
  Book,
  Category,
  LearningPlan,
  PlanDetails,
} from '@/types/book.types';
import BookCard from './BookCard';
import PlanSetupView from './PlanSetupView';

interface BrowserViewProps {
  currentSeriesList: Category[];
  currentSeriesData: Category | undefined;
  currentBookList: Book[];
  bookRows: Book[][];
  previewBook: Book | null;
  activeSeriesId: string;
  setActiveSeriesId: (id: string) => void;
  handleBookCardClick: (book: Book) => void;
  handleStartLearning: (plan: PlanDetails) => void;
  setPreviewBook: (book: Book | null) => void;
  learningList: LearningPlan[];
}

const BrowserView: React.FC<BrowserViewProps> = ({
  currentSeriesList,
  currentSeriesData,
  bookRows,
  previewBook,
  activeSeriesId,
  setActiveSeriesId,
  handleBookCardClick,
  handleStartLearning,
  setPreviewBook,
  learningList,
}) => {
  const t = useTranslations('BookSelection');

  return (
    <motion.div
      key="browser"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="flex-1 flex flex-col overflow-hidden"
    >
      <div className="shrink-0 border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-4 p-4 overflow-x-auto whitespace-nowrap">
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
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {currentSeriesData ? (
          <section>
            <div className="space-y-3">
              {bookRows.map((row, rowIndex) => (
                <div key={rowIndex}>
                  <div
                    className="grid grid-cols-2 sm:grid-cols-3 gap-3"
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
                  <AnimatePresence>
                    {previewBook &&
                      row.some(
                        (book) => book.listCode === previewBook.listCode
                      ) && (
                        <motion.div
                          key="plan-setup-inline-browser"
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
              ))}
            </div>
          </section>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-10">
            {t('BrowserView.noBooksInCategory')}
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default BrowserView;
