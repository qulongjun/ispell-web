'use client';
/*
 * @Date: 2025-10-27 11:44:29
 * @LastEditTime: 2025-11-01 15:53:41
 * @Description: 显示单词列表的侧边抽屉组件（支持国际化，配置路径：Words.WordList.drawer）
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { X, Volume2, Volume1 } from 'lucide-react';
import DefinitionDisplay from '@/components/common/DefinitionDisplay';
import { useSpelling } from '@/contexts/spelling.context';
import { useSpeechPlayer } from '@/hooks/useSpeechPlayer';
import { Word } from '@/types/word.types';
import { SpeechOptions } from '@/utils/speech.utils';

/**
 * 单词列表抽屉的 Props
 */
interface WordListDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 单词卡片组件的 Props
 */
interface WordCardProps {
  wordData: Word;
  onPlay: (wordToPlay: string) => void;
  isPlaying: boolean;
  isAnyWordPlaying: boolean;
  t: ReturnType<typeof useTranslations>;
}

/**
 * 单词卡片组件
 */
function WordCard({
  wordData,
  onPlay,
  isPlaying,
  isAnyWordPlaying,
  t,
}: WordCardProps) {
  const handlePlayClick = () => {
    if (!isAnyWordPlaying) {
      onPlay(wordData.text);
    }
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-lg transition-colors bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600">
      <div>
        <p className="text-xl font-medium text-gray-900 dark:text-white">
          {wordData.text}
        </p>
        <DefinitionDisplay definitions={wordData.definitions} />
      </div>

      {/* 播放按钮：国际化路径 -> Words.WordList.drawer.aria.playPronunciation */}
      <button
        onClick={handlePlayClick}
        disabled={isAnyWordPlaying}
        className={`p-2 rounded-full transition-colors ${
          isPlaying
            ? 'text-blue-500 bg-blue-100 dark:bg-blue-900/50'
            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-500'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        aria-label={t('WordList.drawer.aria.playPronunciation', {
          word: wordData.text,
        })}
      >
        {isPlaying ? <Volume2 size={18} /> : <Volume1 size={18} />}
      </button>
    </div>
  );
}

/**
 * 单词列表抽屉主组件
 */
export default function WordListDrawer({
  isOpen,
  onClose,
}: WordListDrawerProps) {
  // 国际化命名空间：根路径为 Words（对应配置结构）
  const t = useTranslations('Words');
  const { words, speechConfig } = useSpelling();
  const { speak, playingText, isPlaying } = useSpeechPlayer();

  const handlePlayWord = (wordToPlay: string) => {
    if (isPlaying) return;

    const configToPlay: SpeechOptions = {
      ...speechConfig,
      text: wordToPlay,
      onStart: () => {},
      onEnd: () => {},
      onError: (error) => {
        console.error(`播放 "${wordToPlay}" 出错:`, error.error);
      },
    };
    speak(configToPlay);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            aria-hidden="true"
          />

          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 h-full w-full max-w-md bg-white dark:bg-gray-800 shadow-2xl z-50 flex flex-col border-r border-gray-200 dark:border-gray-700"
            role="dialog"
            aria-modal="true"
            aria-labelledby="word-list-drawer-title"
          >
            {/* 标题栏：国际化路径 -> Words.WordList.drawer.title / closeList */}
            <div className="flex items-center justify-between p-4 shrink-0">
              <h2
                id="word-list-drawer-title"
                className="text-xl font-semibold text-gray-900 dark:text-white"
              >
                {t('WordList.drawer.title')}
              </h2>
              <button
                onClick={onClose}
                className="p-1 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label={t('WordList.drawer.aria.closeList')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 内容区：国际化路径 -> Words.WordList.drawer.emptyState */}
            <div className="flex-1 p-4 space-y-3 overflow-y-auto border-t border-gray-200 dark:border-gray-700">
              {words && words.length > 0 ? (
                words.map((word) => (
                  <WordCard
                    key={word.text}
                    wordData={word}
                    onPlay={handlePlayWord}
                    isPlaying={playingText === word.text}
                    isAnyWordPlaying={isPlaying}
                    t={t}
                  />
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center mt-4">
                  {t('WordList.drawer.emptyState')}
                </p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
