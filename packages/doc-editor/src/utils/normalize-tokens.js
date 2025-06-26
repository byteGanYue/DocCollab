/**
 * 标准化Prism.js生成的tokens，使其更适合Slate.js的装饰器系统
 * 将嵌套的token结构展平，并按行分组
 * @param {Array} tokens - Prism.js生成的原始tokens数组
 * @returns {Array} 按行分组的标准化tokens数组
 */
export const normalizeTokens = tokens => {
  const lines = [[]];
  let currentLine = 0;

  /**
   * 递归处理token，将复杂的嵌套结构展平
   * @param {*} token - 要处理的token
   * @param {Array} types - 当前token的类型栈
   */
  const processToken = (token, types = []) => {
    if (typeof token === 'string') {
      // 处理纯文本token，按换行符分割
      const parts = token.split('\n');

      for (let i = 0; i < parts.length; i++) {
        if (i > 0) {
          // 遇到换行符，创建新行
          currentLine++;
          lines[currentLine] = [];
        }

        if (parts[i]) {
          // 如果有内容，添加到当前行
          lines[currentLine].push({
            types,
            content: parts[i],
          });
        }
      }
    } else if (typeof token === 'object' && token !== null) {
      // 处理复杂的token对象
      if (Array.isArray(token)) {
        // 如果是数组，递归处理每个元素
        token.forEach(subToken => processToken(subToken, types));
      } else if (token.content) {
        // 如果是带有content的对象，添加类型并递归处理内容
        const newTypes = token.type ? [...types, token.type] : types;

        if (Array.isArray(token.content)) {
          // content是数组，递归处理每个元素
          token.content.forEach(subToken => processToken(subToken, newTypes));
        } else {
          // content是字符串或单个token，递归处理
          processToken(token.content, newTypes);
        }
      } else if (token.type) {
        // 如果只有type没有content，创建一个空token
        lines[currentLine].push({
          types: [...types, token.type],
          content: '',
        });
      }
    }
  };

  // 处理所有tokens
  tokens.forEach(token => processToken(token));

  // 确保每一行都有内容，即使是空行也要有一个空token
  return lines.map(line =>
    line.length === 0 ? [{ types: [], content: '' }] : line,
  );
};
