/*
 * @Description: 转换 demo.json 为 word.json (适配演示模式的 Word 类型)
 */

const fs = require('fs');
const path = require('path');

// --- 1. 定义文件路径 ---
// __dirname 指向当前脚本所在的文件夹
const inputFilePath = path.join(__dirname, 'demo.json');
const outputFilePath = path.join(__dirname, 'word.json');

// --- 2. 转换函数 (与我们之前讨论的逻辑相同) ---
/**
 * 将原始词库数据转换为 demo.json 格式
 * @param {Array<Object>} sourceData 你的原始数据数组
 * @returns {Array<Object>} 转换后的 Word 数组
 */
function convertToDemoFormat(sourceData) {
  if (!Array.isArray(sourceData)) {
    console.error('输入数据不是一个数组!');
    return [];
  }

  return sourceData.map((item) => {
    
    // 1. 处理释义 (translation)
    // 将 [ {pos: 'adv', translation: '突然地'} ]
    // 转换成 "adv. 突然地"
    const translation = (item.definitions || [])
      .map((def) => `${def.pos}. ${def.translation}`)
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
      // 过滤掉可能不完整的例句
      .filter(s => s && s.text && s.translation);

    // 4. 组装成最终的 Word 对象
    return {
      wordId: item.wordId,     // e.g., "CET4_14"
      progressId: null,      // 关键：演示模式
      text: item.word,       // e.g., "abruptly"
      lang: 'en',            // Hardcoded
      phonetic: phonetic,    // e.g., "ə'brʌptli"
      definition: '',        // 原始数据中没有英文释义，设为空
      translation: translation, // e.g., "adv. 突然地"
      sentences: sentences,   // 转换后的例句数组
    };
  });
}

// --- 3. 主执行逻辑 ---
function runConversion() {
  try {
    // 1. 读取 demo.json
    console.log(`正在读取: ${inputFilePath}`);
    const rawData = fs.readFileSync(inputFilePath, 'utf8');
    
    // 2. 解析 JSON
    const sourceData = JSON.parse(rawData);

    // 3. 转换数据
    console.log(`正在转换 ${sourceData.length} 个单词...`);
    const transformedData = convertToDemoFormat(sourceData);

    // 4. 将转换后的数据格式化为 JSON 字符串
    const outputJson = JSON.stringify(transformedData, null, 2); // null, 2 用于美化格式

    // 5. 写入 word.json
    fs.writeFileSync(outputFilePath, outputJson, 'utf8');
    
    console.log('✅ 转换成功!');
    console.log(`已生成文件: ${outputFilePath}`);

  } catch (error) {
    console.error('❌ 转换失败:');
    if (error.code === 'ENOENT') {
      console.error(`错误：找不到文件 ${inputFilePath}`);
      console.error('请确保 demo.json 和此脚本在同一个文件夹中。');
    } else if (error instanceof SyntaxError) {
      console.error('错误：demo.json 文件格式不正确，无法解析。');
    } else {
      console.error(error.message);
    }
  }
}

// 运行脚本
runConversion();