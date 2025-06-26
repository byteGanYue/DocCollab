import React from 'react';

/**
 * 语言选择器组件
 * 用于代码块中选择编程语言，支持语法高亮
 * @param {Object} props - 组件属性
 * @param {string} props.value - 当前选中的语言
 * @param {Function} props.onChange - 语言改变时的回调函数
 * @param {Object} props.style - 自定义样式
 * @returns {JSX.Element} 语言选择器组件
 */
const LanguageSelect = ({ value = 'html', onChange, style = {}, ...props }) => {
  // 支持的编程语言列表
  const languages = [
    { value: 'css', label: 'CSS' },
    { value: 'html', label: 'HTML' },
    { value: 'java', label: 'Java' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'jsx', label: 'JSX' },
    { value: 'markdown', label: 'Markdown' },
    { value: 'php', label: 'PHP' },
    { value: 'python', label: 'Python' },
    { value: 'sql', label: 'SQL' },
    { value: 'tsx', label: 'TSX' },
    { value: 'typescript', label: 'TypeScript' },
  ];

  const defaultStyle = {
    position: 'absolute',
    right: '5px',
    top: '5px',
    zIndex: 1,
    padding: '4px 8px',
    fontSize: '12px',
    fontFamily: 'monospace',
    border: '1px solid #ccc',
    borderRadius: '4px',
    backgroundColor: '#fff',
    color: '#333',
    cursor: 'pointer',
    outline: 'none',
    ...style,
  };

  return (
    <select
      data-testid="language-select"
      contentEditable={false}
      value={value}
      onChange={onChange}
      style={defaultStyle}
      {...props}
    >
      {languages.map(lang => (
        <option key={lang.value} value={lang.value}>
          {lang.label}
        </option>
      ))}
    </select>
  );
};

export default LanguageSelect;
