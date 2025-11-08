/*
 * @Date: 2025-10-29 21:17:59
 * @LastEditTime: 2025-11-10 18:00:00
 * @Description: 书籍相关 API 服务，提供书籍层级结构和单词列表的获取功能
 */

import apiClient from '@/utils/api.utils';
import { handleApiError, ApiError } from '@/utils/error.utils';
import type { Language } from '@/types/book.types';
import { SimpleWord } from '@/types/word.types';

/**
 * 获取完整的三级书籍层级结构（语言→书籍→章节）
 * @returns 语言列表，每个语言包含其下的书籍及章节信息
 * @throws {ApiError} 接口调用失败或业务逻辑错误时抛出
 */
export async function fetchBookHierarchy(): Promise<Language[]> {
  const endpoint = '/books/hierarchy';
  console.log(`[书籍服务] 获取书籍层级结构: ${endpoint}`);

  try {
    const response = await apiClient(endpoint, { method: 'GET' }, false);

    // 先检查HTTP响应状态
    if (!response.ok) {
      await handleApiError(response, '获取书籍层级结构失败');
    }

    // 状态正常时解析响应数据
    const data = await response.json();

    // 检查业务逻辑状态码
    if (data.code === 0) {
      return data.data; // 返回语言层级结构数组
    } else {
      throw new ApiError(data.message, data.code, response.status);
    }
  } catch (error) {
    console.error(`[书籍服务错误] 获取书籍层级结构失败:`, error);
    throw error; // 向上传递错误（可能是ApiError）
  }
}

/**
 * 获取指定书本（通过listCode标识）的完整单词列表
 * @param listCode 书本唯一标识编码
 * @returns 单词列表（SimpleWord类型数组）
 * @throws {ApiError} 接口调用失败、书本不存在或业务逻辑错误时抛出
 */
export async function getWordsByBook(listCode: string): Promise<SimpleWord[]> {
  const endpoint = `/books/${listCode}/words`;
  console.log(`[书籍服务] 获取书本单词列表: ${endpoint}`);

  try {
    const response = await apiClient(endpoint, { method: 'GET' }, false);

    // 检查HTTP响应状态
    if (!response.ok) {
      await handleApiError(response, '获取书本单词列表失败');
    }

    // 解析响应数据
    const data = await response.json();

    // 检查业务逻辑状态
    if (data.code === 0) {
      // 后端返回格式为 { data: { words: [...] } }
      return data.data.words; // 返回单词数组
    } else {
      throw new ApiError(data.message, data.code, response.status);
    }
  } catch (error) {
    console.error(`[书籍服务错误] 获取书本单词列表失败:`, error);
    throw error; // 向上传递错误
  }
}
