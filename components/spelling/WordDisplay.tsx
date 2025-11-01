/*
 * @Date: 2025-10-26 10:02:44
 * @LastEditTime: 2025-11-01 15:55:01
 * @Description: 单词拼写显示区域 (修改错题本逻辑)
 */
'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import DefinitionDisplay from '../common/DefinitionDisplay';
import PronunciationDisplay from '../common/PronunciationDisplay';
import { useSpelling } from '@/contexts/spelling.context';
import { useSpeechPlayer } from '@/hooks/useSpeechPlayer';
import {
  getAllIndices,
  getConsonantIndices,
  getRandomIndicesOverHalf,
  getVowelIndices,
} from '@/utils/word.utils';
import { SpeechOptions } from '@/utils/speech.utils';
import { AccentType } from '@/types/word.types';

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
  } = useSpelling();

  const { speak, isPlaying } = useSpeechPlayer();

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

  // --- 状态 (不变) ---
  const [userInput, setUserInput] = useState<string[]>([]);
  const [currentPosition, setCurrentPosition] = useState<number>(0);
  const [isError, setIsError] = useState<boolean>(false);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [isHovering, setIsHovering] = useState(false);

  // --- 引用 (不变) ---
  const wordContainerRef = useRef<HTMLDivElement>(null);
  const prevWordRef = useRef<string>(currentWord?.text || '');

  // --- 核心逻辑：状态重置 (不变) ---
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

  // --- hiddenIndices (不变) ---
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

  // --- 各种播放函数 (不变) ---
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

  // --- [!!! 修改 !!!] 拼写逻辑函数 ---

  const handleSuccess = useCallback(async () => {
    playSound(successSfx);
    setIsComplete(true);
    setHasMadeMistake(false); // [!!! 新增 !!!] 拼对了，清除犯错标记

    // [保留] 拼写成功，通知后端
    updateWordProgressInContext(5); // 5 = 质量高

    incrementCorrectCount();
    setTimeout(() => {
      handleNext();
    }, 300);
  }, [
    successSfx,
    updateWordProgressInContext,
    incrementCorrectCount,
    handleNext,
    setHasMadeMistake, // [!!! 新增 !!!]
  ]);

  const handleFailure = useCallback(async () => {
    playSound(errorSfx);
    setIsError(true);

    // [!!! 修改 !!!]
    // 不再调用 handleWordFailure()
    // handleWordFailure(); [!!! 移除 !!!]

    // [!!! 新增 !!!]
    // 只设置“犯错”标记
    setHasMadeMistake(true);

    wordContainerRef.current?.classList.add('shake');
    setTimeout(() => {
      resetInputState(false);
      playCurrentWord();
    }, 1000);
  }, [
    errorSfx,
    setHasMadeMistake, // [!!! 修改 !!!]
    playCurrentWord,
    resetInputState,
  ]);

  // --- 键盘输入监听 (不变) ---
  const handleInputKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (
        isComplete ||
        isError ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        !currentWord?.text ||
        !/^[a-zA-Z]$/.test(e.key)
      )
        return;

      const inputChar = e.key.toLowerCase();
      const targetChar = currentWord.text[currentPosition]?.toLowerCase();

      if (!targetChar) return;

      const newInput = [...userInput];
      newInput[currentPosition] = inputChar;
      setUserInput(newInput);

      if (inputChar === targetChar) {
        const nextPosition = currentPosition + 1;
        setCurrentPosition(nextPosition);
        if (nextPosition === currentWord.text.length) {
          handleSuccess();
        }
      } else {
        handleFailure();
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
    ]
  );

  // --- Effect Hooks (修改) ---
  useEffect(() => {
    if (currentWord?.text && currentWord.text !== prevWordRef.current) {
      resetInputState(true);
      setHasMadeMistake(false); // [!!! 新增 !!!] 切换单词时，重置犯错标记
      prevWordRef.current = currentWord.text;

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
    setHasMadeMistake, // [!!! 新增 !!!]
  ]);

  useEffect(() => {
    const keyPressHandler = (e: KeyboardEvent) => handleInputKeyPress(e);
    window.addEventListener('keydown', keyPressHandler);
    return () => window.removeEventListener('keydown', keyPressHandler);
  }, [handleInputKeyPress]);

  // --- 渲染逻辑 (不变) ---
  const renderWord = (word: string) => {
    // ... (内部代码无变化)
    if (!word) return null;
    const chars = word.split('');

    return (
      <div
        ref={wordContainerRef}
        className="flex items-center justify-center gap-2 transition-all duration-300 cursor-default"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {chars.map((char, index) => {
          const isEntered = index < currentPosition;
          const isCorrect =
            isEntered && userInput[index]?.toLowerCase() === char.toLowerCase();
          const isCurrent = index === currentPosition;
          const hasError = isError && isCurrent;

          let colorClass = 'text-gray-400 dark:text-gray-600';
          if (isEntered)
            colorClass = isCorrect
              ? 'text-green-500 dark:text-green-300'
              : 'text-red-500 dark:text-red-300';
          else if (hasError) colorClass = 'text-red-500 dark:text-red-300';
          else if (isCurrent) colorClass = 'text-gray-900 dark:text-gray-100';

          let charToShow = char;
          if (hiddenIndices.includes(index) && !isEntered && !isHovering) {
            charToShow = '_';
          }

          return (
            <span
              key={index}
              className={`text-5xl sm:text-7xl  tracking-tight ${colorClass}`}
            >
              {charToShow}
            </span>
          );
        })}
      </div>
    );
  };

  const playWordPronunciation = (type: 'uk' | 'us' | null = null) => {
    // ... (内部代码无变化)
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

  // --- JSX 返回 (不变) ---
  return (
    <div
      className="w-full flex flex-col items-center justify-center relative"
      style={{ minHeight: '300px' }}
    >
      <div className="mb-6 h-20 flex items-center">
        {renderWord(currentWord?.text || '')}
      </div>

      <PronunciationDisplay
        pronunciation={currentWord?.pronunciation}
        onPlay={handlePlaySelectedPronunciation}
        isPlaying={isPlaying}
        speechSupported={!!speechSupported}
      />

      <DefinitionDisplay definitions={currentWord?.definitions} />
    </div>
  );
}
