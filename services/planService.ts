/*
 * @Date: 2025-10-29 23:14:16
 * @Description: 学习计划相关 API 服务 (已更新为 code/message/data 结构)
 */

import apiClient from '@/utils/api.utils';
// [!! 修改 !!] 导入 ApiError
import { handleApiError, ApiError } from '@/utils/error.utils';
import type { LearningPlan, PlanDetails } from '@/types/book.types';
// 假设 Word 类型定义在 @/types/word.types
import type { Definition, Pronunciation, Word } from '@/types/word.types';

/**
 * [!! 已修复 !!]
 * 获取用户所有激活的学习计划
 */
export async function fetchLearningList(): Promise<LearningPlan[]> {
  const endpoint = '/plans';
  console.log(`[Plan Service] Fetching user learning plans: ${endpoint}`);

  const response = await apiClient(endpoint, { method: 'GET' });

  if (!response.ok) {
    await handleApiError(response, 'Failed to fetch learning list.');
  }

  const data = await response.json();

  if (data.code === 0) {
    const learningList: LearningPlan[] = data.data;
    console.log(
      `[Plan Service] Fetched learning plans successfully, total: ${learningList.length}`
    );
    return learningList;
  } else {
    throw new ApiError(data.message, data.code, response.status);
  }
}

/**
 * [!! 已修复 !!]
 * 创建或更新学习计划
 */
export async function savePlan(listCode: string, plan: PlanDetails) {
  const endpoint = '/plans';
  console.log(
    `[Plan Service] Saving learning plan: listCode=${listCode}, plan=${JSON.stringify(
      plan
    )}`
  );

  const response = await apiClient(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      listCode,
      planType: plan.type,
      planValue: plan.value,
      reviewStrategy: plan.reviewStrategy,
      learningOrder: plan.learningOrder,
    }),
  });

  if (!response.ok) {
    await handleApiError(response, 'Failed to save learning plan.');
  }

  const data = await response.json();

  if (data.code === 0) {
    console.log(`[Plan Service] Saved learning plan successfully`);
    return data.data;
  } else {
    throw new ApiError(data.message, data.code, response.status);
  }
}

/**
 * [!! 已修复 !!]
 * 删除学习计划（取消学习）
 */
export async function deletePlan(planId: number): Promise<{ message: string }> {
  const endpoint = `/plans/${planId}`;
  console.log(`[Plan Service] Deleting learning plan: planId=${planId}`);

  const response = await apiClient(endpoint, { method: 'DELETE' });

  if (!response.ok) {
    await handleApiError(response, 'Failed to delete learning plan.');
  }

  // 虽然后端返回 200，但依然需要解析 body 来检查 code
  const data = await response.json();

  if (data.code === 0) {
    return { message: data.message || 'Plan deleted successfully' };
  } else {
    throw new ApiError(data.message, data.code, response.status);
  }
}

/**
 * [!! 已修复 !!]
 * 重置学习计划
 */
export async function resetPlan(planId: number) {
  const endpoint = `/plans/${planId}/reset`;
  console.log(`[Plan Service] Resetting learning plan: planId=${planId}`);

  const response = await apiClient(endpoint, { method: 'POST' });

  if (!response.ok) {
    await handleApiError(response, 'Failed to reset learning plan.');
  }

  const data = await response.json();

  if (data.code === 0) {
    console.log(
      `[Plan Service] Reset learning plan successfully: planId=${planId}`
    );
    return data.data;
  } else {
    throw new ApiError(data.message, data.code, response.status);
  }
}

/**
 * [!! 已修复 !!]
 * 激活学习计划
 */
export async function activatePlan(planId: number) {
  const endpoint = `/plans/${planId}/activate`;
  console.log(`[Plan Service] Activating learning plan: planId=${planId}`);

  const response = await apiClient(endpoint, { method: 'POST' });

  if (!response.ok) {
    await handleApiError(response, 'Failed to activate learning plan.');
  }

  const data = await response.json();

  if (data.code === 0) {
    return data.data;
  } else {
    throw new ApiError(data.message, data.code, response.status);
  }
}

/**
 * [!! 已修复 !!]
 * 推进学习计划到下一天
 */
export async function advancePlan(planId: number) {
  const endpoint = `/plans/${planId}/advance`;
  console.log(`[Plan Service] Advancing learning plan: planId=${planId}`);

  try {
    const response = await apiClient(endpoint, { method: 'POST' });

    if (!response.ok) {
      await handleApiError(response, 'Failed to advance learning plan.');
    }

    const data = await response.json();

    if (data.code === 0) {
      console.log(
        `[Plan Service] Advanced learning plan successfully: planId=${planId}`
      );
      return data.data;
    } else {
      throw new ApiError(data.message, data.code, response.status);
    }
  } catch (error) {
    console.error(
      `[Plan Service Error] Advance learning plan failed: planId=${planId}`,
      error
    );
    throw error;
  }
}

