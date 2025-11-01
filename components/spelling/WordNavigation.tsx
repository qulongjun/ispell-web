'use client';
/*
 * @Date: 2025-10-26 10:02:25
 * @LastEditTime: 2025-10-30 15:53:07
 * @Description: 增加截断逻辑，防止超长
 */

import { ChevronLeft, ChevronRight } from 'lucide-react';
import DefinitionDisplay from '../common/DefinitionDisplay';
import { useSpelling } from '@/contexts/spelling.context';

export default function WordNavigation() {
  const { currentIndex, words, displayMode, handlePrev, handleNext } =
    useSpelling();

  const totalWords = words.length;
  const prevWord = words[currentIndex - 1];
  const nextWord = words[currentIndex + 1];

  const isPrevDisabled = currentIndex === 0;
  const isNextDisabled = currentIndex === totalWords - 1;

  let nextWordDisplay = '';
  if (nextWord) {
    if (displayMode === 'full') {
      nextWordDisplay = nextWord.text;
    } else {
      nextWordDisplay = nextWord.text.replace(/./g, '_');
    }
  }

  return (
    <div className="w-full max-w-7xl flex justify-between items-center mb-8 sm:mb-12 mt-8 sm:mt-10 space-x-4 sm:space-x-8">
      {/* 上一个单词 */}
      <button
        onClick={handlePrev}
        disabled={isPrevDisabled}
        className={`flex-1 min-w-0 flex items-center space-x-2 transition-all duration-300 ${
          // <-- [改动 1]
          isPrevDisabled
            ? 'opacity-40 cursor-not-allowed'
            : 'hover:text-blue-500 dark:hover:text-blue-300'
        }`}
      >
        <ChevronLeft className="w-4.5 h-4.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
        <div className="text-left flex-1 min-w-0">
          {' '}
          {/* <-- [改动 2] */}
          <p className="text-base sm:text-2xl font-medium text-gray-500 dark:text-gray-300 truncate">
            {prevWord ? prevWord.text : ''}
          </p>
          <DefinitionDisplay
            definitions={prevWord?.definitions}
            mode="single-line"
            className="truncate" // <-- [改动 3] 应用 truncate
          />
        </div>
      </button>

      {/* 下一个单词 */}
      <button
        onClick={handleNext}
        disabled={isNextDisabled}
        className={`flex-1 min-w-0 flex items-center space-x-2 transition-all duration-300 ${
          // <-- [改动 1]
          isNextDisabled
            ? 'opacity-40 cursor-not-allowed'
            : 'hover:text-blue-500 dark:hover:text-blue-300'
        }`}
      >
        <div className="text-right flex-1 min-w-0">
          {' '}
          {/* <-- [改动 2] */}
          <p className="text-base sm:text-2xl font-medium text-gray-500 dark:text-gray-300 truncate">
            {nextWordDisplay}
          </p>
          <DefinitionDisplay
            definitions={nextWord?.definitions}
            mode="single-line"
            className="truncate" // <-- [改动 3] 应用 truncate
          />
        </div>
        <ChevronRight className="w-4.5 h-4.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
      </button>
    </div>
  );
}
