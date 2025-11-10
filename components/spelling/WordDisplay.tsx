/*
 * @Date: 2025-10-26 10:02:44
 * @LastEditTime: 2025-11-10 08:43:03
 * @Description: 单词拼写显示区域
 */
'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import DefinitionDisplay from '@/components/common/DefinitionDisplay';
import PronunciationDisplay from '@/components/common/PronunciationDisplay';
import { useSpelling } from '@/contexts/spelling.context';
import { useAppContext } from '@/contexts/app.context';
import { useSpeechPlayer } from '@/hooks/useSpeechPlayer';
import {
  getAllIndices,
  getConsonantIndices,
  getRandomIndicesOverHalf,
  getVowelIndices,
} from '@/utils/word.utils';
import { SpeechOptions } from '@/utils/speech.utils';
import { AccentType } from '@/types/word.types';
import SentenceDisplay from '@/components/common/SentenceDisplay';
import { motion, AnimatePresence } from 'framer-motion';
import { Info } from 'lucide-react';
import { useTranslations } from 'next-intl';

const isInputtableChar = (char: string): boolean => {
  return /[a-zA-Z']/.test(char); // 字母 和 撇号
};

const isSkippableChar = (char: string): boolean => {
  return char === ' '; // 仅空格
};

export default function WordDisplay() {
  const {
    currentWord,
    handleNext,
    speechSupported,
    incrementInputCount,
    incrementCorrectCount,
    speechConfig,
    displayMode,
    updateWordProgressInContext,
    setHasMadeMistake,
    showSentences,
    showSentenceTranslation,
  } = useSpelling();

  const { isLoggedIn } = useAppContext();
  const t = useTranslations('WordDisplay');

  const { speak, isPlaying } = useSpeechPlayer();

  // 创建一个 ref 来引用隐藏的 input 元素，用于移动端键盘唤起
  const inputRef = useRef<HTMLInputElement>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const successSfx =
    typeof window !== 'undefined' ? new Audio('/sfx/success.mp3') : null;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const errorSfx =
    typeof window !== 'undefined' ? new Audio('/sfx/failed.wav') : null;

  const playSound = (audio: HTMLAudioElement | null) => {
    if (audio) {
      audio.currentTime = 0;
      audio.volume = 0.7;
      audio.play().catch((e) => console.error('SFX play failed:', e));
    }
  };

  const [userInput, setUserInput] = useState<string[]>([]);
  const [currentPosition, setCurrentPosition] = useState<number>(0);
  const [isError, setIsError] = useState<boolean>(false);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [isHovering, setIsHovering] = useState(false);

  const wordContainerRef = useRef<HTMLDivElement>(null);
  const prevWordRef = useRef<string>(currentWord?.text || '');

  const findNextInputtablePosition = useCallback(
    (word: string, startIndex: number): number => {
      if (!word) return 0;
      for (let i = startIndex; i < word.length; i++) {
        if (isInputtableChar(word[i])) {
          return i;
        }
      }
      return word.length;
    },
    []
  );

  const resetInputState = useCallback(
    (isWordChange = false) => {
      if (!isWordChange) incrementInputCount();
      setUserInput([]);
      setCurrentPosition(0);
      setIsError(false);
      setIsComplete(false);
      wordContainerRef.current?.classList.remove('shake');
      setIsHovering(false);
    },
    [incrementInputCount]
  );

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const hiddenIndices = useMemo(() => {
    if (!currentWord?.text) return [];
    switch (displayMode) {
      case 'hideVowels':
        return getVowelIndices(currentWord.text);
      case 'hideConsonants':
        return getConsonantIndices(currentWord.text);
      case 'hideRandom':
        return getRandomIndicesOverHalf(currentWord.text);
      case 'hideAll':
        return getAllIndices(currentWord.text);
      default:
        return [];
    }
  }, [currentWord?.text, displayMode]);

  const playNewWordPronunciation = useCallback(() => {
    if (!speechSupported || !currentWord?.text) return;
    const configToPlay: SpeechOptions = {
      ...speechConfig,
      text: currentWord.text,
      onStart: () => console.log('播放新单词语音:', currentWord.text),
      onError: (error: SpeechSynthesisErrorEvent) => {
        console.error('新单词语音播放错误:', error.error);
      },
    };
    speak(configToPlay);
  }, [currentWord, speechConfig, speechSupported, speak]);

  const playCurrentWord = useCallback(() => {
    if (!speechSupported || isPlaying || !currentWord?.text) return;
    const configToPlay: SpeechOptions = {
      ...speechConfig,
      text: currentWord.text,
      onStart: () => console.log('播放当前单词语音:', currentWord.text),
      onError: (error) => {
        console.error('当前单词语音错误:', error.error);
      },
    };
    speak(configToPlay);
  }, [currentWord, isPlaying, speechConfig, speechSupported, speak]);

  const handleSuccess = useCallback(async () => {
    playSound(successSfx);
    setIsComplete(true);
    setHasMadeMistake(false);
    updateWordProgressInContext(5);
    incrementCorrectCount();
    setTimeout(() => {
      handleNext();
    }, 300);
  }, [
    successSfx,
    updateWordProgressInContext,
    incrementCorrectCount,
    handleNext,
    setHasMadeMistake,
  ]);

  const handleFailure = useCallback(async () => {
    playSound(errorSfx);
    setIsError(true);
    setHasMadeMistake(true);
    updateWordProgressInContext(1);
    wordContainerRef.current?.classList.add('shake');
    setTimeout(() => {
      resetInputState(false);
      if (currentWord?.text) {
        setCurrentPosition(findNextInputtablePosition(currentWord.text, 0));
      }
      playCurrentWord(); // 调用在这里
    }, 1000);
  }, [
    errorSfx,
    setHasMadeMistake,
    updateWordProgressInContext,
    playCurrentWord, // 依赖在这里
    resetInputState,
    currentWord?.text,
    findNextInputtablePosition,
  ]);

  // 共享的按键处理逻辑，供 PC 全局 和 移动端 <input> 调用
  const handleKeyEvent = useCallback(
    (e: KeyboardEvent) => {
      // 如果事件已经被处理（例如，被 onKeyDown 捕获并阻止了默认行为），则跳过
      if (e.defaultPrevented) {
        return;
      }

      // 如果正在完成、出错或按下了功能键，则忽略
      if (
        isComplete ||
        isError ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        !currentWord?.text
      ) {
        return;
      }

      const inputChar = e.key;

      // 检查是否是可输入的字符
      if (isInputtableChar(inputChar)) {
        // 阻止默认行为（例如在页面上滚动或在 <input> 中输入字符）
        e.preventDefault();

        const targetChar = currentWord.text[currentPosition];
        if (!targetChar) return;

        const newInput = [...userInput];
        newInput[currentPosition] = inputChar;
        setUserInput(newInput);

        // 比较时转换为小写，以改善移动端体验（自动大写）
        const isMatch = inputChar.toLowerCase() === targetChar.toLowerCase();

        if (isMatch) {
          const nextInputtablePos = findNextInputtablePosition(
            currentWord.text,
            currentPosition + 1
          );

          for (let i = currentPosition + 1; i < nextInputtablePos; i++) {
            newInput[i] = currentWord.text[i];
          }
          setUserInput(newInput);

          setCurrentPosition(nextInputtablePos);

          if (nextInputtablePos === currentWord.text.length) {
            handleSuccess();
          }
        } else {
          handleFailure();
        }
      } else {
        // 对于PC全局监听器，我们不想阻止非输入键（如 F5, Tab等）
        // 但如果焦点在我们的隐藏 input 上，我们应该阻止
        if (e.target === inputRef.current) {
          if (e.key !== 'Backspace' && e.key !== 'Delete') {
            e.preventDefault();
          }
        }
      }
    },
    [
      currentPosition,
      currentWord,
      handleFailure,
      handleSuccess,
      isComplete,
      isError,
      userInput,
      findNextInputtablePosition,
    ]
  );

  // 处理输入框失焦事件，尝试重新聚焦以保持键盘（主要用于移动端）
  const handleInputBlur = useCallback(() => {
    setTimeout(() => {
      if (inputRef.current && !isComplete && !isError) {
        inputRef.current.focus();
      }
    }, 50);
  }, [isComplete, isError]);

  // Effect Hook: 加载新单词时
  useEffect(() => {
    if (currentWord?.text && currentWord.text !== prevWordRef.current) {
      resetInputState(true);
      setCurrentPosition(findNextInputtablePosition(currentWord.text, 0));
      setHasMadeMistake(false);
      prevWordRef.current = currentWord.text;

      // 当新单词加载时，自动聚焦到隐藏输入框（对移动端友好）
      inputRef.current?.focus();

      const shouldPlay = speechSupported;
      if (shouldPlay) {
        playNewWordPronunciation();
      }
    } else if (!currentWord?.text && prevWordRef.current) {
      prevWordRef.current = '';
    }
  }, [
    currentWord?.text,
    resetInputState,
    speechSupported,
    playNewWordPronunciation,
    setHasMadeMistake,
    findNextInputtablePosition,
  ]);

  // Effect Hook: 添加全局键盘监听器（对PC端友好）
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // 检查事件目标
      const target = e.target as HTMLElement;

      // 1. 如果事件来自我们的隐藏输入框，让 <input> 的 onKeyDown 自己处理，这里跳过
      if (target === inputRef.current) {
        return;
      }

      // 2. 如果用户正在其他输入框里打字（如搜索框、评论框），也跳过
      const isWriting =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;
      if (isWriting) {
        return;
      }

      // 3. 否则，这是PC上的全局快捷键，手动调用共享逻辑
      handleKeyEvent(e);
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [handleKeyEvent]); // 依赖共享的事件处理器

  const renderWord = (word: string) => {
    if (!word) return null;
    const chars = word.split('');

    return (
      <div
        ref={wordContainerRef}
        className="flex items-center justify-center gap-x-2 gap-y-4 flex-wrap transition-all duration-300 cursor-default"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {chars.map((char, index) => {
          const isEntered = index < currentPosition;

          if (isSkippableChar(char)) {
            const displayChar = char === ' ' ? '&nbsp;' : char;
            const colorClass = isEntered
              ? 'text-green-500 dark:text-green-300'
              : 'text-gray-400 dark:text-gray-600';
            return (
              <span
                key={index}
                className={`text-5xl sm:text-7xl ${colorClass} w-4 sm:w-6`}
                dangerouslySetInnerHTML={{ __html: displayChar }}
              />
            );
          }

          const isCurrent = index === currentPosition;
          const hasError = isError && isCurrent;

          let isCorrect = false;
          if (isEntered) {
            // 比较用户输入和目标字符
            isCorrect = userInput[index]?.toLowerCase() === char.toLowerCase();
          }

          let colorClass = 'text-gray-400 dark:text-gray-600';
          if (isEntered)
            colorClass = isCorrect
              ? 'text-green-500 dark:text-green-300' // 正确
              : 'text-red-500 dark:text-red-300';
          // 错误
          else if (hasError)
            colorClass = 'text-red-500 dark:text-red-300'; // 当前输入错误
          else if (isCurrent) colorClass = 'text-gray-900 dark:text-gray-100'; // 当前光标

          let charToShow = char;
          // 如果是隐藏索引、未输入、未悬停，则显示下划线
          if (hiddenIndices.includes(index) && !isEntered && !isHovering) {
            charToShow = '_';
          }
          // 如果是已输入的位置，显示用户输入的字符
          if (isEntered && userInput[index]) {
            charToShow = userInput[index];
          }

          return (
            <span
              key={index}
              className={`text-5xl sm:text-7xl tracking-tight ${colorClass}`}
            >
              {charToShow}
            </span>
          );
        })}
      </div>
    );
  };

  const playWordPronunciation = (type: 'uk' | 'us' | null = null) => {
    if (
      !speechSupported ||
      isPlaying ||
      !currentWord?.text ||
      !currentWord?.pronunciation
    )
      return;
    let detailToPlay = null;
    let accentLang: AccentType = 'en-US';
    if (type === 'uk' && currentWord.pronunciation.uk?.phonetic) {
      detailToPlay = currentWord.pronunciation.uk;
      accentLang = 'en-GB';
    } else if (type === 'us' && currentWord.pronunciation.us?.phonetic) {
      detailToPlay = currentWord.pronunciation.us;
      accentLang = 'en-US';
    } else {
      if (currentWord.pronunciation.us?.phonetic) {
        detailToPlay = currentWord.pronunciation.us;
        accentLang = 'en-US';
      } else if (currentWord.pronunciation.uk?.phonetic) {
        detailToPlay = currentWord.pronunciation.uk;
        accentLang = 'en-GB';
      }
    }
    if (!detailToPlay) {
      console.warn(
        'No pronunciation detail found to play for:',
        currentWord.text,
        type
      );
      return;
    }
    const configToPlay: SpeechOptions = {
      ...speechConfig,
      accent: accentLang,
      text: currentWord.text,
      onStart: () =>
        console.log(`播放 [${type || 'auto'}] 语音:`, currentWord.text),
      onError: (error) => {
        console.error(`语音 [${type || 'auto'}] 播放错误:`, error.error);
      },
    };
    speak(configToPlay);
  };

  const handlePlaySelectedPronunciation = (type: 'uk' | 'us') => {
    playWordPronunciation(type);
  };

  // --- JSX 返回 (修改) ---
  return (
    <div
      className="w-full flex flex-col items-center justify-center relative"
      style={{ minHeight: '300px' }}
      // 添加 onClick 以便用户点击屏幕任意位置都能唤起键盘
      onClick={() => inputRef.current?.focus()}
    >
      {/* 隐藏的 input 元素，用于在移动端捕获键盘事件 */}
      <input
        ref={inputRef}
        type="text"
        className="absolute top-0 left-0 w-0 h-0 opacity-0 border-none p-0 m-0"
        // <input> 的 onKeyDown 直接调用共享的按键逻辑
        onKeyDown={(e) => handleKeyEvent(e.nativeEvent as KeyboardEvent)}
        onBlur={handleInputBlur} // 绑定失焦处理
        value="" // 始终保持为空，防止自动填充或显示
        onChange={() => {}} // 满足 React 对受控组件的要求
        autoCapitalize="off" // 关闭自动大写
        autoCorrect="off" // 关闭自动纠正
        autoComplete="off" // 关闭自动完成
        spellCheck="false" // 关闭拼写检查
        tabIndex={-1} // 确保无法通过 Tab 键选中
        aria-hidden="true" // 对屏幕阅读器隐藏
      />

      <div className="mb-6 min-h-[80px] w-full px-4 flex items-center justify-center">
        {renderWord(currentWord?.text || '')}
      </div>

      <PronunciationDisplay
        pronunciation={currentWord?.pronunciation}
        onPlay={handlePlaySelectedPronunciation}
        isPlaying={isPlaying}
        speechSupported={!!speechSupported}
      />

      <DefinitionDisplay definitions={currentWord?.definitions} />

      {isLoggedIn ? (
        <>
          <AnimatePresence>
            {showSentences &&
              currentWord?.examples?.general &&
              currentWord.examples.general.length > 0 && (
                <motion.div
                  className="w-full overflow-hidden"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{
                    opacity: 1,
                    height: 'auto',
                  }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                >
                  <div className="mt-4">
                    <SentenceDisplay
                      sentences={currentWord.examples.general}
                      showTranslation={showSentenceTranslation}
                    />
                  </div>
                </motion.div>
              )}
          </AnimatePresence>

          {!showSentences &&
            currentWord?.examples?.general &&
            currentWord.examples.general.length > 0 && <div className="h-10" />}
        </>
      ) : (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 px-4 text-center py-2">
          <Info className="w-4 h-4 flex-shrink-0" />
          <span>{t('loginPrompt')}</span>
        </div>
      )}
    </div>
  );
}
