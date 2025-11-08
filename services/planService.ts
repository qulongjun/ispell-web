/*
 * @Date: 2025-10-29 23:14:16
 * @LastEditTime: 2025-11-08 23:54:15
 * @Description: 学习计划相关 API 服务，提供学习计划的管理、单词进度跟踪及错题集管理功能
 */

import apiClient from '@/utils/api.utils';
import { handleApiError, ApiError } from '@/utils/error.utils';
import type { LearningPlan, PlanDetails } from '@/types/book.types';
import type { Definition, Pronunciation, Word } from '@/types/word.types';

// --- 学习计划核心功能 ---

/**
 * 获取用户所有激活的学习计划
 * @returns 学习计划数组（LearningPlan[]）
 * @throws {ApiError} 获取失败时抛出，包含错误信息和状态码
 */
export async function fetchLearningList(): Promise<LearningPlan[]> {
  const endpoint = '/plans';
  console.log(`[计划服务] 获取用户学习计划列表: ${endpoint}`);

  const response = await apiClient(endpoint, { method: 'GET' });

  if (!response.ok) {
    await handleApiError(response, '获取学习计划列表失败');
  }

  const data = await response.json();

  if (data.code === 0) {
    const learningList: LearningPlan[] = data.data;
    console.log(`[计划服务] 成功获取学习计划，共 ${learningList.length} 个`);
    return learningList;
  } else {
    throw new ApiError(data.message, data.code, response.status);
  }
}

/**
 * 创建或更新学习计划
 * @param listCode 书籍唯一标识
 * @param plan 学习计划详情（包含类型、每日数量、复习策略等）
 * @returns 学习计划对象（LearningPlan）
 * @throws {ApiError} 保存失败时抛出
 */
