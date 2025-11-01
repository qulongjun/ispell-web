/*
 * @Date: 2025-10-26 11:10:22
 * @LastEditTime: 2025-10-27 22:15:01
 * @Description: 文本转语音工具函数（优化版：非阻塞预加载）
 */

import { AccentType, GenderType } from '@/types/word.types';

// 1. 导入新类型

// 2. 更新 SpeechOptions 接口
export interface SpeechOptions {
  text: string;
  lang?: string;
  volume?: number;
  rate?: number;
  pitch?: number;
  accent?: AccentType;
  gender?: GenderType;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: SpeechSynthesisErrorEvent) => void;
}

// --- 优化点 1: 缓存和预加载逻辑 ---
let voicesCache: SpeechSynthesisVoice[] = [];
let isVoicesLoaded = false;
// 用于确保 loadVoices 只被调用一次的 Promise
let loadVoicesPromise: Promise<SpeechSynthesisVoice[]> | null = null;

const loadVoices = (): Promise<SpeechSynthesisVoice[]> => {
  // 如果已加载，立即返回
  if (isVoicesLoaded && voicesCache.length > 0) {
    return Promise.resolve(voicesCache);
  }

  // 如果正在加载中，返回同一个 Promise
  if (loadVoicesPromise) {
    return loadVoicesPromise;
  }

  // 开始加载
  loadVoicesPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      isVoicesLoaded = false;
      return reject(new Error('Speech synthesis not supported.'));
    }

    const updateVoices = () => {
      const newVoices = window.speechSynthesis.getVoices();
      if (newVoices.length > 0) {
        voicesCache = newVoices;
        isVoicesLoaded = true;
        window.speechSynthesis.removeEventListener(
          'voiceschanged',
          updateVoices
        );
        // console.log("Voices loaded successfully:", voicesCache.length);
        resolve(voicesCache);
      }
    };

    window.speechSynthesis.addEventListener('voiceschanged', updateVoices);

    // 立即尝试获取（某些浏览器在启动时就已经准备好了）
    const initialVoices = window.speechSynthesis.getVoices();
    if (initialVoices.length > 0) {
      updateVoices(); // 直接调用来设置缓存和状态
    } else {
      // console.log("Waiting for 'voiceschanged' event...");
    }
  });

  return loadVoicesPromise;
};

// --- 优化点 2: 立即“预热”语音列表 ---
// 在模块加载时就触发，而不是在第一次播放时
if (typeof window !== 'undefined' && window.speechSynthesis) {
  loadVoices()
    .then((res) => {
      console.log('Speech synthesis voices pre-loaded.');
    })
    .catch((err) => {
      console.error('Failed to pre-load voices:', err.message);
    });
}

// 3. (保持) 定义硬编码的语音名称优先级列表
const PREFERRED_VOICES: Record<string, string[]> = {
  'en-GB-male': [
    'Daniel', // Safari
    'Google UK English Male',
    'Daniel', // macOS 经典
    'Microsoft James Online (Natural) - English (United Kingdom)',
    'Microsoft James - English (United Kingdom)',
    'Arthur', // macOS 新增
    'Ryan', // Windows 11 新增自然语音
    'Amazon Polly Matthew - en-GB',
    'IBM Watson English (UK) Male',
    'English (United Kingdom) - Male',
  ],
  'en-GB-female': [
    'Shelley',
    'Google UK English Female',
    'Kate', // macOS 经典
    'Microsoft Sonia Online (Natural) - English (United Kingdom)',
    'Microsoft Hazel - English (United Kingdom)',
    'Martha', // macOS 新增
    'Olivia', // Windows 11 新增自然语音
    'Amazon Polly Emma - en-GB',
    'IBM Watson English (UK) Female',
    'English (United Kingdom) - Female',
  ],
  'en-US-male': [
    'Fred',
    'Alex', // macOS 默认
    'Google US English Male',
    'Microsoft David Online (Natural) - English (United States)',
    'Microsoft David Desktop - English (United States)',
    'Fred',
    'Tom',
    'Microsoft Mark - English (United States)',
    'Ethan',
    'Amazon Polly Matthew - en-US',
    'IBM Watson English (US) Male',
    'English (United States) - Male',
    'Google US English',
  ],
  'en-US-female': [
    'Flo',
    'Samantha', // macOS 默认
    'Victoria',
    'Karen',
    'Google US English Female',
    'Microsoft Zira Online (Natural) - English (United States)',
    'Microsoft Zira Desktop - English (United States)',
    'Microsoft Hazel Desktop - English (United States)',
    'Aria',
    'Emma',
    'Amazon Polly Joanna - en-US',
    'IBM Watson English (US) Female',
    'English (United States) - Female',
    'Google US English',
  ],
};

