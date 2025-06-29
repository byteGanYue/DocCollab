import React, { useEffect, useMemo } from 'react';
import { EditorSDK } from '@byteganyue/editorsdk';
import { useParams } from 'react-router-dom';
import { documentAPI } from '@/utils/api';

/**
 * 文档编辑器页面组件
 * 使用唯一的documentId作为key，确保切换文档时完全重新创建编辑器实例
 * 实现文档间完全隔离
 */
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

  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const userId = userInfo.userId;

  // 组件挂载时打印调试信息
  useEffect(() => {
    console.log(`[DocEditor] 组件挂载 - 文档ID: ${documentId}`);
    console.log(`[DocEditor] 使用key = ${documentId} 强制隔离编辑器实例`);

    // 组件卸载时的清理函数
    return () => {
      console.log(`[DocEditor] 组件卸载 - 文档ID: ${documentId}`);

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

  // 监控组件重新渲染
  console.log(`[DocEditor] 渲染 - 文档ID: ${documentId}`);

  return (
    <div className="doc-editor-page">
      {/* 
        使用documentId作为key属性，确保文档切换时编辑器组件被完全卸载和重建
        这样可以确保文档间的协同上下文完全隔离，避免互相干扰
      */}
      <EditorSDK key={documentId} documentId={documentId} userId={userId} />

      {/* 调试信息 */}
      <div
        style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '5px 10px',
          borderRadius: '4px',
          fontSize: '12px',
          zIndex: 9999,
        }}
      >
        文档ID: {documentId}
      </div>
    </div>
  );
};

export default DocEditor;
