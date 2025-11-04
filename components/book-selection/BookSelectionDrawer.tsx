'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Star,
  MoreHorizontal,
  RotateCcw,
  Trash2,
  ListTree, // 1. 导入新图标
} from 'lucide-react';
import { useAppContext } from '@/contexts/app.context';
import type { Book, Category, Language, PlanDetails } from '@/types/book.types';
import {
  savePlan,
  deletePlan,
  resetPlan,
  activatePlan,
} from '@/services/planService';
import toast from 'react-hot-toast';

// 导入子组件
import BrowserView from './BrowserView';
import LearningView from './LearningView';
import ConfirmationModal from '../common/ConfirmationModal';
import PlanWordsModal from './PlanWordsModal'; // 2. 导入新模态框

// 辅助函数
function chunk<T>(arr: T[], size: number): T[][] {
  if (size <= 0) throw new Error('Chunk size must be greater than 0');
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

const reviewStrategyNames: { [key: string]: string } = {
  NONE: '不复习',
  EBBINGHAUS: '艾宾浩斯',
  SM2: 'SM-2 算法',
  LEITNER: '莱布尼茨',
};

type ModalState = {
  type: 'reset' | 'cancel';
  planId: number;
  bookName: string;
};

// 3. 为新模态框添加状态类型
type PlanWordsModalState = {
  planId: number;
  bookName: string;
};

export default function BookSelectionDrawer() {
  // 从Context获取数据
  const {
    accessToken,
    currentBookId,
    setCurrentBookId,
    loadBook,
    hierarchy,
    learningList,
    isDataLoading,
    dataError,
    refreshAllData,
    isBookDrawerOpen,
    setIsBookDrawerOpen,
  } = useAppContext();

  // 内部状态
  const [mainView, setMainView] = useState<'browser' | 'learning'>('browser');
  const [previewBook, setPreviewBook] = useState<Book | null>(null);
  const [activeLangCode, setActiveLangCode] = useState('');
  const [activeSeriesId, setActiveSeriesId] = useState('');
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [modalState, setModalState] = useState<ModalState | null>(null);

  // 4. 添加新模态框的状态
  const [planWordsModalState, setPlanWordsModalState] =
    useState<PlanWordsModalState | null>(null);

  const isProgrammaticNav = useRef(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // 辅助方法
  const getPlanDescription = (book: Book, plan: PlanDetails): string => {
    const bookCount = book.totalWords;
    if (!bookCount || bookCount <= 0) return '计划信息不可用';
    if (plan.type === 'preset' && plan.value > 0)
      return `计划: ${plan.value} 天 (约 ${Math.ceil(
        bookCount / plan.value
      )} 词/天)`;
    if (plan.type === 'customDays' && plan.value > 0)
      return `计划: ${plan.value} 天 (约 ${Math.ceil(
        bookCount / plan.value
      )} 词/天)`;
    if (plan.type === 'customWords' && plan.value > 0)
      return `计划: ${plan.value} 词/天 (约 ${Math.ceil(
        bookCount / plan.value
      )} 天)`;
    return '未知的计划';
  };

  // 事件处理
  const handleCloseDrawer = () => {
    setIsBookDrawerOpen(false);
    setTimeout(() => {
      setPreviewBook(null);
      setOpenMenu(null);
      setModalState(null);
      setPlanWordsModalState(null); // 关闭抽屉时也重置新模态框状态
    }, 300);
  };

  const handleBookCardClick = (book: Book) => {
    setPreviewBook((prev) => (prev?.listCode === book.listCode ? null : book));
  };

  const handleStartLearning = async (plan: PlanDetails) => {
    if (!previewBook || !accessToken) return;
    const loadingToastId = toast.loading('正在创建计划...');
    try {
      await savePlan(previewBook.listCode, plan);
      loadBook(previewBook.listCode, plan);
      await refreshAllData();
      toast.dismiss(loadingToastId);
      toast.success('计划已创建！');
      handleCloseDrawer();
    } catch (err) {
      console.error('创建计划失败:', err);
      toast.dismiss(loadingToastId);
      toast.error('创建计划失败，请稍后重试');
    }
  };

  const handleUpdatePlan = async (
    planId: number,
    book: Book,
    plan: PlanDetails
  ) => {
    if (!accessToken) return;
    const loadingToastId = toast.loading('正在更新计划...');
    try {
      await savePlan(book.listCode, plan);
      await refreshAllData();
      setPreviewBook(null);
      toast.dismiss(loadingToastId);
      toast.success('计划已更新！');
      if (currentBookId === book.listCode) {
        loadBook(book.listCode, plan);
      }
    } catch (err) {
      console.error('更新计划失败:', err);
      toast.dismiss(loadingToastId);
      toast.error('更新计划失败，请稍后重试');
    }
  };

  const handleActivateLearning = async (planId: number, listCode: string) => {
    if (!accessToken || currentBookId === listCode) return;
    const oldBookId = currentBookId;

    try {
      await activatePlan(planId);
      setCurrentBookId(listCode);
      loadBook(listCode, 'activate');
      await refreshAllData();
      toast.success('已切换激活书籍');
    } catch (err) {
      console.error('激活计划失败:', err);
      toast.error('激活失败，请重试');
      if (oldBookId) setCurrentBookId(oldBookId);
    }
  };

  const handleAdjustPlanClick = (book: Book) => {
    setPreviewBook((prev) => (prev?.listCode === book.listCode ? null : book));
    setOpenMenu(null);
  };

  const openResetModal = (planId: number, bookName: string) => {
    setModalState({ type: 'reset', planId, bookName });
    setOpenMenu(null);
  };

  const openCancelModal = (planId: number, bookName: string) => {
    setModalState({ type: 'cancel', planId, bookName });
    setOpenMenu(null);
  };

  // 5. 添加打开新模态框的处理函数
  const openPlanWordsModal = (planId: number, bookName: string) => {
    setPlanWordsModalState({ planId, bookName });
    setOpenMenu(null); // 关闭 "..." 菜单
  };

  const confirmResetProgress = async () => {
    if (modalState?.type !== 'reset' || !accessToken) return;
    const loadingToastId = toast.loading('正在重置进度...');
    try {
      await resetPlan(modalState.planId);
      await refreshAllData();
      toast.dismiss(loadingToastId);
      toast.success('学习进度已重置');
      const plan = learningList.find((p) => p.planId === modalState.planId);
      if (plan && currentBookId === plan.listCode) {
        loadBook(plan.listCode, 'reset');
      }
    } catch (err) {
      console.error('重置失败:', err);
      toast.dismiss(loadingToastId);
      toast.error('重置失败，请稍后重试');
    }
    setModalState(null);
  };

  const confirmCancelLearning = async () => {
    if (modalState?.type !== 'cancel' || !accessToken) return;
    const { planId } = modalState;
    const bookToCancel = learningList.find(
      (p) => p.planId === planId
    )?.listCode;
    const loadingToastId = toast.loading('正在取消学习...');

    try {
      await deletePlan(planId);
      await refreshAllData();
      if (currentBookId === bookToCancel) {
        setCurrentBookId(null);
        loadBook(null, null);
      }
      toast.dismiss(loadingToastId);
      toast.success('已取消学习该书籍');
      if (learningList.length === 1) setMainView('browser');
    } catch (err) {
      console.error('取消学习失败:', err);
      toast.dismiss(loadingToastId);
      toast.error('取消学习失败，请稍后重试');
    }
    setModalState(null);
  };

  // 派生数据
  const currentLanguagePack = hierarchy.find(
    (lang) => lang.code === activeLangCode
  );
  const currentSeriesList = currentLanguagePack?.categories || [];
  const currentSeriesData = currentSeriesList.find(
    (series) => series.id.toString() === activeSeriesId
  );
  const currentBookList = currentSeriesData?.wordLists || [];
  const bookRows = chunk(currentBookList, 3);
  const modalBookName = modalState ? modalState.bookName : '';

  useEffect(() => {
    if (isProgrammaticNav.current) {
      isProgrammaticNav.current = false;
      return;
    }
    if (mainView === 'browser') {
      const currentLang = hierarchy.find(
        (lang) => lang.code === activeLangCode
      );
      if (currentLang && currentLang.categories.length > 0) {
        setActiveSeriesId(currentLang.categories[0].id.toString());
      } else {
        setActiveSeriesId('');
      }
    }
    setPreviewBook(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLangCode, hierarchy]);

  useEffect(() => {
    if (isProgrammaticNav.current) {
      isProgrammaticNav.current = false;
      return;
    }
    setPreviewBook(null);
  }, [activeSeriesId]);

  useEffect(() => {
    if (!openMenu) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenu]);

  useEffect(() => {
    if (hierarchy.length > 0) {
      setActiveLangCode(hierarchy[0].code);
      if (hierarchy[0].categories.length > 0) {
        setActiveSeriesId(hierarchy[0].categories[0].id.toString());
      } else {
        setActiveSeriesId('');
      }
    } else {
      setActiveLangCode('');
      setActiveSeriesId('');
    }

    if (learningList.length > 0 && !isProgrammaticNav.current) {
      setMainView('learning');
    } else if (learningList.length === 0) {
      setMainView('browser');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hierarchy, learningList]);

  return (
    <AnimatePresence>
      {isBookDrawerOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleCloseDrawer}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            aria-hidden="true"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`fixed top-0 right-0 h-full bg-white dark:bg-gray-800 shadow-2xl z-50 flex flex-col w-full lg:w-2/3 xxl:w-1/2`}
            role="dialog"
            aria-modal="true"
          >
            {/* 头部 */}
            <div className="flex items-center justify-between p-4 shrink-0 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                书架
              </h2>
              <button
                onClick={handleCloseDrawer}
                className="p-1 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="关闭"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 主体内容区 */}
            <div className="flex flex-1 overflow-hidden">
              {/* 垂直导航 */}
              <nav className="w-20 sm:w-24 shrink-0 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
                <ul className="flex flex-col items-center p-2 space-y-2">
                  <li className="w-full">
                    <button
                      onClick={() => setMainView('learning')}
                      className={`flex flex-col items-center justify-center w-full h-16 rounded-lg transition-colors ${
                        mainView === 'learning'
                          ? 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
                          : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                      }`}
                      role="tab"
                      aria-selected={mainView === 'learning'}
                    >
                      <Star className="w-5 h-5" />
                      <span className="text-xs mt-1">在学</span>
                    </button>
                  </li>
                  <li className="w-full px-2">
                    <hr className="border-gray-200 dark:border-gray-700" />
                  </li>
                  {hierarchy.map((lang) => (
                    <li key={lang.code} className="w-full">
                      <button
                        onClick={() => {
                          setMainView('browser');
                          setActiveLangCode(lang.code);
                        }}
                        className={`flex flex-col items-center justify-center w-full h-16 rounded-lg transition-colors ${
                          mainView === 'browser' && activeLangCode === lang.code
                            ? 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
                            : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                        }`}
                        role="tab"
                        aria-selected={
                          mainView === 'browser' && activeLangCode === lang.code
                        }
                      >
                        <span className="text-lg font-bold">
                          {/* 假设 lang 对象有 shortName 字段 */}
                          {lang.shortName || lang.code.toUpperCase()}
                        </span>
                        <span className="text-xs mt-1">{lang.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>

              {/* 右侧内容区 (视图切换) */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {isDataLoading && (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="w-8 h-8 animate-spin text-gray-500 border-4 border-t-transparent border rounded-full" />
                  </div>
                )}
                {dataError && !isDataLoading && (
                  <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                    <p className="text-red-600 dark:text-red-400 mb-4">
                      {dataError}
                    </p>
                    <button
                      onClick={refreshAllData}
                      className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm hover:bg-gray-700 dark:text-gray-900 dark:bg-white dark:hover:bg-gray-300"
                    >
                      重试
                    </button>
                  </div>
                )}

                {!isDataLoading && !dataError && (
                  <AnimatePresence mode="wait">
                    {mainView === 'browser' ? (
                      <BrowserView
                        currentSeriesList={currentSeriesList}
                        currentSeriesData={currentSeriesData}
                        currentBookList={currentBookList}
                        bookRows={bookRows}
                        previewBook={previewBook}
                        activeSeriesId={activeSeriesId}
                        setActiveSeriesId={setActiveSeriesId}
                        handleBookCardClick={handleBookCardClick}
                        handleStartLearning={handleStartLearning}
                        setPreviewBook={setPreviewBook}
                        learningList={learningList}
                      />
                    ) : (
                      <LearningView
                        learningList={learningList}
                        currentBookId={currentBookId}
                        previewBook={previewBook}
                        openMenu={openMenu}
                        menuRef={menuRef}
                        getPlanDescription={getPlanDescription}
                        reviewStrategyNames={reviewStrategyNames}
                        handleActivateLearning={handleActivateLearning}
                        handleAdjustPlanClick={handleAdjustPlanClick}
                        setOpenMenu={setOpenMenu}
                        openResetModal={openResetModal}
                        openCancelModal={openCancelModal}
                        setPreviewBook={setPreviewBook}
                        handleUpdatePlan={handleUpdatePlan}
                        handleViewPlanWords={openPlanWordsModal} // 6. 传递新 handler
                      />
                    )}
                  </AnimatePresence>
                )}
              </div>
            </div>

            {/* 确认弹窗 */}
            <ConfirmationModal
              isOpen={modalState !== null}
              title={modalState?.type === 'cancel' ? '取消学习' : '重置进度'}
              description={
                modalState?.type === 'cancel'
                  ? `你确定要取消学习《${modalBookName}》吗？`
                  : `你确定要重置《${modalBookName}》的学习进度吗？`
              }
              confirmText={
                modalState?.type === 'cancel' ? '取消学习' : '确认重置'
              }
              isDestructive={modalState?.type === 'cancel'}
              onConfirm={
                modalState?.type === 'cancel'
                  ? confirmCancelLearning
                  : confirmResetProgress
              }
              onCancel={() => setModalState(null)}
            />

            {/* 7. 渲染新模态框 */}
            <PlanWordsModal
              isOpen={planWordsModalState !== null}
              planId={planWordsModalState?.planId}
              bookName={planWordsModalState?.bookName}
              onClose={() => setPlanWordsModalState(null)}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
