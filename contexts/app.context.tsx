/*
 * @Date: 2025-10-28 22:05:53
 * @LastEditTime: 2025-11-09 19:14:32
 * @Description: 应用全局状态管理上下文，集中管理用户认证、弹窗状态、主题设置、学习进度和核心数据，提供跨组件状态访问和修改能力
 */
'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
  useCallback,
} from 'react';
import toast from 'react-hot-toast';

// 类型导入
import type { PlanDetails, Language, LearningPlan } from '@/types/book.types';
import { Tokens, User } from '@/types/auth.types';
import { Word } from '@/types/word.types';

// 服务导入
import { fetchBookHierarchy } from '@/services/bookService';
import { fetchLearningList } from '@/services/planService';
import { apiFetchProfile, EXPECTED_OAUTH_ORIGIN } from '@/services/authService';

/**
 * 应用主题类型
 * - light: 浅色模式
 * - dark: 深色模式
 * - system: 跟随系统设置
 */
export type Theme = 'light' | 'dark' | 'system';

/**
 * 学习动作类型
 * 用于触发不同的学习操作（如激活计划、重置进度等）
 */
export type LearningAction = PlanDetails | 'activate' | 'reset' | null;

/**
 * 学习触发器类型
 * 用于启动或切换学习内容
 */
export interface LearningTrigger {
  listCode: string | null; // 学习列表标识
  action: LearningAction; // 要执行的学习动作
}

/**
 * 错题集复习触发器类型
 * 用于启动错题复习模式
 */
export type MistakeReviewTrigger = {
  planId: number; // 关联的学习计划ID
  words: Word[]; // 待复习的错题列表
} | null;

/**
 * 应用全局上下文接口
 * 定义了全局可访问的状态和操作方法
 */
interface IAppContext {
  // 认证相关
  user: User | null; // 当前用户信息
  isLoggedIn: boolean; // 是否已登录（派生状态）
  accessToken: string | null; // 访问令牌
  login: (userData: User, tokens: Tokens, rememberMe: boolean) => void; // 登录处理
  logout: () => void; // 登出处理
  refreshUser: () => Promise<void>; // 刷新用户信息
  isLoading: boolean; // 初始化加载状态

  // 弹窗状态管理
  isLoginModalOpen: boolean; // 登录弹窗是否打开
  openLoginModal: () => void; // 打开登录弹窗
  closeLoginModal: () => void; // 关闭登录弹窗
  isRegisterModalOpen: boolean; // 注册弹窗是否打开
  openRegisterModal: () => void; // 打开注册弹窗
  closeRegisterModal: () => void; // 关闭注册弹窗
  isBookDrawerOpen: boolean; // 书籍列表抽屉是否打开
  setIsBookDrawerOpen: (isOpen: boolean) => void; // 设置书籍列表抽屉状态
  isFeedbackModalOpen: boolean; // 反馈弹窗是否打开
  openFeedbackModal: () => void; // 打开反馈弹窗
  closeFeedbackModal: () => void; // 关闭反馈弹窗

  // 主题设置
  theme: Theme; // 当前主题
  setTheme: (theme: Theme) => void; // 设置主题

  // 学习状态管理
  currentBookId: string | null; // 当前选中的书籍ID
  setCurrentBookId: (bookId: string | null) => void; // 设置当前书籍ID
  learningTrigger: LearningTrigger | null; // 学习触发器
  loadBook: (listCode: string | null, action: LearningAction) => void; // 加载书籍内容
  isLearningSessionActive: boolean; // 学习会话是否激活
  startLearningSession: () => void; // 开始学习会话
  endLearningSession: () => void; // 结束学习会话
  mistakeReviewTrigger: MistakeReviewTrigger; // 错题复习触发器
  startMistakeReview: (planId: number, words: Word[]) => void; // 开始错题复习

