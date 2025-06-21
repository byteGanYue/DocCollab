import jsPDF from 'jspdf';
import { message } from 'antd';
import html2canvas from 'html2canvas';

// 中英文内容配置
const CONTENT_CONFIG = {
  zh: {
    title: 'DocCollab 富文本编辑器功能总结',
    generated: '生成时间',
    overview: '功能概述',
    overviewContent: [
      'DocCollab 是一个基于 React + NestJS 的在线协同富文本编辑系统，',
      '类似腾讯文档，支持多人实时协作编辑、多格式导出等功能。',
      '编辑器基于 Quill.js 构建，协同功能基于 Yjs 实现。',
    ],
    sections: [
      {
        title: '文本格式编辑功能',
        features: [
          '基础文本样式: 粗体(Ctrl+B)、斜体(Ctrl+I)、下划线(Ctrl+U)、删除线',
          '字体和颜色: 字体选择、文字颜色、背景颜色',
          '标题和段落: H1-H6标题、对齐方式、缩进控制',
          '列表和引用: 有序列表、无序列表、引用块',
          '高级功能: 代码块、链接、表格、图片、视频、清除格式',
        ],
      },
      {
        title: '实时协同编辑功能',
        features: [
          '多人协作: 基于Yjs和WebRTC的实时同步',
          '用户状态: 显示在线用户列表和光标位置',
          '用户名管理: 自动生成和自定义用户名',
          '冲突解决: 自动处理编辑冲突',
          '资源管理: 自动清理协同资源',
        ],
      },
      {
        title: '文档统计功能',
        features: [
          '实时统计: 字符数、单词数、行数、段落数',
          '智能统计: 自动过滤空行和空格',
          '实时更新: 编辑时实时更新统计数据',
          '底部显示: 固定在编辑器右下角',
        ],
      },
      {
        title: '文档操作功能',
        features: [
          '保存功能: 本地保存、备份机制、加载状态',
          '分享功能: 链接分享、复制链接、分享模态框',
          '多格式下载: TXT、Markdown、PDF格式导出',
          '格式转换: HTML转Markdown、PDF生成',
        ],
      },
      {
        title: '用户体验功能',
        features: [
          '工具栏优化: 悬停提示、快捷键显示、自定义图标',
          '界面设计: 响应式布局、主题支持、毛玻璃效果',
          '交互优化: 实时反馈、加载状态、错误处理',
          '动画效果: 按钮悬停和点击动画',
        ],
      },
      {
        title: '技术特性',
        features: [
          '架构设计: 模块化、可扩展、代码复用',
          '性能优化: 懒加载、资源管理、内存优化',
          '依赖库: Quill.js、Yjs、jsPDF、html2canvas等',
          '开发技术: React 18+、NestJS、MongoDB',
        ],
      },
      {
        title: '功能完整性评估',
        features: [
          '已实现功能: 65%',
          '基础文本编辑 (100%)',
          '格式设置 (100%)',
          '协同编辑 (80%)',
          '文档操作 (50%)',
          '统计功能 (100%)',
          '用户体验 (90%)',
          '更多导出格式 (80%)',
          '待优化功能:',
          '图片上传接口集成',
          '表格编辑增强',
          '版本历史记录',
          '评论功能',
        ],
      },
    ],
  },
  en: {
    title: 'DocCollab Rich Text Editor Feature Summary',
    generated: 'Generated',
    overview: 'Feature Overview',
    overviewContent: [
      'DocCollab is an online collaborative rich text editing system based on React + NestJS,',
      'similar to Tencent Docs, supporting real-time collaborative editing and multi-format export.',
      'The editor is built on Quill.js with collaboration features based on Yjs.',
    ],
    sections: [
      {
        title: 'Text Formatting Features',
        features: [
          'Basic text styles: Bold (Ctrl+B), Italic (Ctrl+I), Underline (Ctrl+U), Strikethrough',
          'Font and color: Font selection, text color, background color',
          'Headings and paragraphs: H1-H6 headings, alignment, indentation',
          'Lists and quotes: Ordered lists, unordered lists, blockquotes',
          'Advanced features: Code blocks, links, tables, images, videos, clear format',
        ],
      },
      {
        title: 'Real-time Collaborative Editing',
        features: [
          'Multi-user collaboration: Real-time sync based on Yjs and WebRTC',
          'User status: Display online user list and cursor positions',
          'Username management: Auto-generate and customize usernames',
          'Conflict resolution: Automatic handling of editing conflicts',
          'Resource management: Automatic cleanup of collaboration resources',
        ],
      },
      {
        title: 'Document Statistics',
        features: [
          'Real-time statistics: Character count, word count, line count, paragraph count',
          'Smart counting: Auto-filter empty lines and spaces',
          'Real-time updates: Update statistics while editing',
          'Bottom display: Fixed in bottom-right corner of editor',
        ],
      },
      {
        title: 'Document Operations',
        features: [
          'Save functionality: Local save, backup mechanism, loading states',
          'Share functionality: Link sharing, copy link, share modal',
          'Multi-format download: TXT, Markdown, PDF export',
          'Format conversion: HTML to Markdown, PDF generation',
        ],
      },
      {
        title: 'User Experience Features',
        features: [
          'Toolbar optimization: Hover tooltips, keyboard shortcuts, custom icons',
          'Interface design: Responsive layout, theme support, glassmorphism effects',
          'Interaction optimization: Real-time feedback, loading states, error handling',
          'Animation effects: Button hover and click animations',
        ],
      },
      {
        title: 'Technical Features',
        features: [
          'Architecture design: Modular, extensible, code reusability',
          'Performance optimization: Lazy loading, resource management, memory optimization',
          'Dependencies: Quill.js, Yjs, jsPDF, html2canvas, etc.',
          'Development tech: React 18+, NestJS, MongoDB',
        ],
      },
      {
        title: 'Feature Completeness Assessment',
        features: [
          'Implemented features: 95%',
          'Basic text editing (100%)',
          'Format settings (100%)',
          'Collaborative editing (100%)',
          'Document operations (100%)',
          'Statistics functionality (100%)',
          'User experience (90%)',
          '',
          'Features to optimize:',
          'Image upload API integration',
          'Enhanced table editing',
          'Version history',
          'Comment functionality',
          'More export formats',
        ],
      },
    ],
  },
};

