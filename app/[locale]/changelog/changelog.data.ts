/*
 * @Date: 2025-11-06 21:11:15
 * @LastEditTime: 2025-11-09 19:19:54
 * @Description: 更新日志数据定义及具体日志内容
 */

/**
 * 变更类型枚举
 * 包含系统支持的所有变更类型：
 * - new: 新增功能
 * - fix: 问题修复
 * - refactor: 代码重构
 * - perf: 性能优化
 * - docs: 文档更新
 */
export type ChangeType = 'new' | 'fix' | 'refactor' | 'perf' | 'docs';

/**
 * 单条变更记录接口
 * 描述一个具体的变更内容
 */
export interface Change {
  /** 变更类型，对应 ChangeType 中的值 */
  type: ChangeType;
  /**
   * 变更描述的国际化键名
   * 对应 i18n JSON 文件中存储的翻译文本的 key
   */
  descriptionKey: string;
}

/**
 * 单个版本的更新日志接口
 * 描述一个版本的所有变更信息
 */
export interface ChangelogEntry {
  /** 版本号，格式如 v1.0.0 */
  version: string;
  /** 版本发布日期，采用 ISO 日期格式: YYYY-MM-DD */
  date: string;
  /** 该版本的所有变更记录列表 */
  changes: Change[];
}

/**
 * 系统更新日志完整数据
 * @description 按发布时间倒序排列，最新版本位于数组最上方
 */
export const changelogData: ChangelogEntry[] = [
   {
    version: 'v1.1.2',
    date: '2025-11-09',
    changes: [
      { type: 'fix', descriptionKey: 'v1_1_2.fix1' },
    ],
  },
  {
    version: 'v1.1.1',
    date: '2025-11-09',
    changes: [
      { type: 'fix', descriptionKey: 'v1_1_1.fix1' },
      { type: 'fix', descriptionKey: 'v1_1_1.fix2' },
      { type: 'fix', descriptionKey: 'v1_1_1.fix3' },
    ],
  },
  {
    version: 'v1.1.0',
    date: '2025-11-08',
    changes: [
      { type: 'new', descriptionKey: 'v1_1_0.new1' },
      { type: 'new', descriptionKey: 'v1_1_0.new2' },
      { type: 'new', descriptionKey: 'v1_1_0.new3' },
      { type: 'new', descriptionKey: 'v1_1_0.new4' },
      { type: 'refactor', descriptionKey: 'v1_1_0.refactor1' },
      { type: 'refactor', descriptionKey: 'v1_1_0.refactor2' },
      { type: 'fix', descriptionKey: 'v1_1_0.fix1' },
    ],
  },
  {
    version: 'v1.0.0',
    date: '2025-11-01',
    changes: [
      { type: 'new', descriptionKey: 'v1_0_0.new1' },
      { type: 'new', descriptionKey: 'v1_0_0.new2' },
      { type: 'new', descriptionKey: 'v1_0_0.new3' },
      { type: 'docs', descriptionKey: 'v1_0_0.docs1' },
    ],
  },
];