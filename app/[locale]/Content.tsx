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
import { useAppContext } from '@/contexts/app.context'; // 应用全局状态上下文
import { useSpelling } from '@/contexts/spelling.context'; // 拼写学习上下文
import { useEffect } from 'react';

/**
 * 学习内容主组件
 * 基于学习会话状态（激活/未激活、完成/未完成）动态渲染界面
 */
function Content() {
  // 从全局上下文获取学习会话激活状态（控制整体布局切换）
  const { isLearningSessionActive } = useAppContext();
  // 从拼写上下文获取会话完成状态和返回首页方法
  const { isSessionComplete, handleReturnToHome } = useSpelling();

  /**
   * 会话完成时的自动处理
   * 当会话标记为完成，触发返回首页逻辑
   */
  useEffect(() => {
    if (isSessionComplete) {
      handleReturnToHome();
    }
  }, [isSessionComplete, handleReturnToHome]);

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
          isSessionComplete ? null : ( // 会话完成时隐藏学习组件
            <>
              <WordNavigation /> {/* 上/下一个单词导航控制 */}
              <WordDisplay /> {/* 当前单词展示及学习交互 */}
              <StatsCard /> {/* 学习进度与统计数据展示 */}
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
    </>
  );
}

export default Content;
