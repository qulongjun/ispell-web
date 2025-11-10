/*
 * @Date: 2025-11-10 09:05:45
 * @LastEditTime: 2025-11-10 10:03:14
 * @Description: 系统设置相关类型定义
 */

/**
 * 口音类型（语音合成用）
 * 限定支持的语音口音选项
 */
export type AccentType = 'en-US' | 'en-GB'; // 美式英语 / 英式英语

/**
 * 语音性别类型（语音合成用）
 * 限定支持的语音性别选项
 */
export type GenderType = 'auto' | 'male' | 'female'; // 自动 / 男性 / 女性

/**
 * 语音合成配置
 * 控制单词/例句发音的参数（语言、语速、音量等）
 */
export interface SpeechConfig {
  lang: string; // 语言代码（如 'en-US' 对应美式英语）
  rate: number; // 语速（范围 0.1-10，1 为正常速度）
  volume: number; // 音量（范围 0-1，1 为最大音量）
  pitch: number; // 音调（范围 0-2，1 为默认音调）
  accent: AccentType; // 口音（美式/英式）
  gender: GenderType; // 语音性别（自动/男性/女性）
}

/**
 * 单词显示模式（拼写练习用）
 * 控制单词在练习中的隐藏/显示规则
 */
export type DisplayMode =
  | 'full' // 完全显示（无隐藏）
  | 'hideVowels' // 隐藏元音字母（a/e/i/o/u）
  | 'hideConsonants' // 隐藏辅音字母
  | 'hideRandom' // 随机隐藏部分字母
  | 'hideAll'; // 完全隐藏（全空白）

/**
 * 用户设置数据结构 (API 同步)
 * 描述所有需要跨设备同步的用户偏好设置
 */
export interface UserSettings {
  id: number;
  userId: number;
  speechConfig: SpeechConfig;
  isCustomSpeech: boolean;
  displayMode: DisplayMode;
  hideWordInSentence: boolean;
  showSentences: boolean;
  showSentenceTranslation: boolean;
  createdAt: string;
  updatedAt: string;
}
