import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Drawer, Button, Spin, Alert, Typography, Space, message } from 'antd';
import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import { computeContentHash, getTextFromContent } from '../utils/dealContent';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const { Title, Paragraph } = Typography;

// 纯文本样式
const textStyles = `
  .text-container {
    white-space: pre-wrap;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.8;
    font-size: 14px;
    color: #333;
    background-color: #f9f9f9;
    padding: 16px;
    border-radius: 4px;
    border: 1px solid #e0e0e0;
  }
  
  .text-paragraph {
    margin-bottom: 12px;
  }
  
  .text-cursor {
    display: inline-block;
    width: 2px;
    height: 1.2em;
    background-color: #333;
    margin-left: 1px;
    animation: cursor-blink 1s step-start infinite;
    vertical-align: text-bottom;
  }
  
  @keyframes cursor-blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }
  
  @keyframes highlight-fade {
    0% { background-color: rgba(255,255,0,0.3); }
    100% { background-color: transparent; }
  }
  
  .new-content {
    background-color: rgba(255,255,0,0.2);
    animation: highlight-fade 0.5s ease-out forwards;
  }
`;

/**
 * AI抽屉组件 - 用于展示文档摘要
 * 接收文档内容，提取所有文本，发送给AI生成摘要
 * 使用Ant Design的Drawer组件实现
 * 支持纯文本显示和PDF下载
 */
