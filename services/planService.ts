/*
 * @Date: 2025-10-29 23:14:16
 * @LastEditTime: 2025-11-01 11:38:08
 * @Description: 学习计划相关 API 服务
 */

import apiClient from '@/utils/api.utils';
import { handleApiError } from '@/utils/error.utils';
import type { LearningPlan, PlanDetails } from '@/types/book.types';

/**
 * 获取用户所有激活的学习计划
 * @returns 用户的学习计划列表
 * @throws {Error} - 接口调用失败或未认证时抛出错误
 */
export async function fetchLearningList(): Promise<LearningPlan[]> {
  const endpoint = '/plans';
  console.log(`[Plan Service] Fetching user learning plans: ${endpoint}`);

  const response = await apiClient(endpoint, { method: 'GET' });

  if (!response.ok) {
    await handleApiError(response, 'Failed to fetch learning list.');
  }

  const data: LearningPlan[] = await response.json();
  console.log(
    `[Plan Service] Fetched learning plans successfully, total: ${data.length}`
  );

  return data;
}

/**
 * 创建或更新学习计划
 * @param listCode - 单词书编码（如 cet4_core）
 * @param plan - 学习计划详情（包含计划类型、数值、复习策略、学习顺序）
 * @returns 操作后的学习计划数据
 * @throws {Error} - 接口调用失败时抛出错误
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
  console.log(`[Plan Service] Saved learning plan successfully`);

  return data;
}

/**
 * 删除学习计划（取消学习）
 * @param planId - 学习计划 ID
 * @returns 操作结果提示
 * @throws {Error} - 接口调用失败时抛出错误
 */
export async function deletePlan(planId: number): Promise<{ message: string }> {
  const endpoint = `/plans/${planId}`;
  console.log(`[Plan Service] Deleting learning plan: planId=${planId}`);

  const response = await apiClient(endpoint, { method: 'DELETE' });

  if (!response.ok) {
    await handleApiError(response, 'Failed to delete learning plan.');
  }

  // 处理 204 No Content 响应（无返回体）
  if (response.status === 204) {
    console.log(
      `[Plan Service] Deleted learning plan successfully: planId=${planId}`
    );
    return { message: 'Plan deleted successfully' };
  }

  const data = await response.json();
  console.log(
    `[Plan Service] Deleted learning plan successfully: planId=${planId}`
  );

  return data;
}

/**
 * 重置学习计划（清空学习进度，重新开始）
 * @param planId - 学习计划 ID
 * @returns 重置后的学习计划数据
 * @throws {Error} - 接口调用失败时抛出错误
 */
export async function resetPlan(planId: number) {
  const endpoint = `/plans/${planId}/reset`;
  console.log(`[Plan Service] Resetting learning plan: planId=${planId}`);

  const response = await apiClient(endpoint, { method: 'POST' });

  if (!response.ok) {
    await handleApiError(response, 'Failed to reset learning plan.');
  }

  const data = await response.json();
  console.log(
    `[Plan Service] Reset learning plan successfully: planId=${planId}`
  );

  return data;
}

/**
 * 激活学习计划（设置为当前正在学习的计划）
 * @param planId - 学习计划 ID
 * @returns 激活后的学习计划数据
 * @throws {Error} - 接口调用失败时抛出错误
 */
export async function activatePlan(planId: number) {
  const endpoint = `/plans/${planId}/activate`;
  console.log(`[Plan Service] Activating learning plan: planId=${planId}`);

  const response = await apiClient(endpoint, { method: 'POST' });

  if (!response.ok) {
    await handleApiError(response, 'Failed to activate learning plan.');
  }

  const data = await response.json();
  console.log(
    `[Plan Service] Activated learning plan successfully: planId=${planId}`
  );

  return data;
}

/**
 * 推进学习计划到下一天
 * @param planId - 学习计划 ID
 * @returns 推进后的学习计划数据
 * @throws {Error} - 接口调用失败时抛出错误
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
    console.log(
      `[Plan Service] Advanced learning plan successfully: planId=${planId}`
    );

    return data;
  } catch (error) {
    console.error(
      `[Plan Service Error] Advance learning plan failed: planId=${planId}`,
      error
    );
    throw error;
  }
}
