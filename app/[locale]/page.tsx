/*
 * @Date: 2025-10-23 09:38:39
 * @LastEditTime: 2025-11-01 18:28:20
 * @Description: 拼写学习主页面组件
 */
'use client';

// React核心导入
import React, { useEffect } from 'react';

// 上下文Hook导入
import { useSpelling } from '@/contexts/spelling.context'; // 拼写练习上下文（管理学习状态、单词数据等）
import { useAppContext } from '@/contexts/app.context'; // 应用全局上下文（管理学习会话激活状态等）

// 拼写学习相关组件导入
import StatsCard from '@/components/spelling/StatsCard'; // 学习统计卡片（展示正确率、已学单词等）
import WordNavigation from '@/components/spelling/WordNavigation'; // 单词导航组件（上一个/下一个单词切换）
import WordDisplay from '@/components/spelling/WordDisplay'; // 单词展示组件（显示单词、发音、释义等）
import WordList from '@/components/word-list'; // 单词列表组件（当前学习会话的单词清单）
import LearningStart from '@/components/learning-start'; // 学习开始组件（未激活会话时显示，用于启动学习）

// 通用组件导入
import Logo from '@/components/logo'; // 应用Logo组件
import HeaderActions from '@/components/header-actions'; // 头部操作组件（用户信息、设置入口等）
import Settings from '@/components/panels/Settings'; // 设置面板组件（控制学习参数、显示模式等）
import BookSelectionDrawer from '@/components/book-selection/BookSelectionDrawer'; // 书籍选择抽屉（选择要学习的单词书）

/**
 * 内容区域组件
 * 核心逻辑：根据学习会话状态（激活/未激活）和会话完成状态，动态渲染对应的UI组件
 */
function Content() {
  // 从全局上下文获取学习会话激活状态
  const { isLearningSessionActive } = useAppContext();
  // 从拼写上下文获取会话完成状态和返回首页方法
  const { isSessionComplete, handleReturnToHome } = useSpelling();

  /**
   * 监听会话完成状态：当会话完成时，自动触发返回首页操作
   * 依赖：isSessionComplete（会话完成状态）、handleReturnToHome（返回首页方法）
   */
  useEffect(() => {
    if (isSessionComplete) {
      handleReturnToHome();
    }
  }, [isSessionComplete, handleReturnToHome]);

  return (
    <>
      

        {/* 主内容区：根据会话状态调整布局 */}
        <div
          className={`w-full flex flex-col items-center flex-1 mt-12 sm:mt-16 ${
            isLearningSessionActive ? 'justify-between' : 'justify-center'
          }`}
        >
          {/* 学习会话激活时：显示导航、单词展示、统计卡片 */}
          {isLearningSessionActive ? (
            isSessionComplete ? null : ( // 会话完成时不显示学习组件
              <>
                <WordNavigation />
                <WordDisplay />
                <StatsCard />
              </>
            )
          ) : (
            // 学习会话未激活时：显示学习开始组件（引导用户启动学习）
            <LearningStart />
          )}
        </div>

      {/* 全局浮动组件：设置面板、书籍选择抽屉 */}
      <Settings />
      <BookSelectionDrawer />

      {/* 学习会话激活且未完成时：显示单词列表 */}
      {isLearningSessionActive && !isSessionComplete && <WordList />}
    </>
  );
}

/**
 * 拼写学习页面入口组件
 * 作用：作为路由页面的出口，直接渲染内容区域组件
 */
export default function Page() {
  return <Content />;
}