// ... (PlanDayWord/PlanDayWords types unchanged) ...
export type PlanDayWord = {
  id: number;
  word: string;
  definitions: Definition[] | null;
  pronunciation?: Pronunciation[];
};

export type PlanDayWords = {
  day: number;
  words: PlanDayWord[];
};

/**
 * [!! 已修复 !!]
 * 获取计划的按天单词列表
 */
export async function getPlanWordsByDay(
  planId: number
): Promise<PlanDayWords[]> {
  const endpoint = `/plans/${planId}/words`;
  console.log(`[Plan Service] Fetching word list by day for plan: ${planId}`);

  try {
    const response = await apiClient(endpoint, { method: 'GET' });

    if (!response.ok) {
      await handleApiError(response, 'Failed to fetch plan words.');
    }

    const data = await response.json();

    if (data.code === 0) {
      const words: PlanDayWords[] = data.data;
      console.log(`[Plan Service] Fetched plan words successfully.`);
      return words;
    } else {
      throw new ApiError(data.message, data.code, response.status);
    }
  } catch (error) {
    console.error(
      `[Plan Service Error] Fetching plan words failed: planId=${planId}`,
      error
    );
    throw error;
  }
}

// --- 错题集服务 ---

// ... (MistakeEntry type unchanged) ...
export interface MistakeEntry {
  id: number;
  planId: number;
  wordId: number;
  mistakeCount: number;
  createdAt: string;
  updatedAt: string;
  word: Word;
}

/**
 * [!! 已修复 !!]
 * 1. 获取指定计划的错题集列表
 */
export const getMistakes = async (planId: number): Promise<MistakeEntry[]> => {
  const endpoint = `/plans/${planId}/mistakes`;
  console.log(`[Plan Service] Fetching mistakes for plan: ${planId}`);
  try {
    const response = await apiClient(endpoint, { method: 'GET' });

    if (!response.ok) {
      await handleApiError(response, 'Failed to fetch mistakes.');
    }

    const data = await response.json();

    if (data.code === 0) {
      return data.data;
    } else {
      throw new ApiError(data.message, data.code, response.status);
    }
  } catch (error) {
    console.error(`[Plan Service Error] Fetching mistakes failed:`, error);
    throw error;
  }
};

/**
 * [!! 已修复 !!]
 * 2. 获取错题集复习单词列表
 */
export const getMistakeReviewWords = async (
  planId: number
): Promise<{ words: Word[] }> => {
  const endpoint = `/plans/${planId}/mistakes/review`;
  console.log(
    `[Plan Service] Fetching mistake review words for plan: ${planId}`
  );
  try {
    const response = await apiClient(endpoint, { method: 'GET' });

    if (!response.ok) {
      await handleApiError(response, 'Failed to fetch mistake review words.');
    }

    const data = await response.json();

    if (data.code === 0) {
      // 后端返回 { data: { words: [...] } } 结构
      return data.data;
    } else {
      throw new ApiError(data.message, data.code, response.status);
    }
  } catch (error) {
    console.error(
      `[Plan Service Error] Fetching mistake review words failed:`,
      error
    );
    throw error;
  }
};

/**
 * [!! 已修复 !!]
 * 3. 从错题集移除单个单词
 */
export const removeMistake = async (
  planId: number,
  wordId: number
): Promise<{ message: string }> => {
  const endpoint = `/plans/${planId}/mistakes/words/${wordId}`;
  console.log(
    `[Plan Service] Removing mistake: plan=${planId}, word=${wordId}`
  );
  try {
    const response = await apiClient(endpoint, { method: 'DELETE' });

    if (!response.ok) {
      await handleApiError(response, 'Failed to remove mistake.');
    }

    const data = await response.json();

    if (data.code === 0) {
      return { message: data.message || 'Mistake removed successfully' };
    } else {
      throw new ApiError(data.message, data.code, response.status);
    }
  } catch (error) {
    console.error(`[Plan Service Error] Removing mistake failed:`, error);
    throw error;
  }
};

/**
 * [!! 已修复 !!]
 * 4. 清空计划的错题集
 */
export const clearMistakes = async (
  planId: number
): Promise<{ message: string }> => {
  const endpoint = `/plans/${planId}/mistakes`;
  console.log(`[Plan Service] Clearing all mistakes for plan: ${planId}`);
  try {
    const response = await apiClient(endpoint, { method: 'DELETE' });

    if (!response.ok) {
      await handleApiError(response, 'Failed to clear mistakes.');
    }

    const data = await response.json();

    if (data.code === 0) {
      return { message: data.message || 'Mistakes cleared successfully' };
    } else {
      throw new ApiError(data.message, data.code, response.status);
    }
  } catch (error) {
    console.error(`[Plan Service Error] Clearing mistakes failed:`, error);
    throw error;
  }
};
