/*
 * @Date: 2025-11-01 11:33:28
 * @LastEditTime: 2025-11-01 11:47:32
 * @Description: 错误处理通用工具
 */
/**
 * 处理 API 响应错误
 * @param response - 接口响应对象
 * @param defaultMessage - 默认错误提示（接口无返回错误信息时使用）
 * @throws {Error} - 格式化后的错误对象（包含状态码和错误信息）
 */
export async function handleApiError(
  response: Response,
  defaultMessage: string = 'API request failed'
): Promise<never> {
  let errorData: { error?: string } = {};

  try {
    // 尝试解析接口返回的 JSON 格式错误信息
    errorData = await response.json();
  } catch (e) {
    // 解析失败（如空响应体），使用响应状态文本或默认信息
    errorData.error = response.statusText || defaultMessage;
  }

  // 抛出包含状态码和错误信息的错误
  throw new Error(
    `API Error (${response.status}): ${errorData.error || defaultMessage}`
  );
}
