// 计算字数统计
export const calculateStats = quillRef => {
  if (!quillRef?.current) {
    return { characters: 0, words: 0, lines: 0, paragraphs: 0 };
  }

  const text = quillRef.current.getText();
  const trimmedText = text ? text.trim() : '';
  const characters = trimmedText.length;
  const words = trimmedText
    ? trimmedText.split(/\s+/).filter(word => word.length > 0).length
    : 0;
  const lines = trimmedText ? trimmedText.split('\n').length : 0;
  const paragraphs = trimmedText
    ? trimmedText.split(/\n\s*\n/).filter(para => para.trim().length > 0).length
    : 0;

  return { characters, words, lines, paragraphs };
};
