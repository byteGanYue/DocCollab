import { TOOLBAR_STYLES } from './toolbarConfig.js';

// 添加工具栏提示样式
export const addToolbarStyles = () => {
  const styleId = 'quill-toolbar-tooltips';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = TOOLBAR_STYLES;
    document.head.appendChild(style);
  }
};

// 添加工具栏提示和自定义图标
export const addToolbarTooltips = () => {
  const toolbar = document.querySelector('.ql-toolbar');
  if (!toolbar) return;

  // 为所有按钮添加提示
  const buttons = toolbar.querySelectorAll('button');
  buttons.forEach(button => {
    const className = button.className;
    let tooltip = '';

    // 根据按钮类名设置提示
    if (className.includes('ql-bold')) tooltip = '粗体 (Ctrl+B)';
    else if (className.includes('ql-italic')) tooltip = '斜体 (Ctrl+I)';
    else if (className.includes('ql-underline')) tooltip = '下划线 (Ctrl+U)';
    else if (className.includes('ql-strike')) tooltip = '删除线';
    else if (className.includes('ql-link')) tooltip = '插入链接';
    else if (className.includes('ql-clean')) tooltip = '清除格式';
    else if (className.includes('ql-image')) tooltip = '插入图片';
    else if (className.includes('ql-video')) tooltip = '插入视频';
    else if (className.includes('ql-code-block')) tooltip = '代码块';
    else if (className.includes('ql-blockquote')) tooltip = '引用块';
    else if (className.includes('ql-list')) tooltip = '列表';
    else if (className.includes('ql-indent')) tooltip = '缩进';
    else if (className.includes('ql-align')) tooltip = '对齐方式';
    else if (className.includes('ql-header')) tooltip = '标题';
    else if (className.includes('ql-font')) tooltip = '字体';
    else if (className.includes('ql-color')) tooltip = '文字颜色';
    else if (className.includes('ql-background')) tooltip = '背景颜色';
    else if (className.includes('ql-table')) tooltip = '插入表格';

    if (tooltip) {
      button.setAttribute('data-tooltip', tooltip);
    }
  });

  // 为选择器添加提示
  const pickers = toolbar.querySelectorAll('.ql-picker');
  pickers.forEach(picker => {
    const className = picker.className;
    let tooltip = '';

    if (className.includes('ql-font')) tooltip = '选择字体';
    else if (className.includes('ql-size')) tooltip = '选择字号';
    else if (className.includes('ql-color')) tooltip = '选择颜色';
    else if (className.includes('ql-background')) tooltip = '选择背景色';
    else if (className.includes('ql-header')) tooltip = '选择标题级别';
    else if (className.includes('ql-align')) tooltip = '选择对齐方式';

    if (tooltip) {
      picker.setAttribute('data-tooltip', tooltip);
    }
  });
};
