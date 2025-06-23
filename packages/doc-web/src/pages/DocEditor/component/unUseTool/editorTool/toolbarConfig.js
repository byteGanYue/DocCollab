// 工具栏按钮提示配置
export const TOOLBAR_TOOLTIPS = {
  font: '字体',
  bold: '粗体 (Ctrl+B)',
  italic: '斜体 (Ctrl+I)',
  underline: '下划线 (Ctrl+U)',
  strike: '删除线',
  header: '标题',
  color: '文字颜色',
  background: '背景颜色',
  align: '对齐方式',
  list: '列表',
  indent: '缩进',
  link: '插入链接',
  blockquote: '引用',
  'code-block': '代码块',
  table: '插入表格',
  image: '插入图片',
  video: '插入视频',
  clean: '清除格式',
};

// 工具栏配置
export const TOOLBAR_CONFIG = [
  // 字体
  [{ font: [] }],
  // 标题 H1-H6
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  // 文本样式
  ['bold', 'italic', 'underline', 'strike'],
  // 颜色和背景色
  [{ color: [] }, { background: [] }],
  // 对齐方式
  [{ align: [] }],
  // 列表和缩进
  [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
  // 链接和引用
  ['link', 'blockquote'],
  // 代码和表格
  ['code-block', 'table'],
  // 媒体
  ['image', 'video'],
  // 清除格式
  ['clean'],
];
