'use client';
/*
 * @Date: 2025-10-28 22:05:53
 * @LastEditTime: 2025-11-01 11:20:59
 * @Description: 实现记住我功能，区分会话级/持久化存储
 */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
  useCallback,
} from 'react';
import type { PlanDetails, Language, LearningPlan } from '@/types/book.types';
import { fetchBookHierarchy } from '@/services/bookService';
import { fetchLearningList } from '@/services/planService';
import { Tokens, User } from '@/types/auth.types';

export type Theme = 'light' | 'dark' | 'system';

export type LearningAction = PlanDetails | 'activate' | 'reset' | null;

export interface LearningTrigger {
  listCode: string | null;
  action: LearningAction;
}

// 上下文接口定义（修改login方法，新增rememberMe参数）
interface IAppContext {
  // 认证
  user: User | null;
  isLoggedIn: boolean;
  accessToken: string | null;
  login: (userData: User, tokens: Tokens, rememberMe: boolean) => void; // 新增rememberMe参数
  logout: () => void;
  // 弹窗
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  isRegisterModalOpen: boolean;
  openRegisterModal: () => void;
  closeRegisterModal: () => void;
  isBookDrawerOpen: boolean;
  setIsBookDrawerOpen: (isOpen: boolean) => void;
  // 主题
  theme: Theme;
  setTheme: (theme: Theme) => void;
  // 学习状态/动作
  currentBookId: string | null;
  setCurrentBookId: (bookId: string | null) => void;
  learningTrigger: LearningTrigger | null;
  loadBook: (listCode: string | null, action: LearningAction) => void;
  isLearningSessionActive: boolean;
  startLearningSession: () => void;
  endLearningSession: () => void;
  // 数据状态
  hierarchy: Language[];
  learningList: LearningPlan[];
  isDataLoading: boolean;
  dataError: string | null;
  refreshAllData: () => Promise<void>;
  setLearningList: React.Dispatch<React.SetStateAction<LearningPlan[]>>;
  setDataError: React.Dispatch<React.SetStateAction<string | null>>;
}

// --- 创建上下文 ---
const AppContext = createContext<IAppContext | undefined>(undefined);

