import React, {
  useCallback,
  useMemo,
  useState,
  useEffect,
  useRef,
} from 'react';
import isHotkey from 'is-hotkey';
import Prism from 'prismjs';
// 导入Prism.js的各种语言支持
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-typescript';
import { createEditor, Element, Node, Editor, Transforms, Text } from 'slate';
import { withHistory } from 'slate-history';
import { Editable, Slate, withReact } from 'slate-react';
import {
  Toolbar,
  MarkButton,
  BlockButton,
  Element as ElementComponent,
  Leaf,
  HelpModal,
  CodeBlockButton,
  HoveringToolbar,
  ColorButton,
} from './components';
import { HOTKEYS, toggleMark, withLayout } from './utils/editorHelpers';
import { normalizeTokens } from './utils/normalize-tokens';
import { prismThemeCss } from './utils/prismTheme';

//引入yjs相关
// Import the core binding
import {
  withYjs,
  slateNodesToInsertDelta,
  YjsEditor,
  withYHistory,
} from '@slate-yjs/core';

// Import yjs and hocuspocus
import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';

// 常量定义
const ParagraphType = 'paragraph';
const CodeBlockType = 'code-block';
const CodeLineType = 'code-line';
const WS_URL = 'ws://127.0.0.1:1234'; // WebSocket服务器地址

// 创建文本节点的辅助函数
const toChildren = content => [{ text: content }];

// 将字符串转换为代码行数组
const toCodeLines = content =>
  content
    .split('\n')
    .map(line => ({ type: CodeLineType, children: toChildren(line) }));

// 简化的初始编辑器内容 (提升到组件外)
const defaultInitialValue = [
  {
    type: 'paragraph',
    children: [{ text: '协同编辑器示例' }],
  },
];

/**
 * 富文本编辑器 SDK 组件
 * 基于 Slate.js 构建的功能完整的富文本编辑器
 * 实现强制布局：文档始终有标题和至少一个段落
 * 支持代码高亮功能
 * 支持多用户实时协同编辑
 */
