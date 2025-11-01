/**
 * 书籍层级与学习计划相关类型定义
 * 功能：规范书籍层级结构（语言→分类→书籍）和学习计划数据格式，确保前后端数据交互一致性
 * 层级关系：L1(语言) → L2(分类/系列) → L3(书单/词汇表)
 */

/**
 * L3: 书单/词汇表（最底层，包含具体单词内容）
 * 描述：单本词汇书的核心信息，关联具体的单词列表
 */
export interface Book {
  id: number; // 书籍唯一ID（后端自增）
  listCode: string; // 书籍唯一编码（如"cet4_core"，用于接口查询）
  name: string; // 书籍名称（如"大学英语四级核心词汇"）
  totalWords: number; // 书籍包含的总单词数
  description: string | null; // 书籍描述（可选，介绍书籍特点、适用人群等）
}

/**
 * L2: 分类/系列（中间层，用于组织同类书籍）
 * 描述：同一语言下的书籍分类，如"英语"下的"考试类"、"日常类"
 */
export interface Category {
  id: number; // 分类唯一ID（后端自增）
  code: string; // 分类唯一编码（如"english_exam"）
  name: string; // 分类名称（如"英语考试系列"）
  description: string | null; // 分类描述（可选，介绍分类包含的书籍类型）
  wordLists: Book[]; // 该分类下的所有书籍（L3层级集合）
}

/**
 * L1: 语言（最顶层，用于区分不同语言体系）
 * 描述：最高级别的书籍组织维度，如"英语"、"日语"、"法语"
 */
export interface Language {
  id: number; // 语言唯一ID（后端自增）
  code: string; // 语言唯一编码（如"en"、"ja"，遵循ISO 639标准）
  name: string; // 语言全称（如"英语"、"日语"）
  shortName: string; // 语言简称（如"英"、"日"，用于UI紧凑展示）
  categories: Category[]; // 该语言下的所有分类（L2层级集合）
}

/**
 * 学习计划详情配置（前端与后端交互的核心结构）
 * 描述：定义学习计划的具体规则，包括学习节奏、复习策略和学习顺序
 */
export interface PlanDetails {
  type: 'preset' | 'customDays' | 'customWords'; // 计划类型
  // - preset: 预设计划（如"20天速成"）
  // - customDays: 自定义天数（用户指定总天数）
  // - customWords: 自定义每日单词量（用户指定每天学习数）
  value: number; // 计划数值（随type变化：preset对应预设ID，customDays对应总天数，customWords对应每日单词数）
  reviewStrategy: 'NONE' | 'EBBINGHAUS' | 'SM2' | 'LEITNER'; // 复习策略
  // - NONE: 无复习
  // - EBBINGHAUS: 艾宾浩斯记忆曲线
  // - SM2: 超级记忆法（Anki采用）
  // - LEITNER:  Leitner系统（卡片盒法）
  learningOrder: 'SEQUENTIAL' | 'RANDOM'; // 学习顺序
  // - SEQUENTIAL: 按书籍原顺序学习
  // - RANDOM: 随机顺序学习
}

/**
 * 用户学习计划（关联书籍与计划配置，包含学习进度）
 * 描述：用户为某本书创建的学习计划，包含计划配置、关联书籍信息和实时学习进度
 */
export interface LearningPlan {
  planId: number; // 学习计划唯一ID（后端自增）
  listCode: string; // 关联书籍的唯一编码（与Book.listCode对应）
  isCurrent: boolean; // 是否为用户当前激活的计划（同一时间仅一个激活计划）
  book: Book; // 关联的书籍详情（L3层级，包含书籍名称、总单词数等）
  series: {
    // 关联的分类信息（L2层级，简化版Category）
    name: string; // 分类名称（如"英语考试系列"）
    description: string | null; // 分类描述（简化自Category.description）
  };
  plan: PlanDetails; // 该计划的具体配置（学习规则）
  progress: {
    masteredCount: number; // 已掌握的单词数（完全记住）
    learnedCount: number; // 已学习的单词数（至少学过一次）
    totalWords: number; // 书籍总单词数（与Book.totalWords一致）
    currentChapter: number; // 当前学习到的章节
    totalChapters: number; // 书籍总章节数
    dueReviewCount: number; // 今日应复习的单词数
    dueNewCount: number; // 今日应学习的新单词数
    reviewedTodayCount: number; // 今日已复习的单词数
    learnedTodayCount: number; // 今日已学习的新单词数
  };
}
