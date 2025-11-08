/*
 * @Date: 2025-10-30 14:56:46
 * @Description: 单词学习相关 API 服务 (已更新为 code/message/data 结构)
 */

import apiClient from '@/utils/api.utils';
// [!! 修改 !!] 导入 ApiError
import { handleApiError, ApiError } from '@/utils/error.utils';
import type { Word } from '@/types/word.types';

/**
 * 今日学习单词扩展类型 (不变)
 */
export interface LearningWord extends Word {
  progressStatus: 'NEW' | 'REVIEW' | 'MASTERED' | string;
  progressId: number;
}

/**
 * [!! 已修复 !!]
 * 获取今日学习和复习的单词列表
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

    // [!! 1. 关键修复 !!] 先检查 response.ok
    if (!response.ok) {
      // e.g. 404 (PLAN_NOT_FOUND)
      await handleApiError(response, "Failed to fetch today's learning words.");
    }

    // [!! 2. 关键修复 !!] 只有在 OK 之后才调用 .json()
    const data = await response.json();

    // [!! 3. 关键修复 !!] 检查业务代码
    if (data.code === 0) {
      const words: LearningWord[] = data.data.words || [];
      console.log(
        `[Word Service] Fetched today's words successfully: total=${words.length}`
      );
      return words; // [!!] 返回 data.data.words
    } else {
      throw new ApiError(data.message, data.code, response.status);
    }
  } catch (error) {
    console.error(
      `[Word Service Error] Fetch today's learning words failed:`,
      error
    );
    throw error; // 向上抛出 (ApiError)
  }
}

/**
 * [!! 已修复 !!]
 * 更新单词学习进度
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

    // [!! 1. 关键修复 !!] 先检查 response.ok
    if (!response.ok) {
      // e.g. 400 (Validation) or 404 (PROGRESS_NOT_FOUND)
      await handleApiError(response, 'Failed to update word progress.');
    }

    // [!! 2. 关键修复 !!] 只有在 OK 之后才调用 .json()
    const data = await response.json();

    // [!! 3. 关键修复 !!] 检查业务代码
    if (data.code === 0) {
      console.log(
        `[Word Service] Updated word progress successfully: progressId=${progressId}`
      );
      return data.data; // [!!] 返回 data.data
    } else {
      throw new ApiError(data.message, data.code, response.status);
    }
  } catch (error) {
    console.error(
      `[Word Service Error] Update word progress failed: progressId=${progressId}`,
      error
    );
    throw error; // 向上抛出 (ApiError)
  }
}