const EditorSDK = ({ documentId = 'default-document' }) => {
  // 弹窗状态管理
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [value, setValue] = useState(defaultInitialValue);
  const [isConnected, setIsConnected] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(1);
  const valueInitialized = useRef(false);
  const docRef = useRef(new Y.Doc());
  const isServerRunning = useRef(false);
  const editorRef = useRef(null);

  // 检查WebSocket服务器是否在线
  const checkServerStatus = useCallback(async () => {
    try {
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log('WebSocket服务器在线');
        isServerRunning.current = true;
        ws.close();
      };

      ws.onerror = () => {
        console.error('WebSocket服务器未启动，请先启动服务器');
        isServerRunning.current = false;
        setIsConnected(false);
      };

      return new Promise(resolve => {
        setTimeout(() => {
          resolve(isServerRunning.current);
        }, 1000);
      });
    } catch (error) {
      console.error('检查服务器状态失败:', error);
      return false;
    }
  }, []);

  // 创建Hocuspocus Provider用于协同编辑
  const provider = useMemo(() => {
    try {
      // 先创建一个provider实例
      return new HocuspocusProvider({
        url: WS_URL,
        name: documentId,
        document: docRef.current,
        connect: false,
        onConnect: () => {
          console.log('协同服务器连接成功');
          setIsConnected(true);
        },
        onDisconnect: () => {
          console.log('协同服务器连接断开');
          setIsConnected(false);
        },
        onStatus: ({ status }) => {
          console.log('协同状态更新:', status);
        },
        onSynced: ({ documentName }) => {
          console.log(`文档 ${documentName} 已同步`);
        },
      });
    } catch (error) {
      console.error('创建Provider失败:', error);
      return null;
    }
  }, [documentId]);

  // 创建编辑器实例，集成Yjs协同编辑功能
  const editor = useMemo(() => {
    try {
      // 如果服务器未运行或provider未创建，返回普通编辑器
      if (!provider) {
        console.log('使用普通编辑器(无协同功能)');
        const e = withLayout(withHistory(withReact(createEditor())));
        editorRef.current = e;
        return e;
      }

      // 获取共享文本类型
      const sharedType = provider.document.get('content', Y.XmlText);

      // 创建Yjs增强的编辑器
      console.log('创建协同编辑器');
      const e = withLayout(
        withYHistory(withYjs(withReact(createEditor()), sharedType)),
      );

      // 确保编辑器始终至少有一个有效子节点
      const { normalizeNode } = e;
      e.normalizeNode = entry => {
        const [node] = entry;
        if (!Editor.isEditor(node) || node.children.length > 0) {
          return normalizeNode(entry);
        }

        Transforms.insertNodes(
          e,
          {
            type: 'paragraph',
            children: [{ text: '' }],
          },
          { at: [0] },
        );
      };

      editorRef.current = e;
      return e;
    } catch (error) {
      console.error('创建编辑器失败:', error);
      // 出错时返回不带协同功能的编辑器
      const e = withLayout(withHistory(withReact(createEditor())));
      editorRef.current = e;
      return e;
    }
  }, [provider]);

  // 检查服务器并尝试连接
  useEffect(() => {
    const setupConnection = async () => {
      // 检查服务器状态
      const isOnline = await checkServerStatus();

      if (isOnline && provider) {
        try {
          // 设置用户状态
          provider.setAwarenessField('user', {
            name: `用户${Math.floor(Math.random() * 1000)}`,
            color: '#' + Math.floor(Math.random() * 16777215).toString(16),
          });

          // 连接到服务器
          provider.connect();
          console.log('已尝试连接到协同服务器');
        } catch (error) {
          console.error('连接协同服务器失败:', error);
        }
      } else {
        console.log('使用本地编辑模式，协同服务器未启动');
      }
    };

    setupConnection();

    return () => {
      if (provider) {
        try {
          provider.disconnect();
          console.log('已断开协同服务器连接');
        } catch (error) {
          console.error('断开协同服务器连接失败:', error);
        }
      }
    };
  }, [provider, checkServerStatus]);

  // 连接编辑器与协同服务（仅在服务器连接成功后）
  useEffect(() => {
    if (!editor || !provider || !isConnected) return;

    try {
      if (YjsEditor.isYjsEditor(editor)) {
        // 连接编辑器到Yjs
        YjsEditor.connect(editor);
        console.log('编辑器已连接到Yjs');
      }
    } catch (error) {
      console.error('连接编辑器到Yjs失败:', error);
    }

    return () => {
      try {
        // 断开连接以防止内存泄漏
        if (editor && YjsEditor.isYjsEditor(editor)) {
          YjsEditor.disconnect(editor);
        }
      } catch (error) {
        console.error('断开Yjs连接失败:', error);
      }
    };
  }, [editor, provider, isConnected]);

  // 初始化文档内容
  useEffect(() => {
    const initializeContent = async () => {
      if (
        valueInitialized.current ||
        !editor ||
        !provider ||
        !isConnected ||
        !YjsEditor.isYjsEditor(editor)
      ) {
        return;
      }

      try {
        // 检查共享文档是否为空
        const sharedType = YjsEditor.sharedType(editor);

        // 如果共享文档为空，设置初始内容
        if (sharedType && sharedType.toString() === '') {
          console.log('设置文档初始内容');
          const delta = slateNodesToInsertDelta(defaultInitialValue);
          sharedType.applyDelta(delta);
          valueInitialized.current = true;
          console.log('初始内容设置完成');
        } else {
          console.log('文档已有内容，使用现有内容');
          valueInitialized.current = true;
        }
      } catch (error) {
        console.error('初始化文档内容失败:', error);
      }
    };

    // 当连接成功后初始化内容
    if (isConnected) {
      initializeContent();
    }
  }, [editor, provider, isConnected]);

  // 监听远程用户变化
  useEffect(() => {
    if (!provider?.awareness) return;

    const awarenessChangeHandler = () => {
      try {
        const states = provider.awareness.getStates();

        const users = Array.from(states.entries())
          .filter(([clientId]) => clientId !== provider.document.clientID) // 过滤掉自己
          .map(([clientId, state]) => ({
            clientId,
            user: state.user,
          }));

        setRemoteUsers(users);
        setOnlineUsers(states.size);
      } catch (error) {
        console.error('处理用户状态变更失败:', error);
      }
    };

    try {
      provider.awareness.on('change', awarenessChangeHandler);
    } catch (error) {
      console.error('监听用户状态变更失败:', error);
    }

    return () => {
      try {
        if (provider.awareness) {
          provider.awareness.off('change', awarenessChangeHandler);
        }
      } catch (error) {
        console.error('移除用户状态监听失败:', error);
      }
    };
  }, [provider]);

  /**
   * 代码高亮装饰器函数
   * 为代码块中的内容应用语法高亮
   * @param {Array} nodeEntry - [node, path] 节点和路径
   * @returns {Array} 装饰范围数组
   */
  const decorate = useCallback(([node, path]) => {
    if (!node || !path) return [];

    if (Element.isElement(node) && node.type === CodeBlockType) {
      return decorateCodeBlock([node, path]);
    }
    return [];
  }, []);

  /**
   * 为代码块应用语法高亮装饰
   * @param {Array} blockEntry - [block, blockPath] 代码块节点和路径
   * @returns {Array} 装饰范围数组
   */
  const decorateCodeBlock = ([block, blockPath]) => {
    try {
      // 提取代码块的文本内容
      const text = block.children.map(line => Node.string(line)).join('\n');

      // 获取语言支持，默认为HTML
      const language = block.language || 'html';

      // 检查Prism是否支持该语言
      if (!Prism.languages[language]) {
        return [];
      }

      // 使用Prism进行语法分析
      const tokens = Prism.tokenize(text, Prism.languages[language]);

      // 标准化token结构
      const normalizedTokens = normalizeTokens(tokens);

      const decorations = [];

      // 为每一行的每个token创建装饰
      for (let index = 0; index < normalizedTokens.length; index++) {
        const tokens = normalizedTokens[index];

        let start = 0;
        for (const token of tokens) {
          const length = token.content.length;
          if (!length) {
            continue;
          }

          const end = start + length;
          const path = [...blockPath, index, 0];

          // 创建装饰对象
          const decoration = {
            anchor: { path, offset: start },
            focus: { path, offset: end },
            token: true,
          };

          // 为每个token类型添加对应的属性
          token.types.forEach(type => {
            decoration[type] = true;
          });

          decorations.push(decoration);
          start = end;
        }
      }

      return decorations;
    } catch (error) {
      console.error('代码高亮处理失败:', error);
      return [];
    }
  };

  /**
   * Tab键处理函数
   * @param {KeyboardEvent} event - 键盘事件
   */
  const onKeyDown = useCallback(
    event => {
      try {
        // 处理Tab键，在代码块中插入空格
        if (isHotkey('tab', event)) {
          event.preventDefault();
          editor.insertText('  ');
          return;
        }

        // 处理其他快捷键
        for (const hotkey in HOTKEYS) {
          if (isHotkey(hotkey, event)) {
            event.preventDefault();
            const mark = HOTKEYS[hotkey];
            toggleMark(editor, mark);
          }
        }
      } catch (error) {
        console.error('键盘处理失败:', error);
      }
    },
    [editor],
  );

  // 渲染元素的回调函数
  const renderElement = useCallback(
    props => <ElementComponent {...props} />,
    [],
  );

  // 渲染叶子节点的回调函数
  const renderLeaf = useCallback(props => <Leaf {...props} />, []);

  // 编辑器状态更新处理
  const handleSlateChange = useCallback(newValue => {
    try {
      // 防止值为null或undefined
      if (!newValue || !Array.isArray(newValue)) {
        console.warn('接收到无效的编辑器值:', newValue);
        return;
      }

      // 更新本地状态
      setValue(newValue);
    } catch (error) {
      console.error('更新编辑器状态失败:', error);
    }
  }, []);

  return (
    <div
      style={{
        maxWidth: '100%',
        margin: '0 auto',
        padding: '20px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        position: 'relative',
      }}
    >
      {/* 添加Material Icons字体 */}
      <link
        href="https://fonts.googleapis.com/icon?family=Material+Icons"
        rel="stylesheet"
      />
      {/* Prism主题样式 */}
      <style>{prismThemeCss}</style>

      {/* 连接状态指示器 */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          padding: '4px 8px',
          borderRadius: '4px',
          backgroundColor: isConnected ? '#2e7d32' : '#c62828',
          color: 'white',
          fontSize: '12px',
        }}
      >
        {isConnected ? '协同模式' : '本地模式'}
      </div>

      {/* 操作按钮区域 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '12px',
          paddingBottom: '16px',
          backgroundColor: '#f8f9fa',
          margin: '0px -16px 0px',
          padding: '5px 16px',
        }}
      >
        {/* 左侧显示协作状态 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: isConnected ? '#2e7d32' : '#c62828',
          }}
        >
          <span className="material-icons" style={{ fontSize: '16px' }}>
            {isConnected ? 'group' : 'person'}
          </span>
          <span>{isConnected ? `${onlineUsers}人在线` : '离线编辑'}</span>
          {isConnected && (
            <div style={{ marginLeft: '10px', display: 'flex', gap: '4px' }}>
              {remoteUsers.map(({ clientId, user }) => (
                <div
                  key={clientId}
                  title={user?.name || '匿名用户'}
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: user?.color || '#ccc',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: 'white',
                    fontSize: '10px',
                    fontWeight: 'bold',
                  }}
                >
                  {(user?.name || '?').charAt(0)}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 右侧操作按钮 */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
          }}
        >
          <button
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              border: '1px solid #dee2e6',
              borderRadius: '6px',
              backgroundColor: '#f8f9fa',
              color: '#6c757d',
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              outline: 'none',
              minWidth: '80px',
            }}
            onMouseEnter={e => {
              e.target.style.backgroundColor = '#e9ecef';
              e.target.style.borderColor = '#adb5bd';
              e.target.style.color = '#495057';
            }}
            onMouseLeave={e => {
              e.target.style.backgroundColor = '#f8f9fa';
              e.target.style.borderColor = '#dee2e6';
              e.target.style.color = '#6c757d';
            }}
            onMouseDown={e => {
              e.target.style.transform = 'scale(0.98)';
            }}
            onMouseUp={e => {
              e.target.style.transform = 'scale(1)';
            }}
          >
            取消
          </button>
          <button
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              border: '1px solid #0d6efd',
              borderRadius: '6px',
              backgroundColor: '#0d6efd',
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              outline: 'none',
              minWidth: '80px',
            }}
            onMouseEnter={e => {
              e.target.style.backgroundColor = '#0b5ed7';
              e.target.style.borderColor = '#0a58ca';
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 4px 8px rgba(13, 110, 253, 0.25)';
            }}
            onMouseLeave={e => {
              e.target.style.backgroundColor = '#0d6efd';
              e.target.style.borderColor = '#0d6efd';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
            onMouseDown={e => {
              e.target.style.transform = 'translateY(-1px) scale(0.98)';
            }}
            onMouseUp={e => {
              e.target.style.transform = 'translateY(-1px) scale(1)';
            }}
          >
            保存
          </button>
          <button
            onClick={() => setShowHelpModal(true)}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              border: '1px solid #6c757d',
              borderRadius: '6px',
              backgroundColor: '#ffffff',
              color: '#6c757d',
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              outline: 'none',
              minWidth: '80px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            onMouseEnter={e => {
              e.target.style.backgroundColor = '#f8f9fa';
              e.target.style.borderColor = '#495057';
              e.target.style.color = '#495057';
            }}
            onMouseLeave={e => {
              e.target.style.backgroundColor = '#ffffff';
              e.target.style.borderColor = '#6c757d';
              e.target.style.color = '#6c757d';
            }}
          >
            <span className="material-icons" style={{ fontSize: '16px' }}>
              help_outline
            </span>
            使用说明
          </button>
        </div>
      </div>

      <Slate
        editor={editor}
        initialValue={value}
        onChange={handleSlateChange}
        value={value}
      >
        {/* 悬浮工具栏 */}
        <HoveringToolbar />

        {/* 工具栏 */}
        <Toolbar>
          {/* 文本格式化按钮 */}
          <MarkButton format="bold" icon="format_bold" />
          <MarkButton format="italic" icon="format_italic" />
          <MarkButton format="underline" icon="format_underlined" />
          <MarkButton format="strikethrough" icon="strikethrough_s" />
          <MarkButton format="code" icon="code" />

          {/* 分隔符 */}
          <div
            style={{
              width: '1px',
              height: '24px',
              backgroundColor: '#ddd',
              margin: '0 4px',
            }}
          />

          {/* 文本颜色和高亮 */}
          <ColorButton icon="format_color_text" type="color" />
          <ColorButton icon="highlight" type="backgroundColor" />

          {/* 分隔符 */}
          <div
            style={{
              width: '1px',
              height: '24px',
              backgroundColor: '#ddd',
              margin: '0 4px',
            }}
          />

          {/* 块级元素按钮 */}
          <BlockButton format="heading-one" icon="looks_one" />
          <BlockButton format="heading-two" icon="looks_two" />
          <BlockButton format="block-quote" icon="format_quote" />
          {/* 代码块按钮 */}
          <CodeBlockButton />

          {/* 分隔符 */}
          <div
            style={{
              width: '1px',
              height: '24px',
              backgroundColor: '#ddd',
              margin: '0 4px',
            }}
          />

          {/* 列表按钮 */}
          <BlockButton format="numbered-list" icon="format_list_numbered" />
          <BlockButton format="bulleted-list" icon="format_list_bulleted" />

          {/* 分隔符 */}
          <div
            style={{
              width: '1px',
              height: '24px',
              backgroundColor: '#ddd',
              margin: '0 4px',
            }}
          />

          {/* 对齐按钮 */}
          <BlockButton format="left" icon="format_align_left" />
          <BlockButton format="center" icon="format_align_center" />
          <BlockButton format="right" icon="format_align_right" />
          <BlockButton format="justify" icon="format_align_justify" />
        </Toolbar>

        {/* 编辑区域 */}
        <Editable
          decorate={decorate}
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          placeholder="在这里输入内容..."
          spellCheck
          autoFocus
          style={{
            minHeight: '300px',
            padding: '16px',
            border: '1px solid #ced4da',
            borderRadius: '0 0 8px 8px',
            fontSize: '16px',
            lineHeight: '1.5',
            outline: 'none',
            backgroundColor: '#fff',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)',
          }}
          onKeyDown={onKeyDown}
        />
      </Slate>

      {/* 提示服务器未运行 */}
      {!isConnected && (
        <div
          style={{
            marginTop: '20px',
            padding: '12px',
            backgroundColor: '#ffe0e0',
            borderRadius: '6px',
            color: '#c62828',
            fontSize: '14px',
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
            <span
              className="material-icons"
              style={{
                fontSize: '16px',
                marginRight: '4px',
                verticalAlign: 'text-bottom',
              }}
            >
              warning
            </span>
            协同服务器未运行
          </div>
          <p>
            请先启动WebSocket服务器，运行: <code>node server.js</code>
          </p>
          <p>当前正在本地模式编辑，无法与其他用户实时协作。</p>
        </div>
      )}

      {/* 帮助弹窗 */}
      <HelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />
    </div>
  );
};

export { EditorSDK };
export default EditorSDK;
