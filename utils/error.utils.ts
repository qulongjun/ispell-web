/*
 * @Date: 2025-11-01 11:33:28
 * @Description: 错误处理通用工具
 */

/**
 * 前端自定义 API 错误类
 * 包含从后端接收的 HTTP 状态码和自定义业务代码
 */
export class ApiError extends Error {
  public readonly code: number;
  public readonly status: number;

  /**
   * @param {string} message - 开发者消息 (来自后端的 message 字段)
   * @param {number} code - 自定义业务代码 (来自后端的 code 字段)
   * @param {number} status - HTTP 状态码 (e.g., 400, 404, 500)
   */
  constructor(
    message: string = 'API Error',
    code: number = 1000, // 默认为通用错误
    status: number = 500
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

/**
 * 处理 API 响应错误。
 * 此函数现在解析后端的 { code, message, data } 结构并抛出一个 ApiError。
 * @param response - 接口响应对象
 * @param defaultMessage - 默认错误提示
 * @throws {ApiError} - 格式化后的错误对象
 */
export async function handleApiError(
  response: Response,
  defaultMessage: string = 'API request failed'
): Promise<never> {
  let errorData: { code?: number; message?: string } = {};

  try {
    // 尝试解析后端返回的 { code, message, data } 结构
    errorData = await response.json();
  } catch (e) {
    // 解析失败 (例如 502 Bad Gateway 可能返回 HTML)
    errorData.message = response.statusText || defaultMessage;
    errorData.code = response.status; // 使用 HTTP 状态码作为备用代码
  }

  // 抛出包含状态码和业务代码的 ApiError
  throw new ApiError(
    errorData.message || defaultMessage,
    errorData.code || response.status, // 确保有 code
    response.status
  );
}
