import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from 'react';
import { EditorSDK } from '@byteganyue/editorsdk';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { documentAPI } from '@/utils/api';
import { Button, Space, message } from 'antd';
import { FileTextOutlined, HistoryOutlined } from '@ant-design/icons';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
/**
 * 文档编辑器页面组件
 * 使用唯一的documentId作为key，确保切换文档时完全重新创建编辑器实例
 * 实现文档间完全隔离
 *
 * 回滚功能使用说明：
 * 1. 新的回滚实现基于状态快照恢复，不重建Y.Doc和Provider实例
 * 2. 使用 restoreFromSnapshot() 方法进行回滚
 * 3. 回滚流程：暂停协同 -> 应用快照 -> 恢复协同 -> 同步到MongoDB
 * 4. 相比旧的重建实例方式，新方式更高效、更稳定
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

// 将历史版本content转换为Slate格式
const contentToSlate = content => {
  if (!content) {
    return DEFAULT_EDITOR_VALUE;
  }

  try {
    // 如果content是JSON字符串，尝试解析
    if (typeof content === 'string') {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }

    // 如果content是数组，直接返回
    if (Array.isArray(content)) {
      return content;
    }

    // 如果是纯文本，转换为段落格式
    if (typeof content === 'string') {
      return [
        {
          type: 'paragraph',
          children: [{ text: content }],
        },
      ];
    }

    return DEFAULT_EDITOR_VALUE;
  } catch (error) {
    console.warn('[DocEditor] 解析历史版本content失败:', error);
    // 如果解析失败，作为纯文本处理
    return [
      {
        type: 'paragraph',
        children: [{ text: String(content) }],
      },
    ];
  }
};

// 将Slate格式转换为Delta格式
const slateToDelta = slateValue => {
  if (!slateValue || !Array.isArray(slateValue)) {
    return [];
  }

  const delta = [];

  slateValue.forEach(block => {
    if (block.type === 'paragraph') {
      // 处理段落
      if (block.children && block.children.length > 0) {
        const text = block.children.map(child => child.text || '').join('');

        if (text) {
          delta.push({ insert: text });
        }
      }
    } else {
      // 处理其他块级元素
      delta.push({
        insert: { type: block.type, children: block.children || [] },
      });
    }

    // 添加换行
    delta.push({ insert: '\n' });
  });

  return delta;
};

/**
 * 从 Y.Doc 强制同步内容到编辑器
 * 确保编辑器UI与Y.Doc内容完全一致
 */
const forceSyncEditorValueFromYDoc = (ydoc, Y) => {
  if (!ydoc || !Y) {
    console.warn('[DocEditor] Y.Doc或Y库未初始化，无法同步编辑器内容');
    return null;
  }

  try {
    const yText = ydoc.get('content', Y.XmlText);
    if (yText) {
      const content = yText.toString();
      console.log('[DocEditor] 从Y.Doc获取到内容:', content);

      // 尝试解析为Slate格式
      let slateValue;
      try {
        // 首先尝试解析为JSON（如果是Slate格式存储的）
        slateValue = JSON.parse(content);
        if (!Array.isArray(slateValue)) {
          throw new Error('解析结果不是数组');
        }
        console.log('[DocEditor] 成功解析为Slate格式:', slateValue);
      } catch (parseError) {
        // 如果解析失败，作为纯文本处理
        console.log(
          '[DocEditor] 解析失败，作为纯文本处理:',
          parseError.message,
        );
        if (content.trim()) {
          slateValue = [
            {
              type: 'paragraph',
              children: [{ text: content }],
            },
          ];
        } else {
          slateValue = DEFAULT_EDITOR_VALUE;
        }
      }

      console.log('[DocEditor] 最终同步到编辑器的Slate值:', slateValue);
      return slateValue;
    } else {
      console.warn('[DocEditor] Y.Doc中没有找到content字段');
      return DEFAULT_EDITOR_VALUE;
    }
  } catch (error) {
    console.error('[DocEditor] 从Y.Doc同步内容失败:', error);
    return DEFAULT_EDITOR_VALUE;
  }
};

const DocEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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
  const editorValueRef = useRef();
  useEffect(() => {
    editorValueRef.current = editorValue;
    console.log('[DocEditor] editorValue变化:', editorValue);
  }, [editorValue]);

  // 从 Y.Doc 强制同步内容到编辑器的回调函数
  const syncEditorValueFromYDoc = useCallback(() => {
    if (window.ydoc && window.Y) {
      const slateValue = forceSyncEditorValueFromYDoc(window.ydoc, window.Y);
      if (slateValue) {
        setEditorValue(slateValue);
        editorValueRef.current = slateValue;
        console.log('[DocEditor] 已强制用Y.Doc内容刷新编辑器');
      }
    }
  }, []);

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
    onClick: () => { },
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

  // 获取URL中的快照恢复参数
  const restoreSnapshotFromUrl = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    const snapshotBase64 = searchParams.get('restoreSnapshot');
    const versionId = searchParams.get('versionId');
    const contentBase64 = searchParams.get('restoreContent'); // 新增：历史版本内容

    if (snapshotBase64 && versionId) {
      try {
        // 使用 decodeURIComponent 和 atob 的组合来解码包含中文字符的字符串
        const snapshotData = JSON.parse(
          decodeURIComponent(atob(snapshotBase64)),
        );
        let contentData = null;

        // 解析历史版本内容（如果有）
        if (contentBase64) {
          try {
            contentData = JSON.parse(decodeURIComponent(atob(contentBase64)));
          } catch (error) {
            console.warn('[DocEditor] 解析历史版本内容失败:', error);
          }
        }

        return { snapshotData, versionId, contentData };
      } catch (error) {
        console.error('[DocEditor] 解析快照数据失败:', error);
        return null;
      }
    }
    return null;
  }, [location.search]);

  // 生成唯一的编辑器key
  const editorKey = useMemo(() => {
    return currentVersionId ? `${documentId}_v${currentVersionId}` : documentId;
  }, [documentId, currentVersionId]);

  // 新增：只读模式和历史快照内容状态
  const [readOnly, setReadOnly] = useState(false);
  const [historyContent, setHistoryContent] = useState(null);
  const [contentReady, setContentReady] = useState(false);

  // Y.Doc和provider实例
  const [yDocReady, setYDocReady] = useState(false);
  useEffect(() => {
    let isMounted = true;
    async function initYDocAndProvider() {
      if (!documentId || isTempDocument(documentId)) return;
      // 1. 拉取数据库yjsState
      try {
        const res = await fetch(`/api/document/${documentId}/yjs-state`);
        const data = await res.json();
        let ydoc = new Y.Doc();
        if (data.success && data.data && data.data.yjsState) {
          Y.applyUpdate(ydoc, Uint8Array.from(data.data.yjsState));
          console.log('[DocEditor] 用数据库yjsState初始化Y.Doc');
        }
        window.ydoc = ydoc;
        window.Y = Y;
        // 2. 初始化provider，传入ydoc
        if (window.provider) {
          window.provider.destroy && window.provider.destroy();
        }
        window.provider = new WebsocketProvider('ws://localhost:1234', String(documentId), ydoc);
        if (isMounted) setYDocReady(true);
      } catch (error) {
        console.error('[DocEditor] 初始化Y.Doc/provider失败:', error);
      }
    }
    initYDocAndProvider();
    return () => { isMounted = false; };
  }, [documentId]);

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
    if (isTempDocument(documentId) || !hasEdited.current || currentVersionId) {
      return;
    }
    try {
      const content = JSON.stringify(editorValue);
      let yjsState = undefined;
      if (window.ydoc && window.Y) {
        // 获取Yjs文档的二进制状态
        yjsState = Array.from(window.Y.encodeStateAsUpdate(window.ydoc));
        console.log('[快照保存] ydoc.toJSON():', window.ydoc.toJSON());
      }
      if (
        !content ||
        content === '[]' ||
        content === '[{"type":"paragraph","children":[{"text":""}]}]'
      ) {
        console.warn('历史版本未保存：内容为空');
        return;
      }
      const result = await documentAPI.createDocumentHistory(
        documentId,
        content,
        yjsState,
      );
      if (result.success) {
        hasEdited.current = false;
        localStorage.removeItem('isEdit');
      }
    } catch (error) {
      console.error(`[DocEditor] 历史版本创建失败:`, error);
    }
  }, [documentId, currentVersionId, editorValue]);

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

      // 只有在快照恢复进行中时才跳过内容更新
      // 快照恢复完成后，允许正常的编辑操作
      if (window.isRestoringSnapshot) {
        console.log('[DocEditor] 快照恢复进行中，跳过编辑器内容更新');
        return;
      }

      // 如果已经完成快照恢复，也允许正常的编辑操作
      if (window.hasRestoredSnapshot) {
        console.log('[DocEditor] 快照恢复已完成，允许编辑器内容更新');
        // 清除快照恢复完成标志，恢复正常编辑
        window.hasRestoredSnapshot = false;

        // 连接延迟的Provider
        if (window.pendingProvider) {
          console.log('[DocEditor] 快照恢复完成，连接延迟的Provider');
          window.pendingProvider.connect();
          window.pendingProvider = null;
        }
      }

      setEditorValue(value);
      editorValueRef.current = value;

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
      console.log("[DocEditor] 版本回退API调用结果:")
      try {
        // 获取历史版本的yjsState
        const versionRes = await documentAPI.getDocumentVersion(
          documentId,
          versionId,
        );

        if (
          !versionRes.success ||
          !versionRes.data ||
          !versionRes.data.yjsState
        ) {
          throw new Error('无法获取历史版本的yjsState');
        }

        const yjsStateArr = versionRes.data.yjsState;

        // 使用新的快照恢复方法，而不是重建实例
        await restoreFromSnapshot(yjsStateArr);

        // 调用版本回退API（用于后端记录）
        const result = await documentAPI.restoreDocument(documentId, versionId);
        console.log('[DocEditor] 版本回退API调用结果:', result);
        if (!result.success) {
          console.warn(
            '后端版本回退记录失败，但不影响前端回滚:',
            result.message,
          );
        } else {
          // 回滚成功弹出提示
          console.log('[DocEditor] 回滚成功，文档已恢复到历史版本！');
          messageApi.success('回滚成功，文档已恢复到历史版本！');
          // 断开并重连 provider，强制拉取数据库最新内容
          if (window.provider) {
            window.provider.disconnect();
            setTimeout(() => {
              window.provider.connect();
              console.log('[DocEditor] 回滚后已断开并重连provider，拉取数据库最新内容');
            }, 400);
          }
        }

        // 清除URL中的version参数
        window.history.replaceState({}, '', `${location.pathname}`);

        // 重置回退属性
        setOnBackHistoryProps({
          versionId: null,
          isShow: false,
          onClick: () => { },
        });
      } catch (error) {
        console.error(`[DocEditor] 版本回退出错:`, error);
        if (window.antd && window.antd.message) {
          window.antd.message.error('版本回退失败，请重试');
        }
      }
    },
    [documentId, location],
  );

  /**
   * 基于快照恢复文档状态（不重建实例）
   * @param {Array} snapshot - 历史快照数据
   */
  const restoreFromSnapshot = useCallback(
    async snapshot => {
      // 设置快照恢复标志，防止Y.Doc重新初始化和自动同步
      window.isRestoringSnapshot = true;
      window.hasRestoredSnapshot = false;
      console.log(
        '[DocEditor] 设置快照恢复标志，防止Y.Doc重新初始化和自动同步',
      );

      try {
        // 更完善的检查机制
        if (!window.ydoc) {
          throw new Error('Yjs文档未初始化');
        }

        // 检查Y库是否可用，如果window.Y不存在，尝试从其他地方获取
        let Y = window.Y;
        if (!Y) {
          // 尝试从其他可能的位置获取Y库
          Y = window.Yjs || window.yjs || globalThis.Y;
          console.log('[DocEditor] 尝试获取Y库:', !!Y);
        }

        if (!Y) {
          throw new Error('Yjs库未加载');
        }

        // 检查Yjs文档是否已完全初始化
        let docState;
        try {
          docState = window.ydoc.toJSON();
          console.log('[DocEditor] 当前Y.Doc状态:', docState);

          if (!docState || Object.keys(docState).length === 0) {
            console.warn('[DocEditor] Y.Doc状态为空，等待初始化...');
            // 等待一段时间后重试
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          console.warn('[DocEditor] 检查Y.Doc状态失败:', error);
        }

        try {
          console.log('[DocEditor] 开始基于快照恢复文档状态');

          // 1. 暂停协同更新，防止状态冲突
          if (window.provider) {
            window.provider.disconnect();
            console.log('[DocEditor] 已断开Provider连接');
          }

          // 2. 暂停MongoDB同步服务
          if (window.yjsMongoSyncService) {
            await window.yjsMongoSyncService.pauseDocumentSync(documentId);
            console.log('[DocEditor] 已暂停MongoDB同步');
          }

          // 3. 应用历史快照到现有Y.Doc
          console.log('[DocEditor] 快照数据详情:', {
            length: snapshot.length,
            preview: snapshot.slice(0, 10),
            isArray: Array.isArray(snapshot),
            isUint8Array: snapshot instanceof Uint8Array,
            fullData: snapshot, // 输出完整数据用于调试
          });

          // 验证快照数据格式
          if (!Array.isArray(snapshot) || snapshot.length === 0) {
            throw new Error('快照数据格式无效');
          }

          // 检查快照数据是否看起来像有效的Yjs状态
          if (snapshot.length < 50) {
            console.warn(
              '[DocEditor] 快照数据长度过短，可能不完整:',
              snapshot.length,
            );
            console.warn('[DocEditor] 这可能表示历史版本没有保存有效的Yjs状态');
            // 如果快照数据太短，直接跳过快照恢复，使用content回退
            console.log(
              '[DocEditor] 快照数据过短，跳过快照恢复，直接使用content回退',
            );
            throw new Error('快照数据长度不足，无法进行快照恢复');
          }

          // 检查快照数据是否全为0或无效
          const hasValidData = snapshot.some(byte => byte !== 0);
          if (!hasValidData) {
            console.warn('[DocEditor] 快照数据全为0，可能无效');
          }

          console.log('[DocEditor] 快照数据有效性检查:', {
            length: snapshot.length,
            hasValidData,
            firstBytes: snapshot.slice(0, 5),
            lastBytes: snapshot.slice(-5),
          });

          const update = new Uint8Array(snapshot);
          console.log('[DocEditor] 转换后的Uint8Array:', {
            length: update.length,
            preview: Array.from(update.slice(0, 10)),
            fullData: Array.from(update), // 输出完整数据用于调试
          });

          // 验证Uint8Array格式
          if (update.length === 0) {
            throw new Error('快照数据转换失败');
          }

          // 应用快照前记录当前状态
          const beforeState = window.ydoc.toJSON();
          console.log('[DocEditor] 应用快照前的Y.Doc状态:', beforeState);

          // 尝试应用快照
          try {
            Y.applyUpdate(window.ydoc, update);
            console.log(
              '[回滚] applyUpdate后ydoc.toJSON():',
              window.ydoc.toJSON(),
            );
            // 如果内容未变，强制清空content再applyUpdate一次
            const yText = window.ydoc.get('content', Y.XmlText);
            if (
              yText &&
              (!yText.toString() || yText.toString() === beforeState.content)
            ) {
              yText.delete(0, yText.length);
              Y.applyUpdate(window.ydoc, update);
              console.log(
                '[回滚] 强制清空后再applyUpdate，ydoc.toJSON():',
                window.ydoc.toJSON(),
              );
            }
            // === 强制同步本地Y.Doc到服务器/断开重连provider/清空本地缓存 ===
            if (
              window.provider &&
              typeof window.provider.flush === 'function'
            ) {
              await window.provider.flush();
              console.log(
                '[回滚] provider.flush() 完成，已推送本地Y.Doc到服务器',
              );
            } else if (
              window.provider &&
              typeof window.provider.sync === 'function'
            ) {
              await window.provider.sync();
              console.log(
                '[回滚] provider.sync() 完成，已推送本地Y.Doc到服务器',
              );
            } else {
              if (window.provider) {
                window.provider.disconnect();
                console.log('[回滚] 已断开provider');
              }
              // 清空IndexedDB缓存（如有）
              if (
                window.indexeddbProvider &&
                typeof window.indexeddbProvider.clearData === 'function'
              ) {
                await window.indexeddbProvider.clearData();
                console.log('[回滚] 已清空本地indexeddbProvider缓存');
              }
              // 重连provider
              if (window.provider) {
                window.provider.connect();
                console.log('[回滚] 已重连provider');
              }
            }
            // === END ===
            console.log('[DocEditor] 已应用历史快照到Y.Doc');
          } catch (error) {
            console.error('[DocEditor] 应用快照失败:', error);
            throw new Error(`应用快照失败: ${error.message}`);
          }

          // 强制刷新Y.Doc状态
          window.ydoc.emit('afterTransaction', []);

          // 验证快照是否应用成功
          const newDocState = window.ydoc.toJSON();
          console.log('[DocEditor] 快照应用后的Y.Doc状态:', newDocState);

          // 检查快照是否成功应用 - 修复逻辑：检查内容是否真的发生了变化
          const isSnapshotApplied =
            newDocState.content !== '' &&
            newDocState.content !== beforeState.content;
          console.log('[DocEditor] 快照应用检查:', {
            beforeContent: beforeState.content,
            afterContent: newDocState.content,
            isApplied: isSnapshotApplied,
            contentChanged: newDocState.content !== beforeState.content,
          });

          // 如果状态没有变化或内容为空，尝试重新应用快照
          if (!isSnapshotApplied) {
            console.log('[DocEditor] 快照应用后状态未变化，尝试重新应用...');

            // 清空当前Y.Doc内容
            const yText = window.ydoc.get('content', Y.XmlText);
            if (yText) {
              yText.delete(0, yText.length);
              console.log('[DocEditor] 已清空Y.Doc内容');
            }

            // 重新应用快照
            Y.applyUpdate(window.ydoc, update);
            window.ydoc.emit('afterTransaction', []);

            const retryDocState = window.ydoc.toJSON();
            console.log(
              '[DocEditor] 重新应用快照后的Y.Doc状态:',
              retryDocState,
            );

            // 最终检查 - 修复逻辑：检查内容是否真的发生了变化
            const isRetrySuccessful =
              retryDocState.content !== '' &&
              retryDocState.content !== beforeState.content;
            console.log('[DocEditor] 重试结果:', {
              isSuccessful: isRetrySuccessful,
              finalContent: retryDocState.content,
              originalContent: beforeState.content,
              contentChanged: retryDocState.content !== beforeState.content,
            });

            // 如果快照恢复仍然失败（内容为空或没有变化），尝试使用历史版本的content字段
            if (!isRetrySuccessful) {
              console.warn(
                '[DocEditor] 快照恢复失败，尝试使用历史版本的content字段恢复',
              );

              // 尝试使用历史版本的content字段恢复
              if (restoreSnapshotFromUrl?.contentData) {
                try {
                  console.log(
                    '[DocEditor] 使用历史版本content恢复:',
                    restoreSnapshotFromUrl.contentData,
                  );

                  // 将历史版本content转换为Slate格式
                  const historySlateValue = contentToSlate(
                    restoreSnapshotFromUrl.contentData,
                  );
                  console.log(
                    '[DocEditor] 转换后的历史版本Slate值:',
                    historySlateValue,
                  );

                  // 设置编辑器内容
                  setEditorValue(historySlateValue);

                  // 强制同步到Y.Doc
                  if (window.ydoc && Y) {
                    const yText = window.ydoc.get('content', Y.XmlText);
                    if (yText) {
                      // 记录恢复前的内容
                      const beforeContent = yText.toString();
                      console.log(
                        '[DocEditor] 恢复前Y.Doc内容:',
                        beforeContent,
                      );

                      // 清空现有内容
                      yText.delete(0, yText.length);

                      // 插入历史版本内容
                      const historyDelta = slateToDelta(historySlateValue);
                      console.log('[DocEditor] 历史版本Delta:', historyDelta);
                      yText.applyDelta(historyDelta);

                      // 记录恢复后的内容
                      const afterContent = yText.toString();
                      console.log('[DocEditor] 恢复后Y.Doc内容:', afterContent);
                      console.log('[DocEditor] 已使用历史版本content恢复Y.Doc');
                    }
                  }

                  console.log('[DocEditor] 历史版本content恢复完成');

                  // 标记已使用回退机制，跳过后续的同步逻辑
                  console.log('[DocEditor] 已使用回退机制，跳过后续同步逻辑');

                  // 延迟同步到MongoDB，确保内容正确保存
                  // 注意：这里不使用 YjsMongoSyncService，因为它会重新获取 Y.Doc 状态并覆盖我们刚刚同步的 yjsState
                  setTimeout(async () => {
                    try {
                      // 直接使用 API 调用，确保使用我们刚刚更新的 yjsState
                      const response = await fetch(
                        `/api/document/${documentId}/sync-yjs`,
                        {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            yjsState: Array.from(
                              window.Y.encodeStateAsUpdate(window.ydoc),
                            ),
                            content:
                              window.ydoc
                                .get('content', Y.XmlText)
                                ?.toString() || '',
                            username:
                              JSON.parse(localStorage.getItem('userInfo'))
                                ?.username || 'Anonymous',
                          }),
                        },
                      );

                      if (response.ok) {
                        console.log(
                          '[DocEditor] 回退机制：已直接同步到MongoDB',
                        );
                      } else {
                        console.warn(
                          '[DocEditor] 回退机制：直接同步到MongoDB失败',
                        );
                      }
                    } catch (error) {
                      console.warn(
                        '[DocEditor] 回退机制：直接同步到MongoDB失败:',
                        error,
                      );
                    }
                  }, 500);

                  // 延迟重新连接Provider，确保协同编辑正常工作
                  // 注意：在快照恢复完成后，Provider的重新连接可能会覆盖恢复的内容
                  // 因此我们暂时跳过Provider的重新连接，直到用户开始编辑
                  setTimeout(() => {
                    if (window.provider && !window.hasRestoredSnapshot) {
                      window.provider.connect();
                      console.log('[DocEditor] 回退机制：已重新连接Provider');
                    } else {
                      console.log(
                        '[DocEditor] 回退机制：跳过Provider重新连接，等待用户编辑',
                      );
                    }

                    // 强制同步编辑器内容与Y.Doc
                    setTimeout(() => {
                      console.log(
                        '[DocEditor] 回退机制：强制同步编辑器内容与Y.Doc',
                      );
                      syncEditorValueFromYDoc();
                    }, 100);
                  }, 600);

                  // 验证Y.Doc内容是否被正确恢复
                  setTimeout(() => {
                    if (window.ydoc && Y) {
                      const yText = window.ydoc.get('content', Y.XmlText);
                      if (yText) {
                        const finalContent = yText.toString();
                        console.log(
                          '[DocEditor] 最终验证Y.Doc内容:',
                          finalContent,
                        );
                        console.log('[DocEditor] 期望内容: 1234567');
                        console.log(
                          '[DocEditor] 内容匹配:',
                          finalContent.includes('1234567'),
                        );
                      }
                    }
                  }, 1000);

                  // 直接返回，跳过所有后续的同步逻辑（第4-8步）
                  // 这样可以避免MongoDB同步或其他机制覆盖已恢复的内容
                  return;
                } catch (error) {
                  console.error('[DocEditor] 历史版本content恢复失败:', error);
                }
              } else {
                console.warn('[DocEditor] 没有可用的历史版本content数据');
              }
            }
          }

          // 4. 强制同步到MongoDB（在恢复同步服务之前）
          setTimeout(async () => {
            try {
              // 直接使用API调用，确保使用回滚后的yjsState
              const response = await fetch(
                `/api/document/${documentId}/sync-yjs`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    yjsState: Array.from(
                      window.Y.encodeStateAsUpdate(window.ydoc),
                    ),
                    content:
                      window.ydoc.get('content', Y.XmlText)?.toString() || '',
                    username:
                      JSON.parse(localStorage.getItem('userInfo'))?.username ||
                      'Anonymous',
                  }),
                },
              );

              if (response.ok) {
                console.log('[DocEditor] 已强制同步回滚后的状态到MongoDB');
              } else {
                console.warn('[DocEditor] 强制同步到MongoDB失败');
              }
            } catch (error) {
              console.warn('[DocEditor] 强制同步到MongoDB失败:', error);
            }
          }, 100);

          // 5. 恢复MongoDB同步服务（延迟恢复，确保回滚内容已保存）
          if (window.yjsMongoSyncService) {
            setTimeout(async () => {
              await window.yjsMongoSyncService.resumeDocumentSync(documentId);
              console.log('[DocEditor] 已恢复MongoDB同步');
            }, 300);
          }

          // 6. 重新连接Provider，恢复协同（延迟连接，确保内容已保存）
          if (window.provider) {
            setTimeout(() => {
              window.provider.connect();
              console.log('[DocEditor] 已重新连接Provider');
            }, 400);
          }

          // 7. 强制刷新编辑器状态
          setContentReady(false);

          // 8. 强制同步编辑器内容与Y.Doc（关键步骤：确保UI显示正确内容）
          setTimeout(() => {
            console.log('[DocEditor] 强制同步编辑器内容与Y.Doc');
            syncEditorValueFromYDoc();
          }, 500);

          setTimeout(() => {
            setContentReady(true);
          }, 600);

          // 9. 清除快照恢复标志
          setTimeout(() => {
            window.isRestoringSnapshot = false;
            window.hasRestoredSnapshot = true;
            console.log('[DocEditor] 已清除快照恢复标志，标记为已完成');
            // --- 强制刷新页面，彻底解决协同流覆盖问题 ---
            setTimeout(() => {
              window.location.reload();
            }, 200);
          }, 600);

          console.log('[DocEditor] 快照恢复完成');
        } catch (error) {
          console.error('[DocEditor] 快照恢复失败:', error);

          // 如果快照恢复失败，尝试使用历史版本的content字段恢复
          if (restoreSnapshotFromUrl?.contentData) {
            try {
              console.log(
                '[DocEditor] 快照恢复失败，尝试使用历史版本的content字段恢复',
              );
              console.log(
                '[DocEditor] 使用历史版本content恢复:',
                restoreSnapshotFromUrl.contentData,
              );

              // 只读/历史对比页面可用content字段渲染
              const historySlateValue = contentToSlate(
                restoreSnapshotFromUrl.contentData,
              );
              setEditorValue(historySlateValue);
              setTimeout(() => {
                setEditorValue([...historySlateValue]);
              }, 100);
              setTimeout(() => {
                setContentReady(false);
                setTimeout(() => {
                  setContentReady(true);
                }, 50);
              }, 200);
              setContentReady(true);
              console.log(
                '[DocEditor] 设置contentReady为true，确保编辑器能够渲染',
              );
              console.log('[DocEditor] 已使用回退机制，跳过后续同步逻辑');
              console.log('[DocEditor] 历史版本content恢复完成');
              return;
            } catch (contentError) {
              console.error(
                '[DocEditor] 历史版本content恢复也失败:',
                contentError,
              );
            }
          }

          throw error;
        }
      } finally {
        // 清除快照恢复标志
        window.isRestoringSnapshot = false;
        console.log('[DocEditor] 清除快照恢复标志');

        // 设置快照恢复完成标志，防止Y.Doc重新初始化覆盖恢复的内容
        window.hasRestoredSnapshot = true;
        console.log('[DocEditor] 设置快照恢复完成标志');

        // 延迟重新连接Yjs编辑器，确保恢复的内容不会被覆盖
        setTimeout(() => {
          console.log('[DocEditor] 延迟重新连接Yjs编辑器');
          window.hasRestoredSnapshot = false; // 清除标志，允许重新连接

          // 强制刷新Y.Doc的yjsState，确保与MongoDB同步
          if (window.ydoc && window.Y) {
            console.log('[DocEditor] 强制刷新Y.Doc的yjsState');
            // 重新获取最新的yjsState
            fetch(`/api/document/${documentId}/yjs-state`)
              .then(res => res.json())
              .then(data => {
                console.log('[DocEditor] 获取到的yjsState数据:', data);
                if (data.success && data.data.yjsState) {
                  const newYjsState = new Uint8Array(data.data.yjsState);
                  console.log('[DocEditor] 应用新的yjsState到Y.Doc');
                  window.Y.applyUpdate(window.ydoc, newYjsState);
                  console.log('[DocEditor] 已强制刷新Y.Doc的yjsState');
                  console.log(
                    '[DocEditor] 刷新后的Y.Doc内容:',
                    window.ydoc.toJSON(),
                  );

                  // 强制触发一次MongoDB同步，确保数据一致性
                  if (window.yjsMongoSyncService) {
                    setTimeout(() => {
                      console.log('[DocEditor] 强制触发MongoDB同步');
                      window.yjsMongoSyncService.forceSyncDocument(documentId);
                    }, 1000);
                  }

                  // 强制同步编辑器内容与Y.Doc
                  setTimeout(() => {
                    console.log(
                      '[DocEditor] 延迟刷新后强制同步编辑器内容与Y.Doc',
                    );
                    syncEditorValueFromYDoc();
                  }, 1200);
                } else {
                  console.warn('[DocEditor] 获取到的yjsState数据无效:', data);
                }
              })
              .catch(error => {
                console.warn('[DocEditor] 强制刷新Y.Doc的yjsState失败:', error);
              });
          }

          // 延迟强制更新Y.Doc状态，确保与数据库一致
          setTimeout(() => {
            if (window.ydoc && window.Y) {
              console.log('[DocEditor] 延迟强制更新Y.Doc状态');
              // 重新获取最新的yjsState
              fetch(`/api/document/${documentId}/yjs-state`)
                .then(res => res.json())
                .then(data => {
                  console.log('[DocEditor] 延迟获取到的yjsState数据:', data);
                  if (data.success && data.data.yjsState) {
                    const newYjsState = new Uint8Array(data.data.yjsState);
                    console.log('[DocEditor] 延迟应用新的yjsState到Y.Doc');
                    window.Y.applyUpdate(window.ydoc, newYjsState);
                    console.log(
                      '[DocEditor] 延迟刷新后的Y.Doc内容:',
                      window.ydoc.toJSON(),
                    );

                    // 强制同步编辑器内容与Y.Doc
                    setTimeout(() => {
                      console.log(
                        '[DocEditor] 延迟强制更新后强制同步编辑器内容与Y.Doc',
                      );
                      syncEditorValueFromYDoc();
                    }, 100);
                  }
                })
                .catch(error => {
                  console.warn(
                    '[DocEditor] 延迟强制刷新Y.Doc的yjsState失败:',
                    error,
                  );
                });
            }
          }, 3000);

          // 延迟清除快照恢复标志，确保所有同步操作完成
          setTimeout(() => {
            console.log('[DocEditor] 延迟清除快照恢复标志');
            window.isRestoringSnapshot = false;
            window.hasRestoredSnapshot = false;
          }, 3000);
        }, 2000); // 延迟2秒，确保恢复的内容完全稳定
      }
    },
    [documentId],
  );

  // 将 restoreFromSnapshot 方法挂载到全局，供历史版本页面使用
  useEffect(() => {
    if (restoreFromSnapshot) {
      window.restoreFromSnapshot = restoreFromSnapshot;
      console.log('[DocEditor] 已将 restoreFromSnapshot 方法挂载到全局');
    }

    // 组件卸载时清理全局方法
    return () => {
      if (window.restoreFromSnapshot === restoreFromSnapshot) {
        delete window.restoreFromSnapshot;
        console.log('[DocEditor] 已清理全局 restoreFromSnapshot 方法');
      }
    };
  }, [restoreFromSnapshot]);

  // 监听用户编辑，清除快照恢复完成标志并重新连接Provider
  useEffect(() => {
    const handleUserEdit = () => {
      if (window.hasRestoredSnapshot) {
        console.log('[DocEditor] 检测到用户编辑，清除快照恢复完成标志');
        window.hasRestoredSnapshot = false;

        // 重新连接Provider，恢复协同编辑功能
        setTimeout(() => {
          if (window.provider) {
            window.provider.connect();
            console.log('[DocEditor] 用户编辑后重新连接Provider');

            // 强制同步编辑器内容与Y.Doc
            setTimeout(() => {
              console.log('[DocEditor] 用户编辑后强制同步编辑器内容与Y.Doc');
              syncEditorValueFromYDoc();
            }, 200);
          }
        }, 100);
      }
    };

    // 监听编辑器内容变化
    const editorElement = document.querySelector('[data-slate-editor]');
    if (editorElement) {
      editorElement.addEventListener('input', handleUserEdit);
      editorElement.addEventListener('keydown', handleUserEdit);
      editorElement.addEventListener('paste', handleUserEdit);

      return () => {
        editorElement.removeEventListener('input', handleUserEdit);
        editorElement.removeEventListener('keydown', handleUserEdit);
        editorElement.removeEventListener('paste', handleUserEdit);
      };
    }
  }, []);

  // 自动执行快照恢复（如果URL中包含快照参数）
  useEffect(() => {
    if (restoreSnapshotFromUrl && restoreFromSnapshot) {
      const { snapshotData } = restoreSnapshotFromUrl;

      console.log('[DocEditor] 检测到快照恢复参数，开始自动恢复');
      console.log('[DocEditor] 快照数据长度:', snapshotData.length);
      console.log('[DocEditor] 快照数据预览:', snapshotData.slice(0, 10));
      console.log(
        '[DocEditor] 历史版本content数据:',
        restoreSnapshotFromUrl.contentData,
      );

      // 等待编辑器完全初始化后再执行恢复
      const checkAndRestore = () => {
        console.log('[DocEditor] 检查编辑器状态:');
        console.log('- window.ydoc:', !!window.ydoc);
        console.log('- window.Y:', !!window.Y);
        console.log('- window.provider:', !!window.provider);
        console.log(
          '- window.provider.isConnected:',
          window.provider?.isConnected,
        );

        // 检查编辑器是否完全初始化
        if (!window.ydoc) {
          console.log('[DocEditor] Y.Doc未初始化，等待...');
          return false;
        }

        // 检查Y库是否可用，如果window.Y不存在，尝试从其他地方获取
        let Y = window.Y;
        if (!Y) {
          // 尝试从其他可能的位置获取Y库
          Y = window.Yjs || window.yjs || globalThis.Y;
          console.log('[DocEditor] 尝试获取Y库:', !!Y);
        }

        if (!Y) {
          console.log('[DocEditor] Y库未加载，等待...');
          return false;
        }

        // 检查Provider是否已连接
        if (window.provider) {
          // 检查多种可能的连接状态属性
          const isConnected =
            window.provider.isConnected ||
            window.provider.isSynced ||
            window.provider.connected ||
            window.provider.synced;

          console.log('[DocEditor] Provider连接状态检查:');
          console.log('- isConnected:', window.provider.isConnected);
          console.log('- isSynced:', window.provider.isSynced);
          console.log('- connected:', window.provider.connected);
          console.log('- synced:', window.provider.synced);
          console.log('- 综合判断:', isConnected);

          if (!isConnected) {
            console.log('[DocEditor] Provider未连接，等待...');
            return false;
          }
        }

        // 检查编辑器内容是否已加载（移除contentReady检查，避免循环依赖）
        // 只要Y.Doc和Provider准备好就可以进行快照恢复

        // 额外检查：确保Y.Doc有基本结构
        try {
          const docState = window.ydoc.toJSON();
          console.log('[DocEditor] Y.Doc状态:', docState);

          if (!docState || Object.keys(docState).length === 0) {
            console.log('[DocEditor] Y.Doc状态为空，等待初始化...');
            return false;
          }
        } catch (error) {
          console.log('[DocEditor] 检查Y.Doc状态失败:', error);
          return false;
        }

        console.log('[DocEditor] 编辑器已准备好，可以执行快照恢复');

        return true;
      };

      // 使用轮询机制等待编辑器完全初始化
      const pollForReady = async () => {
        let attempts = 0;
        const maxAttempts = 30; // 最多等待30秒

        const poll = () => {
          attempts++;
          console.log(
            `[DocEditor] 检查编辑器状态 (${attempts}/${maxAttempts})`,
          );

          if (checkAndRestore()) {
            // 编辑器已准备好，执行恢复
            (async () => {
              try {
                console.log('[DocEditor] 开始执行快照恢复...');
                await restoreFromSnapshot(snapshotData);
                console.log('[DocEditor] 快照恢复完成');

                // 清除URL参数
                const newUrl = `/doc-editor/${documentId}`;
                window.history.replaceState({}, '', newUrl);
                console.log('[DocEditor] 已清除URL参数');

                // 显示成功消息
                if (window.antd && window.antd.message) {
                  window.antd.message.success('版本恢复成功！');
                }
              } catch (error) {
                console.error('[DocEditor] 快照恢复失败:', error);
                if (window.antd && window.antd.message) {
                  window.antd.message.error('版本恢复失败，请重试');
                }
              }
            })();
            return;
          }

          if (attempts >= maxAttempts) {
            console.error('[DocEditor] 编辑器初始化超时，放弃快照恢复');
            if (window.antd && window.antd.message) {
              window.antd.message.error('编辑器初始化超时，请刷新页面重试');
            }
            return;
          }

          // 继续轮询
          setTimeout(poll, 1000);
        };

        poll();
      };

      // 开始轮询
      pollForReady();
    } else if (restoreSnapshotFromUrl) {
      console.warn(
        '[DocEditor] 检测到快照参数但 restoreFromSnapshot 方法不可用',
      );
    }
  }, [restoreSnapshotFromUrl, restoreFromSnapshot, documentId]);

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
        onClick: () => { },
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

      // 只在"当前编辑文档"卸载时创建历史版本（不是只读快照/切换文档/历史版本预览）
      const isEdit = hasEdited.current;
      const isTemp = isTempDocument(documentId);
      const isReadOnly = readOnly;
      const isHistory = currentVersionId;
      const value = editorValueRef.current;
      if (
        !isReadOnly &&
        !isSwitchingDocs.current &&
        !isHistory &&
        isEdit &&
        !isTemp
      ) {
        const content = JSON.stringify(value);
        let yjsState = undefined;
        if (window.ydoc && window.Y) {
          yjsState = Array.from(window.Y.encodeStateAsUpdate(window.ydoc));
        }
        if (
          content &&
          content !== '[]' &&
          content !== '[{"type":"paragraph","children":[{"text":""}]}]'
        ) {
          documentAPI
            .createDocumentHistory(documentId, content, yjsState)
            .then(() => {
              localStorage.removeItem('isEdit');
            })
            .catch(error => {
              console.error('创建历史版本失败:', error);
            });
        } else {
          console.warn('历史版本未保存（卸载时）：内容为空');
        }
      }
    };
  }, [documentId]);

  // 切换文档时初始化编辑器
  useEffect(() => {
    initializeEditor();
    // 切换文档时清除保存定时器
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [initializeEditor]);

  // 监听Yjs/IndexedDB同步完成，内容ready后再渲染编辑器
  useEffect(() => {
    setContentReady(false);
    // 这里假设window.indexeddbProvider由useCollaborativeEditor或EditorSDK暴露
    // 如果不是，请根据实际情况获取indexeddbProvider
    const checkReady = () => {
      if (window.indexeddbProvider && window.indexeddbProvider.synced) {
        setContentReady(true);
      } else if (window.indexeddbProvider) {
        window.indexeddbProvider.on('synced', () => setContentReady(true));
      } else {
        // fallback: 最多1秒后兜底显示
        setTimeout(() => setContentReady(true), 1000);
      }
    };
    checkReady();
    // 切换文档时重置
    return () => setContentReady(false);
  }, [documentId]);

  // 新增：根据version参数获取历史快照内容
  useEffect(() => {
    if (currentVersionId) {
      setReadOnly(true);
      setHistoryContent(null);
      setLoading(true);
      documentAPI
        .getDocumentVersion(documentId, currentVersionId)
        .then(res => {
          let content = DEFAULT_EDITOR_VALUE;
          if (res.success && res.data && res.data.content) {
            try {
              const parsed = JSON.parse(res.data.content);
              if (Array.isArray(parsed) && parsed.length > 0) {
                content = parsed;
              }
            } catch {
              /* ignore parse error, fallback to default */
            }
          }
          setHistoryContent(content);
        })
        .finally(() => setLoading(false));
    } else {
      setReadOnly(false);
      setHistoryContent(null);
    }
  }, [currentVersionId, documentId]);

  const [messageApi, contextHolder] = message.useMessage();

  return (
    <>
      {contextHolder}
      <div className="doc-editor-page">
        {/* 文档操作工具栏 */}
        {!isTempDocument(documentId) && !readOnly && (
          <div
            style={{
              padding: '12px 20px',
              borderBottom: '1px solid #f0f0f0',
              backgroundColor: '#fafafa',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Space>
              <Button
                type="primary"
                icon={<FileTextOutlined />}
                onClick={() => navigate(`/archive-management/${documentId}`)}
              >
                归档管理
              </Button>
              <Button
                icon={<HistoryOutlined />}
                onClick={() => navigate(`/history-version/${documentId}`)}
              >
                历史版本
              </Button>
            </Space>
          </div>
        )}

        {/* 编辑器加载中提示 */}
        {loading && (
          <div style={{ padding: 20, color: '#888' }}>文档加载中...</div>
        )}
        {/* 只读历史快照预览 */}
        {!loading && readOnly && historyContent && (
          <EditorSDK
            key={editorKey}
            value={historyContent}
            readOnly={true}
            disableCollab={true}
          />
        )}
        {/* 协同编辑模式 */}
        {!loading && !readOnly && contentReady && (
          <EditorSDK
            key={editorKey}
            documentId={documentId}
            userId={userId}
            value={editorValue}
            onChange={handleEditorChange}
            onBackHistoryProps={onBackHistoryProps}
          // 快照恢复后仍然使用协同编辑模式，但确保显示正确的内容
          />
        )}

        {/* 调试信息
        {window.location.hostname === 'localhost' && (
          <div
            style={{
              position: 'fixed',
              bottom: 10,
              right: 10,
              background: '#f0f0f0',
              padding: 10,
              fontSize: 12,
            }}
          >
            <div>
              editorValue:{' '}
              {editorValue
                ? JSON.stringify(editorValue).substring(0, 100) + '...'
                : 'undefined'}
            </div>
            <div>contentReady: {contentReady.toString()}</div>
            <div>loading: {loading.toString()}</div>
            <div>
              isRestoringSnapshot:{' '}
              {window.isRestoringSnapshot?.toString() || 'undefined'}
            </div>
            <div>
              hasRestoredSnapshot:{' '}
              {window.hasRestoredSnapshot?.toString() || 'undefined'}
            </div>
            <div>documentId: {documentId}</div>
          </div>
        )} */}

        {!loading && !contentReady && !readOnly && (
          <div style={{ padding: 20, color: '#888' }}>内容同步中...</div>
        )}
      </div>
    </>
  );
};

export default DocEditor;
