/*
 * @Date: 2025-11-06
 * @Description: 用户反馈 API 服务 (已更新为 code/message/data 结构)
 */

import apiClient from '@/utils/api.utils';
// [!! 新增 !!] 导入 ApiError 和 handleApiError
import { handleApiError, ApiError } from '@/utils/error.utils';

// 定义反馈类型 (不变)
export type FeedbackType = 'WORD' | 'FUNCTION' | 'BUG' | 'SUGGESTION';

// (不变)
interface FeedbackPayload {
  type: FeedbackType;
  content: string;
  contactEmail?: string;
}

/**
 * [!! 重大修改 !!]
 * 提交新的用户反馈
 */
export async function submitFeedback(
  type: FeedbackType,
  content: string,
  contactEmail?: string
): Promise<{ message: string }> {
  const endpoint = '/feedback';
  console.log(`[Feedback Service] 提交反馈: ${type}`);

  const bodyPayload: FeedbackPayload = {
    type,
    content,
    ...(contactEmail && { contactEmail }),
  };

  try {
    // [!! 1. 关键修复 !!]
    // 第三个参数 (requireAuth) 必须为 false。
    // 这告诉 apiClient: "如果请求失败了(401/403)，不要尝试刷新Token。"
    // apiClient 仍会(正确地)附加
    const response = await apiClient(
      endpoint,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyPayload),
      },
      false // [!!] 必须是 false (代表此路由是公开的)
    );

    // [!! 2. 关键修复 !!] 先检查 response.ok
    if (!response.ok) {
      // e.g. 400 (Validation failed) or 403 (Invalid Token)
      await handleApiError(response, 'Failed to submit feedback.');
    }

    // [!! 3. 关键修复 !!] 只有在 OK 之后才调用 .json()
    const data = await response.json();

    // [!! 4. 关键修复 !!] 检查业务代码
    if (data.code === 0) {
      return data.data; // 返回后端 success() 中的 data
    } else {
      // 抛出业务错误
      throw new ApiError(data.message, data.code, response.status);
    }
  } catch (error) {
    console.error(`[Feedback Service Error] 提交反馈失败:`, error);
    throw error; // 向上抛出 (ApiError)
  }
}
