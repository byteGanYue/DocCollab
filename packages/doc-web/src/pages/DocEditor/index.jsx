import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from 'react';
import { EditorSDK } from '@byteganyue/editorsdk';
import { useParams, useLocation } from 'react-router-dom';
import { documentAPI } from '@/utils/api';

/**
 * 文档编辑器页面组件
 * 使用唯一的documentId作为key，确保切换文档时完全重新创建编辑器实例
 * 实现文档间完全隔离
 */
const AUTO_SAVE_DELAY = 1000; // 自动保存防抖间隔(ms)
const HISTORY_VERSION_TIMER = 60 * 10 * 1000; // 自动创建历史版本的计时器间隔(10分钟)

const DocEditor = () => {
  const { id } = useParams();
  // 获取location对象用于解析URL查询参数
  const location = useLocation();

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

  // 编辑器内容状态
  const [editorValue, setEditorValue] = useState(undefined);
  // 加载状态
  const [loading, setLoading] = useState(false);
  // 保存状态
  const [saving, setSaving] = useState(false);
  // 防抖保存定时器
  const saveTimer = useRef(null);
  // 记录上次保存内容
  const lastSavedValue = useRef(undefined);
  // 是否正在切换文档的标志
  const isSwitchingDocs = useRef(false);
  // 编辑器版本回退props
  const [onBackHistoryProps, setOnBackHistoryProps] = useState({
    versionId: null,
    isShow: false,
    onClick: () => {},
  });

  // 历史版本自动创建计时器
  const historyVersionTimer = useRef(null);
  // 是否有编辑过的标志
  const hasEdited = useRef(false);

  // 加载文档内容
  const fetchDocumentContent = useCallback(async () => {
    if (!documentId || !userId || documentId.startsWith('temp_')) {
      setEditorValue(undefined); // 新建文档用默认内容
      return;
    }
    setLoading(true);
    // 设置切换文档标志
    isSwitchingDocs.current = true;
    try {
      const response = await documentAPI.getDocument(documentId, userId);
      console.log('API获取后端的response', response);
      if (response.success && response.data) {
        let content = response.data.content;
        let parsed = undefined;
        if (typeof content === 'string') {
          try {
            parsed = JSON.parse(content);
          } catch {
            parsed = undefined;
          }
        } else if (Array.isArray(content)) {
          parsed = content;
        }
        setEditorValue(parsed);
        lastSavedValue.current = parsed;
        console.log('setEditorValue', parsed);
        // 清除window上的全局变量，以便重置初始化状态
        if (window.currentExternalValue) {
          console.log('清除当前外部值缓存，准备使用新加载的内容');
          window.currentExternalValue = null;
        }
      } else {
        setEditorValue(undefined);
        lastSavedValue.current = undefined;
      }
    } catch {
      setEditorValue(undefined);
      lastSavedValue.current = undefined;
    } finally {
      setLoading(false);
      // 文档加载完成后重置标志
      setTimeout(() => {
        isSwitchingDocs.current = false;
      }, 500); // 稍微延迟以确保状态更新完成
    }
  }, [documentId, userId]);

  // 创建历史版本
  const createHistoryVersion = useCallback(async () => {
    // 如果是临时文档或标记为没有编辑，则不创建历史版本
    if (!documentId || documentId.startsWith('temp_') || !hasEdited.current) {
      return;
    }

    console.log(`[DocEditor] 开始创建历史版本: documentId=${documentId}`);
    try {
      const result = await documentAPI.createDocumentHistory(documentId);
      if (result.success) {
        console.log(
          `[DocEditor] 历史版本创建成功: documentId=${documentId}, versionId=${result.data.versionId}`,
        );
        // 重置编辑标志
        hasEdited.current = false;
        // 清除localStorage中的编辑标记
        localStorage.removeItem('isEdit');
      }
    } catch (error) {
      console.error(`[DocEditor] 历史版本创建失败:`, error);
    }
  }, [documentId]);

  // 启动或重置历史版本创建计时器
  const resetHistoryVersionTimer = useCallback(() => {
    // 清除现有计时器
    if (historyVersionTimer.current) {
      clearTimeout(historyVersionTimer.current);
      historyVersionTimer.current = null;
    }

    // 如果是临时文档，不设置计时器
    if (!documentId || documentId.startsWith('temp_')) return;

    // 设置新计时器
    historyVersionTimer.current = setTimeout(() => {
      console.log(`[DocEditor] 历史版本计时器触发: documentId=${documentId}`);
      createHistoryVersion();
    }, HISTORY_VERSION_TIMER);

    console.log(
      `[DocEditor] 启动/重置历史版本计时器: documentId=${documentId}, 计时${HISTORY_VERSION_TIMER / 60000}分钟`,
    );
  }, [documentId, createHistoryVersion]);

  // 自动保存逻辑（防抖）
  const handleEditorChange = useCallback(
    value => {
      // 如果正在切换文档，跳过内容更新
      if (isSwitchingDocs.current) {
        console.log('[DocEditor] 正在切换文档，跳过内容更新');
        return;
      }

      setEditorValue(value);
      // 标记有编辑动作
      hasEdited.current = true;
      localStorage.setItem('isEdit', 'true');

      // 重置历史版本计时器
      resetHistoryVersionTimer();

      // 仅保存已存在的文档
      if (!documentId || documentId.startsWith('temp_')) return;

      // 检查是否是空内容，如果是则跳过保存
      const isEmpty =
        Array.isArray(value) &&
        value.length === 1 &&
        value[0].type === 'paragraph' &&
        value[0].children?.length === 1 &&
        value[0].children[0].text === '';

      if (isEmpty) {
        console.log('[DocEditor] 检测到空内容，跳过保存');
        return;
      }

      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        // 避免重复保存相同内容
        if (JSON.stringify(value) === JSON.stringify(lastSavedValue.current))
          return;
        setSaving(true);
        try {
          await documentAPI.updateDocument(documentId, {
            content: JSON.stringify(value),
          });
          lastSavedValue.current = value;
        } catch {
          // 可加错误提示
        } finally {
          setSaving(false);
        }
      }, AUTO_SAVE_DELAY);
    },
    [documentId, resetHistoryVersionTimer],
  );

  // 点击版本回退按钮回调函数
  const handleBackHistory = useCallback(
    async versionId => {
      try {
        // 调用版本回退API
        const result = await documentAPI.restoreDocument(documentId, versionId);
        if (result.success) {
          console.log(`[DocEditor] 成功回退到版本: ${versionId}`);
          // 回退成功后刷新页面内容
          fetchDocumentContent();
          // 清除URL中的version参数
          window.history.replaceState({}, '', `${location.pathname}`);
          // 重置回退属性
          setOnBackHistoryProps({
            versionId: null,
            isShow: false,
            onClick: () => {},
          });
        } else {
          console.error(`[DocEditor] 版本回退失败:`, result.message);
          // 可以添加错误提示
        }
      } catch (error) {
        console.error(`[DocEditor] 版本回退出错:`, error);
        // 可以添加错误提示
      }
    },
    [documentId, location, fetchDocumentContent],
  );

  // 检查URL中是否包含version参数
  useEffect(() => {
    // 解析URL查询参数
    const searchParams = new URLSearchParams(location.search);
    const versionId = searchParams.get('version');

    if (versionId) {
      console.log(`[DocEditor] 检测到版本ID参数: ${versionId}`);

      // 设置版本回退属性
      setOnBackHistoryProps({
        versionId: parseInt(versionId),
        isShow: true,
        onClick: () => handleBackHistory(parseInt(versionId)),
      });
    } else {
      // 没有version参数时重置回退属性
      setOnBackHistoryProps({
        versionId: null,
        isShow: false,
        onClick: () => {},
      });
    }
  }, [documentId, location, fetchDocumentContent, handleBackHistory]);

  // 组件挂载时打印调试信息
  useEffect(() => {
    console.log(`[DocEditor] 组件挂载 - 文档ID: ${documentId}`);
    console.log(`[DocEditor] 使用key = ${documentId} 强制隔离编辑器实例`);

    // 重置编辑状态
    hasEdited.current = false;
    localStorage.removeItem('isEdit');

    // 组件卸载时的清理函数
    return () => {
      console.log(`[DocEditor] 组件卸载 - 文档ID: ${documentId}`);

      // 清除历史版本计时器
      if (historyVersionTimer.current) {
        clearTimeout(historyVersionTimer.current);
        historyVersionTimer.current = null;
        console.log(`[DocEditor] 清除历史版本计时器`);
      }

      // 在切换文档时不创建历史版本
      if (isSwitchingDocs.current) {
        console.log(`[DocEditor] 正在切换文档，不创建历史版本`);
        return;
      }

      // 如果有编辑过，创建历史版本
      if (hasEdited.current && documentId && !documentId.startsWith('temp_')) {
        console.log(
          `[DocEditor] 组件卸载时创建历史版本: documentId=${documentId}`,
        );
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
      } else {
        console.log(`[DocEditor] 组件卸载时未检测到编辑，不创建历史版本`);
      }
    };
  }, [documentId]);

  // 切换文档时加载内容
  useEffect(() => {
    fetchDocumentContent();
    // 切换文档时清除保存定时器
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [fetchDocumentContent]);

  // 组件卸载时自动保存一次
  useEffect(() => {
    return () => {
      if (
        documentId &&
        !documentId.startsWith('temp_') &&
        editorValue &&
        JSON.stringify(editorValue) !==
          JSON.stringify(lastSavedValue.current) &&
        // 添加此检查，防止保存空内容
        !(
          Array.isArray(editorValue) &&
          editorValue.length === 1 &&
          editorValue[0].type === 'paragraph' &&
          editorValue[0].children?.length === 1 &&
          editorValue[0].children[0].text === ''
        ) &&
        // 不在切换文档过程中
        !isSwitchingDocs.current
      ) {
        console.log('组件卸载时保存文档:', documentId);
        documentAPI.updateDocument(documentId, {
          content: JSON.stringify(editorValue),
        });
      }
    };
  }, [documentId, editorValue]);

  // 监控组件重新渲染
  console.log(`[DocEditor] 渲染 - 文档ID: ${documentId}`);

  return (
    <div className="doc-editor-page">
      {/* 编辑器加载中提示 */}
      {loading && (
        <div style={{ padding: 20, color: '#888' }}>文档加载中...</div>
      )}
      {/* 自动保存状态提示 */}
      {saving && (
        <div
          style={{
            position: 'fixed',
            top: 10,
            right: 10,
            color: '#888',
            zIndex: 9999,
          }}
        >
          正在自动保存...
        </div>
      )}
      {/* 
        使用documentId作为key属性，确保文档切换时编辑器组件被完全卸载和重建
        这样可以确保文档间的协同上下文完全隔离，避免互相干扰
      */}
      <EditorSDK
        key={documentId}
        documentId={documentId}
        userId={userId}
        value={editorValue}
        onChange={handleEditorChange}
        onBackHistoryProps={onBackHistoryProps}
      />

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
