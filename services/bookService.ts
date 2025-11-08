/*
 * @Date: 2025-10-29 21:17:59
 * @Description: 书籍相关 API 服务 (已更新为 code/message/data 结构)
 */

import apiClient from '@/utils/api.utils';
// [!! 修改 !!] 导入 ApiError
import { handleApiError, ApiError } from '@/utils/error.utils';
import type { Language } from '@/types/book.types';
import { SimpleWord } from '@/types/word.types';

/**
 * [!! 已修复 !!]
 * 获取完整的三级书籍层级结构（语言→书籍→章节）
 */
export async function fetchBookHierarchy(): Promise<Language[]> {
  const endpoint = '/books/hierarchy';
  console.log(`[Book Service] Fetching book hierarchy: ${endpoint}`);

  try {
    const response = await apiClient(endpoint, { method: 'GET' }, false);

    // [!! 1. 关键修复 !!] 先检查 response.ok
    if (!response.ok) {
      await handleApiError(response, 'Failed to fetch book hierarchy.');
    }

    // [!! 2. 关键修复 !!] 只有在 OK 之后才调用 .json()
    const data = await response.json();

    // [!! 3. 关键修复 !!] 检查业务代码
    if (data.code === 0) {
      return data.data; // 返回 Language[]
    } else {
      // 抛出业务错误
      throw new ApiError(data.message, data.code, response.status);
    }
  } catch (error) {
    console.error(`[Book Service Error] Fetch book hierarchy failed:`, error);
    throw error; // 向上抛出 (可能是 ApiError)
  }
}

/**
 * [!! 已修复 !!]
 * 获取指定书本（listCode）的完整单词列表
 */
export async function getWordsByBook(listCode: string): Promise<SimpleWord[]> {
  const endpoint = `/books/${listCode}/words`;
  console.log(`[Book Service] Fetching words for book: ${endpoint}`);

  try {
    const response = await apiClient(endpoint, { method: 'GET' }, false);

    // [!! 1. 关键修复 !!] 先检查 response.ok
    if (!response.ok) {
      // e.g. 404 Not Found
      await handleApiError(response, 'Failed to fetch book words.');
    }

    // [!! 2. 关键修复 !!] 只有在 OK 之后才调用 .json()
    const data = await response.json();

    // [!! 3. 关键修复 !!] 检查业务代码
    if (data.code === 0) {
      // 后端返回 { data: { words: [...] } }
      return data.data.words; // 返回 SimpleWord[]
    } else {
      throw new ApiError(data.message, data.code, response.status);
    }
  } catch (error) {
    console.error(`[Book Service Error] Fetch book words failed:`, error);
    throw error; // 向上抛出 (ApiError)
  }
}