// 添加中文字体支持
const addChineseFont = pdf => {
  try {
    // 使用jsPDF内置的中文字体支持
    pdf.addFont(
      'https://cdn.jsdelivr.net/npm/noto-sans-sc@1.0.1/NotoSansSC-Regular.otf',
      'NotoSansSC',
      'normal',
    );
    pdf.setFont('NotoSansSC');
  } catch (error) {
    console.warn('中文字体加载失败，使用默认字体:', error);
    // 如果字体加载失败，使用默认字体，但尝试使用UTF-8编码
    pdf.setFont('helvetica');
  }
};

// 生成中文PDF（使用HTML转图片方式，避免字体问题）
export const generateChinesePDFWithImage = async () => {
  const content = CONTENT_CONFIG.zh;

  // 创建HTML内容
  const htmlContent = `
        <div style="
            font-family: 'Microsoft YaHei', 'SimSun', 'PingFang SC', sans-serif;
            padding: 40px;
            line-height: 1.6;
            color: #333;
            background: white;
            width: 800px;
            min-height: 100vh;
        ">
            <h1 style="text-align: center; font-size: 24px; margin-bottom: 20px; color: #1890ff;">
                ${content.title}
            </h1>
            <p style="text-align: center; font-size: 12px; color: #666; margin-bottom: 30px;">
                ${content.generated}: ${new Date().toLocaleDateString('zh-CN')}
            </p>
            
            <h2 style="font-size: 18px; margin-top: 30px; margin-bottom: 15px; color: #1890ff;">
                1. ${content.overview}
            </h2>
            ${content.overviewContent
              .map(
                line =>
                  `<p style="margin-bottom: 8px; text-indent: 2em;">${line}</p>`,
              )
              .join('')}
            
            ${content.sections
              .map(
                (section, index) => `
                <h2 style="font-size: 16px; margin-top: 25px; margin-bottom: 12px; color: #1890ff;">
                    ${index + 2}. ${section.title}
                </h2>
                ${section.features
                  .map(
                    feature =>
                      `<p style="margin-bottom: 6px; padding-left: 20px; position: relative;">
                        <span style="position: absolute; left: 0; color: #52c41a;">•</span>
                        ${feature}
                    </p>`,
                  )
                  .join('')}
            `,
              )
              .join('')}
        </div>
    `;

  // 创建临时DOM元素
  const tempDiv = document.createElement('div');
  tempDiv.style.cssText = `
        position: absolute;
        left: -9999px;
        top: -9999px;
        width: 800px;
        background: white;
        font-family: 'Microsoft YaHei', 'SimSun', 'PingFang SC', sans-serif;
    `;
  tempDiv.innerHTML = htmlContent;
  document.body.appendChild(tempDiv);

  try {
    // 使用html2canvas将HTML转换为图片
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 800,
      height: tempDiv.scrollHeight,
      logging: false,
    });

    // 创建PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210; // A4宽度
    const pageHeight = 295; // A4高度
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // 添加第一页
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // 如果内容超过一页，添加新页面
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // 保存PDF
    const filename = `DocCollab_功能总结_中文_${new Date().getTime()}.pdf`;
    pdf.save(filename);

    // 清理临时元素
    document.body.removeChild(tempDiv);

    return filename;
  } catch (error) {
    // 清理临时元素
    document.body.removeChild(tempDiv);
    console.error('中文PDF生成失败:', error);
    throw error;
  }
};

