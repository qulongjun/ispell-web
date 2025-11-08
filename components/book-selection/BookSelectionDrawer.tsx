/*
 * @Date: 2025-11-04 20:17:42
 * @LastEditTime: 2025-11-08 08:49:44
 * @Description:
 */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, ArchiveX, ListTree } from 'lucide-react';
import { useAppContext } from '@/contexts/app.context';
// [!! 1. 移除 !!] 不再需要 Book
import type { PlanDetails, LearningPlan } from '@/types/book.types';
import {
  savePlan,
  deletePlan,
  resetPlan,
  activatePlan,
  getMistakeReviewWords,
} from '@/services/planService';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl'; // [!! 新增 !!]

// 导入子组件
import BrowserView from './BrowserView';
import LearningView from './LearningView';
import ConfirmationModal from '../common/ConfirmationModal';
import PlanWordsModal from './PlanWordsModal';
import MistakeModal from './MistakeModal';

// [!! 移除 !!] chunk 辅助函数 (已移至 BrowserView)
// ...

// [!! 移除 !!] 静态 reviewStrategyNames 对象
// ...

// 确认弹窗状态类型
type ModalState = {
  type: 'reset' | 'cancel';
  planId: number;
  bookName: string;
};

// 计划单词模态框状态类型
type PlanWordsModalState = {
  planId: number;
  bookName: string;
};

// 错题集模态框状态类型
type MistakeModalState = {
  planId: number;
  bookName: string;
};