// --- 优化点 3: 查找函数改为同步 ---
// 它不再等待加载，只检查当前缓存
const findVoiceByAccentAndGender = (
  accent: AccentType = 'en-US',
  gender: GenderType = 'auto'
): SpeechSynthesisVoice | null => {
  // 如果缓存未就绪，立即返回 null
  if (!isVoicesLoaded || voicesCache.length === 0) {
    // console.warn("findVoice: Cache not ready. Using default.");
    return null;
  }

  const availableVoices = voicesCache; // 使用缓存

  let targetGender = gender;
  // 处理 'auto' 性别
  if (gender === 'auto') {
    targetGender = Math.random() > 0.5 ? 'male' : 'female';
  }

  // 构造目标 key，例如 "en-US-male"
  const targetKey = `${accent}-${targetGender}`;
  const preferredNames = PREFERRED_VOICES[targetKey] || [];

  // (查找逻辑保持不变)
  for (const name of preferredNames) {
    const foundVoice = availableVoices.find((voice) => voice.name === name);
    if (foundVoice) {
      // console.log(`Found preferred voice for ${targetKey}: ${name}`);
      return foundVoice;
    }
  }

  // 回退查找
  // console.warn(`No preferred voice found for ${targetKey}. Trying fallback...`);
  const fallbackGenderKeyword = targetGender === 'male' ? 'male' : 'female';
  const fallbackVoice = availableVoices.find(
    (voice) =>
      voice.lang === accent &&
      voice.name.toLowerCase().includes(fallbackGenderKeyword)
  );

  if (fallbackVoice) {
    // console.log(`Found fallback voice for ${targetKey}: ${fallbackVoice.name}`);
    return fallbackVoice;
  }

  // 再次回退
  const accentFallback = availableVoices.find((voice) => voice.lang === accent);
  if (accentFallback) {
    // console.warn(`No gender-specific voice found for ${targetKey}. Using first voice for ${accent}: ${accentFallback.name}`);
    return accentFallback;
  }

  // console.warn(`No voice found for ${accent} at all. Using browser default.`);
  return null;
};

// --- 优化点 4: playPronunciation 改为同步 ---
// 移除 async，不再返回 Promise
export function playPronunciation(options: SpeechOptions) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    console.error('当前浏览器不支持文本转语音功能');
    // 调用 onError 回调（如果提供了）
    options.onError?.(
      new SpeechSynthesisErrorEvent('error', {
        error: 'speech_synthesis_not_supported',
      })
    );
    return; // 不再 throw Error
  }

  const {
    text,
    lang,
    volume = 1,
    rate = 1,
    pitch = 1,
    accent = 'en-US',
    gender = 'auto',
    onStart,
    onEnd,
    onError,
  } = options;

  if (!text.trim()) {
    console.error('播放文本不能为空');
    onError?.(new SpeechSynthesisErrorEvent('error', { error: 'empty_text' }));
    return;
  }

  // 创建语音实例
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.volume = Math.max(0, Math.min(1, volume));
  utterance.rate = Math.max(0.1, Math.min(10, rate));
  utterance.pitch = Math.max(0, Math.min(2, pitch));
  utterance.lang = lang || accent; // 设置一个初始 lang

  // 绑定事件回调
  if (onStart) utterance.addEventListener('start', onStart);
  if (onEnd) utterance.addEventListener('end', onEnd);
  if (onError) utterance.addEventListener('error', onError);

  // --- 优化点 5: 同步查找并设置语音 ---
  // 移除了 try/catch 和 Promise.race
  const specificVoice = findVoiceByAccentAndGender(accent, gender);

  if (specificVoice) {
    utterance.voice = specificVoice;
    utterance.lang = specificVoice.lang; // 确保 lang 和 voice 匹配
    console.log(
      `Using voice: ${specificVoice.name} | Lang: ${specificVoice.lang}`
    );
  } else {
    // console.log(`Using default voice for lang ${utterance.lang}`);
  }

  // --- 优化点 6: 立即播放 ---
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel(); // 打断上一个
  }
  window.speechSynthesis.speak(utterance); // 立即排队播放

  // 不再返回 Promise.resolve()
}
