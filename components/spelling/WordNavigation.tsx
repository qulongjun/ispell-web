'use client';
/*
 * @Date: 2025-10-26 10:02:25
 * @LastEditTime: 2025-11-07 22:26:17
 * @Description: 单词导航 (达到列表两端时隐藏按钮及其图标)
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

  const wordTextStyle =
    'text-base sm:text-2xl font-medium text-gray-500 dark:text-gray-300 truncate';

  return (
    <div className="w-full max-w-7xl flex justify-between items-center mb-4 sm:mb-12 mt-4 sm:mt-10 space-x-2 sm:space-x-8">
     
      {!isPrevDisabled && (
        <button
          onClick={handlePrev}
          disabled={isPrevDisabled}
          className="flex-1 min-w-0 flex items-center space-x-1 sm:space-x-2 transition-all duration-300"
        >
          <ChevronLeft className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />

          <div className="text-left flex-1 min-w-0">
            <p className={wordTextStyle}>{prevWord ? prevWord.text : ''}</p>
            <DefinitionDisplay
              definitions={prevWord?.definitions}
              mode="single-line"
              className="truncate hidden sm:block"
            />
          </div>
        </button>
      )}

     
      {!isNextDisabled && (
        <button
          onClick={handleNext}
          disabled={isNextDisabled}
          className="flex-1 min-w-0 flex items-center space-x-1 sm:space-x-2 transition-all duration-300"
        >
          {/* 这个 div 也会被隐藏 */}
          <div className="text-right flex-1 min-w-0">
            <p className={wordTextStyle}>{nextWordDisplay}</p>
            <DefinitionDisplay
              definitions={nextWord?.definitions}
              mode="single-line"
              className="truncate hidden sm:block"
            />
          </div>

          <ChevronRight className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-gray-500 dark:text-gray-400 shrink-0" />
        </button>
      )}
    </div>
  );
}
