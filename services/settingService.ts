/*
 * @Date: 2025-11-10 08:14:16
 * @LastEditTime: 2025-11-10 09:08:06
 * @Description: 用户设置 API 服务
 */
import apiClient from '@/utils/api.utils';
import { handleApiError, ApiError } from '@/utils/error.utils';
import { UserSettings } from '@/types/setting.types';

/**
 * 从后端获取当前用户的设置
 * @returns {Promise<UserSettings>} 用户的设置对象
 * @throws {ApiError} 获取失败时抛出错误
 */
export const apiFetchSettings = async (): Promise<UserSettings> => {
  console.log('[Setting Service] 获取用户设置');

  const response = await apiClient('/settings', {
    method: 'GET',
    cache: 'no-store',
  });

  if (!response.ok) {
    await handleApiError(response, '获取用户设置失败');
  }

  const data = await response.json();

  if (data.code !== 0) {
    throw new ApiError(data.message, data.code, response.status);
  }

  return data.data;
};

/**
 * 更新（保存）用户的设置到后端
 * @param settings 包含一个或多个设置项的对象
 * @returns {Promise<UserSettings>} 更新后的完整设置对象
 * @throws {ApiError} 更新失败时抛出错误
 */
export const apiUpdateSettings = async (
  settings: Partial<UserSettings>
): Promise<UserSettings> => {
  console.log('[Setting Service] 更新用户设置', settings);

  const response = await apiClient('/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });

  if (!response.ok) {
    await handleApiError(response, '更新用户设置失败');
  }

  const data = await response.json();

  if (data.code !== 0) {
    throw new ApiError(data.message, data.code, response.status);
  }

  return data.data;
};
