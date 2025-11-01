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
import { DisplayMode, SpeechConfig, Stats, Word } from '@/types/word.types';
import toast from 'react-hot-toast';
import { PlanDetails } from '@/types/book.types';

// 时间格式化工具函数 (不变)
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export interface SpellingContextType {
  words: Word[];
  currentIndex: number;
  currentWord: Word | undefined;
  stats: Stats;
  displayMode: DisplayMode;
  speechConfig: SpeechConfig;
  speechSupported: boolean;
  isCustomSpeech: boolean;
  showSentences: boolean;
  isSessionComplete: boolean;
  handleNext: () => void;
  handlePrev: () => void;
  startTimer: () => void;
  incrementInputCount: () => void;
  incrementCorrectCount: () => void;
  setSpeechConfig: React.Dispatch<React.SetStateAction<SpeechConfig>>;
  setDisplayMode: React.Dispatch<React.SetStateAction<DisplayMode>>;
  setIsCustomSpeech: React.Dispatch<React.SetStateAction<boolean>>;
  setShowSentences: React.Dispatch<React.SetStateAction<boolean>>;
  updateWordProgressInContext: (quality: number) => void;
  handleWordFailure: () => void;
  handleAdvanceToNextChapter: () => Promise<void>;
  handleReturnToHome: () => Promise<void>;
  setHasMadeMistake: (value: boolean) => void;
}

const SpellingContext = createContext<SpellingContextType | undefined>(
  undefined
);

interface SpellingProviderProps {
  children: ReactNode;
}

