/*
 * @Date: 2025-10-27 21:54:27
 * @LastEditTime: 2025-11-08 23:18:36
 * @Description: 单词列表的入口组件
 */
'use client';

import { useState } from 'react';
import { List } from 'lucide-react'; // 导入列表图标
import WordListDrawer from './WordListDrawer'; // 导入抽屉组件

/**
 * 单词列表入口组件
 * @description
 * 该组件渲染一个固定的触发按钮（列表图标）。
 */
const WordList = () => {
  // 状态：用于控制单词列表抽屉 (WordListDrawer) 是否打开
  const [isWordListOpen, setIsWordListOpen] = useState(false);

  return (
    <>
      {/* 触发按钮 */}
      <button
        onClick={() => setIsWordListOpen(true)} // 点击时，设置状态为 true，打开抽屉
        aria-label="打开单词列表" // 辅助功能：为屏幕阅读器提供按钮说明
        className="fixed bottom-6 left-4 sm:left-6 p-3 bg-gray-900 dark:bg-gray-700 text-white rounded-full shadow-lg group transition-all duration-300 hover:scale-110 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-600 focus:ring-offset-2 z-30"
      >
        <List />
      </button>

      {/* 单词列表抽屉组件 */}
      <WordListDrawer
        isOpen={isWordListOpen} //
        onClose={() => setIsWordListOpen(false)} //
      />
    </>
  );
};

export default WordList;
