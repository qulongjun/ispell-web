/*
 * @Date: 2025-10-26 09:43:47
 * @LastEditTime: 2025-11-07 21:52:10
 * @Description: 英文单词处理通用工具
 */

import { Definition, Word } from '@/types/word.types';

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

/**
 * 转义正则表达式中的特殊字符（如 . * + ? $ ^ ( ) [ ] { } | \ 等）
 * @param str 需要转义的字符串
 * @returns 转义后的安全字符串
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 查找例句中目标单词及其所有变形（规则+不规则）的字符索引
 * @param targetWord 目标单词（原形）
 * @param sentence 包含目标单词的例句
 * @param irregularForms 不规则变形数组（如 ["went", "gone"] 对应 "go"）
 * @returns 所有匹配字符的索引数组（从0开始，按出现顺序排列）
 */
export function findWordIndices(
  targetWord: string,
  sentence: string,
  irregularForms: string[] = []
): number[] {
  // 1. 定义英语中常见的规则变形后缀（覆盖大多数规则变化）
  const regularSuffixes = [
    '', // 原形（必须包含）
    's', // 第三人称单数（如 runs, eats）
    'es', // 特殊第三人称单数（如 watches, passes）
    'ed', // 过去式/过去分词（如 walked, played）
    'ing', // 现在分词（如 running, eating）
    'en', // 过去分词（如 spoken, written）
    'er', // 比较级（如 faster, bigger）
    'est', // 最高级（如 fastest, biggest）
    'd', // 去e加d（如 loved, moved）
    't', // 不规则过去式（如 spent, felt, kept）
    'ied', // 以y结尾变ied（如 studied, tried）
    'ies', // 以y结尾变ies（如 flies, cries）
    'ing', // 重读闭音节双写尾字母加ing（如 sitting, running）
    'ed', // 重读闭音节双写尾字母加ed（如 stopped, dropped）
  ];

  // 2. 处理目标单词的规则变形（生成所有可能的规则形式）
  const escapedTarget = escapeRegExp(targetWord);
  const regularForms = regularSuffixes.map(
    (suffix) => `${escapedTarget}${suffix}`
  );

  // 3. 合并规则变形和不规则变形（去重处理）
  const allForms = [...new Set([...regularForms, ...irregularForms])];

  // 4. 构建正则表达式（匹配完整单词，忽略大小写，全局匹配）
  // \b 确保匹配完整单词（避免匹配单词片段，如 "appoint" 不匹配 "appointment"）
  const pattern = `\\b(?:${allForms.map(escapeRegExp).join('|')})\\b`;
  const regex = new RegExp(pattern, 'gi');

  // 5. 查找所有匹配项并收集索引
  const indices: number[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(sentence)) !== null) {
    const startIndex = match.index;
    const matchLength = match[0].length;
    const endIndex = startIndex + matchLength - 1;

    // 收集当前匹配项的所有字符索引（从start到end，包含两端）
    for (let i = startIndex; i <= endIndex; i++) {
      indices.push(i);
    }

    // 处理零宽匹配的极端情况（避免无限循环）
    if (matchLength === 0) {
      regex.lastIndex++;
    }
  }

  return indices;
}

/**
 * 将原始词库数据转换为 demo.json 格式
 * @param {Array<Object>} sourceData 你的原始数据数组
 * @returns {Array<Object>} 转换后的 Word 数组
 */
export function convertToDemoFormat(
  sourceData: (Word & { word: string; wordId: string })[]
) {
  if (!Array.isArray(sourceData)) {
    console.error('输入数据不是一个数组!');
    return [];
  }

  return sourceData.map((item) => {
    // 1. 处理释义 (translation)
    // 将 [ {pos: 'adv', translation: '突然地'} ]
    // 转换成 "adv. 突然地"
    const translation = item.definitions
      .map((def: Definition) => `${def.pos}. ${def.translation}`)
      .join('; '); // 如果有多个释义，用分号隔开

    // 2. 处理发音 (phonetic)
    // 优先用美式，备用英式
    const phonetic =
      item.pronunciation?.us?.phonetic ||
      item.pronunciation?.uk?.phonetic ||
      ''; // 降级为空字符串

    // 3. 处理例句 (sentences)
    // 将 {en: '...', cn: '...'}
    // 转换成 {text: '...', translation: '...'}
    const sentences = (item.examples?.general || []) // 确保 general 存在
      .map((ex) => ({
        text: ex.en,
        translation: ex.cn,
      }))
      // 过滤掉可能不完整的例句 (例如 "absent" 的 general 是空的)
      .filter((s) => s.text && s.translation);

    // 4. 组装成最终的 Word 对象
    return {
      wordId: item.wordId, // e.g., "CET4_14"
      progressId: null, // 关键：演示模式
      text: item.word, // e.g., "abruptly"
      lang: 'en', // Hardcoded
      phonetic: phonetic, // e.g., "ə'brʌptli"
      definition: '', // 原始数据中没有英文释义，设为空
      translation: translation, // e.g., "adv. 突然地"
      sentences: sentences, // 转换后的例句数组
    };
  });
}