export const SpellingProvider = ({ children }: SpellingProviderProps) => {
  const {
    currentBookId,
    learningTrigger,
    learningList, // [!!!] 直接使用最新的 learningList
    endLearningSession,
    isLearningSessionActive,
    refreshAllData,
  } = useAppContext();

  // 核心状态管理 (不变)
  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [showSentences, setShowSentences] = useState<boolean>(true);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('full');
  const [speechConfig, setSpeechConfig] = useState<SpeechConfig>({
    lang: 'en-GB',
    rate: 0.8,
    volume: 1,
    pitch: 1,
    accent: 'en-GB',
    gender: 'auto',
  });
  const [isCustomSpeech, setIsCustomSpeech] = useState<boolean>(false);
  const [isSessionComplete, setIsSessionComplete] = useState<boolean>(false);

  // 统计相关内部状态 (不变)
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeElapsed, setTimeElapsed] = useState<number>(0);
  const [failCount, setFailCount] = useState<number>(0);
  const [successCount, setSuccessCount] = useState<number>(0);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const [failedWordsInSession, setFailedWordsInSession] = useState<Word[]>([]);

  // 跟踪当前单词是否犯过错 (使用 State 和 Ref) (不变)
  const [hasMadeMistake, _setHasMadeMistake] = useState<boolean>(false);
  const hasMadeMistakeRef = useRef<boolean>(false);

  const setHasMadeMistake = useCallback((value: boolean) => {
    _setHasMadeMistake(value);
    hasMadeMistakeRef.current = value;
  }, []);

  // startTimer (不变)
  const startTimer = useCallback(() => {
    setStartTime((prevStartTime) => {
      if (prevStartTime === null) {
        return Date.now();
      }
      return prevStartTime;
    });
  }, []);

  // [!!! 移除 !!!] 不再需要 learningListRef
  // const learningListRef = useRef<LearningPlan[]>(learningList);
  // useEffect(() => {
  //   learningListRef.current = learningList;
  // }, [learningList]);

  // 单词加载和重置逻辑 [!!! 修改 !!!]
  const loadWordsForSession = useCallback(
    async (listCode: string, action: LearningAction) => {
      if (!listCode) return;

      setIsSessionComplete(false);

      const currentLearningList = learningList; // [!!!] 直接使用最新的 learningList
      const currentPlan = currentLearningList.find(
        (p) => p.listCode === listCode
      );

      if (!currentPlan) {
        // [!!!] 增加日志，帮助调试
        console.warn(
          '[Spelling Context] loadWordsForSession: 未找到计划。 learningList 可能尚未刷新。'
        );
        toast.error('未找到当前书籍的学习计划。');
        endLearningSession();
        return;
      }

      // (配额计算... 不变)
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
        const progress = currentPlan.progress;
        const remainingNewWords = progress.totalNewCount || totalWords;

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

      if (currentPlan.plan.reviewStrategy === 'NONE') {
        dueReviewCount = 0;
      }
      // (配额计算结束)

      // [!!!] 增加日志，帮助调试
      console.log(
        `[Spelling Context] 计算配额: new=${dueNewCount}, review=${dueReviewCount}`
      );

      if (dueNewCount === 0 && dueReviewCount === 0) {
        toast('今天没有学习或复习任务！', { icon: '🎉' });
        setIsSessionComplete(true);
        return;
      }

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

        setWords(data);
        setCurrentIndex(0);
        setStartTime(null);
        setTimeElapsed(0);
        setFailCount(0);
        setSuccessCount(0);
        startTimer();
        setFailedWordsInSession([]);
        setHasMadeMistake(false); // 重置犯错标记

        console.log(
          `[Spelling Context] Loaded ${data.length} words for session.`
        );
      } catch (error: any) {
        console.error('加载学习单词失败:', error);
        endLearningSession();
        toast.error(error.message || '加载今日单词列表失败。');
      }
    },
    [endLearningSession, startTimer, setHasMadeMistake, learningList] // [!!!] 依赖最新的 learningList
  );

  // [!!! 最终修复 !!!]
  // 这个 useEffect 必须依赖 loadWordsForSession
  // 以确保它总是调用 "最新" 版本的函数
  useEffect(() => {
    if (
      isLearningSessionActive &&
      learningTrigger &&
      learningTrigger.listCode
    ) {
      const { listCode, action } = learningTrigger;
      console.log(
        '[Spelling Context] 监听到 learningTrigger:',
        listCode,
        action
      );
      if (action !== null) {
        loadWordsForSession(listCode, action);
      }
    }
  }, [
    learningTrigger,
    isLearningSessionActive,
    loadWordsForSession, // [!!!] 这是关键的修复
  ]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSpeechSupported(!!window.speechSynthesis);
    }
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (startTime && isLearningSessionActive) {
      timer = setInterval(() => {
        setTimeElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [startTime, isLearningSessionActive]);

  // (handleWordFailure, handleNext, handlePrev... 不变)
  const handleWordFailure = useCallback(() => {
    const word = words[currentIndex];
    if (!word) return;
    setFailedWordsInSession((prevFailed) => {
      // @ts-ignore
      if (prevFailed.find((w) => w.progressId === word.progressId)) {
        return prevFailed;
      }
      console.log(`[Spelling Context] 将 "${word.text}" 加入本轮错题`);
      return [...prevFailed, word];
    });
  }, [words, currentIndex]);

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
        toast.success('今日任务已完成！');
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

  const handlePrev = useCallback(() => {
    if (hasMadeMistakeRef.current) {
      handleWordFailure();
    }
    setHasMadeMistake(false);
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, [handleWordFailure, setHasMadeMistake]);

  const incrementInputCount = useCallback(() => {
    setFailCount((prev) => prev + 1);
  }, []);

  const incrementCorrectCount = useCallback(() => {
    setSuccessCount((prev) => prev + 1);
  }, []);

  const updateWordProgressInContext = useCallback(
    async (quality: number) => {
      const word = words[currentIndex];
      // @ts-ignore
      if (!word || !word.progressId) {
        console.error('无法更新进度：缺少 word 或 progressId');
        return;
      }
      // @ts-ignore
      const progressId = word.progressId as number;
      try {
        console.log(
          `[Spelling Context] Updating progress for ID ${progressId}, quality ${quality}`
        );
        await updateWordProgress(progressId, quality);
      } catch (error: any) {
        console.error('后台同步单词进度失败:', error);
        toast.error(`同步进度失败: ${error.message}`, { duration: 2000 });
      }
    },
    [words, currentIndex]
  );

  // “开启下一章”按钮的逻辑 [!!! 修改 !!!]
  const handleAdvanceToNextChapter = useCallback(async () => {
    const currentPlan = learningList.find(
      // [!!!] 直接使用最新的 learningList
      (p) => p.listCode === currentBookId
    );
    if (!currentPlan) {
      toast.error('未找到当前计划。');
      return;
    }
    try {
      console.log(`[Spelling Context] Advancing plan ${currentPlan.planId}`);
      await advancePlan(currentPlan.planId);
      toast.success('已开启新章节！');

      if (refreshAllData) {
        await refreshAllData(); // 1. 刷新 AppContext 的数据
      }

      // [!!!] 注意：这里的 AppContext 刷新后，会触发 SpellingProvider 重新渲染
      // [!!!] 从而更新 loadWordsForSession
      // [!!!] 然后我们才需要调用 loadWordsForSession
      // [!!!] 但是我们不能在这里 await refreshAllData() 之后再调用 loadWords...
      // [!!!] 因为 loadWords... 依赖的是 useEffect[learningTrigger]
      // [!!!] 我们需要一种方法在 refreshAllData 之后再触发 learningTrigger

      // [!!!] 解决方案：在 LearningStart.tsx 中，startLearningSession() 是在 refreshAllData() 之后调用的。
      // [!!!] 这意味着我们的 useEffect [learningTrigger] 已经是安全的了。
      // [!!!] 所以这里的逻辑 *不需要* 调用 loadWordsForSession，
      // [!!!] 只需要刷新数据，然后等待 LearningStart.tsx 中的 startLearningSession() 触发

      // [!!!] 移除这里的 loadWordsForSession 调用，因为它会导致竞态
      // if (learningTrigger && learningTrigger.listCode) {
      //   await loadWordsForSession(learningTrigger.listCode, 'activate');
      // } else {
      //   endLearningSession();
      //   setWords([]);
      //   setIsSessionComplete(false);
      // }
    } catch (error: any) {
      console.error('推进章节失败:', error);
      toast.error(error.message || '开启新章节失败。');
    }
  }, [
    currentBookId,
    refreshAllData,
    learningList, // [!!!] 依赖
    // [!!!] 移除了 loadWordsForSession, learningTrigger, endLearningSession
  ]);

  // “返回主页”按钮的逻辑 (不变)
  const handleReturnToHome = useCallback(async () => {
    endLearningSession(); // AppContext 会自动刷新数据
    setWords([]);
    setIsSessionComplete(false);
  }, [endLearningSession]);

  // 派生统计数据 (不变)
  const stats = useMemo<Stats>(() => {
    const totalAttempts = failCount + successCount;
    const accuracyNum =
      totalAttempts === 0 ? 0 : (successCount / totalAttempts) * 100;
    const accuracy = Math.round(accuracyNum * 10) / 10;
    const currentPlan = learningList.find(
      // [!!!] 直接使用最新的 learningList
      (p) => p.listCode === currentBookId
    );
    const masteredCount = currentPlan?.progress.masteredCount || 0;

    return {
      time: formatTime(timeElapsed),
      inputCount: totalAttempts,
      correctCount: successCount,
      masteredCount: masteredCount,
      accuracy,
    };
  }, [timeElapsed, failCount, successCount, currentBookId, learningList]); // [!!!] 依赖

  const currentWord = useMemo<Word | undefined>(() => {
    return words[currentIndex];
  }, [words, currentIndex]);

  const contextValue: SpellingContextType = {
    words,
    currentIndex,
    currentWord,
    stats,
    displayMode,
    // @ts-ignore
    isMaskActive: false,
    speechConfig,
    speechSupported,
    isCustomSpeech,
    showSentences,
    isSessionComplete,
    handleNext,
    handlePrev,
    startTimer,
    incrementInputCount,
    incrementCorrectCount,
    // @ts-ignore
    setIsMaskActive: () => {},
    setSpeechConfig,
    setDisplayMode,
    setIsCustomSpeech,
    setShowSentences,
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

// 自定义Hook (不变)
export const useSpelling = (): SpellingContextType => {
  const context = useContext(SpellingContext);
  if (context === undefined) {
    throw new Error('useSpelling 必须在 SpellingProvider 内部使用');
  }
  return context;
};