export async function savePlan(
  listCode: string,
  plan: PlanDetails
): Promise<LearningPlan> {
  const endpoint = '/plans';
  console.log(
    `[计划服务] 保存学习计划: listCode=${listCode}, plan=${JSON.stringify(
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
    await handleApiError(response, '保存学习计划失败');
  }

  const data = await response.json();

  if (data.code === 0) {
    console.log(`[计划服务] 学习计划保存成功`);
    return data.data as LearningPlan;
  } else {
    throw new ApiError(data.message, data.code, response.status);
  }
}

/**
 * 删除学习计划（取消学习）
 * @param planId 计划ID
 * @returns 包含成功信息的对象 { message: string }
 * @throws {ApiError} 删除失败时抛出
 */
export async function deletePlan(planId: number): Promise<{ message: string }> {
  const endpoint = `/plans/${planId}`;
  console.log(`[计划服务] 删除学习计划: planId=${planId}`);

  const response = await apiClient(endpoint, { method: 'DELETE' });

  if (!response.ok) {
    await handleApiError(response, '删除学习计划失败');
  }

  // 即使HTTP状态为200，仍需检查业务状态码
  const data = await response.json();

  if (data.code === 0) {
    return { message: data.message || '学习计划已成功删除' };
  } else {
    throw new ApiError(data.message, data.code, response.status);
  }
}

/**
 * 重置学习计划（清空进度，重新开始）
 * @param planId 计划ID
 * @returns 重置后的学习计划对象（LearningPlan）
 * @throws {ApiError} 重置失败时抛出
 */
export async function resetPlan(planId: number): Promise<LearningPlan> {
  const endpoint = `/plans/${planId}/reset`;
  console.log(`[计划服务] 重置学习计划: planId=${planId}`);

  const response = await apiClient(endpoint, { method: 'POST' });

  if (!response.ok) {
    await handleApiError(response, '重置学习计划失败');
  }

  const data = await response.json();

  if (data.code === 0) {
    console.log(`[计划服务] 学习计划重置成功: planId=${planId}`);
    return data.data as LearningPlan;
  } else {
    throw new ApiError(data.message, data.code, response.status);
  }
}

/**
 * 激活学习计划（开始或恢复学习）
 * @param planId 计划ID
 * @returns 激活后的学习计划对象（LearningPlan）
 * @throws {ApiError} 激活失败时抛出
 */
export async function activatePlan(planId: number): Promise<LearningPlan> {
  const endpoint = `/plans/${planId}/activate`;
  console.log(`[计划服务] 激活学习计划: planId=${planId}`);

  const response = await apiClient(endpoint, { method: 'POST' });

  if (!response.ok) {
    await handleApiError(response, '激活学习计划失败');
  }

  const data = await response.json();

  if (data.code === 0) {
    return data.data as LearningPlan;
  } else {
    throw new ApiError(data.message, data.code, response.status);
  }
}

/**
 * 推进学习计划到下一天
 * @param planId 计划ID
 * @returns 推进后的学习计划对象（LearningPlan）
 * @throws {ApiError} 推进失败时抛出
 */
export async function advancePlan(planId: number): Promise<LearningPlan> {
  const endpoint = `/plans/${planId}/advance`;
  console.log(`[计划服务] 推进学习计划到下一天: planId=${planId}`);

  try {
    const response = await apiClient(endpoint, { method: 'POST' });

    if (!response.ok) {
      await handleApiError(response, '推进学习计划失败');
    }

    const data = await response.json();

    if (data.code === 0) {
      console.log(`[计划服务] 学习计划推进成功: planId=${planId}`);
      return data.data as LearningPlan;
    } else {
      throw new ApiError(data.message, data.code, response.status);
    }
  } catch (error) {
    console.error(`[计划服务错误] 推进学习计划失败: planId=${planId}`, error);
    throw error;
  }
}

// --- 计划单词按天列表相关类型与接口 ---

/**
 * 每日计划单词项
 * @property id - 单词在计划中的唯一标识
 * @property word - 单词文本
 * @property definitions - 单词释义列表（可为null）
 * @property pronunciation - 单词发音信息（可选）
 */
export type PlanDayWord = {
  id: number;
  word: string;
  definitions: Definition[] | null;
  pronunciation?: Pronunciation[];
};

/**
 * 按天分组的计划单词
 * @property day - 天数（第几天的学习内容）
 * @property words - 当天的单词列表
 */
export type PlanDayWords = {
  day: number;
  words: PlanDayWord[];
};

/**
 * 获取计划的按天单词列表
 * @param planId 计划ID
 * @returns 按天分组的单词列表（PlanDayWords[]）
 * @throws {ApiError} 获取失败时抛出
 */
export async function getPlanWordsByDay(
  planId: number
): Promise<PlanDayWords[]> {
  const endpoint = `/plans/${planId}/words`;
  console.log(`[计划服务] 获取计划按天单词列表: planId=${planId}`);

  try {
    const response = await apiClient(endpoint, { method: 'GET' });

    if (!response.ok) {
      await handleApiError(response, '获取计划单词列表失败');
    }

    const data = await response.json();

    if (data.code === 0) {
      const words: PlanDayWords[] = data.data;
      console.log(`[计划服务] 成功获取计划单词列表`);
      return words;
    } else {
      throw new ApiError(data.message, data.code, response.status);
    }
  } catch (error) {
    console.error(
      `[计划服务错误] 获取计划单词列表失败: planId=${planId}`,
      error
    );
    throw error;
  }
}

// --- 错题集相关类型与接口 ---

/**
 * 错题集条目
 * @property id - 错题记录ID
 * @property planId - 所属计划ID
 * @property wordId - 单词ID
 * @property mistakeCount - 错误次数
 * @property createdAt - 创建时间
 * @property updatedAt - 更新时间
 * @property word - 单词详情
 */
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
 * 获取指定计划的错题集列表
 * @param planId 计划ID
 * @returns 错题集条目数组（MistakeEntry[]）
 * @throws {ApiError} 获取失败时抛出
 */
export const getMistakes = async (planId: number): Promise<MistakeEntry[]> => {
  const endpoint = `/plans/${planId}/mistakes`;
  console.log(`[计划服务] 获取计划错题集: planId=${planId}`);

  try {
    const response = await apiClient(endpoint, { method: 'GET' });

    if (!response.ok) {
      await handleApiError(response, '获取错题集失败');
    }

    const data = await response.json();

    if (data.code === 0) {
      return data.data as MistakeEntry[];
    } else {
      throw new ApiError(data.message, data.code, response.status);
    }
  } catch (error) {
    console.error(`[计划服务错误] 获取错题集失败:`, error);
    throw error;
  }
};

/**
 * 获取错题集复习单词列表
 * @param planId 计划ID
 * @returns 包含单词列表的对象 { words: Word[] }
 * @throws {ApiError} 获取失败时抛出
 */
export const getMistakeReviewWords = async (
  planId: number
): Promise<{ words: Word[] }> => {
  const endpoint = `/plans/${planId}/mistakes/review`;
  console.log(`[计划服务] 获取错题复习单词: planId=${planId}`);

  try {
    const response = await apiClient(endpoint, { method: 'GET' });

    if (!response.ok) {
      await handleApiError(response, '获取错题复习单词失败');
    }

    const data = await response.json();

    if (data.code === 0) {
      // 后端返回结构: { data: { words: [...] } }
      return data.data as { words: Word[] };
    } else {
      throw new ApiError(data.message, data.code, response.status);
    }
  } catch (error) {
    console.error(`[计划服务错误] 获取错题复习单词失败:`, error);
    throw error;
  }
};

/**
 * 从错题集移除单个单词
 * @param planId 计划ID
 * @param wordId 单词ID
 * @returns 包含成功信息的对象 { message: string }
 * @throws {ApiError} 移除失败时抛出
 */
export const removeMistake = async (
  planId: number,
  wordId: number
): Promise<{ message: string }> => {
  const endpoint = `/plans/${planId}/mistakes/words/${wordId}`;
  console.log(`[计划服务] 移除错题集中的单词: plan=${planId}, word=${wordId}`);

  try {
    const response = await apiClient(endpoint, { method: 'DELETE' });

    if (!response.ok) {
      await handleApiError(response, '移除错题失败');
    }

    const data = await response.json();

    if (data.code === 0) {
      return { message: data.message || '单词已从错题集移除' };
    } else {
      throw new ApiError(data.message, data.code, response.status);
    }
  } catch (error) {
    console.error(`[计划服务错误] 移除错题失败:`, error);
    throw error;
  }
};

/**
 * 清空计划的错题集
 * @param planId 计划ID
 * @returns 包含成功信息的对象 { message: string }
 * @throws {ApiError} 清空失败时抛出
 */
export const clearMistakes = async (
  planId: number
): Promise<{ message: string }> => {
  const endpoint = `/plans/${planId}/mistakes`;
  console.log(`[计划服务] 清空计划错题集: planId=${planId}`);

  try {
    const response = await apiClient(endpoint, { method: 'DELETE' });

    if (!response.ok) {
      await handleApiError(response, '清空错题集失败');
    }

    const data = await response.json();

    if (data.code === 0) {
      return { message: data.message || '错题集已清空' };
    } else {
      throw new ApiError(data.message, data.code, response.status);
    }
  } catch (error) {
    console.error(`[计划服务错误] 清空错题集失败:`, error);
    throw error;
  }
};