export default function BookSelectionDrawer() {
  // [!! 新增 !!] 引入 i18n
  const t = useTranslations('BookSelection');
  const tCommon = useTranslations('common');

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
    isLoggedIn,
    startMistakeReview,
  } = useAppContext();

  // 内部状态
  const [mainView, setMainView] = useState<'browser' | 'learning'>('browser');
  // [!! 2. 移除 !!] previewBook 类型简化
  const [previewBook, setPreviewBook] = useState<LearningPlan['book'] | null>(
    null
  );
  const [activeLangCode, setActiveLangCode] = useState('');
  const [activeSeriesId, setActiveSeriesId] = useState('');
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [modalState, setModalState] = useState<ModalState | null>(null);
  const [planWordsModalState, setPlanWordsModalState] =
    useState<PlanWordsModalState | null>(null);

  const [mistakeModalState, setMistakeModalState] =
    useState<MistakeModalState | null>(null);

  const isProgrammaticNav = useRef(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // [!! 新增 !!] 动态构建 reviewStrategyNames (从 i18n 获取)
  const reviewStrategyNames = {
    NONE: t('PlanSetupView.reviewStrategies.NONE.name'),
    EBBINGHAUS: t('PlanSetupView.reviewStrategies.EBBINGHAUS.name'),
    SM2: t('PlanSetupView.reviewStrategies.SM2.name'),
    LEITNER: t('PlanSetupView.reviewStrategies.LEITNER.name'),
  };

  // [!! 3. 移除 !!] getPlanDescription 函数整个被删除
  // const getPlanDescription = (...) => { ... };

  const handleCloseDrawer = () => {
    setIsBookDrawerOpen(false);
    setTimeout(() => {
      setPreviewBook(null);
      setOpenMenu(null);
      setModalState(null);
      setPlanWordsModalState(null);
      setMistakeModalState(null);
    }, 300);
  };

  const handleBookCardClick = (book: LearningPlan['book']) => {
    setPreviewBook((prev) => (prev?.listCode === book.listCode ? null : book));
  };

  // [!! 修改 !!] handleStartLearning Toast 使用 i18n
  const handleStartLearning = async (plan: PlanDetails) => {
    if (!previewBook || !accessToken) return;
    const loadingToastId = toast.loading(t('toast.creatingPlan'));
    try {
      await savePlan(previewBook.listCode, plan);
      loadBook(previewBook.listCode, plan);
      await refreshAllData();
      toast.dismiss(loadingToastId);
      toast.success(t('toast.createPlanSuccess'));
      handleCloseDrawer();
    } catch (err) {
      console.error('创建计划失败:', err);
      toast.dismiss(loadingToastId);
      toast.error(t('toast.createPlanError'));
    }
  };

  // [!! 4. 修改 !!] handleUpdatePlan 类型简化
  const handleUpdatePlan = async (
    planId: number,
    book: LearningPlan['book'], // 类型简化
    plan: PlanDetails
  ) => {
    if (!accessToken) return;
    const loadingToastId = toast.loading(t('toast.updatingPlan'));
    try {
      await savePlan(book.listCode, plan);
      await refreshAllData();
      setPreviewBook(null);
      toast.dismiss(loadingToastId);
      toast.success(t('toast.updatePlanSuccess'));
      if (currentBookId === book.listCode) {
        loadBook(book.listCode, plan);
      }
    } catch (err) {
      console.error('更新计划失败:', err);
      toast.dismiss(loadingToastId);
      toast.error(t('toast.updatePlanError'));
    }
  };

  // [!! 修正 !!] handleActivateLearning Toast 使用 i18n (并修正 loadingToastId bug)
  const handleActivateLearning = async (planId: number, listCode: string) => {
    if (!accessToken || currentBookId === listCode) return;
    const oldBookId = currentBookId;

    // [!! 修正 !!] 在 try...catch 外部声明 loadingToastId
    const loadingToastId = toast.loading(t('toast.activatingPlan'));

    try {
      await activatePlan(planId);
      setCurrentBookId(listCode);
      loadBook(listCode, 'activate');
      await refreshAllData();

      toast.dismiss(loadingToastId); // [!! 修正 !!] 成功时 dismiss
      toast.success(t('toast.activatePlanSuccess'));
    } catch (err) {
      console.error('激活计划失败:', err);
      toast.dismiss(loadingToastId); // [!! 修正 !!] 失败时 dismiss
      toast.error(t('toast.activatePlanError'));
      if (oldBookId) setCurrentBookId(oldBookId);
    }
  };

  // [!! 5. 修改 !!] handleAdjustPlanClick 类型简化
  const handleAdjustPlanClick = (book: LearningPlan['book']) => {
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

  const openPlanWordsModal = (planId: number, bookName: string) => {
    setPlanWordsModalState({ planId, bookName });
    setOpenMenu(null);
  };

  const openMistakeModal = (planId: number, bookName: string) => {
    setMistakeModalState({ planId, bookName });
    setOpenMenu(null);
  };

  // [!! 修改 !!] handleStartMistakeReview Toast 使用 i18n
  const handleStartMistakeReview = async (planId: number) => {
    if (!accessToken) return;
    try {
      const { words } = await getMistakeReviewWords(planId);
      if (words.length === 0) {
        toast.error(t('toast.mistakeListEmpty'));
        return;
      }
      if (startMistakeReview) {
        startMistakeReview(planId, words);
      } else {
        console.warn('AppContext.startMistakeReview 未定义');
      }
      toast.success(t('toast.mistakeReviewStarted'));
      handleCloseDrawer();
    } catch (err) {
      console.error('开始错题复习失败:', err);
      toast.error(t('toast.mistakeReviewStartError'));
    }
  };

  // [!! 修改 !!] confirmResetProgress Toast 使用 i18n
  const confirmResetProgress = async () => {
    if (modalState?.type !== 'reset' || !accessToken) return;
    const loadingToastId = toast.loading(t('toast.resettingProgress'));
    try {
      await resetPlan(modalState.planId);
      await refreshAllData();
      toast.dismiss(loadingToastId);
      toast.success(t('toast.resetProgressSuccess'));
      const plan = learningList.find((p) => p.planId === modalState.planId);
      if (plan && currentBookId === plan.listCode) {
        loadBook(plan.listCode, 'reset');
      }
    } catch (err) {
      console.error('重置失败:', err);
      toast.dismiss(loadingToastId);
      toast.error(t('toast.resetProgressError'));
    }
    setModalState(null);
  };

  // [!! 修改 !!] confirmCancelLearning Toast 使用 i18n
  const confirmCancelLearning = async () => {
    if (modalState?.type !== 'cancel' || !accessToken) return;
    const { planId } = modalState;
    const bookToCancel = learningList.find(
      (p) => p.planId === planId
    )?.listCode;
    const loadingToastId = toast.loading(t('toast.cancellingPlan'));
    try {
      await deletePlan(planId);
      await refreshAllData();
      if (currentBookId === bookToCancel) {
        setCurrentBookId(null);
        loadBook(null, null);
      }
      toast.dismiss(loadingToastId);
      toast.success(t('toast.cancelPlanSuccess'));
      if (learningList.length === 1) setMainView('browser');
    } catch (err) {
      console.error('取消学习失败:', err);
      toast.dismiss(loadingToastId);
      toast.error(t('toast.cancelPlanError'));
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
  const currentBookList = currentSeriesData?.wordLists || []; // [!!] 这个原始列表会传递给 BrowserView
  // const bookRows = chunk(currentBookList, 3); // [!!] 移除这一行
  const modalBookName = modalState ? modalState.bookName : '';

  // ... (所有 useEffects 保持不变) ...
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
    if (!isLoggedIn) {
      setMainView('browser');
      return;
    }
    if (learningList.length > 0 && !isProgrammaticNav.current) {
      setMainView('learning');
    } else if (learningList.length === 0) {
      setMainView('browser');
    }
  }, [hierarchy, learningList, isLoggedIn]);

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
    if (learningList.length > 0 && !isProgrammaticNav.current && isLoggedIn) {
      setMainView('learning');
    } else if (learningList.length === 0 || !isLoggedIn) {
      setMainView('browser');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hierarchy, learningList, isLoggedIn]);

  return (
    <AnimatePresence>
      {isBookDrawerOpen && (
        <>
          {/* ... (背景遮罩 保持不变) ... */}
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
            {/* [!! 修改 !!] 抽屉头部 使用 i18n */}
            <div className="flex items-center justify-between p-4 shrink-0 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('bookshelfBtnText')}
              </h2>
              <button
                onClick={handleCloseDrawer}
                className="p-1 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label={tCommon('aria.close')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* [!! 修改 !!] 主体内容区 和 垂直导航 使用 i18n */}
            <div className="flex flex-1 overflow-hidden">
              <nav className="w-20 sm:w-24 shrink-0 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
                <ul className="flex flex-col items-center p-2 space-y-2">
                  {isLoggedIn && (
                    <>
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
                          <span className="text-xs mt-1">
                            {t('LearningView.title')}
                          </span>
                        </button>
                      </li>
                      <li className="w-full px-2">
                        <hr className="border-gray-200 dark:border-gray-700" />
                      </li>
                    </>
                  )}
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
                          {lang.shortName || lang.code.toUpperCase()}
                        </span>
                        <span className="text-xs mt-1">{lang.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>

              {/* [!! 修改 !!] 右侧内容区 和 加载/错误状态 使用 i18n */}
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
                      {tCommon('buttons.retry')}
                    </button>
                  </div>
                )}

                {!isDataLoading && !dataError && (
                  <AnimatePresence mode="wait">
                    {mainView === 'browser' ? (
                      <BrowserView
                        currentSeriesList={currentSeriesList}
                        currentSeriesData={currentSeriesData}
                        currentBookList={currentBookList} // [!!] 传递原始列表
                        // bookRows={bookRows} // [!!] 移除此 prop
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
                        // [!! 6. 移除 !!] getPlanDescription prop 被移除
                        reviewStrategyNames={reviewStrategyNames}
                        handleActivateLearning={handleActivateLearning}
                        handleAdjustPlanClick={handleAdjustPlanClick}
                        setOpenMenu={setOpenMenu}
                        openResetModal={openResetModal}
                        openCancelModal={openCancelModal}
                        setPreviewBook={setPreviewBook}
                        handleUpdatePlan={handleUpdatePlan}
                        handleViewPlanWords={openPlanWordsModal}
                        handleViewMistakes={openMistakeModal}
                      />
                    )}
                  </AnimatePresence>
                )}
              </div>
            </div>

            {/* [!! 修改 !!] 确认弹窗 使用 i18n */}
            <ConfirmationModal
              isOpen={modalState !== null}
              title={
                modalState?.type === 'cancel'
                  ? t('LearningView.modals.cancelTitle')
                  : t('LearningView.modals.resetTitle')
              }
              description={
                modalState?.type === 'cancel'
                  ? t('LearningView.modals.cancelDesc', {
                      bookName: modalBookName,
                    })
                  : t('LearningView.modals.resetDesc', {
                      bookName: modalBookName,
                    })
              }
              confirmText={
                modalState?.type === 'cancel'
                  ? t('LearningView.modals.cancelConfirmBtn')
                  : t('LearningView.modals.resetConfirmBtn')
              }
              isDestructive={modalState?.type === 'cancel'}
              onConfirm={
                modalState?.type === 'cancel'
                  ? confirmCancelLearning
                  : confirmResetProgress
              }
              onCancel={() => setModalState(null)}
            />

            {/* 计划单词模态框 (保持不变, 假设子组件自己处理i18n) */}
            <PlanWordsModal
              isOpen={planWordsModalState !== null}
              planId={planWordsModalState?.planId}
              bookName={planWordsModalState?.bookName}
              onClose={() => setPlanWordsModalState(null)}
            />

            {/* 错题集模态框 (保持不变, 假设子组件自己处理i18n) */}
            <MistakeModal
              isOpen={mistakeModalState !== null}
              planId={mistakeModalState?.planId}
              bookName={mistakeModalState?.bookName}
              onClose={() => setMistakeModalState(null)}
              onStartReview={handleStartMistakeReview}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
