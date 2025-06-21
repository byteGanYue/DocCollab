import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { documentAPI } from '../../utils/api';
import Editor from './component/editor';

const DocEditor = () => {
  const { id: documentId } = useParams(); // 从路由参数获取documentId
  const [documentData, setDocumentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { userId } = JSON.parse(localStorage.getItem('userInfo'));

  // 获取文档详情数据
  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setLoading(true);

        console.log('userId', userId);
        const response = await documentAPI.getDocument(
          parseInt(documentId),
          userId,
        );

        if (response.success) {
          setDocumentData(response.data);
        }
      } catch (err) {
        console.error('获取文档详情失败:', err);
      } finally {
        setLoading(false);
      }
    };

    if (documentId) {
      fetchDocument();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  // 渲染加载状态
  if (loading) {
    return (
      <div className="doc-editor-page">
        <div style={{ padding: '20px', textAlign: 'center' }}>加载中...</div>
      </div>
    );
  }

  return (
    <div className="doc-editor-page">
      <Editor documentData={documentData} />
    </div>
  );
};

export default DocEditor;
