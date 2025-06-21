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

// 用户颜色列表
export const USER_COLORS = [
  '#30bced',
  '#6eeb83',
  '#ffbc42',
  '#ecd444',
  '#ee6352',
  '#9ac2c9',
  '#8acb88',
  '#1be7ff',
];

// 工具栏样式
export const TOOLBAR_STYLES = `
  .ql-toolbar .ql-formats button,
  .ql-toolbar .ql-formats .ql-picker {
    position: relative;
  }
  
  .ql-toolbar .ql-formats button:hover::after,
  .ql-toolbar .ql-formats .ql-picker:hover::after {
    content: attr(data-tooltip);
    position: absolute;
    bottom: -30px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    z-index: 1000;
    pointer-events: none;
  }
  
  .ql-toolbar .ql-formats button:hover::before,
  .ql-toolbar .ql-formats .ql-picker:hover::before {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 50%;
    transform: translateX(-50%);
    border: 4px solid transparent;
    border-bottom-color: rgba(0, 0, 0, 0.8);
    z-index: 1000;
    pointer-events: none;
  }

  /* 自定义工具栏图标样式 */
  .ql-toolbar .ql-formats button {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    border: 1px solid transparent;
    background: transparent;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 2px;
  }

  .ql-toolbar .ql-formats button:hover {
    background-color: rgba(var(--color-primary-rgb), 0.1);
    border-color: rgba(var(--color-primary-rgb), 0.2);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .ql-toolbar .ql-formats button.ql-active {
    background-color: var(--color-primary);
    border-color: var(--color-primary);
    color: white;
    box-shadow: 0 2px 8px rgba(var(--color-primary-rgb), 0.3);
  }

  .ql-toolbar .ql-formats button svg {
    width: 16px;
    height: 16px;
    fill: currentColor;
    transition: all 0.2s ease;
  }

  .ql-toolbar .ql-formats button:hover svg {
    transform: scale(1.1);
  }

  .ql-toolbar .ql-formats button.ql-active svg {
    fill: white;
  }

  /* 自定义图标 */
  .ql-bold .ql-icon {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M15.6 11.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 7.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z'/%3E%3C/svg%3E");
  }

  .ql-italic .ql-icon {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4h-8z'/%3E%3C/svg%3E");
  }

  .ql-underline .ql-icon {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z'/%3E%3C/svg%3E");
  }

  .ql-strike .ql-icon {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M7.24 8.75c-.26-.48-.39-1.03-.39-1.67 0-1.84 1.61-3.23 3.77-3.23 1.3 0 2.32.49 2.61 1.28.17.45.21.9.21 1.23h1.69c0-.61-.12-1.17-.36-1.67-.56-1.11-1.56-1.81-2.94-2.09V2h-1.67v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 3.09 3.92 3.75 1.19.33 1.88.56 2.07.66.19.1.35.19.35.28 0 .19-.34.28-.93.28-.61 0-1.22-.11-1.67-.21v1.49c.49.18 1.02.27 1.67.27 1.19 0 2.05-.31 2.67-.92.61-.61.92-1.43.92-2.45 0-.73-.26-1.39-.78-1.97-.52-.58-1.07-1.11-1.67-1.49V5.48c1.51.32 2.72 1.3 2.72 2.81 0 1.79-1.49 3.09-3.92 3.75-1.19.33-1.88.56-2.07.66-.19.1-.35.19-.35.28 0 .19.34.28.93.28.61 0 1.22-.11 1.67-.21v1.49c-.49.18-1.02.27-1.67.27-1.19 0-2.05-.31-2.67-.92-.61-.61-.92-1.43-.92-2.45 0-.73.26-1.39.78-1.97.52-.58 1.07-1.11 1.67-1.49V5.48c-1.51.32-2.72 1.3-2.72 2.81z'/%3E%3C/svg%3E");
  }

  .ql-link .ql-icon {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z'/%3E%3C/svg%3E");
  }

  .ql-clean .ql-icon {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z'/%3E%3C/svg%3E");
  }

  .ql-image .ql-icon {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z'/%3E%3C/svg%3E");
  }

  .ql-video .ql-icon {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z'/%3E%3C/svg%3E");
  }

  .ql-code-block .ql-icon {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z'/%3E%3C/svg%3E");
  }

  .ql-blockquote .ql-icon {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z'/%3E%3C/svg%3E");
  }

  .ql-list[data-value='ordered'] .ql-icon {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M2 17h2v.5H1v1h3v-1.5H2V17zm0-4h2v.5H1v1h3v-1.5H2V13zm0-4h2v.5H1v1h3v-1.5H2V9zm0-4h2v.5H1v1h3v-1.5H2V5zm4 12h16v-2H6v2zm0-4h16v-2H6v2zm0-4h16V9H6v2zm0-4h16V5H6v2z'/%3E%3C/svg%3E");
  }

  .ql-list[data-value='bullet'] .ql-icon {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8h14V3H7v2z'/%3E%3C/svg%3E");
  }

  .ql-indent[data-value='-1'] .ql-icon {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M3 17.25V21h1.75L17.81 9.94l-1.75-1.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 1.75 1.75 1.83-1.83z'/%3E%3C/svg%3E");
  }

  .ql-indent[data-value='+1'] .ql-icon {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M3 17.25V21h1.75L17.81 9.94l-1.75-1.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 1.75 1.75 1.83-1.83z'/%3E%3C/svg%3E");
  }

  .ql-align[data-value=''] .ql-icon {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M3 3h18v2H3zm0 8h18v2H3zm0 8h18v2H3z'/%3E%3C/svg%3E");
  }

  .ql-align[data-value='center'] .ql-icon {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M3 3h18v2H3zm2 8h14v2H5zm-2 8h18v2H3z'/%3E%3C/svg%3E");
  }

  .ql-align[data-value='right'] .ql-icon {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M3 3h18v2H3zm4 8h14v2H7zm-4 8h18v2H3z'/%3E%3C/svg%3E");
  }

  .ql-align[data-value='justify'] .ql-icon {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M3 3h18v2H3zm0 8h18v2H3zm0 8h18v2H3z'/%3E%3C/svg%3E");
  }

  .ql-header[data-value='1'] .ql-icon {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M5 4v3h5.5v12h3V7H19V4z'/%3E%3C/svg%3E");
  }

  .ql-header[data-value='2'] .ql-icon {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M3 4h6v3H3zm0 8h6v3H3zm8-8h10v3H11zm0 8h10v3H11z'/%3E%3C/svg%3E");
  }

  .ql-header[data-value='3'] .ql-icon {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M3 4h6v3H3zm0 8h6v3H3zm8-8h10v3H11zm0 8h10v3H11z'/%3E%3C/svg%3E");
  }

  .ql-header[data-value='4'] .ql-icon {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M3 4h6v3H3zm0 8h6v3H3zm8-8h10v3H11zm0 8h10v3H11z'/%3E%3C/svg%3E");
  }

  .ql-header[data-value='5'] .ql-icon {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M3 4h6v3H3zm0 8h6v3H3zm8-8h10v3H11zm0 8h10v3H11z'/%3E%3C/svg%3E");
  }

  .ql-header[data-value='6'] .ql-icon {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M3 4h6v3H3zm0 8h6v3H3zm8-8h10v3H11zm0 8h10v3H11z'/%3E%3C/svg%3E");
  }

  .ql-font .ql-icon {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M9 4v3h5l-6 7v4h8v-3h-5l6-7V4H9z'/%3E%3C/svg%3E");
  }

  .ql-color .ql-icon {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z'/%3E%3C/svg%3E");
  }

  .ql-background .ql-icon {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z'/%3E%3C/svg%3E");
  }

  .ql-table .ql-icon {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M3 3h18v2H3zm0 8h18v2H3zm0 8h18v2H3z'/%3E%3C/svg%3E");
  }
`;
