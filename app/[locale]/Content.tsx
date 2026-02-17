/*
 * @Date: 2025-11-08 18:11:53
 * @LastEditTime: 2025-11-08 18:22:54
 * @Description: 拼写学习核心内容组件
 */
'use client';

import BookSelectionDrawer from '@/components/book-selection/BookSelectionDrawer';
import LearningStart from '@/components/learning-start'; // 学习启动引导组件
import StatsCard from '@/components/spelling/StatsCard'; // 学习统计卡片
import WordDisplay from '@/components/spelling/WordDisplay'; // 单词展示组件
import WordNavigation from '@/components/spelling/WordNavigation'; // 单词导航控制
import WordList from '@/components/word-list'; // 单词列表组件
import SpellingOnboarding from '@/components/spelling/SpellingOnboarding'; // 拼写界面新人引导
import { useAppContext } from '@/contexts/app.context'; // 应用全局状态上下文
import { useSpelling } from '@/contexts/spelling.context'; // 拼写学习上下文
import { useEffect } from 'react';

/**
 * 学习内容主组件
 * 基于学习会话状态（激活/未激活、完成/未完成）动态渲染界面
 */
function Content() {
  const { isLearningSessionActive, openLoginModal } = useAppContext();
  const { isSessionComplete, isDemoMode, handleReturnToHome } = useSpelling();

  /**
   * 会话完成时：返回主界面；未登录试用完成则同时打开登录弹窗
   */
  useEffect(() => {
    if (!isSessionComplete) return;
    if (isDemoMode) {
      openLoginModal();
    }
    handleReturnToHome();
  }, [isSessionComplete, isDemoMode, handleReturnToHome, openLoginModal]);

  return (
    <>
      {/* 主内容区：根据会话激活状态调整布局对齐方式 */}
      <div
        className={`w-full flex flex-col items-center flex-1 ${
          isLearningSessionActive ? 'justify-between' : 'justify-center'
        }`}
      >
        {/* 学习会话激活且未完成时：显示学习核心组件 */}
        {isLearningSessionActive ? (
          isSessionComplete ? null : (
            <>
              <WordNavigation />
              <WordDisplay />
              <StatsCard />
            </>
          )
        ) : (
          // 会话未激活时：显示学习启动引导界面
          <LearningStart />
        )}
      </div>

      {/* 书籍选择抽屉（全局可用，通过内部状态控制显示/隐藏） */}
      <BookSelectionDrawer />

      {/* 学习会话激活且未完成时：显示当前单词列表 */}
      {isLearningSessionActive && !isSessionComplete && <WordList />}

      {/* 首次进入拼写界面时的新人引导 */}
      {isLearningSessionActive && !isSessionComplete && <SpellingOnboarding />}
    </>
  );
}

export default Content;