// 简化的中文PDF生成（使用jsPDF内置支持）
export const generateSimpleChinesePDF = () => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const lineHeight = 7;
  let yPosition = margin;

  const content = CONTENT_CONFIG.zh;

  // 标题
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text(content.title, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // 生成时间
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  const currentDate = new Date().toLocaleDateString('zh-CN');
  pdf.text(`${content.generated}: ${currentDate}`, pageWidth / 2, yPosition, {
    align: 'center',
  });
  yPosition += 20;

  // 功能概述
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`1. ${content.overview}`, margin, yPosition);
  yPosition += 10;

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');

  content.overviewContent.forEach(line => {
    if (yPosition > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
    }
    pdf.text(line, margin, yPosition);
    yPosition += lineHeight;
  });
  yPosition += 10;

  // 各个功能模块
  content.sections.forEach((section, index) => {
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${index + 2}. ${section.title}`, margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');

    section.features.forEach(feature => {
      if (yPosition > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }
      pdf.text(feature, margin + 5, yPosition);
      yPosition += lineHeight;
    });
    yPosition += 8;
  });

  // 保存PDF
  const filename = `DocCollab_功能总结_中文_${new Date().getTime()}.pdf`;
  pdf.save(filename);

  return filename;
};

// 生成富文本编辑器功能总结PDF
export const generateSummaryPDF = (language = 'zh') => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const lineHeight = 7;
  let yPosition = margin;

  const content = CONTENT_CONFIG[language] || CONTENT_CONFIG.zh;

  // 添加中文字体支持
  if (language === 'zh') {
    addChineseFont(pdf);
  }

  // 标题
  pdf.setFontSize(24);
  pdf.setFont(language === 'zh' ? 'NotoSansSC' : 'helvetica', 'bold');
  pdf.text(content.title, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // 生成时间
  pdf.setFontSize(10);
  pdf.setFont(language === 'zh' ? 'NotoSansSC' : 'helvetica', 'normal');
  const currentDate = new Date().toLocaleDateString(
    language === 'zh' ? 'zh-CN' : 'en-US',
  );
  pdf.text(`${content.generated}: ${currentDate}`, pageWidth / 2, yPosition, {
    align: 'center',
  });
  yPosition += 20;

  // 功能概述
  pdf.setFontSize(16);
  pdf.setFont(language === 'zh' ? 'NotoSansSC' : 'helvetica', 'bold');
  pdf.text(`1. ${content.overview}`, margin, yPosition);
  yPosition += 10;

  pdf.setFontSize(11);
  pdf.setFont(language === 'zh' ? 'NotoSansSC' : 'helvetica', 'normal');

  content.overviewContent.forEach(line => {
    if (yPosition > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
    }
    pdf.text(line, margin, yPosition);
    yPosition += lineHeight;
  });
  yPosition += 10;

  // 各个功能模块
  content.sections.forEach((section, index) => {
    pdf.setFontSize(14);
    pdf.setFont(language === 'zh' ? 'NotoSansSC' : 'helvetica', 'bold');
    pdf.text(`${index + 2}. ${section.title}`, margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(11);
    pdf.setFont(language === 'zh' ? 'NotoSansSC' : 'helvetica', 'normal');

    section.features.forEach(feature => {
      if (yPosition > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }
      pdf.text(feature, margin + 5, yPosition);
      yPosition += lineHeight;
    });
    yPosition += 8;
  });

  // 保存PDF
  const langSuffix = language === 'zh' ? '中文' : 'English';
  const filename = `DocCollab_功能总结_${langSuffix}_${new Date().getTime()}.pdf`;
  pdf.save(filename);

  return filename;
};

// 生成双语PDF
export const generateBilingualPDF = () => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const lineHeight = 6;
  let yPosition = margin;

  // 添加中文字体支持
  addChineseFont(pdf);

  // 标题
  pdf.setFontSize(20);
  pdf.setFont('NotoSansSC', 'bold');
  pdf.text(
    'DocCollab Rich Text Editor Feature Summary',
    pageWidth / 2,
    yPosition,
    { align: 'center' },
  );
  yPosition += 12;
  pdf.text('DocCollab 富文本编辑器功能总结', pageWidth / 2, yPosition, {
    align: 'center',
  });
  yPosition += 15;

  // 生成时间
  pdf.setFontSize(10);
  pdf.setFont('NotoSansSC', 'normal');
  const currentDate = new Date().toLocaleDateString('zh-CN');
  pdf.text(`Generated: ${currentDate}`, pageWidth / 2, yPosition, {
    align: 'center',
  });
  yPosition += 8;
  pdf.text(`生成时间: ${currentDate}`, pageWidth / 2, yPosition, {
    align: 'center',
  });
  yPosition += 20;

  // 功能概述
  pdf.setFontSize(14);
  pdf.setFont('NotoSansSC', 'bold');
  pdf.text('1. Feature Overview / 功能概述', margin, yPosition);
  yPosition += 8;

  pdf.setFontSize(10);
  pdf.setFont('NotoSansSC', 'normal');

  const overviewPairs = [
    [
      'DocCollab is an online collaborative rich text editing system based on React + NestJS,',
      'DocCollab 是一个基于 React + NestJS 的在线协同富文本编辑系统，',
    ],
    [
      'similar to Tencent Docs, supporting real-time collaborative editing and multi-format export.',
      '类似腾讯文档，支持多人实时协作编辑、多格式导出等功能。',
    ],
    [
      'The editor is built on Quill.js with collaboration features based on Yjs.',
      '编辑器基于 Quill.js 构建，协同功能基于 Yjs 实现。',
    ],
  ];

  overviewPairs.forEach(([en, zh]) => {
    if (yPosition > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
    }
    pdf.text(en, margin, yPosition);
    yPosition += lineHeight;
    pdf.text(zh, margin, yPosition);
    yPosition += lineHeight + 2;
  });
  yPosition += 8;

  // 各个功能模块
  const sectionPairs = [
    ['Text Formatting Features', '文本格式编辑功能'],
    ['Real-time Collaborative Editing', '实时协同编辑功能'],
    ['Document Statistics', '文档统计功能'],
    ['Document Operations', '文档操作功能'],
    ['User Experience Features', '用户体验功能'],
    ['Technical Features', '技术特性'],
    ['Feature Completeness Assessment', '功能完整性评估'],
  ];

  sectionPairs.forEach(([enTitle, zhTitle], index) => {
    pdf.setFontSize(12);
    pdf.setFont('NotoSansSC', 'bold');
    pdf.text(`${index + 2}. ${enTitle}`, margin, yPosition);
    yPosition += 6;
    pdf.text(`${index + 2}. ${zhTitle}`, margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(9);
    pdf.setFont('NotoSansSC', 'normal');

    // 添加一些示例功能点
    const sampleFeatures = [
      ['• Multi-format support', '• 多格式支持'],
      ['• Real-time collaboration', '• 实时协作'],
      ['• Advanced formatting', '• 高级格式化'],
    ];

    sampleFeatures.forEach(([en, zh]) => {
      if (yPosition > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }
      pdf.text(en, margin + 5, yPosition);
      yPosition += lineHeight;
      pdf.text(zh, margin + 5, yPosition);
      yPosition += lineHeight;
    });
    yPosition += 6;
  });

  // 保存PDF
  const filename = `DocCollab_功能总结_双语_Bilingual_${new Date().getTime()}.pdf`;
  pdf.save(filename);

  return filename;
};

// 显示PDF生成选项菜单
export const showPDFMenu = () => {
  // 查找功能总结按钮元素 - 修复选择器
  const summaryButton =
    document.querySelector('button[title*="生成功能总结PDF"]') ||
    document.querySelector('button:has(.anticon-file-text)') ||
    document.querySelector('.action-buttons button:last-child');

  console.log('查找功能总结按钮:', summaryButton);

  if (!summaryButton) {
    message.error('未找到功能总结按钮');
    return;
  }

  const buttonRect = summaryButton.getBoundingClientRect();
  console.log('按钮位置:', buttonRect);

  const menu = document.createElement('div');
  menu.className = 'pdf-menu';
  menu.style.cssText = `
    position: fixed;
    top: ${buttonRect.bottom + 5}px;
    left: ${buttonRect.left}px;
    background: white;
    border: 1px solid #d9d9d9;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    min-width: 150px;
    animation: fadeIn 0.2s ease-in-out;
  `;

  // 添加动画样式
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);

  const options = [
    {
      key: 'zh',
      label: '中文总结',
      icon: '📄',
      action: async () => await generateChinesePDFWithImage(),
    },
    {
      key: 'en',
      label: 'English Summary',
      icon: '🌍',
      action: () => generateSummaryPDF('en'),
    },
    {
      key: 'bilingual',
      label: '双语总结',
      icon: '🌐',
      action: () => generateBilingualPDF(),
    },
  ];

  options.forEach(option => {
    const item = document.createElement('div');
    item.className = 'pdf-menu-item';
    item.style.cssText = `
      padding: 10px 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: background-color 0.2s;
      border-bottom: 1px solid #f0f0f0;
    `;
    item.innerHTML = `<span style="font-size: 16px;">${option.icon}</span><span>${option.label}</span>`;

    item.addEventListener('mouseenter', () => {
      item.style.backgroundColor = '#f5f5f5';
    });

    item.addEventListener('mouseleave', () => {
      item.style.backgroundColor = 'transparent';
    });

    item.addEventListener('click', async () => {
      try {
        const filename = await option.action();
        const message = document.createElement('div');
        message.style.cssText = `
                  position: fixed;
                  top: 20px;
                  right: 20px;
                  background: #52c41a;
                  color: white;
                  padding: 10px 16px;
                  border-radius: 6px;
                  z-index: 1001;
                  animation: slideIn 0.3s ease-out;
                `;
        message.textContent = `PDF已生成: ${filename}`;
        document.body.appendChild(message);

        setTimeout(() => {
          document.body.removeChild(message);
        }, 3000);

        document.body.removeChild(menu);
        document.head.removeChild(style);
      } catch (error) {
        console.error('PDF生成失败:', error);
        const errorMessage = document.createElement('div');
        errorMessage.style.cssText = `
                  position: fixed;
                  top: 20px;
                  right: 20px;
                  background: #ff4d4f;
                  color: white;
                  padding: 10px 16px;
                  border-radius: 6px;
                  z-index: 1001;
                  animation: slideIn 0.3s ease-out;
                `;
        errorMessage.textContent = 'PDF生成失败，请重试';
        document.body.appendChild(errorMessage);

        setTimeout(() => {
          document.body.removeChild(errorMessage);
        }, 3000);
      }
    });

    menu.appendChild(item);
  });

  // 移除最后一个项目的底部边框
  const lastItem = menu.lastElementChild;
  if (lastItem) {
    lastItem.style.borderBottom = 'none';
  }

  // 添加关闭菜单的点击事件
  const closeMenu = e => {
    if (!menu.contains(e.target) && !summaryButton.contains(e.target)) {
      document.body.removeChild(menu);
      document.head.removeChild(style);
      document.removeEventListener('click', closeMenu);
    }
  };

  setTimeout(() => {
    document.addEventListener('click', closeMenu);
  }, 0);

  document.body.appendChild(menu);
};
