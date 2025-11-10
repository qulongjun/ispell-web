/*
 * @Date: 2025-10-28 22:05:53
 * @LastEditTime: 2025-11-10 09:31:35
 * @Description: 拼写学习上下文，管理单词学习会话状态、用户设置和学习进度，包含演示模式支持
 */
'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
  useEffect,
  useRef,
} from 'react';
import { useAppContext, type LearningAction } from '@/contexts/app.context';
import { fetchLearningWords, updateWordProgress } from '@/services/wordService';
import { advancePlan } from '@/services/planService';
import { Word, Stats } from '@/types/word.types';
import toast from 'react-hot-toast';
import { PlanDetails } from '@/types/book.types';

/**
 * 格式化时间为 MM:SS 格式
 * @param seconds 秒数
 * @returns 格式化后的时间字符串
 */
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

/**
 * 拼写上下文类型定义
 */
export interface SpellingContextType {
  words: Word[];
  currentIndex: number;
  currentWord: Word | undefined;
  stats: Stats;
  isSessionComplete: boolean;
  isDemoMode: boolean; // 演示模式状态
  speechSupported: boolean; // 浏览器是否支持语音

  // 会话操作
  handleNext: () => void;
  handlePrev: () => void;
  startTimer: () => void;
  incrementInputCount: () => void;
  incrementCorrectCount: () => void;
  updateWordProgressInContext: (quality: number) => void;
  handleWordFailure: () => void;
  handleAdvanceToNextChapter: () => Promise<void>;
  handleReturnToHome: () => Promise<void>;
  setHasMadeMistake: (value: boolean) => void;
}

// 创建上下文
const SpellingContext = createContext<SpellingContextType | undefined>(
  undefined
);

/**
 * 拼写上下文提供者属性定义
 */
interface SpellingProviderProps {
  children: ReactNode;
}

/**
 * 拼写上下文提供者组件
 * 管理拼写学习的所有状态和业务逻辑
 */
