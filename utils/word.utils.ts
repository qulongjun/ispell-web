/*
 * @Date: 2025-10-26 09:43:47
 * @LastEditTime: 2025-11-01 18:19:36
 * @Description: 英文单词处理通用工具
 */

/**
 * 提取英文单词中所有元音字母的索引位置
 * 元音包括：a, e, i, o, u（不区分大小写）
 * @param word 待处理的英文单词（字符串）
 * @returns 元音索引组成的数组，无元音时返回空数组
 * @throws 当输入不是字符串时抛出类型错误
 */
export function getVowelIndices(word: string): number[] {
  // 运行时类型校验（防止TypeScript编译后被绕过类型约束）
  if (typeof word !== 'string') {
    throw new TypeError('输入必须是字符串类型的英文单词');
  }

  // 空字符串直接返回空数组
  if (word.length === 0) {
    return [];
  }

  // 元音集合（使用Set提升查找效率），包含小写形式
  const vowels = new Set(['a', 'e', 'i', 'o', 'u']);
  const vowelIndices: number[] = [];

  // 遍历每个字符，检查是否为元音
  for (let i = 0; i < word.length; i++) {
    // 转换为小写后判断（兼容大写元音）
    const lowerChar = word[i].toLowerCase();
    if (vowels.has(lowerChar)) {
      vowelIndices.push(i);
    }
  }

  return vowelIndices;
}

/**
 * 提取英文单词中所有辅音字母的索引位置（0开始）
 * 辅音定义：除元音（a,e,i,o,u，不区分大小写）外的所有英文字母
 * @param word 待处理的英文单词（字符串）
 * @returns 辅音索引组成的数组，无辅音时返回空数组
 * @throws 当输入不是字符串时抛出类型错误
 */
export function getConsonantIndices(word: string): number[] {
  // 运行时类型校验
  if (typeof word !== 'string') {
    throw new TypeError('输入必须是字符串类型的英文单词');
  }

  // 空字符串直接返回空数组
  if (word.length === 0) {
    return [];
  }

  // 元音集合（用于排除判断）
  const vowels = new Set(['a', 'e', 'i', 'o', 'u']);
  const consonantIndices: number[] = [];

  // 遍历每个字符，检查是否为辅音
  for (let i = 0; i < word.length; i++) {
    const char = word[i];
    // 先判断是否为英文字母（排除数字、符号等非字母字符）
    if (/[a-zA-Z]/.test(char)) {
      // 是字母且不是元音，则视为辅音
      const lowerChar = char.toLowerCase();
      if (!vowels.has(lowerChar)) {
        consonantIndices.push(i);
      }
    }
    // 非字母字符直接忽略（不纳入辅音）
  }

  return consonantIndices;
}

/**
 * 从英文单词中随机抽取大于等于二分之一长度的索引位置
 * @param word 待处理的英文单词（字符串）
 * @returns 随机抽取的索引数组（长度 ≥ 单词长度的1/2）
 * @throws 当输入不是字符串时抛出类型错误
 */
export function getRandomIndicesOverHalf(word: string): number[] {
  // 运行时类型校验
  if (typeof word !== 'string') {
    throw new TypeError('输入必须是字符串类型的英文单词');
  }

  const length = word.length;
  // 空字符串直接返回空数组
  if (length === 0) {
    return [];
  }

  // 生成所有索引的数组（0到length-1）
  const allIndices = Array.from({ length }, (_, i) => i);

  // 计算需要抽取的最小数量（≥ 长度的1/2）
  // 公式：向上取整(长度 * 1/2)，确保满足 "≥ 1/2" 的条件
  const minCount = Math.ceil(length * 0.5);

  // 洗牌算法（Fisher-Yates）随机打乱索引顺序
  const shuffledIndices = [...allIndices];
  for (let i = shuffledIndices.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    // 交换位置
    [shuffledIndices[i], shuffledIndices[randomIndex]] = [
      shuffledIndices[randomIndex],
      shuffledIndices[i],
    ];
  }

  // 取前minCount个索引（满足≥1/2的数量要求）
  return shuffledIndices.slice(0, minCount);
}

/**
 * 获取英文单词中所有字符的索引位置（0开始）
 * @param word 待处理的英文单词（字符串）
 * @returns 包含所有索引的数组（0到word.length-1），空字符串返回空数组
 * @throws 当输入不是字符串时抛出类型错误
 */
export function getAllIndices(word: string): number[] {
  // 运行时类型校验
  if (typeof word !== 'string') {
    throw new TypeError('输入必须是字符串类型的英文单词');
  }

  const length = word.length;
  // 空字符串直接返回空数组
  if (length === 0) {
    return [];
  }

  // 生成0到length-1的索引数组
  return Array.from({ length }, (_, index) => index);
}
