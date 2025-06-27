/**
 * 从文档内容中提取所有文本
 * @param {Array} content - 文档内容数组
 * @returns {string} 提取出的文本
 */
export const getTextFromContent = content => {
  if (!content || !Array.isArray(content)) return '';

  let extractedText = '';

  // 递归提取所有text字段的内容
  const extractText = node => {
    if (!node) return;

    // 如果有text属性，直接添加到结果中
    if (node.text !== undefined) {
      extractedText += node.text + ' ';
      return;
    }

    // 如果有children属性，递归处理
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach(child => extractText(child));
    }
  };

  // 处理每个顶层节点
  content.forEach(node => extractText(node));

  return extractedText.trim();
};

/**
 * 格式化时间戳为可读性好的时间字符串
 * @param {number|string} timestamp - 时间戳或时间字符串
 * @returns {string} 格式化后的时间字符串
 */
export const formatTimestamp = timestamp => {
  if (!timestamp) return '';

  const date = new Date(timestamp);
  const now = new Date();

  // 计算时间差（毫秒）
  const diffMs = now - date;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  // 今天内
  if (diffDays < 1) {
    if (diffMinutes < 1) return '刚刚';
    if (diffHours < 1) return `${diffMinutes}分钟前`;
    return `${diffHours}小时前`;
  }

  // 昨天
  if (diffDays === 1) return '昨天';

  // 7天内
  if (diffDays < 7) return `${diffDays}天前`;

  // 一年内，显示月日
  if (date.getFullYear() === now.getFullYear()) {
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  }

  // 超过一年，显示年月日
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
};

/**
 * 截取文本内容，超长时添加省略号
 * @param {string} text - 原始文本
 * @param {number} maxLength - 最大长度
 * @returns {string} 处理后的文本
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * 计算内容的简单哈希值，用于比较内容是否变化
 * @param {Array} content - 文档内容
 * @returns {string} 哈希值
 */
export const computeContentHash = content => {
  if (!content || !Array.isArray(content)) return '';
  // 提取文本后取前100字符，避免过长计算
  const text = getTextFromContent(content);
  const sample = text.slice(0, 100);
  // 简单哈希：字符串长度 + 前后字符的char code
  return `${text.length}_${sample.charCodeAt(0)}_${sample.charCodeAt(sample.length - 1)}`;
};