export const SpellingProvider = ({ children }: SpellingProviderProps) => {
  // 从应用上下文获取所需状态和方法
  const {
    currentBookId,
    learningTrigger,
    learningList,
    endLearningSession,
    isLearningSessionActive,
    refreshAllData,
    mistakeReviewTrigger,
  } = useAppContext();

  // 核心状态管理
  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // 会话状态
  const [isSessionComplete, setIsSessionComplete] = useState<boolean>(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false); // 演示模式状态

  // 统计状态
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeElapsed, setTimeElapsed] = useState<number>(0);
  const [failCount, setFailCount] = useState<number>(0);
  const [successCount, setSuccessCount] = useState<number>(0);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const [failedWordsInSession, setFailedWordsInSession] = useState<Word[]>([]);
  const [hasMadeMistake, _setHasMadeMistake] = useState<boolean>(false);
  const hasMadeMistakeRef = useRef<boolean>(false);

  /**
   * 更新错误状态（同步更新状态和引用）
   */
  const setHasMadeMistake = useCallback((value: boolean) => {
    _setHasMadeMistake(value);
    hasMadeMistakeRef.current = value;
  }, []);

  /**
   * 开始计时
   */
  const startTimer = useCallback(() => {
    setStartTime((prevStartTime) => {
      if (prevStartTime === null) {
        return Date.now();
      }
      return prevStartTime;
    });
  }, []);

  /**
   * 重置学习会话
   * @param wordsToLoad 新的单词列表
   */
  const resetSession = useCallback(
    (wordsToLoad: Word[]) => {
      setWords(wordsToLoad);
      setCurrentIndex(0);
      setStartTime(null);
      setTimeElapsed(0);
      setFailCount(0);
      setSuccessCount(0);
      startTimer();
      setFailedWordsInSession([]);
      setHasMadeMistake(false);
      setIsSessionComplete(false);
    },
    [startTimer, setHasMadeMistake]
  );

  /**
   * 为学习会话加载单词
   * @param listCode 单词列表标识
   * @param action 学习动作
   */
  const loadWordsForSession = useCallback(
    async (listCode: string, action: LearningAction) => {
      if (!listCode) return;

      // 查找当前学习计划
      const currentPlan = learningList.find((p) => p.listCode === listCode);
      if (!currentPlan) {
        console.warn(
          '[Spelling Context] loadWordsForSession: 未找到计划。 learningList 可能尚未刷新。'
        );
        toast.error('未找到当前书籍的学习计划。');
        endLearningSession();
        return;
      }

      // 计算需要加载的新单词和复习单词数量
      let dueNewCount = 0;
      let dueReviewCount = 0;
      const totalDueNew = currentPlan.progress.dueNewCount || 0;
      const totalDueReview = currentPlan.progress.dueReviewCount || 0;
      const learnedToday = currentPlan.progress.learnedTodayCount || 0;

      if (action === 'activate') {
        dueNewCount = Math.max(0, totalDueNew - learnedToday);
        dueReviewCount = totalDueReview;
      } else if (
        action === 'reset' ||
        (typeof action === 'object' && action !== null)
      ) {
        const plan =
          action === 'reset' ? currentPlan.plan : (action as PlanDetails);
        const totalWords = currentPlan.book.totalWords;
        const remainingNewWords = 0 || totalWords;

        if (plan.type === 'customWords' && plan.value > 0) {
          dueNewCount = Math.min(plan.value, remainingNewWords);
        } else if (
          (plan.type === 'preset' || plan.type === 'customDays') &&
          plan.value > 0
        ) {
          const dailyQuota = Math.ceil(totalWords / plan.value);
          dueNewCount = Math.min(dailyQuota, remainingNewWords);
        } else {
          dueNewCount = Math.min(20, remainingNewWords);
        }
        dueReviewCount = action === 'reset' ? 0 : totalDueReview;
      }

      // 无复习策略时不加载复习单词
      if (currentPlan.plan.reviewStrategy === 'NONE') {
        dueReviewCount = 0;
      }

      console.log(
        `[Spelling Context] 计算配额: new=${dueNewCount}, review=${dueReviewCount}`
      );

      // 无单词可学时标记会话完成
      if (dueNewCount === 0 && dueReviewCount === 0) {
        setIsSessionComplete(true);
        return;
      }

      // 加载单词数据
      try {
        const data = await fetchLearningWords(
          listCode,
          dueNewCount,
          dueReviewCount
        );
        if (data.length === 0) {
          toast('今天没有学习或复习任务！', { icon: '🎉' });
          setIsSessionComplete(true);
          return;
        }
        resetSession(data);
        console.log(
          `[Spelling Context] Loaded ${data.length} words for session.`
        );
      } catch (error: unknown) {
        console.error('加载学习单词失败:', error);
        endLearningSession();
        toast.error((error as Error).message || '加载今日单词列表失败。');
      }
    },
    [learningList, endLearningSession, resetSession]
  );

  /**
   * 监听学习触发器，初始化学习会话或演示模式
   * 当mistakeReviewTrigger的planId为0时进入演示模式
   */
  useEffect(() => {
    if (!isLearningSessionActive) {
      // 会话结束时，重置演示模式
      setIsDemoMode(false);
      return;
    }

    if (mistakeReviewTrigger && mistakeReviewTrigger.words.length > 0) {
      console.log(
        `[Spelling Context] 监听到 mistakeReviewTrigger，加载 ${mistakeReviewTrigger.words.length} 个错题...`
      );

      // 检查 planId 是否为 0 (演示模式的约定)
      if (mistakeReviewTrigger.planId === 0) {
        console.log('[Spelling Context] 进入演示模式 (DEMO MODE).');
        setIsDemoMode(true);
      } else {
        // 真实的错题集复习
        setIsDemoMode(false);
      }

      resetSession(mistakeReviewTrigger.words);
    } else if (learningTrigger && learningTrigger.listCode) {
      const { listCode, action } = learningTrigger;
      console.log(
        '[Spelling Context] 监听到 learningTrigger:',
        listCode,
        action
      );

      // 常规学习重置演示模式
      setIsDemoMode(false);

      if (action !== null) {
        loadWordsForSession(listCode, action);
      }
    }
  }, [
    isLearningSessionActive,
    mistakeReviewTrigger,
    learningTrigger,
    loadWordsForSession,
    resetSession,
  ]);

  // 检测浏览器是否支持语音合成
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSpeechSupported(!!window.speechSynthesis);
    }
  }, []);

  // 学习会话计时器
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (startTime && isLearningSessionActive) {
      timer = setInterval(() => {
        setTimeElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [startTime, isLearningSessionActive]);

  /**
   * 处理单词拼写失败
   * 将当前单词加入本轮错题列表
   */
  const handleWordFailure = useCallback(() => {
    const word = words[currentIndex];
    if (!word) return;
    setFailedWordsInSession((prevFailed) => {
      if (prevFailed.find((w) => w.progressId === word.progressId)) {
        return prevFailed;
      }
      console.log(`[Spelling Context] 将 "${word.text}" 加入本轮错题`);
      return [...prevFailed, word];
    });
  }, [words, currentIndex]);

  /**
   * 导航到下一个单词
   */
  const handleNext = useCallback(() => {
    if (hasMadeMistakeRef.current) {
      handleWordFailure();
    }
    setHasMadeMistake(false);

    if (currentIndex < words.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      if (failedWordsInSession.length > 0) {
        toast('开始复习本轮错题...', { icon: '🔁' });
        setWords((prevWords) => [...prevWords, ...failedWordsInSession]);
        setFailedWordsInSession([]);
        setCurrentIndex((prev) => prev + 1);
      } else {
        toast.success('任务已完成！');
        setIsSessionComplete(true);
      }
    }
  }, [
    words,
    currentIndex,
    failedWordsInSession,
    handleWordFailure,
    setHasMadeMistake,
  ]);

  /**
   * 导航到上一个单词
   */
  const handlePrev = useCallback(() => {
    if (hasMadeMistakeRef.current) {
      handleWordFailure();
    }
    setHasMadeMistake(false);
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, [handleWordFailure, setHasMadeMistake]);

  /**
   * 增加错误尝试次数
   */
  const incrementInputCount = useCallback(() => {
    setFailCount((prev) => prev + 1);
  }, []);

  /**
   * 增加正确拼写次数
   */
  const incrementCorrectCount = useCallback(() => {
    setSuccessCount((prev) => prev + 1);
  }, []);

  /**
   * 更新单词学习进度
   * 演示模式下会拦截此操作，不发送到后端
   * @param quality 学习质量
   */
  const updateWordProgressInContext = useCallback(
    async (quality: number) => {
      // 演示模式拦截
      if (isDemoMode) {
        console.log('[Spelling Context] 演示模式：跳过进度同步。');
        return;
      }

      const word = words[currentIndex];
      if (!word || !word.progressId) {
        console.warn('无法更新进度：缺少 word、progressId，或处于演示模式。');
        return;
      }

      const progressId = word.progressId as number;
      try {
        console.log(
          `[Spelling Context] Updating progress for ID ${progressId}, quality ${quality}`
        );
        await updateWordProgress(progressId, quality);
      } catch (error: unknown) {
        console.error('后台同步单词进度失败:', error);
        toast.error(`同步进度失败: ${(error as Error).message}`, {
          duration: 2000,
        });
      }
    },
    [words, currentIndex, isDemoMode]
  );

  /**
   * 推进到下一章
   * 演示模式下会拦截此操作
   */
  const handleAdvanceToNextChapter = useCallback(async () => {
    // 演示模式拦截
    if (isDemoMode) {
      console.log('[Spelling Context] 演示模式：无法开启新章节。');
      toast.error('演示模式无法开启新章节');
      return;
    }

    const currentPlan = learningList.find((p) => p.listCode === currentBookId);
    if (!currentPlan) {
      toast.error('未找到当前计划。');
      return;
    }

    try {
      console.log(`[Spelling Context] Advancing plan ${currentPlan.planId}`);
      await advancePlan(currentPlan.planId);
      toast.success('已开启新章节！');
      if (refreshAllData) {
        await refreshAllData();
      }
    } catch (error: unknown) {
      console.error('推进章节失败:', error);
      toast.error((error as Error).message || '开启新章节失败。');
    }
  }, [currentBookId, refreshAllData, learningList, isDemoMode]);

  /**
   * 返回首页并结束当前学习会话
   * 退出时重置演示模式
   */
  const handleReturnToHome = useCallback(async () => {
    endLearningSession();
    setWords([]);
    setIsSessionComplete(false);
    setIsDemoMode(false); // 显式重置演示模式
  }, [endLearningSession]);

  /**
   * 计算学习统计数据（记忆化）
   */
  const stats = useMemo<Stats>(() => {
    const totalAttempts = failCount + successCount;
    const accuracyNum =
      totalAttempts === 0 ? 0 : (successCount / totalAttempts) * 100;
    const accuracy = Math.round(accuracyNum * 10) / 10;
    const currentPlan = learningList.find((p) => p.listCode === currentBookId);
    const masteredCount = currentPlan?.progress.masteredCount || 0;
    return {
      time: formatTime(timeElapsed),
      inputCount: totalAttempts,
      correctCount: successCount,
      masteredCount: masteredCount,
      accuracy,
    };
  }, [timeElapsed, failCount, successCount, currentBookId, learningList]);

  /**
   * 当前单词（记忆化）
   */
  const currentWord = useMemo<Word | undefined>(() => {
    return words[currentIndex];
  }, [words, currentIndex]);

  // 上下文值
  const contextValue: SpellingContextType = {
    words,
    currentIndex,
    currentWord,
    stats,
    isSessionComplete,
    isDemoMode,
    speechSupported,

    // 会话操作
    handleNext,
    handlePrev,
    startTimer,
    incrementInputCount,
    incrementCorrectCount,
    updateWordProgressInContext,
    handleWordFailure,
    handleAdvanceToNextChapter,
    handleReturnToHome,
    setHasMadeMistake,
  };

  return (
    <SpellingContext.Provider value={contextValue}>
      {children}
    </SpellingContext.Provider>
  );
};

/**
 * 自定义Hook：获取拼写上下文
 */
export const useSpelling = (): SpellingContextType => {
  const context = useContext(SpellingContext);
  if (context === undefined) {
    throw new Error('useSpelling 必须在 SpellingProvider 内部使用');
  }
  return context;
};
