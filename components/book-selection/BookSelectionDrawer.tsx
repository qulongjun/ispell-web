/*
 * @Date: 2025-11-04 20:17:42
 * @LastEditTime: 2025-11-08 22:31:22
 * @Description: 书籍选择抽屉组件
 */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star } from 'lucide-react';
import { useAppContext } from '@/contexts/app.context';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';

// 类型定义
import type { PlanDetails, LearningPlan } from '@/types/book.types';

// 服务接口
import {
  savePlan,
  deletePlan,
  resetPlan,
  activatePlan,
  getMistakeReviewWords,
} from '@/services/planService';

// 子组件
import BrowserView from './BrowserView';
import LearningView from './LearningView';
import ConfirmationModal from '../common/ConfirmationModal';
import PlanWordsModal from './PlanWordsModal';
import MistakeModal from './MistakeModal';

// 确认弹窗状态类型：包含操作类型、计划ID和书籍名称
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

/**
 * 书籍选择抽屉组件
 * 提供学习计划的管理入口，支持浏览可选书籍、查看进行中计划、调整学习设置等功能
 * 状态同步至全局上下文，操作结果实时反馈
 */
const BookSelectionDrawer: React.FC = () => {
  // 国际化翻译
  const t = useTranslations('BookSelection');
  const tCommon = useTranslations('common');

  // 全局状态与方法
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

  // 内部状态管理
  const [mainView, setMainView] = useState<'browser' | 'learning'>('browser'); // 主视图切换：浏览/学习中
  const [previewBook, setPreviewBook] = useState<LearningPlan['book'] | null>(
    null
  ); // 预览的书籍信息
  const [activeLangCode, setActiveLangCode] = useState(''); // 当前激活的语言代码
  const [activeSeriesId, setActiveSeriesId] = useState(''); // 当前激活的系列ID
  const [openMenu, setOpenMenu] = useState<number | null>(null); // 打开的操作菜单ID
  const [modalState, setModalState] = useState<ModalState | null>(null); // 确认弹窗状态
  const [planWordsModalState, setPlanWordsModalState] =
    useState<PlanWordsModalState | null>(null); // 计划单词模态框状态
  const [mistakeModalState, setMistakeModalState] =
    useState<MistakeModalState | null>(null); // 错题集模态框状态

  // 编程式导航标记与菜单引用
  const isProgrammaticNav = useRef(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // 复习策略名称映射（国际化）
  const reviewStrategyNames = {
    NONE: t('PlanSetupView.reviewStrategies.NONE.name'),
    EBBINGHAUS: t('PlanSetupView.reviewStrategies.EBBINGHAUS.name'),
    SM2: t('PlanSetupView.reviewStrategies.SM2.name'),
    LEITNER: t('PlanSetupView.reviewStrategies.LEITNER.name'),
  };

  /**
   * 关闭抽屉并重置状态
   * 延迟重置避免动画冲突
   */
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

  /**
   * 处理书籍卡片点击
   * 切换书籍预览状态（已预览则关闭，未预览则打开）
   */
  const handleBookCardClick = (book: LearningPlan['book']) => {
    setPreviewBook((prev) => (prev?.listCode === book.listCode ? null : book));
  };

  /**
   * 开始学习：创建新学习计划
   * 调用接口保存计划，更新全局状态并反馈结果
   */
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

  /**
   * 更新学习计划
   * 保存计划修改，刷新数据并更新当前学习状态
   */
  const handleUpdatePlan = async (
    planId: number,
    book: LearningPlan['book'],
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

  /**
   * 激活学习计划
   * 切换当前学习的计划，更新全局状态并处理异常
   */
  const handleActivateLearning = async (planId: number, listCode: string) => {
    if (!accessToken || currentBookId === listCode) return;
    const oldBookId = currentBookId;
    const loadingToastId = toast.loading(t('toast.activatingPlan'));

    try {
      await activatePlan(planId);
      setCurrentBookId(listCode);
      loadBook(listCode, 'activate');
      await refreshAllData();
      toast.dismiss(loadingToastId);
      toast.success(t('toast.activatePlanSuccess'));
    } catch (err) {
      console.error('激活计划失败:', err);
      toast.dismiss(loadingToastId);
      toast.error(t('toast.activatePlanError'));
      if (oldBookId) setCurrentBookId(oldBookId);
    }
  };

  /**
   * 调整计划：打开书籍预览
   */
  const handleAdjustPlanClick = (book: LearningPlan['book']) => {
    setPreviewBook((prev) => (prev?.listCode === book.listCode ? null : book));
    setOpenMenu(null);
  };

  /**
   * 打开重置进度确认弹窗
   */
  const openResetModal = (planId: number, bookName: string) => {
    setModalState({ type: 'reset', planId, bookName });
    setOpenMenu(null);
  };

  /**
   * 打开取消计划确认弹窗
   */
  const openCancelModal = (planId: number, bookName: string) => {
    setModalState({ type: 'cancel', planId, bookName });
    setOpenMenu(null);
  };

  /**
   * 打开计划单词列表模态框
   */
  const openPlanWordsModal = (planId: number, bookName: string) => {
    setPlanWordsModalState({ planId, bookName });
    setOpenMenu(null);
  };

  /**
   * 打开错题集模态框
   */
  const openMistakeModal = (planId: number, bookName: string) => {
    setMistakeModalState({ planId, bookName });
    setOpenMenu(null);
  };

  /**
   * 开始错题复习
   * 获取错题列表，启动复习流程并反馈结果
   */
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

  /**
   * 确认重置学习进度
   * 调用接口重置计划，刷新数据并更新当前视图
   */
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

  /**
   * 确认取消学习计划
   * 调用接口删除计划，更新全局状态并处理当前学习计划变更
   */
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

  // 派生数据：当前语言包、系列列表、书籍列表
  const currentLanguagePack = hierarchy.find(
    (lang) => lang.code === activeLangCode
  );
  const currentSeriesList = currentLanguagePack?.categories || [];
  const currentSeriesData = currentSeriesList.find(
    (series) => series.id.toString() === activeSeriesId
  );
  const currentBookList = currentSeriesData?.wordLists || [];
  const modalBookName = modalState ? modalState.bookName : '';

  /**
   * 语言切换时重置系列选择
   * 确保语言切换后默认选中第一个系列
   */
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

  /**
   * 系列切换时重置书籍预览
   */
  useEffect(() => {
    if (isProgrammaticNav.current) {
      isProgrammaticNav.current = false;
      return;
    }
    setPreviewBook(null);
  }, [activeSeriesId]);

  /**
   * 根据登录状态和学习列表自动切换视图
   * 登录且有学习计划时默认显示学习视图，否则显示浏览视图
   */
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

  /**
   * 点击外部关闭操作菜单
   * 监听全局点击事件，点击菜单外部时关闭菜单
   */
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

  /**
   * 初始化视图状态
   * 组件挂载时设置默认语言和系列，根据学习列表状态切换初始视图
   */
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
          {/* 背景遮罩：半透明黑色背景，点击关闭抽屉 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleCloseDrawer}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            aria-hidden="true"
          />

          {/* 抽屉主体：带动画的侧边栏，包含导航和内容区 */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`fixed top-0 right-0 h-full bg-white dark:bg-gray-800 shadow-2xl z-50 flex flex-col w-full lg:w-2/3 xxl:w-1/2`}
            role="dialog"
            aria-modal="true"
          >
            {/* 抽屉头部：标题和关闭按钮 */}
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

            {/* 主体内容区：左侧导航 + 右侧内容 */}
            <div className="flex flex-1 overflow-hidden">
              {/* 左侧垂直导航：切换视图和语言 */}
              <nav className="w-20 sm:w-24 shrink-0 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
                <ul className="flex flex-col items-center p-2 space-y-2">
                  {isLoggedIn && (
                    <>
                      {/* 学习视图导航项 */}
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

                  {/* 语言选择导航项 */}
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

              {/* 右侧内容区：根据视图显示不同内容 */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* 加载状态 */}
                {isDataLoading && (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="w-8 h-8 animate-spin text-gray-500 border-4 border-t-transparent border rounded-full" />
                  </div>
                )}

                {/* 数据加载错误状态 */}
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

                {/* 主内容区域：根据视图切换显示 */}
                {!isDataLoading && !dataError && (
                  <AnimatePresence mode="wait">
                    {mainView === 'browser' ? (
                      <BrowserView
                        currentSeriesList={currentSeriesList}
                        currentSeriesData={currentSeriesData}
                        currentBookList={currentBookList}
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

            {/* 确认操作弹窗：用于重置进度和取消计划 */}
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

            {/* 计划单词列表模态框 */}
            <PlanWordsModal
              isOpen={planWordsModalState !== null}
              planId={planWordsModalState?.planId}
              bookName={planWordsModalState?.bookName}
              onClose={() => setPlanWordsModalState(null)}
            />

            {/* 错题集模态框 */}
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
};

export default BookSelectionDrawer;
