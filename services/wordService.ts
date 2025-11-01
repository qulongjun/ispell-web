/*
 * @Date: 2025-10-30 14:56:46
 * @LastEditTime: 2025-11-01 11:40:07
 * @Description: 单词学习相关 API 服务
 */

import apiClient from '@/utils/api.utils';
import { handleApiError } from '@/utils/error.utils';
import type { Word } from '@/types/word.types';

/**
 * 今日学习单词扩展类型（包含学习进度状态和进度 ID）
 */
export interface LearningWord extends Word {
  progressStatus: 'NEW' | 'REVIEW' | 'MASTERED' | string; // 学习状态
  progressId: number; // 单词进度记录 ID
}

/**
 * 获取今日学习和复习的单词列表
 * @param listCode - 当前激活的单词书编码
 * @param dueNewCount - 今日剩余新词学习配额
 * @param dueReviewCount - 今日剩余复习单词配额
 * @returns 今日待学习/复习的单词列表
 * @throws {Error} - 接口调用失败时抛出错误
 */
export async function fetchLearningWords(
  listCode: string,
  dueNewCount: number,
  dueReviewCount: number
): Promise<LearningWord[]> {
  const endpoint = `/words/today?listCode=${listCode}&dueNew=${dueNewCount}&dueReview=${dueReviewCount}`;
  console.log(`[Word Service] Fetching today's learning words: ${endpoint}`);

  try {
    const response = await apiClient(endpoint, { method: 'GET' });

    if (!response.ok) {
      await handleApiError(response, "Failed to fetch today's learning words.");
    }

    const data = await response.json();
    const words: LearningWord[] = data.words || [];
    console.log(
      `[Word Service] Fetched today's words successfully: total=${words.length}`
    );

    return words;
  } catch (error) {
    console.error(
      `[Word Service Error] Fetch today's learning words failed:`,
      error
    );
    throw error;
  }
}

/**
 * 更新单词学习进度
 * @param progressId - 单词进度记录 ID
 * @param quality - 回答质量（1=错误，5=正确）
 * @returns 更新后的单词进度数据
 * @throws {Error} - 接口调用失败时抛出错误
 */
export async function updateWordProgress(progressId: number, quality: number) {
  const endpoint = `/words/progress/${progressId}`;
  console.log(
    `[Word Service] Updating word progress: progressId=${progressId}, quality=${quality}`
  );

  try {
    const response = await apiClient(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quality }),
    });

    if (!response.ok) {
      await handleApiError(response, 'Failed to update word progress.');
    }

    const data = await response.json();
    console.log(
      `[Word Service] Updated word progress successfully: progressId=${progressId}`
    );

    return data;
  } catch (error) {
    console.error(
      `[Word Service Error] Update word progress failed: progressId=${progressId}`,
      error
    );
    throw error;
  }
}
