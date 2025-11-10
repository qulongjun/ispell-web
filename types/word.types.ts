/*
 * @Date: 2025-10-26 09:55:11
 * @LastEditTime: 2025-11-10 18:39:43
 * @Description: 单词学习相关类型定义
 */
import { DisplayMode } from './setting.types';

/**
 * 单个发音项（包含音标和发音音频）
 * 用于存储单词的具体发音信息（如英式/美式的音标和对应音频）
 */
export interface PronunciationItem {
  phonetic: string; // 音标字符串（如英式音标 /ˈwɜːd/）
  speechUrl?: string; // 发音音频URL（可选，无音频时不返回）
}

/**
 * 单词发音信息（区分英式和美式）
 * 整合单词的不同口音发音数据
 */
export interface Pronunciation {
  uk?: PronunciationItem | null; // 英式发音（可选，部分单词可能无英式发音）
  us?: PronunciationItem | null; // 美式发音（可选，部分单词可能无美式发音）
}

/**
 * 单词释义项（新结构）
 * 存储单词在特定词性下的具体含义和元数据
 */
export interface DefinitionItem {
  translation: string; // 中文释义
  enTranslation?: string; // 英文释义 (可选)
  level?: string; // 难度等级 (可选)
  register?: string; // 语域 (可选)
  frequency?: string; // 频率 (可选)
}

/**
 * 单词释义数据（按词性分组的对象）
 * key 为词性 (如 "n.", "v."), value 为该词性的释义数组
 * 示例: {"n.": [DefinitionItem, ...], "v.": [DefinitionItem, ...]}
 */
export type DefinitionsData = Record<string, DefinitionItem[]>;

/**
 * 例句数据结构
 * 包含中英文对照、高亮显示版本及可选的例句发音
 */
export interface Sentence {
  cn: string; // 例句中文翻译
  en: string; // 例句英文原文
  en_highlighted: string; // 带高亮标记的英文例句（优先用于UI展示，如突出当前单词）
  speechUrl?: string; // 例句发音音频URL（可选）
}

/**
 * 近义词组（按词性分组）
 * 同一词性下的近义词集合及共同释义
 */
interface SynonymGroup {
  pos: string; // 词性缩写（与Definition.pos对应）
  words: string[]; // 近义词列表（如 ["happy", "glad"]）
  translation: string; // 近义词共同的中文释义（如 "adj. 快乐的"）
}

/**
 * 相关词（如反义词、衍生词等）
 * 与当前单词相关联的其他词汇及基本信息
 */
interface RelatedWord {
  pos: string; // 相关词的词性缩写
  word: string; // 相关词文本（如 "sad" 是 "happy" 的反义词）
  translation: string; // 相关词的中文释义
}

/**
 * 词语关系总结构
 * 整合单词的近义词组和其他相关词信息
 */
export interface Relations {
  synonyms?: SynonymGroup[]; // 近义词组列表（可选，无近义词时不返回）
  relatedWords?: RelatedWord[]; // 相关词列表（可选，无相关词时不返回）
}

/**
 * 单词核心数据结构
 * 包含单词的基本信息、发音、释义、例句及词语关系
 */
export interface Word {
  progressId: number;
  id: number; // 单词唯一ID（后端自增）
  pronunciation: Pronunciation; // 发音信息（英式/美式）
  definitions: DefinitionsData; // 释义列表（按词性分组）
  examples: {
    general: Sentence[]; // 通用例句列表（日常场景例句）
  };
  relations: Relations; // 词语关系（近义词、相关词等）
  text: string; // 单词文本（如 "word"）
}

/**
 * 学习统计数据
 * 记录单词学习过程中的关键指标（输入次数、正确率等）
 */
export interface Stats {
  time: string; // 统计时间（如 "2025-11-01" 或 "今天"）
  inputCount: number; // 总输入次数（用户尝试拼写的次数）
  correctCount: number; // 正确输入次数
  masteredCount: number; // 已掌握的单词数
  accuracy: number; // 正确率（correctCount / inputCount，百分比或小数）
}

/**
 * 导航回调函数类型
 * 用于拼写练习中切换上一个/下一个单词的处理函数
 */
export type NavigateCallback = () => void;

/**
 * 拼写练习上下文类型
 * 管理拼写练习的全局状态和操作方法，供练习组件共享
 */
export interface SpellingContextType {
  currentIndex: number; // 当前单词在列表中的索引
  currentWord: Word; // 当前正在练习的单词
  words: Word[]; // 本次练习的单词列表
  displayMode: DisplayMode; // 当前的单词显示模式
  stats: Stats; // 本次练习的统计数据
  progress: number; // 练习进度（0-100，百分比）
  isTimerRunning: boolean; // 计时器是否正在运行
  setDisplayMode: (mode: DisplayMode) => void; // 设置单词显示模式
  handlePrev: NavigateCallback; // 切换到上一个单词
  handleNext: NavigateCallback; // 切换到下一个单词
  startTimer: () => void; // 开始计时
  resetTimer: () => void; // 重置计时器
  incrementInputCount: () => void; // 增加总输入次数
  incrementCorrectCount: () => void; // 增加正确输入次数
}

/**
 * 描述：包含单词、释义和发音等核心信息
 */
export interface SimpleWord {
  id: number;
  word: string; // 单词原文 (来自 Prisma 的 'text' 字段)
  definitions: DefinitionsData; // 或更具体的 Definition[]，来自 JSON 字段
  pronunciation: Pronunciation; // 或更具体的 PronunciationType，来自 JSON 字段
}
