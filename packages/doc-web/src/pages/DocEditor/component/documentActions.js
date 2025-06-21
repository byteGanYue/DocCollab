import { message } from 'antd';

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

// 下载文档
export const handleDownload = (quillRef, documentTitle) => {
  if (!quillRef.current) return;

  const text = quillRef.current.getText();
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${documentTitle}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  message.success('文档下载成功！');
};
