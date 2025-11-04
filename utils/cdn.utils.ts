/*
 * @Date: 2025-11-03 22:15:52
 * @LastEditTime: 2025-11-03 22:19:53
 * @Description: CDN 路径解析工具
 */
// 您的 CDN 域名
const CDN_PREFIX = 'https://static-1251807795.cos.ap-shanghai.myqcloud.com';
// 您的 COS 路径前缀
const COS_PATH_PREFIX = '/ispell-cos';

/**
 * 解析 COS 路径为完整的 CDN URL
 * @param url - 数据库中存储的 URL 路径 (e.g., /ispell-cos/avatars/xxx.jpg) 或
 * 完整 URL (e.g., https://...) 或 本地路径 (e.g., /images/...)
 * @returns 完整的 CDN URL 或原始 URL
 */
export const resolveCdnUrl = (url: string | null | undefined): string => {
  // 1. 如果 url 为空或未定义，返回空字符串，让调用方处理默认值
  if (!url) {
    return '';
  }

  // 2. 如果 url 以 /ispell-cos 开头，则拼接 CDN 域名
  if (url.startsWith(COS_PATH_PREFIX)) {
    return `${CDN_PREFIX}${url}`;
  }

  // 3. 如果是其他情况 (例如 'https://...', 'blob:', '/images/...' 等)，则原样返回
  return url;
};