const AIDrawer = ({ isOpen, onClose, documentContent }) => {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false); // 正在生成中
  const [newContent, setNewContent] = useState(''); // 最新接收的内容

  // 记录上一次处理的内容哈希值
  const [lastContentHash, setLastContentHash] = useState('');

  // 用于自动滚动到底部
  const contentContainerRef = useRef(null);

  // 跟踪内容更新器
  const contentRef = useRef('');

  /**
   * 实时添加新内容，确保立即渲染
   * @param {string} content - 新接收的内容片段
   */
  const appendContentImmediately = useCallback(content => {
    // 使用ref来跟踪实际内容，避免闭包问题
    contentRef.current += content;

    // 更新React状态，触发重新渲染
    setSummary(contentRef.current);

    // 设置新内容用于高亮显示
    setNewContent(content);

    // 短暂高亮后清除
    setTimeout(() => {
      setNewContent('');
    }, 150);
  }, []);

  /**
   * 自动滚动到内容底部
   */
  const scrollToBottom = useCallback(() => {
    if (contentContainerRef.current) {
      const container = contentContainerRef.current;
      const isUserNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <
        100;

      // 只有当用户已经接近底部或者刚开始生成时才自动滚动
      if (isUserNearBottom || container.scrollTop === 0) {
        // 使用requestAnimationFrame确保在下一帧渲染后滚动
        requestAnimationFrame(() => {
          container.scrollTop = container.scrollHeight;
        });
      }
    }
  }, []);

  // 监听内容变化，自动滚动
  useEffect(() => {
    scrollToBottom();
  }, [summary, scrollToBottom]);

  /**
   * 生成文档摘要
   */
  const generateSummary = async () => {
    if (!documentContent) return;

    try {
      // 重置状态
      setLoading(true);
      setError(null);
      setSummary('');
      contentRef.current = ''; // 重要：重置ref中的内容
      setIsGenerating(true);
      setNewContent('');

      // 提取文本
      const extractedText = getTextFromContent(documentContent);
      if (!extractedText) {
        setError('无法从文档中提取文本内容');
        setLoading(false);
        setIsGenerating(false);
        return;
      }

      // 更新内容哈希值
      const contentHash = computeContentHash(documentContent);
      setLastContentHash(contentHash);

      // 构建请求体
      const requestBody = {
        model: 'Qwen/Qwen3-8B',
        stream: true,
        max_tokens: 512,
        enable_thinking: true,
        thinking_budget: 4096,
        min_p: 0.05,
        temperature: 0.7,
        top_p: 0.7,
        top_k: 50,
        frequency_penalty: 0.5,
        n: 1,
        stop: [],
        tools: [],
        messages: [
          {
            role: 'system',
            content:
              '你是一个专业的文档摘要生成助手，请根据用户提供的文档内容生成简洁明了的摘要，使用纯文本输出，注意段落分明。',
          },
          {
            role: 'user',
            content: `请为以下文档内容生成一个清晰、结构化的摘要：\n\n${extractedText}`,
          },
        ],
      };

      const options = {
        method: 'POST',
        headers: {
          Authorization:
            'Bearer sk-rdxapeitvmjgqnzcovllejczycnosmmgrdzxnfuudzpkmdph',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      };

      console.log('发送AI请求...');

      // 使用fetch API的流式响应
      const response = await fetch(
        'https://api.siliconflow.cn/v1/chat/completions',
        options,
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API错误详情:', {
          status: response.status,
          statusText: response.statusText,
          errorText,
        });
        throw new Error(
          `API请求失败: ${response.status} - ${errorText || response.statusText}`,
        );
      }

      console.log('开始接收流式响应');

      // 处理流式响应
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      // 逐块处理数据
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('流式响应接收完成');
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        console.log('收到数据块:', chunk);

        try {
          // 处理返回的数据行
          const lines = chunk.split('\n').filter(line => line.trim() !== '');
          console.log(`处理 ${lines.length} 行数据`);

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6); // 去掉 "data: " 前缀
              if (jsonStr === '[DONE]') {
                console.log('收到 [DONE] 标记');
                continue;
              }

              try {
                const data = JSON.parse(jsonStr);
                console.log('解析JSON数据:', data);

                if (
                  data.choices &&
                  data.choices[0].delta &&
                  data.choices[0].delta.content
                ) {
                  const content = data.choices[0].delta.content;
                  console.log('添加新内容:', content);

                  // 立即更新内容，确保实时渲染
                  appendContentImmediately(content);
                }
              } catch (jsonError) {
                console.error('JSON解析错误:', jsonError, '原始数据:', jsonStr);
              }
            }
          }
        } catch (e) {
          console.error('处理流式响应出错:', e);
        }
      }
    } catch (err) {
      setError(`生成摘要时出错: ${err.message}`);
      console.error('生成摘要时出错:', err);
    } finally {
      setLoading(false);
      setIsGenerating(false);
    }
  };

  // 当抽屉打开且有文档内容时，判断是否需要生成摘要
  useEffect(() => {
    if (isOpen && documentContent) {
      // 计算当前内容的哈希值
      const currentContentHash = computeContentHash(documentContent);

      // 如果内容发生变化或者没有摘要，则生成新的摘要
      if (currentContentHash !== lastContentHash || !summary) {
        generateSummary();
      }
    }
  }, [isOpen, documentContent, lastContentHash, summary]);

  /**
   * 下载摘要为PDF文件
   */
  const downloadAsPDF = async () => {
    if (!summary) {
      message.warn('没有可下载的摘要内容');
      return;
    }

    try {
      message.loading('正在生成PDF，请稍候...', 0);

      // 创建临时元素进行渲染，避免界面样式干扰
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '-9999px';
      tempContainer.style.width = '800px'; // 设置固定宽度以便更好的渲染
      tempContainer.style.padding = '20px';
      tempContainer.style.backgroundColor = '#ffffff';
      tempContainer.style.fontFamily =
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

      // 添加标题
      const titleDiv = document.createElement('div');
      titleDiv.style.fontSize = '20px';
      titleDiv.style.fontWeight = 'bold';
      titleDiv.style.marginBottom = '15px';
      titleDiv.style.borderBottom = '1px solid #ddd';
      titleDiv.style.paddingBottom = '10px';
      titleDiv.innerText = 'AI文档摘要';
      tempContainer.appendChild(titleDiv);

      // 添加内容
      const contentDiv = document.createElement('div');
      contentDiv.style.fontSize = '14px';
      contentDiv.style.lineHeight = '1.8';
      contentDiv.style.whiteSpace = 'pre-wrap';

      // 格式化摘要文本，将连续的换行符替换为段落
      const formattedSummary = summary
        .replace(/\n\s*\n/g, '\n\n') // 标准化连续换行
        .split('\n\n'); // 按段落分隔

      formattedSummary.forEach(paragraph => {
        if (paragraph.trim()) {
          const p = document.createElement('p');
          p.style.marginBottom = '12px';
          p.innerText = paragraph.trim();
          contentDiv.appendChild(p);
        }
      });

      tempContainer.appendChild(contentDiv);

      document.body.appendChild(tempContainer);

      try {
        // 使用html2canvas将元素转换为图像
        const canvas = await html2canvas(tempContainer, {
          scale: 2, // 提高清晰度
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          removeContainer: true, // 自动删除临时容器
        });

        // 创建PDF文档
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });

        // 计算宽高比，适应A4页面
        const imgWidth = 210 - 20; // A4宽度减去边距
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // 添加图像到PDF
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);

        // 如果内容超过一页，添加更多页面
        let heightLeft = imgHeight;
        let position = 10; // 初始位置

        while (heightLeft > 287) {
          // A4页面高度减去上下边距
          position = imgHeight - heightLeft + 10;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 10, -position, imgWidth, imgHeight);
          heightLeft -= 287;
        }

        // 下载PDF文件
        const fileName = `AI文档摘要_${new Date().toLocaleString().replace(/[\/\s:]/g, '_')}.pdf`;
        pdf.save(fileName);

        message.success('PDF生成成功，已开始下载');
      } finally {
        // 移除临时元素
        if (document.body.contains(tempContainer)) {
          document.body.removeChild(tempContainer);
        }
        message.destroy(); // 关闭所有消息
      }
    } catch (error) {
      console.error('PDF生成错误:', error);
      message.error('PDF生成失败: ' + error.message);
    }
  };

  // 使用antd的Drawer组件
  return (
    <Drawer
      title="AI文档摘要"
      placement="right"
      onClose={onClose}
      open={isOpen}
      width={1000}
      footer={
        <div style={{ textAlign: 'right' }}>
          {summary && (
            <Button
              type="primary"
              style={{ marginRight: 8 }}
              onClick={downloadAsPDF}
              disabled={isGenerating}
              icon={<DownloadOutlined />}
            >
              下载PDF
            </Button>
          )}
          <Button onClick={onClose}>关闭</Button>
        </div>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        {loading && !summary && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>正在生成文档摘要...</div>
          </div>
        )}

        {error && (
          <Alert
            message="生成摘要出错"
            description={error}
            type="error"
            showIcon
          />
        )}

        {(summary || (loading && summary)) && (
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
              }}
            >
              <Title level={4} style={{ margin: 0 }}>
                文档摘要
                {isGenerating && (
                  <Spin size="small" style={{ marginLeft: '10px' }} />
                )}
              </Title>
              <Button
                type="primary"
                onClick={generateSummary}
                disabled={loading || isGenerating}
                icon={<ReloadOutlined />}
              >
                重新生成摘要
              </Button>
            </div>

            <div
              style={{
                backgroundColor: '#f9f9f9',
                padding: '16px',
                borderRadius: '4px',
                border: '1px solid #e0e0e0',
                position: 'relative',
                maxHeight: '80vh',
                overflow: 'auto',
              }}
              ref={contentContainerRef}
            >
              <style>{textStyles}</style>
              <div className="text-container">
                {summary.split('\n\n').map((paragraph, index) => (
                  <Paragraph key={index} className="text-paragraph">
                    {paragraph}
                  </Paragraph>
                ))}
                {isGenerating && <span className="text-cursor"></span>}
              </div>
            </div>
            {isGenerating && (
              <div
                style={{
                  textAlign: 'center',
                  marginTop: '8px',
                  fontSize: '12px',
                  color: '#888',
                }}
              >
                正在生成中... 已生成 {summary.length} 个字符
              </div>
            )}
          </div>
        )}
      </Space>
    </Drawer>
  );
};

export default AIDrawer;
