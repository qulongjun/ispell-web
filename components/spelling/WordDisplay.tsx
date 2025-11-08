/*
 * @Date: 2025-10-26 10:02:44
 * @LastEditTime: 2025-11-08 23:23:49
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
      playCurrentWord();
    }, 1000);
  }, [
    errorSfx,
    setHasMadeMistake,
    updateWordProgressInContext,
    playCurrentWord,
    resetInputState,
    currentWord?.text,
    findNextInputtablePosition,
  ]);

  const handleInputKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (
        isComplete ||
        isError ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        !currentWord?.text ||
        !/^[a-zA-Z']$/.test(e.key) // 允许字母和撇号
      )
        return;

      const inputChar = e.key;
      const targetChar = currentWord.text[currentPosition];

      if (!targetChar) return;

      const newInput = [...userInput];
      newInput[currentPosition] = inputChar;
      setUserInput(newInput);

      const isMatch = inputChar === targetChar;

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

  // ... (Effect Hooks (useEffect) ... 保持不变) ...
  useEffect(() => {
    if (currentWord?.text && currentWord.text !== prevWordRef.current) {
      resetInputState(true);
      setCurrentPosition(findNextInputtablePosition(currentWord.text, 0));
      setHasMadeMistake(false);
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
    setHasMadeMistake,
    findNextInputtablePosition,
  ]);

  useEffect(() => {
    const keyPressHandler = (e: KeyboardEvent) => handleInputKeyPress(e);
    window.addEventListener('keydown', keyPressHandler);
    return () => window.removeEventListener('keydown', keyPressHandler);
  }, [handleInputKeyPress]);

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
            isCorrect = userInput[index] === char;
          }

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
    >
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
