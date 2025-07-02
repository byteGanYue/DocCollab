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

// 默认编辑器内容
const DEFAULT_EDITOR_VALUE = [
  {
    type: 'paragraph',
    children: [{ text: '' }],
  },
];

/**
 * 检查编辑器内容是否为空
 * @param {Array} value - 编辑器内容
 * @returns {boolean} 是否为空
 */
const isEditorValueEmpty = value => {
  return (
    Array.isArray(value) &&
    value.length === 1 &&
    value[0].type === 'paragraph' &&
    value[0].children?.length === 1 &&
    value[0].children[0].text === ''
  );
};

/**
 * 检查是否为临时文档
 * @param {string} documentId - 文档ID
 * @returns {boolean} 是否为临时文档
 */
const isTempDocument = documentId => {
  return !documentId || documentId.startsWith('temp_');
};

/**
 * 获取URL查询参数中的版本ID
 * @param {string} search - URL search字符串
 * @returns {string|null} 版本ID
 */
const getVersionIdFromUrl = search => {
  const searchParams = new URLSearchParams(search);
  return searchParams.get('version');
};

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

  // 获取当前URL中的版本ID
  const currentVersionId = useMemo(
    () => getVersionIdFromUrl(location.search),
    [location.search],
  );

  // 生成唯一的编辑器key
  const editorKey = useMemo(() => {
    return currentVersionId ? `${documentId}_v${currentVersionId}` : documentId;
  }, [documentId, currentVersionId]);

  // 初始化编辑器内容
  const initializeEditor = useCallback(() => {
    setLoading(true);

    // 对于新文档或临时文档，使用默认内容
    if (isTempDocument(documentId) || !userId) {
      setEditorValue(DEFAULT_EDITOR_VALUE);
    } else {
      // 对于现有文档，协同编辑内容将通过EditorSDK的Yjs同步机制加载
      // 这里只需要设置一个初始值，实际内容会通过yjsState同步
      setEditorValue(DEFAULT_EDITOR_VALUE);
    }

    setLoading(false);
  }, [documentId, userId]);

  // 创建历史版本（现在主要通过yjsState处理）
  const createHistoryVersion = useCallback(async () => {
    // 如果是临时文档或标记为没有编辑，或者正在查看历史版本，则不创建历史版本
    if (isTempDocument(documentId) || !hasEdited.current || currentVersionId) {
      return;
    }

    try {
      // 历史版本创建现在主要依赖yjsState，这里保留接口调用但不传递content
      const result = await documentAPI.createDocumentHistory(documentId);
      if (result.success) {
        // 重置编辑标志
        hasEdited.current = false;
        // 清除localStorage中的编辑标记
        localStorage.removeItem('isEdit');
      }
    } catch (error) {
      console.error(`[DocEditor] 历史版本创建失败:`, error);
    }
  }, [documentId, currentVersionId]);

  // 启动或重置历史版本创建计时器
  const resetHistoryVersionTimer = useCallback(() => {
    // 清除现有计时器
    if (historyVersionTimer.current) {
      clearTimeout(historyVersionTimer.current);
      historyVersionTimer.current = null;
    }

    // 如果是临时文档，不设置计时器
    if (isTempDocument(documentId)) return;

    // 设置新计时器
    historyVersionTimer.current = setTimeout(() => {
      createHistoryVersion();
    }, HISTORY_VERSION_TIMER);
  }, [documentId, createHistoryVersion]);

  // 自动保存逻辑（防抖）
  const handleEditorChange = useCallback(
    value => {
      if (isSwitchingDocs.current) return;
      setEditorValue(value);

      // 只有内容非空且和 lastSavedValue 不一致时才标记 hasEdited
      const isEmpty = isEditorValueEmpty(value);
      const hasChanged =
        JSON.stringify(value) !== JSON.stringify(lastSavedValue.current);

      if (!isEmpty && hasChanged) {
        hasEdited.current = true;
        localStorage.setItem('isEdit', 'true');
      }
      resetHistoryVersionTimer();
    },
    [resetHistoryVersionTimer],
  );

  // 点击版本回退按钮回调函数
  const handleBackHistory = useCallback(
    async versionId => {
      try {
        // 调用版本回退API
        const result = await documentAPI.restoreDocument(documentId, versionId);
        if (result.success) {
          console.log(`[DocEditor] 成功回退到版本: ${versionId}`);
          // 版本回退成功，内容会通过yjsState自动同步
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
        }
      } catch (error) {
        console.error(`[DocEditor] 版本回退出错:`, error);
      }
    },
    [documentId, location],
  );

  // 检查URL中是否包含version参数
  useEffect(() => {
    if (currentVersionId) {
      // 设置版本回退属性
      setOnBackHistoryProps({
        versionId: currentVersionId,
        isShow: true,
        onClick: () => handleBackHistory(currentVersionId),
      });
    } else {
      // 重置状态
      setOnBackHistoryProps({
        versionId: null,
        isShow: false,
        onClick: () => {},
      });
    }
  }, [currentVersionId, handleBackHistory]);

  // 组件挂载和卸载处理
  useEffect(() => {
    // 重置编辑状态
    hasEdited.current = false;
    localStorage.removeItem('isEdit');

    // 组件卸载时的清理函数
    return () => {
      // 清除历史版本计时器
      if (historyVersionTimer.current) {
        clearTimeout(historyVersionTimer.current);
        historyVersionTimer.current = null;
      }

      // 在切换文档时或查看历史版本时不创建历史版本
      if (isSwitchingDocs.current || currentVersionId) {
        return;
      }

      // 如果有编辑过且不是临时文档，创建历史版本
      if (hasEdited.current && !isTempDocument(documentId)) {
        documentAPI
          .createDocumentHistory(documentId)
          .then(() => {
            localStorage.removeItem('isEdit');
          })
          .catch(error => {
            console.error('创建历史版本失败:', error);
          });
      }
    };
  }, [documentId, currentVersionId]);

  // 切换文档时初始化编辑器
  useEffect(() => {
    initializeEditor();
    // 切换文档时清除保存定时器
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [initializeEditor]);

  return (
    <div className="doc-editor-page">
      {/* 编辑器加载中提示 */}
      {loading && (
        <div style={{ padding: 20, color: '#888' }}>文档加载中...</div>
      )}
      {/* 只有 editorValue 有效且非 loading 时才渲染编辑器 */}
      {!loading && editorValue && (
        <EditorSDK
          key={editorKey}
          documentId={documentId}
          userId={userId}
          value={editorValue}
          onChange={handleEditorChange}
          onBackHistoryProps={onBackHistoryProps}
        />
      )}
    </div>
  );
};

export default DocEditor;
