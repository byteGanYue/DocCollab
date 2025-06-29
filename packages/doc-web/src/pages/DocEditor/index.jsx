import React, { useEffect } from 'react';
import { EditorSDK } from '@byteganyue/editorsdk';
import { useParams } from 'react-router-dom';
import { documentAPI } from '@/utils/api';

const DocEditor = () => {
  const documentId = useParams().id;
  console.log('documentId', documentId);
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const userId = userInfo.userId;
  console.log('userId', userId);
  useEffect(() => {
    // 组件卸载时的清理函数
    return () => {
      const isEdit = localStorage.getItem('isEdit') === 'true';
      if (isEdit && documentId) {
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
      <EditorSDK documentId={documentId} userId={userId} />
    </div>
  );
};

export default DocEditor;
