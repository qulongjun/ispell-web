/*
 * @Date: 2025-10-28 22:05:53
 * @LastEditTime: 2025-11-03 18:50:38
 * @Description: AppContext，已添加 refreshUser 和 OAuth 绑定监听器
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
import type { PlanDetails, Language, LearningPlan } from '@/types/book.types';
import { fetchBookHierarchy } from '@/services/bookService';
import { fetchLearningList } from '@/services/planService';
import { Tokens, User } from '@/types/auth.types';
// [新] 导入 apiFetchProfile 和 OAuth 常量
import {
  apiFetchProfile,
  EXPECTED_OAUTH_ORIGIN,
} from '@/services/authService';
import toast from 'react-hot-toast';

export type Theme = 'light' | 'dark' | 'system';

export type LearningAction = PlanDetails | 'activate' | 'reset' | null;

export interface LearningTrigger {
  listCode: string | null;
  action: LearningAction;
}

// 上下文接口定义（新增 refreshUser）
interface IAppContext {
  // 认证
  user: User | null;
  isLoggedIn: boolean;
  accessToken: string | null;
  login: (userData: User, tokens: Tokens, rememberMe: boolean) => void;
  logout: () => void;
  refreshUser: () => Promise<void>; // [新] 刷新用户信息
  isLoading: boolean; // [新] 添加一个顶层 isLoading
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
  const [isLoading, setIsLoading] = useState(true); // [新] 顶层加载状态

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

  // --- [新] 刷新用户信息的函数 ---
  const refreshUser = useCallback(async () => {
    console.log('[AppContext] Refreshing user...');
    try {
      // 1. 检查是否存在 token
      let token = accessToken;
      if (!token) {
        token =
          sessionStorage.getItem('accessToken') ||
          localStorage.getItem('accessToken');
      }
      if (!token) {
        console.warn('[AppContext] No token, skipping user refresh.');
        return;
      }

      // 2. 调用 API 获取最新用户信息
      const updatedUser = await apiFetchProfile();

      // 3. 更新 user 状态
      setUser(updatedUser);

      // 4. 更新存储（保持持久化状态）
      const storage = localStorage.getItem('accessToken')
        ? localStorage
        : sessionStorage;
      storage.setItem('user', JSON.stringify(updatedUser));
      console.log('[AppContext] User refresh successful.');
    } catch (error) {
      console.error('[AppContext] Failed to refresh user:', error);
      toast.error('无法更新用户信息，请尝试重新登录');
      // 如果刷新失败（例如 token 过期），则登出
      logout();
    }
  }, [accessToken]); // 依赖 logout

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
    } catch (err: unknown) {
      console.error('加载全局数据失败:', err);
      setDataError((err as Error).message || '无法加载数据，请稍后重试。');
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

  // --- 登录逻辑 ---
  const login = useCallback(
    (userData: User, tokens: Tokens, rememberMe: boolean) => {
      setUser(userData);
      setAccessToken(tokens.accessToken);
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
    [] // 移除依赖
  );

  // --- 登出逻辑 ---
  const logout = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    localStorage.removeItem('currentBookId');
    setCurrentBookId(null);
    setLearningTrigger(null);
    setIsLearningSessionActive(false);
    setLearningList([]);
    setDataError(null);
    closeLoginModal();
    closeRegisterModal();
  }, []); // 移除依赖

  // --- [新] OAuth 绑定/登录 回调监听器 ---
  useEffect(() => {
    const handleOAuthMessage = async (event: MessageEvent) => {
      // 安全校验：检查来源是否是后端 API
      if (event.origin !== EXPECTED_OAUTH_ORIGIN) {
        console.warn('Received message from untrusted origin:', event.origin);
        return;
      }

      const { data } = event;
      console.log('[AppContext] Received postMessage:', data);

      // 检查是否为 OAuth 成功消息
      if (data && data.type && data.type.endsWith('-login-success')) {
        const { user, accessToken, refreshToken } = data;

        if (user && accessToken && refreshToken) {
          // 检查这是“登录”还是“绑定”
          if (isLoggedIn) {
            // 场景：已登录用户，进行“绑定”
            toast.success(`账号 ${data.type.split('-')[0]} 绑定成功！`);
            // 刷新用户信息（以获取新的 bindings）
            await refreshUser();
          } else {
            // 场景：未登录用户，进行“登录”
            toast.success('登录成功，欢迎回来！');
            // 触发登录（此处假设 OAuth 登录总是“记住我”）
            login(user, { accessToken, refreshToken }, true);
          }
        }
      } else if (data && data.type && data.type.endsWith('-login-error')) {
        toast.error(`登录失败: ${data.error || '未知错误'}`);
      }
    };

    window.addEventListener('message', handleOAuthMessage);

    return () => {
      window.removeEventListener('message', handleOAuthMessage);
    };
  }, [isLoggedIn, login, refreshUser]); // 依赖 isLoggedIn, login, refreshUser

  // --- 初始化 ---
  useEffect(() => {
    setIsLoading(true);
    // 读取主题
    const storedTheme = localStorage.getItem('app-theme') as Theme | null;
    if (storedTheme && ['light', 'dark', 'system'].includes(storedTheme)) {
      setTheme(storedTheme);
    }

    // 1. 加载书籍层级数据（始终加载）
    fetchBookHierarchy()
      .then(setHierarchy)
      .catch((err) => {
        console.error('加载书籍层级失败 (onMount):', err);
        setDataError(err.message || '无法加载书籍列表。');
      });

    // 2. 加载用户数据
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
        const storedBookId = localStorage.getItem('currentBookId');
        if (storedBookId) {
          setCurrentBookId(storedBookId);
        }
      } catch (e) {
        logout();
      }
    } else {
      setIsLoading(false); // 没有 token，停止加载
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- 登录/登出时加载"在学"数据 ---
  useEffect(() => {
    if (accessToken) {
      console.log('[AppContext] AccessToken 变化，正在加载在学列表...');
      setIsDataLoading(true);
      // [修改] 在 accessToken 变化时，同时刷新学习列表和用户信息
      Promise.all([fetchLearningList(), apiFetchProfile()])
        .then(([learningData, profileData]) => {
          // 更新学习列表
          setLearningList(learningData);
          const activePlan = learningData.find((p) => p.isCurrent);
          const activeListCode = activePlan ? activePlan.listCode : null;
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
          console.error('加载在学列表或用户信息失败:', err);
          setDataError(err.message || '无法加载数据。');
          if (err.message.includes('401') || err.message.includes('403')) {
            logout(); // Token 无效，登出
          }
        })
        .finally(() => {
          setIsDataLoading(false);
          setIsLoading(false); // [新] 结束顶层加载
        });
    } else {
      setLearningList([]);
      setCurrentBookId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]); // 依赖 accessToken

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
      login,
      logout,
      refreshUser, // [新] 导出
      isLoading, // [新] 导出
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
      login,
      logout,
      refreshUser, // [新]
      isLoading, // [新]
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
