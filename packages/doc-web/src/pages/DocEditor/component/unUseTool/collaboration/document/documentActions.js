import { message } from 'antd';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import TurndownService from 'turndown';

// 保存文档
export const handleSave = async (quillRef, documentTitle, setSaveLoading) => {
  if (!quillRef.current) return;

  setSaveLoading(true);
  try {
    const content = quillRef.current.getContents();
    const text = quillRef.current.getText();

    // 这里可以调用后端API保存文档
    // const response = await documentAPI.saveDocument({
    //   title: documentTitle,
    //   content: JSON.stringify(content),
    //   text: text
    // });

    // 模拟保存延迟
    await new Promise(resolve => setTimeout(resolve, 1000));

    message.success('文档保存成功！');

    // 保存到本地存储作为备份
    localStorage.setItem(
      'document_backup',
      JSON.stringify({
        title: documentTitle,
        content: content,
        text: text,
        timestamp: new Date().toISOString(),
      }),
    );
  } catch (error) {
    console.error('保存失败:', error);
    message.error('保存失败，请重试');
  } finally {
    setSaveLoading(false);
  }
};

// 分享文档
export const handleShare = (setShareUrl, setShareModalVisible) => {
  const currentUrl = window.location.href;
  setShareUrl(currentUrl);
  setShareModalVisible(true);
};

// 复制分享链接
export const copyShareUrl = async shareUrl => {
  try {
    await navigator.clipboard.writeText(shareUrl);
    message.success('链接已复制到剪贴板');
  } catch {
    message.error('复制失败，请手动复制');
  }
};

// 下载功能 - 支持多种格式
export const handleDownload = async (quill, format = 'txt') => {
  if (!quill) {
    message.error('编辑器未初始化');
    return;
  }

  try {
    let content = '';
    let filename = `document_${new Date().getTime()}`;
    let mimeType = '';

    switch (format) {
      case 'txt':
        // 纯文本格式
        content = quill.getText();
        filename += '.txt';
        mimeType = 'text/plain';
        break;

      case 'md': {
        // Markdown格式
        const htmlContent = quill.root.innerHTML;
        const turndownService = new TurndownService({
          headingStyle: 'atx',
          codeBlockStyle: 'fenced',
          emDelimiter: '*',
          bulletListMarker: '-',
        });

        // 配置代码块转换
        turndownService.addRule('codeBlocks', {
          filter: ['pre'],
          replacement: function (content, node) {
            const code = node.querySelector('code');
            const language = code
              ? code.className.replace('ql-syntax', '').trim()
              : '';
            return `\n\`\`\`${language}\n${content}\n\`\`\`\n`;
          },
        });

        content = turndownService.turndown(htmlContent);
        filename += '.md';
        mimeType = 'text/markdown';
        break;
      }

      case 'pdf': {
        // PDF格式
        const editorElement = quill.root;

        // 创建临时容器用于PDF生成
        const tempContainer = document.createElement('div');
        tempContainer.style.cssText = `
          position: absolute;
          left: -9999px;
          top: -9999px;
          width: 800px;
          background: white;
          padding: 40px;
          font-family: 'Arial', sans-serif;
          line-height: 1.6;
          color: #333;
        `;
        tempContainer.innerHTML = editorElement.innerHTML;
        document.body.appendChild(tempContainer);

        try {
          const canvas = await html2canvas(tempContainer, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            width: 800,
            height: tempContainer.scrollHeight,
          });

          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');

          const imgWidth = 210; // A4宽度
          const pageHeight = 295; // A4高度
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          let heightLeft = imgHeight;

          let position = 0;

          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;

          while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
          }

          pdf.save(`${filename}.pdf`);
          message.success('PDF下载成功');
        } finally {
          document.body.removeChild(tempContainer);
        }
        return; // PDF处理完成，直接返回
      }

      default:
        message.error('不支持的格式');
        return;
    }

    // 创建并下载文件
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    message.success(`${format.toUpperCase()}文件下载成功`);
  } catch (error) {
    console.error('下载失败:', error);
    message.error('下载失败，请重试');
  }
};

// 显示下载选项菜单
export const showDownloadMenu = quill => {
  // 查找下载按钮元素 - 修复选择器
  const downloadButton =
    document.querySelector('button[title*="下载文档"]') ||
    document.querySelector('button:has(.anticon-download)') ||
    document.querySelector('.action-buttons button:last-child');

  if (!downloadButton) {
    message.error('未找到下载按钮');
    return;
  }

  const buttonRect = downloadButton.getBoundingClientRect();

  const menu = document.createElement('div');
  menu.className = 'download-menu';
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

  const formats = [
    { key: 'txt', label: '文本文件 (.txt)', icon: '📄' },
    { key: 'md', label: 'Markdown (.md)', icon: '📝' },
    { key: 'pdf', label: 'PDF文档 (.pdf)', icon: '📕' },
  ];

  formats.forEach(format => {
    const item = document.createElement('div');
    item.className = 'download-menu-item';
    item.style.cssText = `
      padding: 10px 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: background-color 0.2s;
      border-bottom: 1px solid #f0f0f0;
    `;
    item.innerHTML = `<span style="font-size: 16px;">${format.icon}</span><span>${format.label}</span>`;

    item.addEventListener('mouseenter', () => {
      item.style.backgroundColor = '#f5f5f5';
    });

    item.addEventListener('mouseleave', () => {
      item.style.backgroundColor = 'transparent';
    });

    item.addEventListener('click', () => {
      handleDownload(quill, format.key);
      document.body.removeChild(menu);
      document.head.removeChild(style);
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
    if (!menu.contains(e.target) && !downloadButton.contains(e.target)) {
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