// --- Provider 组件 ---
export const AppProvider = ({ children }: { children: ReactNode }) => {
  // --- 用户状态管理 ---
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isBookDrawerOpen, setIsBookDrawerOpen] = useState<boolean>(false);
  const isLoggedIn = !!user && !!accessToken;

  // --- 学习状态/数据 ---
  const [currentBookId, setCurrentBookId] = useState<string | null>(null);
  const [learningTrigger, setLearningTrigger] =
    useState<LearningTrigger | null>(null);
  const [isLearningSessionActive, setIsLearningSessionActive] = useState(false);

  // 数据状态
  const [hierarchy, setHierarchy] = useState<Language[]>([]);
  const [learningList, setLearningList] = useState<LearningPlan[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  // --- 弹窗状态 ---
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const openRegisterModal = () => setIsRegisterModalOpen(true);
  const closeRegisterModal = () => setIsRegisterModalOpen(false);

  // --- 主题状态管理 ---
  const [theme, setTheme] = useState<Theme>('system');

  // --- 数据获取函数 ---
  const refreshAllData = useCallback(async () => {
    setIsDataLoading(true);
    setDataError(null);
    console.log(
      `[AppContext] Refreshing data. Token available: ${!!accessToken}`
    );

    try {
      const hierarchyPromise = fetchBookHierarchy();
      const learningPromise = accessToken
        ? fetchLearningList()
        : Promise.resolve([]);

      const [hierarchyData, learningData] = await Promise.all([
        hierarchyPromise,
        learningPromise,
      ]);

      setHierarchy(hierarchyData as Language[]);
      setLearningList(learningData as LearningPlan[]);

      if (accessToken && learningData.length > 0) {
        const activePlan = (learningData as LearningPlan[]).find(
          (p) => p.isCurrent
        );
        const activeListCode = activePlan ? activePlan.listCode : null;

        if (currentBookId !== activeListCode) {
          setCurrentBookId(activeListCode);
        }
      } else {
        setCurrentBookId(null);
      }
    } catch (err: any) {
      console.error('加载全局数据失败:', err);
      setDataError(err.message || '无法加载数据，请稍后重试。');
    } finally {
      setIsDataLoading(false);
    }
  }, [accessToken, currentBookId]);

  // --- 学习动作 ---
  const loadBook = useCallback(
    (listCode: string | null, action: LearningAction) => {
      console.log('[AppContext] loadBook triggered:', listCode, action);
      setCurrentBookId(listCode);
      setLearningTrigger({ listCode, action });
    },
    []
  );

  // --- 会话控制 ---
  const startLearningSession = useCallback(() => {
    if (currentBookId) {
      console.log('[AppContext] Starting learning session...');
      setIsLearningSessionActive(true);
      setLearningTrigger({ listCode: currentBookId, action: 'activate' });
    } else {
      console.warn('[AppContext] Cannot start session: no active book.');
      setIsBookDrawerOpen(true);
    }
  }, [currentBookId]);

  const endLearningSession = useCallback(() => {
    console.log('[AppContext] Ending learning session...');
    setIsLearningSessionActive(false);
    refreshAllData();
  }, [refreshAllData]);

  // --- 登录逻辑（核心修改：根据rememberMe选择存储方式） ---
  const login = useCallback(
    (userData: User, tokens: ITokens, rememberMe: boolean) => {
      setUser(userData);
      setAccessToken(tokens.accessToken);
      // 勾选"记住我"用localStorage（持久化），否则用sessionStorage（会话级）
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('user', JSON.stringify(userData));
      storage.setItem('accessToken', tokens.accessToken);
      storage.setItem('refreshToken', tokens.refreshToken);
      closeLoginModal();
      closeRegisterModal();
      const storedBookId = localStorage.getItem('currentBookId');
      if (storedBookId) {
        setCurrentBookId(storedBookId);
      }
    },
    [closeLoginModal, closeRegisterModal]
  );

  // --- 登出逻辑（核心修改：同时清除两种存储） ---
  const logout = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    // 清除localStorage和sessionStorage中的登录信息
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    // 清除学习状态
    localStorage.removeItem('currentBookId');
    setCurrentBookId(null);
    setLearningTrigger(null);
    setIsLearningSessionActive(false);
    setLearningList([]);
    setDataError(null);
    closeLoginModal();
    closeRegisterModal();
  }, [closeLoginModal, closeRegisterModal]);

  // --- 初始化：先读sessionStorage，再读localStorage ---
  useEffect(() => {
    // 读取主题
    const storedTheme = localStorage.getItem('app-theme') as Theme | null;
    if (storedTheme && ['light', 'dark', 'system'].includes(storedTheme)) {
      setTheme(storedTheme);
    }

    // 1. 加载书籍层级数据
    setIsDataLoading(true);
    fetchBookHierarchy()
      .then(setHierarchy)
      .catch((err) => {
        console.error('加载书籍层级失败 (onMount):', err);
        setDataError(err.message || '无法加载书籍列表。');
      })
      .finally(() => {
        // 无token时停止加载
        if (
          !localStorage.getItem('accessToken') &&
          !sessionStorage.getItem('accessToken')
        ) {
          setIsDataLoading(false);
        }
      });

    // 2. 加载用户数据（优先读会话存储，再读持久存储）
    let storedUser = sessionStorage.getItem('user');
    let storedToken = sessionStorage.getItem('accessToken');
    // 会话存储无数据时，读持久存储
    if (!storedUser || !storedToken) {
      storedUser = localStorage.getItem('user');
      storedToken = localStorage.getItem('accessToken');
    }

    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setAccessToken(storedToken);
        const storedBookId = localStorage.getItem('currentBookId');
        if (storedBookId) {
          setCurrentBookId(storedBookId);
        }
      } catch (e) {
        logout(); // 数据损坏时强制登出
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- 登录/登出时加载"在学"数据 ---
  useEffect(() => {
    if (accessToken) {
      console.log('[AppContext] AccessToken 变化，正在加载在学列表...');
      setIsDataLoading(true);
      fetchLearningList(accessToken)
        .then((learningData) => {
          setLearningList(learningData);
          const activePlan = learningData.find((p) => p.isCurrent);
          const activeListCode = activePlan ? activePlan.listCode : null;
          if (currentBookId !== activeListCode) {
            setCurrentBookId(activeListCode);
          }
        })
        .catch((err) => {
          console.error('加载在学列表失败:', err);
          setDataError(err.message || '无法加载在学列表。');
        })
        .finally(() => {
          setIsDataLoading(false);
        });
    } else {
      setLearningList([]);
      setCurrentBookId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  // --- 主题变化同步 ---
  useEffect(() => {
    localStorage.setItem('app-theme', theme);
    const root = window.document.documentElement;
    if (theme === 'system') {
      const systemPrefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches;
      root.setAttribute('data-theme', systemPrefersDark ? 'dark' : 'light');
    } else {
      root.setAttribute('data-theme', theme);
    }
  }, [theme]);

  // --- 当前书籍变化同步 ---
  useEffect(() => {
    if (currentBookId) {
      localStorage.setItem('currentBookId', currentBookId);
    } else {
      localStorage.removeItem('currentBookId');
      setIsLearningSessionActive(false);
    }
  }, [currentBookId]);

  // --- 上下文值 ---
  const contextValue = useMemo(
    () => ({
      user,
      isLoggedIn,
      accessToken,
      login, // 传递修改后的login方法
      logout,
      theme,
      setTheme,
      isLoginModalOpen,
      openLoginModal,
      closeLoginModal,
      isRegisterModalOpen,
      openRegisterModal,
      closeRegisterModal,
      isBookDrawerOpen,
      setIsBookDrawerOpen,
      currentBookId,
      setCurrentBookId,
      learningTrigger,
      loadBook,
      isLearningSessionActive,
      startLearningSession,
      endLearningSession,
      hierarchy,
      learningList,
      isDataLoading,
      dataError,
      refreshAllData,
      setLearningList,
      setDataError,
    }),
    [
      user,
      isLoggedIn,
      accessToken,
      login, // 依赖修改后的login
      logout,
      theme,
      isLoginModalOpen,
      isRegisterModalOpen,
      isBookDrawerOpen,
      currentBookId,
      learningTrigger,
      loadBook,
      isLearningSessionActive,
      startLearningSession,
      endLearningSession,
      hierarchy,
      learningList,
      isDataLoading,
      dataError,
      refreshAllData,
    ]
  );

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
};

// --- 自定义Hook ---
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext 必须在 AppProvider 内部使用');
  }
  return context;
};