  // 数据管理
  hierarchy: Language[]; // 书籍层级结构数据
  learningList: LearningPlan[]; // 学习计划列表
  dataError: string | null; // 数据加载错误信息
  refreshAllData: () => Promise<void>; // 刷新所有核心数据
  setLearningList: React.Dispatch<React.SetStateAction<LearningPlan[]>>; // 设置学习计划列表
  setDataError: React.Dispatch<React.SetStateAction<string | null>>; // 设置数据错误信息
}

/**
 * 创建应用上下文
 * 初始值为undefined，确保必须在Provider内部使用
 */
const AppContext = createContext<IAppContext | undefined>(undefined);

/**
 * 应用上下文提供者组件
 * 负责管理全局状态并向子组件提供上下文
 */
export const AppProvider = ({ children }: { children: ReactNode }) => {
  // --- 用户状态管理 ---
  const [user, setUser] = useState<User | null>(null); // 当前用户信息
  const [accessToken, setAccessToken] = useState<string | null>(null); // 访问令牌
  const [isBookDrawerOpen, setIsBookDrawerOpen] = useState<boolean>(false); // 书籍抽屉状态
  const isLoggedIn = !!user && !!accessToken; // 派生登录状态
  const [isLoading, setIsLoading] = useState(true); // 初始化加载状态

  // --- 学习状态管理 ---
  const [currentBookId, setCurrentBookId] = useState<string | null>(null); // 当前书籍ID
  const [learningTrigger, setLearningTrigger] =
    useState<LearningTrigger | null>(null); // 学习触发器
  const [mistakeReviewTrigger, setMistakeReviewTrigger] =
    useState<MistakeReviewTrigger>(null); // 错题复习触发器
  const [isLearningSessionActive, setIsLearningSessionActive] = useState(false); // 学习会话激活状态

  // --- 数据状态管理 ---
  const [hierarchy, setHierarchy] = useState<Language[]>([]); // 书籍层级数据
  const [learningList, setLearningList] = useState<LearningPlan[]>([]); // 学习计划列表
  const [dataError, setDataError] = useState<string | null>(null); // 数据错误信息

  // --- 弹窗状态管理 ---
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false); // 登录弹窗状态
  const openLoginModal = () => setIsLoginModalOpen(true); // 打开登录弹窗
  const closeLoginModal = () => setIsLoginModalOpen(false); // 关闭登录弹窗

  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false); // 注册弹窗状态
  const openRegisterModal = () => setIsRegisterModalOpen(true); // 打开注册弹窗
  const closeRegisterModal = () => setIsRegisterModalOpen(false); // 关闭注册弹窗

  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false); // 反馈弹窗状态
  const openFeedbackModal = () => setIsFeedbackModalOpen(true); // 打开反馈弹窗
  const closeFeedbackModal = () => setIsFeedbackModalOpen(false); // 关闭反馈弹窗

  // --- 主题状态管理 ---
  const [theme, setTheme] = useState<Theme>('system'); // 当前主题

  /**
   * 刷新用户信息
   * 从服务器获取最新用户数据并更新状态，处理令牌过期情况
   */
  const refreshUser = useCallback(async () => {
    console.log('[AppContext] 刷新用户信息...');
    try {
      // 获取令牌（优先内存，其次存储）
      let token = accessToken;
      if (!token) {
        token =
          sessionStorage.getItem('accessToken') ||
          localStorage.getItem('accessToken');
      }
      if (!token) {
        console.warn('[AppContext] 无令牌，跳过用户刷新');
        return;
      }

      // 调用API获取最新用户信息
      const updatedUser = await apiFetchProfile();
      setUser(updatedUser);

      // 同步更新存储的用户信息
      const storage = localStorage.getItem('accessToken')
        ? localStorage
        : sessionStorage;
      storage.setItem('user', JSON.stringify(updatedUser));
      console.log('[AppContext] 用户信息刷新成功');
    } catch (error) {
      console.error('[AppContext] 用户信息刷新失败:', error);
      toast.error('无法更新用户信息，请尝试重新登录');
      logout(); // 刷新失败（如令牌过期）则登出
    }
  }, [accessToken]);

  /**
   * 刷新所有核心数据
   * 包括书籍层级和学习计划列表，处理加载状态和错误
   */
  const refreshAllData = useCallback(async () => {
    setDataError(null);
    console.log(`[AppContext] 刷新数据，令牌状态: ${!!accessToken}`);

    try {
      // 并行请求书籍层级和学习计划
      const hierarchyPromise = fetchBookHierarchy();
      const learningPromise = accessToken
        ? fetchLearningList()
        : Promise.resolve([]);
      const [hierarchyData, learningData] = await Promise.all([
        hierarchyPromise,
        learningPromise,
      ]);

      // 更新状态
      setHierarchy(hierarchyData as Language[]);
      setLearningList(learningData as LearningPlan[]);

      // 同步当前书籍ID与激活的学习计划
      if (accessToken && learningData.length > 0) {
        const activePlan = (learningData as LearningPlan[]).find(
          (p) => p.isCurrent
        );
        const activeListCode = activePlan?.listCode || null;
        if (currentBookId !== activeListCode) {
          setCurrentBookId(activeListCode);
        }
      } else {
        setCurrentBookId(null);
      }
    } catch (err: unknown) {
      console.error('全局数据加载失败:', err);
      setDataError((err as Error).message || '无法加载数据，请稍后重试');
    }
  }, [accessToken, currentBookId]);

  /**
   * 加载书籍内容
   * @param listCode 书籍列表标识
   * @param action 要执行的学习动作
   */
  const loadBook = useCallback(
    (listCode: string | null, action: LearningAction) => {
      console.log('[AppContext] 加载书籍:', listCode, action);
      setCurrentBookId(listCode);
      setLearningTrigger({ listCode, action });
      setMistakeReviewTrigger(null); // 清除错题复习状态
    },
    []
  );

  /**
   * 开始学习会话
   * 激活当前选中书籍的学习状态，若无选中书籍则打开书籍抽屉
   */
  const startLearningSession = useCallback(() => {
    if (currentBookId) {
      console.log('[AppContext] 开始学习会话');
      setIsLearningSessionActive(true);
      setLearningTrigger({ listCode: currentBookId, action: 'activate' });
      setMistakeReviewTrigger(null); // 清除错题复习状态
    } else {
      console.warn('[AppContext] 无法开始会话：无选中书籍');
      setIsBookDrawerOpen(true); // 提示用户选择书籍
    }
  }, [currentBookId]);

  /**
   * 结束学习会话
   * 重置学习状态并刷新数据
   */
  const endLearningSession = useCallback(() => {
    console.log('[AppContext] 结束学习会话');
    setIsLearningSessionActive(false);
    setMistakeReviewTrigger(null); // 清除错题复习状态
    refreshAllData(); // 刷新数据以更新进度
  }, [refreshAllData]);

  /**
   * 开始错题集复习
   * @param planId 关联的学习计划ID
   * @param words 待复习的错题列表
   */
  const startMistakeReview = useCallback(
    (planId: number, words: Word[]) => {
      if (words.length === 0) {
        toast.error('错题集为空，无需复习');
        return;
      }
      console.log(`[AppContext] 开始错题复习，计划ID: ${planId}`);

      // 设置错题复习状态
      setMistakeReviewTrigger({ planId, words });
      setLearningTrigger(null); // 清除常规学习状态
      setIsLearningSessionActive(true);

      // 同步当前书籍ID与计划匹配
      const plan = learningList.find((p) => p.planId === planId);
      if (plan && plan.listCode !== currentBookId) {
        setCurrentBookId(plan.listCode);
      }
    },
    [learningList, currentBookId]
  );

  /**
   * 处理登录逻辑
   * @param userData 用户信息
   * @param tokens 认证令牌
   * @param rememberMe 是否记住登录状态
   */
  const login = useCallback(
    (userData: User, tokens: Tokens, rememberMe: boolean) => {
      setUser(userData);
      setAccessToken(tokens.accessToken);

      // 根据rememberMe选择存储方式
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('user', JSON.stringify(userData));
      storage.setItem('accessToken', tokens.accessToken);
      storage.setItem('refreshToken', tokens.refreshToken);

      // 关闭相关弹窗
      closeLoginModal();
      closeRegisterModal();

      // 恢复之前的书籍选择
      const storedBookId = localStorage.getItem('currentBookId');
      if (storedBookId) {
        setCurrentBookId(storedBookId);
      }
    },
    []
  );

  /**
   * 处理登出逻辑
   * 清除用户信息、令牌和相关状态
   */
  const logout = useCallback(() => {
    setUser(null);
    setAccessToken(null);

    // 清除所有存储的认证信息
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    localStorage.removeItem('currentBookId');

    // 重置学习相关状态
    setCurrentBookId(null);
    setLearningTrigger(null);
    setMistakeReviewTrigger(null);
    setIsLearningSessionActive(false);
    setLearningList([]);
    setDataError(null);

    // 关闭所有弹窗
    closeLoginModal();
    closeRegisterModal();
    closeFeedbackModal();
  }, []);

  /**
   * 监听OAuth认证回调消息
   * 处理第三方登录/绑定的结果
   */
  useEffect(() => {
    const handleOAuthMessage = async (event: MessageEvent) => {
      // 验证消息来源安全性
      if (event.origin !== EXPECTED_OAUTH_ORIGIN) {
        console.warn('收到未知来源消息:', event.origin);
        return;
      }

      const { data } = event;
      console.log('[AppContext] 收到OAuth消息:', data);

      // 处理登录成功消息
      if (data?.type?.endsWith('-login-success')) {
        const { user, accessToken, refreshToken } = data;
        if (user && accessToken && refreshToken) {
          if (isLoggedIn) {
            // 已登录状态：处理账号绑定
            toast.success(`账号 ${data.type.split('-')[0]} 绑定成功`);
            await refreshUser(); // 刷新用户信息以更新绑定状态
          } else {
            // 未登录状态：处理登录
            toast.success('登录成功，欢迎回来');
            login(user, { accessToken, refreshToken }, true);
          }
        }
      }
      // 处理登录错误消息
      else if (data?.type?.endsWith('-login-error')) {
        toast.error(`登录失败: ${data.error || '未知错误'}`);
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, [isLoggedIn, login, refreshUser]);

  /**
   * 初始化应用状态
   * 加载主题设置、用户信息和书籍层级数据
   */
  useEffect(() => {
    setIsLoading(true);

    // 加载主题设置
    const storedTheme = localStorage.getItem('app-theme') as Theme | null;
    if (storedTheme && ['light', 'dark', 'system'].includes(storedTheme)) {
      setTheme(storedTheme);
    }

    // 加载书籍层级数据（无需登录）
    fetchBookHierarchy()
      .then(setHierarchy)
      .catch((err) => {
        console.error('初始化加载书籍层级失败:', err);
        setDataError(err.message || '无法加载书籍列表');
      });

    // 加载用户信息（如有存储）
    let storedUser = sessionStorage.getItem('user');
    let storedToken = sessionStorage.getItem('accessToken');
    if (!storedUser || !storedToken) {
      storedUser = localStorage.getItem('user');
      storedToken = localStorage.getItem('accessToken');
    }

    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setAccessToken(storedToken);
        // 恢复之前的书籍选择
        const storedBookId = localStorage.getItem('currentBookId');
        if (storedBookId) {
          setCurrentBookId(storedBookId);
        }
      } catch (e) {
        console.error('解析存储的用户数据失败，执行登出', e);
        logout();
      }
    } else {
      setIsLoading(false); // 无用户数据，结束加载
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * 令牌变化时刷新数据
   * 登录/令牌更新时加载学习计划和用户信息
   */
  useEffect(() => {
    if (accessToken) {
      console.log('[AppContext] 令牌变化，加载学习数据...');

      // 并行加载学习计划和用户信息
      Promise.all([fetchLearningList(), apiFetchProfile()])
        .then(([learningData, profileData]) => {
          // 更新学习计划
          setLearningList(learningData);
          const activePlan = learningData.find((p) => p.isCurrent);
          const activeListCode = activePlan?.listCode || null;
          if (currentBookId !== activeListCode) {
            setCurrentBookId(activeListCode);
          }

          // 更新用户信息
          setUser(profileData);
          const storage = localStorage.getItem('accessToken')
            ? localStorage
            : sessionStorage;
          storage.setItem('user', JSON.stringify(profileData));
        })
        .catch((err) => {
          console.error('加载学习数据或用户信息失败:', err);
          setDataError(err.message || '无法加载数据');
          // 令牌无效时登出
          if (err.message?.includes('401') || err.message?.includes('403')) {
            logout();
          }
        })
        .finally(() => {
          setIsLoading(false); // 结束初始化加载
        });
    } else {
      // 无令牌时清空学习数据
      setLearningList([]);
      setCurrentBookId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  /**
   * 主题变化时同步到DOM
   * 更新文档根元素的data-theme属性
   */
  useEffect(() => {
    localStorage.setItem('app-theme', theme);
    const root = window.document.documentElement;

    if (theme === 'system') {
      // 跟随系统主题
      const systemPrefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches;
      root.setAttribute('data-theme', systemPrefersDark ? 'dark' : 'light');
    } else {
      // 使用指定主题
      root.setAttribute('data-theme', theme);
    }
  }, [theme]);

  /**
   * 当前书籍变化时同步到本地存储
   * 确保刷新后保持选中状态
   */
  useEffect(() => {
    if (currentBookId) {
      localStorage.setItem('currentBookId', currentBookId);
    } else {
      localStorage.removeItem('currentBookId');
      setIsLearningSessionActive(false);
    }
  }, [currentBookId]);

  /**
   * 构建上下文值
   * 使用useMemo避免不必要的重渲染
   */
  const contextValue = useMemo<IAppContext>(
    () => ({
      // 认证相关
      user,
      isLoggedIn,
      accessToken,
      login,
      logout,
      refreshUser,
      isLoading,

      // 弹窗状态
      isLoginModalOpen,
      openLoginModal,
      closeLoginModal,
      isRegisterModalOpen,
      openRegisterModal,
      closeRegisterModal,
      isBookDrawerOpen,
      setIsBookDrawerOpen,
      isFeedbackModalOpen,
      openFeedbackModal,
      closeFeedbackModal,

      // 主题设置
      theme,
      setTheme,

      // 学习状态
      currentBookId,
      setCurrentBookId,
      learningTrigger,
      loadBook,
      isLearningSessionActive,
      startLearningSession,
      endLearningSession,
      mistakeReviewTrigger,
      startMistakeReview,

      // 数据管理
      hierarchy,
      learningList,
      dataError,
      refreshAllData,
      setLearningList,
      setDataError,
    }),
    [
      user,
      isLoggedIn,
      accessToken,
      login,
      logout,
      refreshUser,
      isLoading,
      isLoginModalOpen,
      isRegisterModalOpen,
      isBookDrawerOpen,
      isFeedbackModalOpen,
      theme,
      currentBookId,
      learningTrigger,
      loadBook,
      isLearningSessionActive,
      startLearningSession,
      endLearningSession,
      mistakeReviewTrigger,
      startMistakeReview,
      hierarchy,
      learningList,
      dataError,
      refreshAllData,
    ]
  );

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
};

/**
 * 自定义Hook：获取应用上下文
 * 确保在Provider内部使用，否则抛出错误
 */
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext 必须在 AppProvider 内部使用');
  }
  return context;
};
