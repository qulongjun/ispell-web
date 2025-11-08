/*
 * @Date: 2025-10-30 14:56:46
 * @LastEditTime: 2025-11-08 23:55:18
 * @Description: 单词学习相关 API 服务，提供今日学习单词获取及学习进度更新功能
 */

import apiClient from '@/utils/api.utils';
import { handleApiError, ApiError } from '@/utils/error.utils';
import type { Word } from '@/types/word.types';

/**
 * 今日学习单词扩展类型，包含进度状态信息
 * @extends Word 基础单词信息
 * @property progressStatus - 进度状态（NEW: 新学, REVIEW: 复习, MASTERED: 已掌握）
 * @property progressId - 进度记录唯一标识
 */
export interface LearningWord extends Word {
  progressStatus: 'NEW' | 'REVIEW' | 'MASTERED' | string;
  progressId: number;
}

/**
 * 单词进度更新结果类型
 * @property progressId - 进度记录ID
 * @property status - 更新后的状态
 * @property nextReviewAt - 下次复习时间（ISO格式字符串，可选）
 */
export interface WordProgressUpdateResult {
  progressId: number;
  status: string;
  nextReviewAt?: string;
}

/**
 * 获取今日学习和复习的单词列表
 * @param listCode 书籍唯一标识
 * @param dueNewCount 今日应学新单词数量
 * @param dueReviewCount 今日应复习单词数量
 * @returns 学习单词列表（LearningWord[]）
 * @throws {ApiError} 获取失败时抛出，包含错误信息和状态码
 */
export async function fetchLearningWords(
  listCode: string,
  dueNewCount: number,
  dueReviewCount: number
): Promise<LearningWord[]> {
  const endpoint = `/words/today?listCode=${listCode}&dueNew=${dueNewCount}&dueReview=${dueReviewCount}`;
  console.log(`[单词服务] 获取今日学习单词列表: ${endpoint}`);

  try {
    const response = await apiClient(endpoint, { method: 'GET' });

    // 先检查HTTP响应状态
    if (!response.ok) {
      await handleApiError(response, '获取今日学习单词失败');
    }

    // 解析响应数据
    const data = await response.json();

    // 检查业务逻辑状态码
    if (data.code === 0) {
      const words: LearningWord[] = data.data.words || [];
      console.log(`[单词服务] 成功获取今日单词，共 ${words.length} 个`);
      return words;
    } else {
      throw new ApiError(data.message, data.code, response.status);
    }
  } catch (error) {
    console.error(`[单词服务错误] 获取今日学习单词失败:`, error);
    throw error; // 向上传递错误（ApiError类型）
  }
}

/**
 * 更新单词学习进度
 * @param progressId 进度记录ID
 * @param quality 学习质量（通常为0-5的数值，代表掌握程度）
 * @returns 进度更新结果（WordProgressUpdateResult）
 * @throws {ApiError} 更新失败时抛出，包含错误信息和状态码
 */
export async function updateWordProgress(
  progressId: number,
  quality: number
): Promise<WordProgressUpdateResult> {
  const endpoint = `/words/progress/${progressId}`;
  console.log(
    `[单词服务] 更新单词学习进度: progressId=${progressId}, quality=${quality}`
  );

  try {
    const response = await apiClient(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quality }),
    });

    // 检查HTTP响应状态
    if (!response.ok) {
      await handleApiError(response, '更新单词学习进度失败');
    }

    // 解析响应数据
    const data = await response.json();

    // 检查业务逻辑状态码
    if (data.code === 0) {
      console.log(`[单词服务] 单词进度更新成功: progressId=${progressId}`);
      return data.data as WordProgressUpdateResult;
    } else {
      throw new ApiError(data.message, data.code, response.status);
    }
  } catch (error) {
    console.error(
      `[单词服务错误] 更新单词进度失败: progressId=${progressId}`,
      error
    );
    throw error; // 向上传递错误
  }
}
