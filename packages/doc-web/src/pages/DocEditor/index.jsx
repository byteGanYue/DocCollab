import React, { useEffect, useMemo } from 'react';
import { EditorSDK } from '@byteganyue/editorsdk';
import { useParams } from 'react-router-dom';
import { documentAPI } from '@/utils/api';

const DocEditor = () => {
  const { id } = useParams();

  // 使用 useMemo 确保 documentId 稳定，避免重复渲染
  const documentId = useMemo(() => {
    // 如果没有 id 参数，生成一个唯一的临时 ID
    if (!id) {
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('生成临时文档ID:', tempId);
      return tempId;
    }
    return id;
  }, [id]);

  useEffect(() => {
    // 组件卸载时的清理函数
    return () => {
      const isEdit = localStorage.getItem('isEdit') === 'true';
      console.log('isEdit', isEdit);
      console.log('documentId', documentId);
      if (isEdit && documentId && !documentId.startsWith('temp_')) {
        console.log('documentId', documentId);
        // 调用创建历史版本API
        documentAPI
          .createDocumentHistory(documentId)
          .then(() => {
            console.log('历史版本创建成功');
            // 清除编辑标记
            localStorage.removeItem('isEdit');
          })
          .catch(error => {
            console.error('创建历史版本失败:', error);
          });
      }
    };
  }, [documentId]);

  return (
    <div className="doc-editor-page">
      <EditorSDK documentId={documentId} />
    </div>
  );
};

export default DocEditor;
