/*
 * @Date: 2025-11-06
 * @LastEditTime: 2025-11-08 23:50:15
 * @Description: 用户反馈 API 服务，处理用户反馈的提交功能
 */

import apiClient from '@/utils/api.utils';
import { handleApiError, ApiError } from '@/utils/error.utils';

/**
 * 反馈类型枚举
 * - WORD: 单词相关反馈
 * - FUNCTION: 功能相关反馈
 * - BUG: 缺陷报告
 * - SUGGESTION: 建议反馈
 */
export type FeedbackType = 'WORD' | 'FUNCTION' | 'BUG' | 'SUGGESTION';

/**
 * 反馈提交参数接口
 */
interface FeedbackPayload {
  type: FeedbackType;
  content: string;
  contactEmail?: string;
}

/**
 * 提交用户反馈
 * @param type 反馈类型（WORD/FUNCTION/BUG/SUGGESTION）
 * @param content 反馈内容（必填，详细描述）
 * @param contactEmail 联系邮箱（可选，用于后续沟通）
 * @returns 包含成功信息的对象 { message: string }
 * @throws {ApiError} 提交失败时抛出（包含错误信息和状态码）
 *
 * 说明：该接口为公开接口，无需登录即可提交反馈，因此requireAuth参数设为false
 */
export async function submitFeedback(
  type: FeedbackType,
  content: string,
  contactEmail?: string
): Promise<{ message: string }> {
  const endpoint = '/feedback';
  console.log(`[反馈服务] 提交反馈 (类型: ${type})`);

  // 构建请求体，仅在contactEmail存在时添加该字段
  const bodyPayload: FeedbackPayload = {
    type,
    content,
    ...(contactEmail && { contactEmail }),
  };

  try {
    // 调用API客户端，第三个参数设为false（公开接口，无需Token刷新逻辑）
    const response = await apiClient(
      endpoint,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyPayload),
      },
      false
    );

    // 先检查HTTP响应状态
    if (!response.ok) {
      await handleApiError(response, '提交反馈失败');
    }

    // 解析响应数据
    const data = await response.json();

    // 检查业务逻辑状态码
    if (data.code === 0) {
      return data.data; // 返回后端成功响应中的数据
    } else {
      throw new ApiError(data.message, data.code, response.status);
    }
  } catch (error) {
    console.error(`[反馈服务错误] 提交反馈失败:`, error);
    throw error; // 向上传递错误（保持错误类型为ApiError）
  }
}
