/*
 * @Date: 2025-10-27 07:33:45
 * @Description: 统一的语音播放 Hook
 */
'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useSpelling } from '@/contexts/spelling.context';
import { playPronunciation, SpeechOptions } from '@/utils/speech.utils';

/**
 * useSpeechPlayer Hook
 * @description 封装了所有语音播放逻辑，包括 API vs 浏览器切换、Fallback、状态管理。
 */
export const useSpeechPlayer = () => {
  const { isCustomSpeech, speechConfig } = useSpelling();

  // 状态：正在播放的文本 (null 表示未播放)
  const [playingText, setPlayingText] = useState<string | null>(null);
  // 状态：播放错误
  const [speechError, setSpeechError] = useState<string | null>(null);
  // 引用：用于 API 播放的 Audio 元素
  const apiAudioRef = useRef<HTMLAudioElement | null>(null);

  /**
   * 停止所有播放 (API 和浏览器)
   */
  const stop = useCallback(() => {
    // 停止 API
    if (apiAudioRef.current) {
      apiAudioRef.current.pause();
      apiAudioRef.current.src = '';
      apiAudioRef.current = null;
    }
    // 停止浏览器 TTS
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    // 重置状态
    setPlayingText(null);
  }, []);

  /**
   * 播放语音
   * @param options 包含 text, accent, 和可选回调
   */
  const speak = useCallback(
    (options: SpeechOptions) => {
      // 1. 先停止当前播放
      stop();

      // 2. 重置错误并设置播放中状态
      setSpeechError(null);
      setPlayingText(options.text); // 标记此文本正在播放

      // 3. 定义内部回调，确保状态被清理
      const internalOnStart = () => {
        options.onStart?.();
      };

      const internalOnEnd = () => {
        setPlayingText(null); // 清理状态
        options.onEnd?.();
      };

      const internalOnError = (
        error: SpeechSynthesisErrorEvent | Event, // 兼容 API 和 TTS
        errorMessage: string
      ) => {
        // console.error('Speech error:', errorMessage);
        setSpeechError(`播放失败: ${errorMessage}`);
        setPlayingText(null); // 清理状态

        // 确保传递的是 SpeechSynthesisErrorEvent 类型
        const event =
          error instanceof SpeechSynthesisErrorEvent
            ? error
            : // @ts-expect-error --- FORCE TYPE ---
              new SpeechSynthesisErrorEvent('error', { error: errorMessage });
        options.onError?.(event);
      };

      // 4. 策略 1: 自定义发音 (浏览器 TTS)
      if (isCustomSpeech) {
        console.log('Using Browser TTS');
        playPronunciation({
          ...speechConfig,
          ...options,
          onStart: internalOnStart,
          onEnd: internalOnEnd,
          onError: (e) => internalOnError(e, e.error),
        });
        return;
      }

      // 5. 策略 2: 默认发音 (API)
      console.log('Using API TTS');
      const audioType =
        (options.accent || speechConfig.accent) === 'en-GB' ? '1' : '2';
      const url = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(
        options.text
      )}&type=${audioType}`;

      const audio = new Audio(url);
      apiAudioRef.current = audio;

      // 手动触发 onStart
      internalOnStart();

      audio.onended = internalOnEnd;

      audio.onerror = (e) => {
        // @ts-expect-error --- FORCE TYPE ---
        internalOnError(e, 'api_failed_fallback');

        // 回退到浏览器发音
        playPronunciation({
          ...speechConfig,
          ...options,
          onStart: internalOnStart,
          onEnd: internalOnEnd,
          onError: (e_tts) => internalOnError(e_tts, e_tts.error),
        });
      };

      audio.play().catch(audio.onerror);
    },
    [isCustomSpeech, speechConfig, stop]
  );

  // Effect: 组件卸载时自动停止播放
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  // 派生状态：是否正在播放
  const isPlaying = useMemo(() => playingText !== null, [playingText]);

  // 返回 API
  return {
    speak,
    stop,
    playingText, // 正在播放的单词
    isPlaying, // 是否有任何东西在播放
    speechError, // 错误信息
  };
};
