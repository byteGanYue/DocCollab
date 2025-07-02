/* eslint-disable react-hooks/exhaustive-deps */
import React, {
  useState,
  useRef,
  useEffect,
  useContext,
  useCallback,
  useMemo,
} from 'react';
import {
  FolderOpenOutlined,
  PlusSquareOutlined,
  FolderAddOutlined,
  MoreOutlined,
  HomeOutlined,
  ClockCircleOutlined,
  LockOutlined,
  UnlockOutlined,
  TeamOutlined,
  UserOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  Layout,
  Menu,
  Button,
  Tooltip,
  message,
  Modal,
  Input,
  Dropdown,
  Menu as AntdMenu,
  Radio,
  Space,
} from 'antd';
const { Search } = Input;
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './folderMenu.module.less';
import folderUtils from '../../utils/folder';
// 导入 API
import { folderAPI, documentAPI, userAPI } from '../../utils/api';
// 导入用户上下文
import { UserContext } from '../../contexts/UserContext';

/**
 * EllipsisLabel 组件
 *
 * @param {Object} props - 组件属性
 * @param {string} props.text - 要显示的文本
 * @param {boolean} props.isEditing - 是否处于编辑状态
 * @param {function} props.onSave - 保存回调函数
 * @param {function} props.onCancel - 取消回调函数
 *
 * @returns {JSX.Element} 返回 Tooltip 组件包裹的文本元素，只有文字溢出时才显示tooltip
 */
const EllipsisLabel = ({ text, isEditing, onSave, onCancel }) => {
  const textRef = useRef(null);
  const inputRef = useRef(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [inputValue, setInputValue] = useState(text);
  useEffect(() => {
    const checkOverflow = () => {
      if (textRef.current) {
        const element = textRef.current;
        // 检查元素的滚动宽度是否大于客户端宽度
        const isTextOverflowing = element.scrollWidth > element.clientWidth;
        setIsOverflowing(isTextOverflowing);
      }
    };

    // 初次检查
    checkOverflow();

    // 添加resize监听器，在窗口大小变化时重新检查
    const resizeObserver = new ResizeObserver(checkOverflow);
    if (textRef.current) {
      resizeObserver.observe(textRef.current);
    }

    // 清理函数
    return () => {
      resizeObserver.disconnect();
    };
  }, [text]); // 当文本变化时重新检查

  // 处理输入框的键盘事件
  const handleKeyDown = e => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  // 处理保存
  const handleSave = () => {
    const trimmedValue = inputValue.trim();
    if (!trimmedValue) {
      message.error('名称不能为空');
      return;
    }
    onSave(trimmedValue);
  };

  // 处理取消
  const handleCancel = () => {
    setInputValue(text);
    onCancel();
  };

  // 处理输入框失去焦点
  const handleBlur = () => {
    handleSave();
  };

  // 如果处于编辑状态，显示输入框
  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        size="small"
        className={styles.editingInput}
        maxLength={50}
        autoFocus
      />
    );
  }

  const textElement = (
    <span ref={textRef} className={styles.ellipsisText}>
      {text}
    </span>
  );

  // 只有在文字溢出时才显示tooltip
  return isOverflowing ? (
    <Tooltip title={text} placement="right">
      {textElement}
    </Tooltip>
  ) : (
    textElement
  );
};

// 按钮样式
const buttonStyle = {
  height: 30,
  minWidth: 55,
  background:
    'linear-gradient(135deg, var(--color-primary) 0%, var(--color-hover) 100%)',
  border: 'none',
  color: 'white',
  fontWeight: 500,
  transition: 'all 0.3s ease',
  borderRadius: '6px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '4px',
};

const buttonHoverStyle = {
  ...buttonStyle,
  background:
    'linear-gradient(135deg, var(--color-hover) 0%, var(--color-primary) 100%)',
  transform: 'translateY(-1px)',
  boxShadow:
    '0 4px 12px color-mix(in srgb, var(--color-primary) 40%, transparent)',
};

/**
 * FolderMenu 组件
 *
 * 用于显示和管理文件夹和文件的侧边栏菜单组件。
 *
 * @returns {JSX.Element} 渲染的组件
 */
const FolderMenu = () => {
  const navigate = useNavigate();
  const location = useLocation(); // 获取当前路由信息
  // 使用用户上下文获取用户信息和权限状态
  const { userInfo, userPermission, updateUserPermission } =
    useContext(UserContext);

  // 消息API用于显示提示信息
  const [messageApi, contextHolder] = message.useMessage();

  // 协同文档用户数据状态管理
  const [collaborationUsers, setCollaborationUsers] = useState([]);

  /**
   * 获取协同文档数据（所有公开用户的文件夹和文档）
   */
  const fetchCollaborationData = useCallback(async () => {
    try {
      // 获取所有公开用户的文件夹结构
      const foldersResponse = await folderAPI.getPublicFolders();
      // 获取所有公开用户的文档
      const documentsResponse = await documentAPI.getPublicDocuments();

      if (foldersResponse.success && documentsResponse.success) {
        // 转换数据格式
        const collaborationData = convertPublicDataToCollaboration(
          foldersResponse.data,
          documentsResponse.data,
        );
        setCollaborationUsers(collaborationData);
      }
    } catch (error) {
      console.error('获取协同文档数据失败:', error);
      // 失败时设置为空数组
      setCollaborationUsers([]);
    }
  }, []);

  /**
   * 将公开用户数据转换为协同文档格式
   * @param {Array} publicFolders 公开用户文件夹数据
   * @param {Array} publicDocuments 公开用户文档数据
   * @returns {Array} 转换后的协同文档数据
   */
  const convertPublicDataToCollaboration = (publicFolders, publicDocuments) => {
    const collaborationData = [];

    // 合并文件夹和文档数据，按用户分组
    const userMap = new Map();

    // 处理文件夹数据
    publicFolders.forEach(userFolders => {
      if (!userMap.has(userFolders.userId)) {
        userMap.set(userFolders.userId, {
          userId: userFolders.userId,
          username: userFolders.username,
          isPublic: userFolders.isPublic,
          folders: [],
          documents: [],
        });
      }
      userMap.get(userFolders.userId).folders = userFolders.folders;
    });

    // 处理文档数据
    publicDocuments.forEach(userDocuments => {
      if (!userMap.has(userDocuments.userId)) {
        userMap.set(userDocuments.userId, {
          userId: userDocuments.userId,
          username: userDocuments.username,
          isPublic: userDocuments.isPublic,
          folders: [],
          documents: [],
        });
      }
      userMap.get(userDocuments.userId).documents = userDocuments.documents;
    });

    // 转换为前端菜单格式
    userMap.forEach(userData => {
      const folderData = convertUserDataToMenuFormat(userData);
      collaborationData.push({
        userId: userData.userId,
        username: userData.username,
        avatar: getAvatarByUserId(userData.userId),
        folderData: folderData,
      });
    });

    return collaborationData;
  };

  /**
   * 根据用户ID获取头像
   * @param {number} userId 用户ID
   * @returns {string} 头像表情
   */
  const getAvatarByUserId = userId => {
    const avatars = ['👨‍💻', '👩‍💼', '🧑‍🔬', '👨‍🎨', '👩‍🚀', '🧑‍💼', '👨‍🔧', '👩‍⚕️'];
    return avatars[userId % avatars.length];
  };

  /**
   * 将用户数据转换为菜单格式
   * @param {Object} userData 用户数据
   * @returns {Object} 菜单格式数据
   */
  const convertUserDataToMenuFormat = userData => {
    // 构建文档映射，按父文件夹ID分组
    const documentsByFolder = new Map();

    // 初始化根级文档数组
    documentsByFolder.set('root', []);

    userData.documents.forEach(doc => {
      if (doc.parentFolderIds && doc.parentFolderIds.length > 0) {
        // 文档有父文件夹，使用最后一个父文件夹ID（最直接的父级）
        const directParentId =
          doc.parentFolderIds[doc.parentFolderIds.length - 1];
        if (!documentsByFolder.has(directParentId)) {
          documentsByFolder.set(directParentId, []);
        }
        documentsByFolder.get(directParentId).push(doc);
      } else {
        // 根级文档
        documentsByFolder.get('root').push(doc);
      }
    });

    // 构建文件夹映射，方便查找
    const folderMap = new Map();
    const buildFolderMap = folders => {
      folders.forEach(folder => {
        folderMap.set(folder.autoFolderId, folder);
        if (folder.children && folder.children.length > 0) {
          buildFolderMap(folder.children);
        }
      });
    };
    buildFolderMap(userData.folders);

    // 递归转换文件夹为菜单项
    const convertFolderToMenuItem = folder => {
      // const folderKey = `collab_user_${userData.userId}_folder_${folder.autoFolderId}`;
      const folderKey = `${folder.folderId}`;

      // 获取该文件夹下的直接文档
      const folderDocuments = documentsByFolder.get(folder.autoFolderId) || [];

      // 转换文档为菜单项
      const documentMenuItems = folderDocuments.map((doc, index) => ({
        key: `collab_user_${userData.userId}_doc_${doc.documentId}_${index}`,
        label: (
          <div
            style={{
              cursor: 'pointer',
              display: 'inline-block',
              width: '100%',
            }}
            onClick={() => {
              console.log(
                '🚀 协同空间文档直接点击:',
                doc.documentName,
                doc.documentId,
              );
              navigate(`/doc-editor/${doc.documentId}?collaborative=true`);
            }}
          >
            <EllipsisLabel text={doc.documentName} />
          </div>
        ),
        isLeaf: true,
        backendData: doc,
        documentId: doc.documentId,
        userId: userData.userId,
        userName: userData.username,
        isCollaborative: true,
        selectable: true, // 确保可以选中
      }));

      // 递归处理子文件夹
      const childFolders = folder.children
        ? folder.children.map(child => convertFolderToMenuItem(child))
        : [];

      // 合并子文件夹和文档，文件夹在前，文档在后
      const allChildren = [...childFolders, ...documentMenuItems];

      return {
        key: folderKey,
        icon: React.createElement(FolderOpenOutlined),
        label: (
          <div
            style={{
              cursor: 'pointer',
              display: 'inline-block',
              width: '100%',
            }}
            onClick={() => {
              console.log('🚀 协同空间文件夹直接点击:', folder.folderId);
              navigate(`/folderListPage/${folder.folderId}`);
            }}
          >
            <EllipsisLabel text={folder.folderName} />
          </div>
        ),
        children: allChildren.length > 0 ? allChildren : undefined,
        backendData: folder,
        userId: userData.userId,
        userName: userData.username,
        isCollaborative: true,
        selectable: true, // 确保可以选中
        disabled: false, // 确保不禁用
      };
    };

    // 处理根级文件夹
    const rootFolders = userData.folders.map(folder =>
      convertFolderToMenuItem(folder),
    );

    // 处理根级文档
    const rootDocuments = documentsByFolder.get('root').map((doc, index) => ({
      key: `collab_user_${userData.userId}_doc_${doc.documentId}_${index}`,
      label: (
        <div
          style={{ cursor: 'pointer', display: 'inline-block', width: '100%' }}
          onClick={() => {
            console.log(
              '🚀 协同空间根级文档直接点击:',
              doc.documentName,
              doc.documentId,
            );
            navigate(`/doc-editor/${doc.documentId}?collaborative=true`);
          }}
        >
          <EllipsisLabel text={doc.documentName} />
        </div>
      ),
      isLeaf: true,
      backendData: doc,
      documentId: doc.documentId,
      userId: userData.userId,
      userName: userData.username,
      isCollaborative: true,
      selectable: true, // 确保可以选中
    }));

    // 合并根级文件夹和文档
    const allChildren = [...rootFolders, ...rootDocuments];

    return {
      key: `collab_user_${userData.userId}`,
      icon: React.createElement(UserOutlined),
      label: (
        <div
          style={{ cursor: 'pointer', display: 'inline-block', width: '100%' }}
        >
          <EllipsisLabel text={`${userData.username}的公开空间`} />
        </div>
      ),
      permission: 'public',
      owner: userData.username,
      ownerId: userData.userId,
      children: allChildren.length > 0 ? allChildren : undefined,
      selectable: true, // 确保可以选中
      disabled: false, // 确保不禁用
    };
  };

  // 组件挂载时获取协同文档数据
  useEffect(() => {
    fetchCollaborationData();
  }, [fetchCollaborationData]);

  /**
   * 获取当前用户ID的统一函数
   * @returns {number} 数字类型的用户ID
   * @throws {Error} 如果无法获取有效的用户ID
   */
  const getCurrentUserId = () => {
    let userId = userInfo?.userId || userInfo?._id;

    // 如果userInfo中没有userId，尝试从localStorage获取
    if (!userId) {
      const localUserId = localStorage.getItem('userId');

      // 如果从localStorage获取的是对象字符串，尝试解析
      if (typeof localUserId === 'string' && localUserId.startsWith('{')) {
        try {
          const userObj = JSON.parse(localUserId);
          userId = userObj.userId || userObj._id;
        } catch {
          // 解析失败，使用原值
          userId = localUserId;
        }
      } else {
        userId = localUserId;
      }
    }

    // 如果仍然没有有效的用户ID，则抛出错误
    if (!userId) {
      throw new Error('用户信息不完整，请重新登录');
    }

    // 确保userId是number类型（后端期望number类型）
    const numericUserId = parseInt(userId, 10);

    // 验证转换结果
    if (isNaN(numericUserId) || numericUserId <= 0) {
      throw new Error('无效的用户ID，请重新登录');
    }

    return numericUserId;
  };

  // 先声明状态
  const [folderList, setFolderList] = useState([]);
  const [openKeys, setOpenKeys] = useState(['root']);
  // 新增：用户实际选中的菜单项（用于新建文件夹/文档时确定目标位置）
  const [userSelectedKeys, setUserSelectedKeys] = useState(['root']);
  // 新增：控制编辑状态的key
  const [editingKey, setEditingKey] = useState(null);
  // 新增：控制删除弹窗显示和目标key
  const [deleteModal, setDeleteModal] = useState({
    visible: false,
    key: '',
    name: '',
    loading: false,
  });
  // 新增：按钮悬停状态
  const [hoveredButton, setHoveredButton] = useState(null);

  // 新增：跟踪新创建的文档ID，用于重命名后跳转
  const [newlyCreatedDocumentId, setNewlyCreatedDocumentId] = useState(null);

  // 搜索相关状态
  // eslint-disable-next-line no-unused-vars
  const [searchKeyword, setSearchKeyword] = useState(''); // 搜索关键词
  // eslint-disable-next-line no-unused-vars
  const [searchResults, setSearchResults] = useState([]); // 搜索结果
  const [isSearching, setIsSearching] = useState(false); // 搜索状态
  const [originalFolderList, setOriginalFolderList] = useState([]); // 原始文件夹列表，用于恢复

  /**
   * 执行文件夹搜索
   * @param {string} keyword - 搜索关键词
   */
  const performSearch = useCallback(
    async keyword => {
      if (!keyword || keyword.trim() === '') {
        // 如果搜索关键词为空，恢复原始列表
        setFolderList(originalFolderList);
        setSearchResults([]);
        setSearchKeyword('');
        setIsSearching(false);
        // 恢复默认的展开状态
        setOpenKeys(['root']);
        return;
      }

      try {
        setIsSearching(true);
        setSearchKeyword(keyword);

        // 获取当前用户ID
        const numericUserId = getCurrentUserId();

        // 调用搜索API
        const response = await folderAPI.searchFolders({
          keyword: keyword.trim(),
          userId: numericUserId,
          page: 1,
          limit: 100, // 获取足够多的结果
        });

        if (response.success && response.data.folders) {
          const searchedFolders = response.data.folders;
          setSearchResults(searchedFolders);

          // 获取搜索到的文件夹中的文档
          const foldersWithDocuments = await Promise.allSettled(
            searchedFolders.map(async folder => {
              try {
                // 使用自增ID获取文件夹中的文档
                const folderIdForQuery = folder.autoFolderId || folder.folderId;
                const documentsResponse = await documentAPI.getFolderDocuments(
                  folderIdForQuery,
                  numericUserId, // 传递用户ID
                  {
                    page: 1,
                    pageSize: 100, // 获取足够多的文档
                  },
                );

                return {
                  ...folder,
                  documents: documentsResponse.success
                    ? documentsResponse.data?.documents || []
                    : [],
                };
              } catch (error) {
                console.warn(
                  `获取文件夹 ${folder.folderName} 中的文档失败:`,
                  error,
                );
                return {
                  ...folder,
                  documents: [],
                };
              }
            }),
          );

          // 提取成功获取文档的文件夹数据
          const foldersWithDocsData = foldersWithDocuments.map(result =>
            result.status === 'fulfilled' ? result.value : result.reason,
          );

          // 转换搜索结果为菜单格式（包含文档）
          const searchMenuItems =
            convertSearchResultsToMenuFormat(foldersWithDocsData);

          // 构建基础菜单项（首页、最近访问等）
          const baseMenuItems = [
            {
              key: 'home',
              icon: React.createElement(HomeOutlined),
              label: <EllipsisLabel text="首页" />,
              children: null,
            },
            {
              key: 'recent-docs',
              icon: React.createElement(ClockCircleOutlined),
              label: <EllipsisLabel text="最近访问文档列表" />,
              children: null,
            },
            {
              key: 'collaboration',
              icon: React.createElement(TeamOutlined),
              label: (
                <div className={styles.menuLabelContainer}>
                  <div className={styles.labelContent}>
                    <EllipsisLabel text="协同空间" />
                    <Tooltip title="公开协同空间 - 所有公开用户的文档">
                      <TeamOutlined
                        style={{
                          color: '#52c41a',
                          marginLeft: 4,
                          fontSize: '12px',
                        }}
                      />
                    </Tooltip>
                  </div>
                </div>
              ),
              children: collaborationUsers
                .map(user => user.folderData)
                .filter(Boolean),
            },
          ];

          // 合并基础菜单项和搜索结果
          setFolderList([...baseMenuItems, ...searchMenuItems]);

          // 自动展开包含搜索结果的路径
          const pathsToExpand = new Set(['root']); // 始终展开根目录

          searchedFolders.forEach(folder => {
            // 展开匹配文件夹的所有父级路径
            if (folder.parentFolderIds && folder.parentFolderIds.length > 0) {
              folder.parentFolderIds.forEach(parentId => {
                pathsToExpand.add(parentId.toString());
              });
            }
            // 也要展开匹配的文件夹本身（如果它有子文件夹的话）
            const folderId = folder.folderId || folder.autoFolderId?.toString();
            if (folderId) {
              pathsToExpand.add(folderId);
            }
          });

          setOpenKeys(Array.from(pathsToExpand));

          if (searchedFolders.length === 0) {
            message.warning(`搜索的文件夹"${keyword}"不存在`);

            // 显示空状态的搜索结果
            const emptySearchResult = [
              {
                key: 'empty-search-result',
                icon: React.createElement(SearchOutlined),
                label: (
                  <div
                    style={{
                      color: '#999',
                      fontStyle: 'italic',
                      padding: '8px 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>未找到匹配的文件夹 "{keyword}"</span>
                  </div>
                ),
                disabled: true,
                selectable: false,
                children: undefined,
              },
            ];

            // 合并基础菜单项和空状态提示
            setFolderList([...baseMenuItems, ...emptySearchResult]);
          } else {
            // 统计文档总数
            const totalDocuments = foldersWithDocsData.reduce(
              (sum, folder) =>
                sum + (folder.documents ? folder.documents.length : 0),
              0,
            );

            const folderText = `${searchedFolders.length} 个文件夹`;
            const documentText =
              totalDocuments > 0 ? `，${totalDocuments} 个文档` : '';
            message.success(`找到 ${folderText}${documentText}`);
          }
        } else {
          throw new Error(response.message || '搜索失败');
        }
      } catch (error) {
        console.error('搜索文件夹失败:', error);
        message.error(error.message || '搜索失败，请重试');
        // 搜索失败时恢复原始列表
        setFolderList(originalFolderList);
        setSearchResults([]);
        setIsSearching(false);
        // 恢复默认的展开状态
        setOpenKeys(['root']);
      }
    },
    [originalFolderList, collaborationUsers],
  );

  /**
   * 将搜索结果转换为菜单格式，保留完整的层级结构
   * @param {Array} searchResultsWithDocs - 搜索结果（包含文档数据）
   * @returns {Array} 菜单格式的搜索结果，包含完整的父级路径和文档
   */
  const convertSearchResultsToMenuFormat = searchResultsWithDocs => {
    if (!searchResultsWithDocs || searchResultsWithDocs.length === 0) {
      return [];
    }

    // 从原始文件夹列表中找到"我的文件夹"节点
    const myFoldersRoot = originalFolderList.find(item => item.key === 'root');
    if (!myFoldersRoot || !myFoldersRoot.children) {
      return [];
    }

    // 构建一个包含所有匹配文件夹及其父级路径的树
    const buildFilteredTree = (originalTree, matchedFolderIds) => {
      const filteredTree = [];

      const processNode = node => {
        if (!node) return null;

        // 检查当前节点是否是匹配的文件夹（支持多种ID格式）
        const nodeIdMatches = [
          node.key,
          node.autoFolderId?.toString(),
          node.backendData?.folderId,
          node.backendData?.autoFolderId?.toString(),
        ].filter(Boolean);

        const isMatched = nodeIdMatches.some(id =>
          matchedFolderIds.includes(id),
        );

        // 检查是否有匹配的子节点（递归处理）
        let hasMatchedChildren = false;
        let filteredChildren = [];

        if (node.children && node.children.length > 0) {
          node.children.forEach(child => {
            const processedChild = processNode(child);
            if (processedChild) {
              filteredChildren.push(processedChild);
              hasMatchedChildren = true;
            }
          });
        }

        // 如果当前节点是匹配的文件夹，且有搜索结果中的文档数据，则添加文档子项
        if (isMatched) {
          // 从搜索结果中找到对应的文件夹数据
          const matchedFolderData = searchResultsWithDocs.find(folder => {
            const folderIds = [
              folder.folderId,
              folder.autoFolderId?.toString(),
            ].filter(Boolean);
            return folderIds.some(id => nodeIdMatches.includes(id));
          });

          // 如果找到匹配的文件夹数据且包含文档，则添加文档菜单项
          if (
            matchedFolderData &&
            matchedFolderData.documents &&
            matchedFolderData.documents.length > 0
          ) {
            const documentMenuItems = matchedFolderData.documents.map(doc => {
              const docKey = `doc_${doc.documentId}`;
              return {
                key: docKey,
                label: <EllipsisLabel text={doc.documentName} />,
                isLeaf: true,
                backendData: doc,
                documentId: doc.documentId,
              };
            });

            // 将文档添加到子项中
            filteredChildren = [...filteredChildren, ...documentMenuItems];
            hasMatchedChildren = true;
          }
        }

        // 如果当前节点匹配或有匹配的子节点，则包含此节点
        if (isMatched || hasMatchedChildren) {
          const filteredNode = {
            ...node,
            children:
              filteredChildren.length > 0 ? filteredChildren : undefined,
          };

          // 移除高亮相关的处理，保持原始样式

          return filteredNode;
        }

        return null;
      };

      originalTree.forEach(node => {
        const processedNode = processNode(node);
        if (processedNode) {
          filteredTree.push(processedNode);
        }
      });

      return filteredTree;
    };

    // 收集所有匹配文件夹的ID
    const matchedFolderIds = searchResultsWithDocs
      .map(folder => folder.folderId || folder.autoFolderId?.toString())
      .filter(Boolean);

    // 构建过滤后的树，只包含匹配的文件夹及其父级路径
    const filteredChildren = buildFilteredTree(
      myFoldersRoot.children,
      matchedFolderIds,
    );

    if (filteredChildren.length === 0) {
      return [];
    }

    // 返回包含搜索结果的"我的文件夹"节点
    return [
      {
        ...myFoldersRoot,
        label: (
          <EllipsisLabel
            text={`我的文件夹 (${searchResultsWithDocs.length}个匹配)`}
          />
        ),
        children: filteredChildren,
      },
    ];
  };

  /**
   * 生成唯一的默认文件名/文件夹名，避免同级目录下的重复
   * @param {string} baseName - 基础名称，如"新建文档"或"新建文件夹"
   * @param {string} targetKey - 目标文件夹的key
   * @returns {string} 唯一的名称
   */
  const generateUniqueDefaultName = (baseName, targetKey) => {
    // 获取目标文件夹的现有子项
    const getExistingNames = () => {
      const existingNames = new Set();

      // 递归查找目标文件夹及其子项
      const findTargetFolderItems = (nodes, key) => {
        for (const node of nodes) {
          if (node.key === key) {
            // 找到目标文件夹，收集其子项名称
            if (node.children) {
              node.children.forEach(child => {
                const name = child.label?.props?.text || child.label;
                if (name) {
                  existingNames.add(name);
                }
              });
            }
            return true;
          }
          if (node.children) {
            if (findTargetFolderItems(node.children, key)) {
              return true;
            }
          }
        }
        return false;
      };

      // 如果是根目录
      if (targetKey === 'root') {
        const rootFolder = folderList.find(item => item.key === 'root');
        if (rootFolder && rootFolder.children) {
          rootFolder.children.forEach(child => {
            const name = child.label?.props?.text || child.label;
            if (name) {
              existingNames.add(name);
            }
          });
        }
      } else {
        findTargetFolderItems(folderList, targetKey);
      }

      return existingNames;
    };

    const existingNames = getExistingNames();

    // 从1开始尝试生成唯一名称
    let counter = 1;
    let candidateName = `${baseName}${counter}`;

    while (existingNames.has(candidateName)) {
      counter++;
      candidateName = `${baseName}${counter}`;
    }

    return candidateName;
  };
  // 新增：权限管理弹窗状态
  const [permissionModal, setPermissionModal] = useState({
    visible: false,
    key: '',
    name: '',
    permission: 'private',
    loading: false,
  });
  // 新增：加载状态
  const [_loading, setLoading] = useState(false);

  /**
   * 根据当前路由计算应该高亮的菜单项
   * @returns {Array} 应该高亮的菜单项key数组
   */
  const getSelectedKeysFromRoute = useMemo(() => {
    const path = location.pathname;

    // 根据路由路径确定选中的菜单项
    if (path === '/home') {
      return ['home'];
    } else if (path === '/recent-docs') {
      return ['recent-docs'];
    } else if (path === '/collaboration') {
      return ['collaboration'];
    } else if (
      path.startsWith('/doc-editor/') ||
      path.startsWith('/history-version/')
    ) {
      // 文档编辑页面，检查是否是协同文档
      const urlParams = new URLSearchParams(location.search);
      const isCollaborative = urlParams.get('collaborative') === 'true';

      if (isCollaborative) {
        // 协同文档编辑，需要找到对应的协同文档菜单项
        const documentId = path.split('/doc-editor/')[1];
        if (documentId) {
          // 在协同文档中查找匹配的文档
          const findCollaborativeDocumentInMenu = items => {
            if (!Array.isArray(items)) return null;
            for (const item of items) {
              // 协同文档的key格式：collab_user_{userId}_doc_{documentId}_{index}
              if (
                item.key &&
                item.key.includes('collab_user_') &&
                item.key.includes(`_doc_${documentId}_`)
              ) {
                return item.key;
              }
              if (item.children) {
                const found = findCollaborativeDocumentInMenu(item.children);
                if (found) return found;
              }
            }
            return null;
          };

          const foundCollabDocKey = findCollaborativeDocumentInMenu(folderList);
          if (foundCollabDocKey) {
            return [foundCollabDocKey];
          }
        }

        // 如果没找到具体的协同文档项，保持协同文档菜单高亮
        return ['collaboration'];
      } else {
        // 普通文档编辑，需要在菜单中找到对应的文档项
        const documentId = path.startsWith('/doc-editor/')
          ? path.split('/doc-editor/')[1]
          : path.split('/history-version/')[1];
        if (documentId) {
          // 尝试在菜单数据中找到对应的文档
          const findDocumentInMenu = items => {
            if (!Array.isArray(items)) return null;
            for (const item of items) {
              // 尝试多种key格式匹配
              if (
                item.key &&
                (item.key.startsWith(`doc_${documentId}_`) || // 新格式: doc_${documentId}_${index}
                  item.key === `doc_${documentId}` || // 标准格式: doc_${documentId}
                  item.key === `doc${documentId}`) // 简化格式: doc${documentId}
              ) {
                return item.key;
              }
              if (item.children) {
                const found = findDocumentInMenu(item.children);
                if (found) return found;
              }
            }
            return null;
          };

          const foundDocKey = findDocumentInMenu(folderList);
          if (foundDocKey) {
            return [foundDocKey];
          }

          // 如果没找到对应的文档菜单项，返回空数组而不是默认高亮首页
          // 这样可以避免在文档编辑页面时首页被错误高亮
          console.log('⚠️ 未找到对应的文档菜单项，documentId:', documentId);
          return [];
        }
      }
    } else if (path.startsWith('/folderListPage/')) {
      // 文件夹页面，需要高亮显示对应的文件夹
      const folderId = path.split('/folderListPage/')[1];
      if (folderId) {
        console.log('🔍 查找文件夹菜单项，folderId:', folderId);

        // 尝试在菜单数据中找到对应的文件夹
        const findFolderInMenu = items => {
          if (!Array.isArray(items)) return null;
          for (const item of items) {
            if (item.key && item.key === folderId) {
              return item.key;
            }
            if (item.children) {
              const found = findFolderInMenu(item.children);
              if (found) return found;
            }
          }
          return null;
        };

        const foundFolderKey = findFolderInMenu(folderList);
        if (foundFolderKey) {
          return [foundFolderKey];
        }

        // 如果没找到对应的文件夹菜单项，返回folderId本身
        console.log('⚠️ 未找到对应的文件夹菜单项，使用folderId:', folderId);
        return [folderId];
      }
    }

    // 默认返回首页选中
    return ['home'];
  }, [location.pathname, location.search, folderList]);

  // 基于路由计算的选中状态
  const selectedKeys = getSelectedKeysFromRoute;

  /**
   * 数据验证函数：确保菜单数据结构正确
   * @param {Array} menuData - 菜单数据数组
   * @returns {Array} 清理后的菜单数据
   */
  const validateMenuData = menuData => {
    if (!Array.isArray(menuData)) {
      console.warn('⚠️ 菜单数据不是数组:', menuData);
      return [];
    }

    // // 用于检查key唯一性的Set
    // const usedKeys = new Set();

    // const validateAndClean = items => {
    //   if (!Array.isArray(items)) return [];

    //   return items
    //     .filter(item => {
    //       if (!item) {
    //         console.warn('⚠️ 发现空菜单项');
    //         return false;
    //       }
    //       if (!item.key) {
    //         console.warn('⚠️ 菜单项缺少key:', item);
    //         return false;
    //       }

    //       // 检查key唯一性
    //       if (usedKeys.has(item.key)) {
    //         console.warn('⚠️ 发现重复的key:', item.key, item);
    //         return false; // 过滤掉重复的key
    //       }
    //       usedKeys.add(item.key);

    //       return true;
    //     })
    //     .map(item => ({
    //       ...item,
    //       children: item.children ? validateAndClean(item.children) : undefined,
    //     }));
    // };

    return menuData;
  };

  // 获取文件夹列表
  const fetchFolders = useCallback(async () => {
    try {
      setLoading(true);

      // 获取用户ID，优先从userInfo获取，然后从localStorage获取
      let userId = userInfo?.userId || userInfo?._id;

      // 如果userInfo中没有userId，尝试从localStorage获取
      if (!userId) {
        const localUserId = localStorage.getItem('userId');

        // 如果从localStorage获取的是对象字符串，尝试解析
        if (typeof localUserId === 'string' && localUserId.startsWith('{')) {
          try {
            const userObj = JSON.parse(localUserId);
            userId = userObj.userId || userObj._id;
          } catch {
            // 解析失败，使用原值
            userId = localUserId;
          }
        } else {
          userId = localUserId;
        }
      }

      // 尝试获取用户ID，如果获取不到则跳过请求
      let numericUserId;
      try {
        numericUserId = getCurrentUserId();
      } catch (error) {
        // 如果是用户信息不完整的错误，说明用户信息还没加载完成，静默跳过
        if (error.message.includes('用户信息不完整')) {
          setLoading(false);
          return;
        }
        // 其他错误直接抛出
        throw error;
      }

      // 并行获取文件夹和文档数据
      const documentParams = {
        page: Number(1),
        pageSize: Number(1000), // 获取足够多的文档
      };

      const [folderResponse, documentResponse] = await Promise.all([
        folderAPI.getFolders({ userId: numericUserId }),
        documentAPI.getUserDocuments(numericUserId, documentParams),
      ]);

      // 转换后端数据为前端菜单格式
      const convertedFolders = convertBackendFoldersToMenuFormat(
        folderResponse.data || [],
        documentResponse.data?.documents || [],
      );

      // 构建协同文档菜单项
      const collaborationMenuItem = {
        key: 'collaboration',
        icon: React.createElement(TeamOutlined),
        label: (
          <div className={styles.menuLabelContainer}>
            <div className={styles.labelContent}>
              <EllipsisLabel text="协同空间" />
              {/* 协同空间主目录显示公开空间图标 */}
              <Tooltip title="公开协同空间 - 所有公开用户的文档">
                <TeamOutlined
                  style={{ color: '#52c41a', marginLeft: 4, fontSize: '12px' }}
                />
              </Tooltip>
            </div>
          </div>
        ),
        children: collaborationUsers
          .map(user => user.folderData)
          .filter(Boolean),
      };

      // 合并基础菜单项（首页、最近访问等）和用户文件夹
      const baseMenuItems = [
        {
          key: 'home',
          icon: React.createElement(HomeOutlined),
          label: <EllipsisLabel text="首页" />,
          children: null,
        },
        {
          key: 'recent-docs',
          icon: React.createElement(ClockCircleOutlined),
          label: <EllipsisLabel text="最近访问文档列表" />,
          children: null,
        },
        collaborationMenuItem,
      ];

      const fullFolderList = [...baseMenuItems, ...convertedFolders];
      setFolderList(fullFolderList);
      // 保存原始文件夹列表，用于搜索后恢复
      if (!isSearching) {
        setOriginalFolderList(fullFolderList);
      }
    } catch (error) {
      console.error('获取文件夹列表失败:', error);
      message.error('获取文件夹列表失败');

      // 失败时使用基础菜单项
      const collaborationMenuItem = {
        key: 'collaboration',
        icon: React.createElement(TeamOutlined),
        label: (
          <div className={styles.menuLabelContainer}>
            <div className={styles.labelContent}>
              <EllipsisLabel text="协同文档" />
              {/* 协同文档主目录显示公开空间图标 */}
              <Tooltip title="公开协同空间 - 所有公开用户的文档">
                <TeamOutlined
                  style={{ color: '#52c41a', marginLeft: 4, fontSize: '12px' }}
                />
              </Tooltip>
            </div>
          </div>
        ),
        children: collaborationUsers
          .map(user => user.folderData)
          .filter(Boolean),
      };

      const baseMenuItems = [
        {
          key: 'home',
          icon: React.createElement(HomeOutlined),
          label: <EllipsisLabel text="首页" />,
          children: null,
        },
        {
          key: 'recent-docs',
          icon: React.createElement(ClockCircleOutlined),
          label: <EllipsisLabel text="最近访问文档列表" />,
          children: null,
        },
        collaborationMenuItem,
        {
          key: 'root',
          icon: React.createElement(FolderOpenOutlined),
          label: <EllipsisLabel text="我的文件夹" />,
          permission: 'private',
          children: [],
        },
      ];
      setFolderList(baseMenuItems);
      // 失败时也保存原始列表
      if (!isSearching) {
        setOriginalFolderList(baseMenuItems);
      }
    } finally {
      setLoading(false);
    }
  }, [userInfo, collaborationUsers]);

  // 将后端文件夹数据转换为前端菜单格式
  const convertBackendFoldersToMenuFormat = (
    backendFolders,
    documents = [],
  ) => {
    // 使用工具函数构建文件夹和文档的映射关系
    const { folderDocuments, rootDocuments } =
      folderUtils.buildFolderDocumentTree(backendFolders, documents);

    // 递归转换后端文件夹数据为前端菜单格式
    const convertFolderToMenuItem = folder => {
      const menuItem = {
        key: folder.folderId, // 使用MongoDB字符串ID作为key
        autoFolderId: folder.autoFolderId, // 保存自增ID（如果有）
        icon: React.createElement(FolderOpenOutlined),
        label: <EllipsisLabel text={folder.folderName} />,
        children: [],
        backendData: folder, // 保存后端数据以便后续使用
        depth: folder.depth || 0,
        parentFolderIds: folder.parentFolderIds || [],
        childrenCount: folder.childrenCount || { documents: 0, folders: 0 },
        create_time: folder.create_time,
        update_time: folder.update_time,
      };

      // 递归处理子文件夹
      if (
        folder.children &&
        Array.isArray(folder.children) &&
        folder.children.length > 0
      ) {
        menuItem.children = folder.children.map(childFolder =>
          convertFolderToMenuItem(childFolder),
        );
      }

      // 使用工具函数获取属于此文件夹的文档
      const folderDocumentList = folderUtils.getDocumentsByFolderId(
        folderDocuments,
        folder.folderId,
      );

      // 将文档转换为菜单项并添加到children中
      const documentMenuItems = folderDocumentList.map(doc => {
        const docKey = `doc_${doc.documentId}`;
        return {
          key: docKey,
          label: (
            <EllipsisLabel
              text={doc.documentName}
              isEditing={editingKey === docKey}
              onSave={newName => handleRenameSave(docKey, newName)}
              onCancel={() => handleRenameCancel(docKey)}
            />
          ),
          isLeaf: true,
          backendData: doc,
          documentId: doc.documentId,
          // 移除onClick属性，因为Antd Menu不支持，改为在handleMenuSelect中处理
        };
      });

      // 合并文件夹和文档（文件夹在前，文档在后）
      menuItem.children = [...(menuItem.children || []), ...documentMenuItems];

      return menuItem;
    };

    // 转换所有根级文件夹（后端已经返回了完整的树形结构）
    const folderTree = Array.isArray(backendFolders)
      ? backendFolders.map(folder => convertFolderToMenuItem(folder))
      : [];

    // 对文件夹进行排序（按名称）
    const sortFolders = folders => {
      return folders
        .sort((a, b) => {
          const nameA = a.label?.props?.text || a.label || '';
          const nameB = b.label?.props?.text || b.label || '';
          return nameA.localeCompare(nameB, 'zh-CN');
        })
        .map(folder => ({
          ...folder,
          children:
            folder.children && folder.children.length > 0
              ? sortFolders(folder.children)
              : [],
        }));
    };

    const sortedFolderTree = sortFolders(folderTree);

    // 将根级文档转换为菜单项
    const rootDocumentMenuItems = rootDocuments.map(doc => {
      const docKey = `doc_${doc.documentId}`;
      return {
        key: docKey,
        label: (
          <EllipsisLabel
            text={doc.documentName}
            isEditing={editingKey === docKey}
            onSave={newName => handleRenameSave(docKey, newName)}
            onCancel={() => handleRenameCancel(docKey)}
          />
        ),
        isLeaf: true,
        backendData: doc,
        documentId: doc.documentId,
      };
    });

    // 创建"我的文件夹"根节点，包含所有后端文件夹数据和根级文档
    const myFoldersRoot = {
      key: 'root',
      icon: React.createElement(FolderOpenOutlined),
      label: <EllipsisLabel text="我的文件夹" />,
      permission: userPermission || 'private', // 使用用户权限状态
      children: [...sortedFolderTree, ...rootDocumentMenuItems], // 将文件夹和根级文档作为子项
    };

    return [myFoldersRoot];
  };

  // 组件挂载时获取文件夹列表
  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  // 调试：打印folderList的内容（开发时使用）
  useEffect(() => {
    if (import.meta.env.DEV) {
      if (folderList.length > 0) {
        // 查找并打印所有文档项
        const findDocuments = (items, path = '') => {
          items.forEach(item => {
            if (item.children) {
              findDocuments(item.children, path + '/' + item.key);
            }
          });
        };
        findDocuments(folderList);
      }
    }
  }, [folderList]);

  const handleMenuSelect = ({ selectedKeys }) => {
    const selectedKey = selectedKeys[0];

    // 更新用户实际选中的菜单项（用于新建文件夹/文档时确定目标位置）
    setUserSelectedKeys(selectedKeys);

    console.log('📁 菜单选中事件 - selectedKey:', selectedKey);
    console.log('📁 菜单选中事件 - selectedKeys:', selectedKeys);

    // 处理首页点击导航
    if (selectedKey === 'home') {
      navigate('/home');
    }
    // 处理最近访问文档列表点击导航
    else if (selectedKey === 'recent-docs') {
      navigate('/recent-docs');
    }
    // 处理协同文档点击导航
    else if (selectedKey === 'collaboration') {
      // navigate('/collaboration');
    }
    // 处理普通文档点击导航
    else if (selectedKey && selectedKey.startsWith('doc_')) {
      // 新的key格式: doc_${documentId}_${index}
      const parts = selectedKey.split('_');
      const documentId = parts[1]; // 获取documentId部分

      if (documentId) {
        navigate(`/doc-editor/${documentId}`);
      } else {
        console.warn('⚠️ 无法从key中解析documentId:', selectedKey);
      }
    }
    // 处理协同文档中的文档点击
    else if (
      selectedKey &&
      selectedKey.includes('collab_user_') &&
      selectedKey.includes('_doc_')
    ) {
      // 新的key格式: collab_user_{userId}_doc_{documentId}_{index}
      const parts = selectedKey.split('_');
      const documentId = parts[parts.length - 2]; // 获取倒数第二个部分作为documentId

      // 跳转到协同编辑器，添加协同标识
      navigate(`/doc-editor/${documentId}?collaborative=true`);
    }
    // 处理以doc开头的其他文档格式
    else if (
      selectedKey &&
      selectedKey.startsWith('doc') &&
      !selectedKey.includes('collab_user_')
    ) {
      // 处理格式如 "doc123" 的文档key
      const documentId = selectedKey.replace('doc', '');

      if (documentId && !isNaN(documentId)) {
        navigate(`/doc-editor/${documentId}`);
      } else {
        console.warn('⚠️ 无效的documentId:', documentId, 'key:', selectedKey);
      }
    }
    // 处理文件夹类型的选中
    else if (selectedKey && selectedKey !== 'empty-search-result') {
      // 检查是否是特殊菜单项
      const isSpecialKey = [
        'home',
        'recent-docs',
        'collaboration',
        'root',
      ].includes(selectedKey);

      // 区分协同空间的根节点和子文件夹
      const isCollabRootSpace = selectedKey.match(/^collab_user_\d+$/); // 匹配协同空间根节点
      const isCollabFolder =
        selectedKey.includes('collab_user_') &&
        selectedKey.includes('_folder_');

      // 查找当前选中的项目，确认是否有子节点
      const selectedItem = folderUtils.findNodeByKey(folderList, selectedKey);

      // 对所有类型的文件夹都处理展开逻辑
      if (
        selectedItem &&
        selectedItem.children &&
        selectedItem.children.length > 0
      ) {
        // 如果有子节点且未展开，则自动展开
        if (!openKeys.includes(selectedKey)) {
          setOpenKeys(prev => [...prev, selectedKey]);
        }
      }

      // 处理导航逻辑
      if (!isSpecialKey) {
        if (isCollabRootSpace) {
          // 协同空间根节点导航到协同空间页面
          // navigate('/collaboration');
          console.log(
            '📁 Menu选择事件 - 导航到协同空间页面，key:',
            selectedKey,
          );
        } else {
          // 普通文件夹和协同空间的文件夹都导航到文件夹页面
          navigate(`/folderListPage/${selectedKey}`);
          console.log(
            '📁 Menu选择事件 - 导航到文件夹页面，key:',
            selectedKey,
            isCollabFolder ? '(协同空间文件夹)' : '(普通文件夹)',
          );
        }
      } else {
        console.log('📁 特殊文件夹选中，无需导航，key:', selectedKey);
      }
    } else {
      console.log('📁 无效选择项，无需导航，key:', selectedKey);
    }
  };

  const handleMenuOpenChange = newOpenKeys => {
    console.log('📁 菜单展开/折叠事件 - newOpenKeys:', newOpenKeys);

    // 更新展开状态，但不影响选中状态和导航
    setOpenKeys(newOpenKeys);

    // 移除选中状态的更新逻辑，因为现在选中状态基于路由计算
    // 文件夹的展开/折叠不再影响菜单高亮状态
  };

  // 新建文件功能
  const handleAddFile = async () => {
    try {
      console.log('📁 新建文档 - 用户选中的菜单项:', userSelectedKeys[0]);
      console.log('📁 新建文档 - 完整的userSelectedKeys:', userSelectedKeys);
      console.log('📁 新建文档 - 打开的菜单项:', openKeys);

      // 使用工具函数获取有效的目标文件夹
      // 如果userSelectedKeys不正确，使用openKeys的最后一个作为备选
      const selectedKey = userSelectedKeys[0];
      const fallbackKey =
        openKeys.length > 0 ? openKeys[openKeys.length - 1] : 'root';
      const actualSelectedKey =
        selectedKey && selectedKey !== 'root' ? selectedKey : fallbackKey;

      console.log('📁 新建文档 - 实际使用的选中键:', actualSelectedKey);

      const targetKey = folderUtils.getValidTargetKey(
        folderList,
        actualSelectedKey,
        openKeys,
      );

      console.log('📁 新建文档 - 计算出的目标文件夹:', targetKey);

      // 检查是否选中了文件，如果是则给出提示
      const currentKey = userSelectedKeys[0];
      if (currentKey && currentKey.startsWith('doc')) {
        const parentNode = folderUtils.findParentNodeByKey(
          folderList,
          currentKey,
        );
        const parentName = parentNode
          ? parentNode.label?.props?.text || parentNode.label
          : '我的文件夹';
        message.info(`文档将在文件夹"${parentName}"中创建`);
      }

      // 生成唯一的默认名称，避免同级目录下的重复
      const defaultName = generateUniqueDefaultName('新建文档', targetKey);

      // 获取当前用户ID
      const numericUserId = getCurrentUserId();

      const username =
        userInfo?.username ||
        userInfo?.name ||
        localStorage.getItem('username') ||
        '当前用户';

      // 准备父文件夹ID数组
      let parentFolderIds = [];

      // 如果选中的是"我的文件夹"根节点，创建根级文档
      if (targetKey === 'root') {
        parentFolderIds = []; // 根级文档，parentFolderIds为空数组
      } else if (targetKey && targetKey !== 'root') {
        // 找到目标文件夹并构建父文件夹路径
        const targetFolder = folderUtils.findNodeByKey(folderList, targetKey);
        if (targetFolder && targetFolder.backendData) {
          // 如果目标文件夹存在，继承其路径并添加自身
          const targetFolderId =
            targetFolder.backendData.autoFolderId || parseInt(targetKey, 10);

          if (!isNaN(targetFolderId) && targetFolderId > 0) {
            // 确保parentFolderIds数组中只包含数字类型的ID（过滤掉MongoDB ObjectId字符串）
            const numericParentIds = (
              targetFolder.backendData.parentFolderIds || []
            )
              .map(id => {
                // 如果是数字，直接返回
                if (typeof id === 'number') return id;
                // 如果是字符串，尝试转换为数字
                const numericId = parseInt(id, 10);
                return !isNaN(numericId) && numericId > 0 ? numericId : null;
              })
              .filter(id => id !== null); // 过滤掉无效的ID

            parentFolderIds = [...numericParentIds, targetFolderId];
          } else {
            // 如果无法解析文件夹ID，使用空数组（根级）
            parentFolderIds = [];
          }
        } else {
          // 如果找不到详细信息，尝试解析targetKey
          const parsedTargetId = parseInt(targetKey, 10);
          if (!isNaN(parsedTargetId) && parsedTargetId > 0) {
            parentFolderIds = [parsedTargetId];
          } else {
            parentFolderIds = [];
          }
        }
      }

      // 准备创建文档的数据
      const createDocumentData = {
        documentName: defaultName,
        content: '', // 新建文档的初始内容为空
        userId: numericUserId,
        create_username: username,
        parentFolderIds: parentFolderIds,
      };

      // 调用后端 API 创建文档
      const response = await documentAPI.createDocument(createDocumentData);

      if (response.success) {
        message.success('新建文档成功');

        // 记录新创建的文档ID
        const documentId = response.data.documentId;
        if (documentId) {
          setNewlyCreatedDocumentId(documentId);
        }

        // 确保父文件夹路径都展开
        if (parentFolderIds.length > 0) {
          const newOpenKeys = [
            ...new Set([...openKeys, 'root', ...parentFolderIds.slice(0, -1)]),
          ];
          setOpenKeys(newOpenKeys);
        } else {
          // 如果是根级文档，只需要展开"我的文件夹"
          const newOpenKeys = [...new Set([...openKeys, 'root'])];
          setOpenKeys(newOpenKeys);
        }

        // 刷新文件夹列表以显示新文档
        try {
          await fetchFolders();
          // 重新获取协同文档数据，因为用户文档数据发生了变化
          await fetchCollaborationData();

          // 在文件夹列表刷新完成后，进入编辑状态
          if (documentId) {
            const documentKey = `doc_${documentId}`;
            console.log('📝 设置文档编辑状态，documentKey:', documentKey);
            console.log('📝 当前文件夹列表长度:', folderList.length);
            // 延迟一下再设置编辑状态，确保组件已经更新
            setTimeout(() => {
              setEditingKey(documentKey);
              console.log('📝 编辑状态已设置:', documentKey);
            }, 100);
          }
        } catch (fetchError) {
          console.warn('刷新文件夹列表失败:', fetchError);
          if (documentId) {
            console.warn('由于刷新失败，无法进入编辑状态');
            message.warning('文档创建成功，请刷新页面查看');
          }
        }
      } else {
        throw new Error(response.message || '创建文档失败');
      }
    } catch (error) {
      console.error('创建文档失败:', error);
      message.error(error.message || '创建文档失败，请重试');
    }
  };

  // 修改：创建文件夹，调用后端 API
  const handleAddFolder = async () => {
    try {
      console.log('📁 新建文件夹 - 用户选中的菜单项:', userSelectedKeys[0]);
      console.log('📁 新建文件夹 - 完整的userSelectedKeys:', userSelectedKeys);
      console.log('📁 新建文件夹 - 打开的菜单项:', openKeys);

      // 使用工具函数获取有效的目标文件夹
      // 如果userSelectedKeys不正确，使用openKeys的最后一个作为备选
      const selectedKey = userSelectedKeys[0];
      const fallbackKey =
        openKeys.length > 0 ? openKeys[openKeys.length - 1] : 'root';
      const actualSelectedKey =
        selectedKey && selectedKey !== 'root' ? selectedKey : fallbackKey;

      console.log('📁 新建文件夹 - 实际使用的选中键:', actualSelectedKey);

      const targetKey = folderUtils.getValidTargetKey(
        folderList,
        actualSelectedKey,
        openKeys,
      );

      console.log('📁 新建文件夹 - 计算出的目标文件夹:', targetKey);

      // 检查是否选中了文件，如果是则给出提示
      const currentKey = userSelectedKeys[0];
      if (currentKey && currentKey.startsWith('doc')) {
        const parentNode = folderUtils.findParentNodeByKey(
          folderList,
          currentKey,
        );
        const parentName = parentNode
          ? parentNode.label?.props?.text || parentNode.label
          : '我的文件夹';
        message.info(`文件夹将在文件夹"${parentName}"中创建`);
      }

      // 生成唯一的默认名称，避免同级目录下的重复
      const defaultName = generateUniqueDefaultName('新建文件夹', targetKey);

      // 获取当前用户ID
      const numericUserId = getCurrentUserId();

      const username =
        userInfo?.username ||
        userInfo?.name ||
        localStorage.getItem('username') ||
        '当前用户';

      // 准备父文件夹ID数组
      let parentFolderIds = [];

      // 如果选中的是"我的文件夹"根节点，创建根级文件夹
      if (targetKey === 'root') {
        parentFolderIds = []; // 根级文件夹，parentFolderIds为空数组
      } else if (targetKey && targetKey !== 'root') {
        // 找到目标文件夹，新文件夹将在此文件夹内创建
        const targetFolder = folderUtils.findNodeByKey(folderList, targetKey);
        if (targetFolder && targetFolder.backendData) {
          // 获取目标文件夹的自增ID，这将成为新文件夹的直接父文件夹
          const targetAutoFolderId =
            targetFolder.backendData.autoFolderId ||
            targetFolder.backendData.folderId;

          if (
            typeof targetAutoFolderId === 'number' &&
            targetAutoFolderId > 0
          ) {
            // 新文件夹的parentFolderIds就是选中文件夹的自增ID
            parentFolderIds = [targetAutoFolderId];
          } else {
            // 如果无法获取自增ID，尝试解析targetKey
            const numericTargetKey = parseInt(targetKey, 10);
            if (!isNaN(numericTargetKey) && numericTargetKey > 0) {
              parentFolderIds = [numericTargetKey];
            } else {
              parentFolderIds = [];
            }
          }
        } else {
          // 如果找不到详细信息，尝试将targetKey转换为数字作为父级
          const numericTargetKey = parseInt(targetKey, 10);
          if (!isNaN(numericTargetKey) && numericTargetKey > 0) {
            parentFolderIds = [numericTargetKey];
          } else {
            parentFolderIds = [];
          }
        }
      }

      // 准备创建文件夹的数据
      const createFolderData = {
        folderName: defaultName,
        userId: numericUserId,
        create_username: username,
        parentFolderIds: parentFolderIds,
      };

      // 调用后端 API 创建文件夹
      const response = await folderAPI.createFolder(createFolderData);

      if (response.success) {
        message.success('新建文件夹成功');

        // 重新获取文件夹列表以显示最新数据
        await fetchFolders();

        // 重新获取协同文档数据，因为用户文件夹数据发生了变化
        await fetchCollaborationData();

        // 进入编辑状态
        setEditingKey(response.data.folderId);

        // 确保"我的文件夹"根节点展开
        if (!openKeys.includes('root')) {
          setOpenKeys(prev => [...prev, 'root']);
        }

        // 确保父文件夹路径都展开
        if (parentFolderIds.length > 0) {
          const newOpenKeys = [
            ...new Set([...openKeys, 'root', ...parentFolderIds]),
          ];
          setOpenKeys(newOpenKeys);
        } else {
          // 如果是根级文件夹，只需要展开"我的文件夹"
          const newOpenKeys = [...new Set([...openKeys, 'root'])];
          setOpenKeys(newOpenKeys);
        }
      } else {
        throw new Error(response.message || '创建文件夹失败');
      }
    } catch (error) {
      console.error('创建文件夹失败:', error);
      message.error(error.message || '创建文件夹失败，请重试');
    }
  };

  // 处理重命名保存
  const handleRenameSave = async (key, newName) => {
    try {
      // 获取当前用户名
      let username =
        userInfo?.username ||
        userInfo?.name ||
        localStorage.getItem('username') ||
        '当前用户';

      // 如果从localStorage获取的是对象字符串，尝试解析
      if (typeof username === 'string' && username.startsWith('{')) {
        try {
          const userObj = JSON.parse(username);
          username = userObj.username || userObj.name || username;
        } catch {
          // 解析失败，继续使用原值
        }
      }

      // 查找项目，获取相关信息
      const targetItem = folderUtils.findNodeByKey(folderList, key);

      // 判断是文档还是文件夹
      const isDocument = key.startsWith('doc_') || key.startsWith('doc');

      let response;

      if (isDocument) {
        // 获取文档ID（优先使用 documentId，如果没有则使用 autoDocumentId）
        const documentId =
          targetItem?.documentId ||
          targetItem?.backendData?.documentId ||
          targetItem?.backendData?.autoDocumentId;

        if (!documentId) {
          throw new Error('无法获取文档ID，重命名失败');
        }

        // 调用文档更新API
        response = await documentAPI.updateDocument(documentId, {
          documentName: newName,
        });
      } else {
        // 重命名文件夹
        // 优先使用自增ID，如果没有则使用MongoDB ID（兼容旧数据）
        // 尝试从多个地方获取自增ID
        const autoFolderId =
          targetItem?.autoFolderId ||
          targetItem?.backendData?.autoFolderId ||
          targetItem?.backendData?.folderId;

        const updateId =
          typeof autoFolderId === 'number' && autoFolderId > 0
            ? autoFolderId
            : key;

        // 调用文件夹更新API - 使用自增ID
        response = await folderAPI.updateFolder(updateId, {
          folderName: newName,
        });
      }

      if (response.success) {
        // 重新获取文件夹列表
        await fetchFolders();
        // 重新获取协同文档数据，因为用户文件夹或文档数据发生了变化
        await fetchCollaborationData();
        setEditingKey(null);
        message.success('重命名成功');

        // 如果是文档重命名成功，自动跳转到文档编辑器
        if (isDocument) {
          const documentId =
            newlyCreatedDocumentId || // 优先使用新创建的文档ID
            targetItem?.documentId ||
            targetItem?.backendData?.documentId ||
            targetItem?.backendData?.autoDocumentId;

          if (documentId) {
            // 清除新创建文档ID的记录
            setNewlyCreatedDocumentId(null);
            // 延迟一下再跳转，让用户看到重命名成功的反馈
            setTimeout(() => {
              navigate(`/doc-editor/${documentId}`);
            }, 800);
          }
        }
      } else {
        throw new Error(response.message || '重命名失败');
      }
    } catch (error) {
      console.error('重命名失败:', error);

      // 显示详细的错误信息弹窗
      messageApi.warning({
        content: `重命名失败：${error.response.data.message || error}`,
        duration: 5, // 显示5秒
      });
    }
  };

  // 处理重命名取消
  const handleRenameCancel = async key => {
    // 如果是新创建的项目且取消了重命名，则删除该项目
    const item = folderUtils.findNodeByKey(folderList, key);
    if (item?.isNew) {
      try {
        // 判断是文档还是文件夹
        const isDocument = key.startsWith('doc_') || key.startsWith('doc');

        if (isDocument) {
          // 删除文档
          const documentId =
            newlyCreatedDocumentId || // 优先使用新创建的文档ID
            item?.documentId ||
            item?.backendData?.documentId ||
            item?.backendData?.autoDocumentId ||
            key.replace('doc_', ''); // 从key中提取documentId

          if (documentId) {
            await documentAPI.deleteDocument(documentId);
            // 清除新创建文档ID的记录
            setNewlyCreatedDocumentId(null);
            messageApi.warning({
              content: `已取消创建文档`,
              duration: 5, // 显示5秒
            });
          }
        } else {
          // 删除文件夹
          const autoFolderId =
            item?.autoFolderId ||
            item?.backendData?.autoFolderId ||
            item?.backendData?.folderId;

          // 优先使用自增ID删除，如果没有则使用MongoDB ID（兼容性）
          if (typeof autoFolderId === 'number' && autoFolderId > 0) {
            await folderAPI.deleteFolderByFolderId(autoFolderId);
          } else {
            await folderAPI.deleteFolder(key);
          }
          messageApi.warning({
            content: `已取消创建文件夹`,
            duration: 5, // 显示5秒
          });
        }

        await fetchFolders();
        await fetchCollaborationData();
      } catch (error) {
        console.error('删除失败:', error);
        message.error('取消创建失败');
      }
    }
    setEditingKey(null);
  };

  // 处理权限管理
  const handlePermissionManage = async (key, name, currentPermission) => {
    try {
      // 使用用户上下文中的权限状态，如果没有则使用传入的权限状态
      const actualPermission = userPermission || currentPermission || 'private';

      setPermissionModal({
        visible: true,
        key,
        name,
        permission: actualPermission,
        loading: false,
      });
    } catch (error) {
      console.error('获取权限状态失败:', error);
      // 即使获取失败，也显示弹窗，使用默认状态
      setPermissionModal({
        visible: true,
        key,
        name,
        permission: userPermission || currentPermission || 'private',
        loading: false,
      });
    }
  };

  // 处理权限保存
  const handlePermissionSave = async () => {
    if (permissionModal.key !== 'root') {
      message.error('只能修改工作空间的权限设置');
      return;
    }

    // 设置加载状态
    setPermissionModal(prev => ({ ...prev, loading: true }));

    try {
      // 获取用户邮箱
      const userEmail = userInfo?.email || localStorage.getItem('userEmail');

      if (!userEmail) {
        message.error('无法获取用户邮箱信息，请重新登录');
        setPermissionModal(prev => ({ ...prev, loading: false }));
        return;
      }

      // 设置isPublic值 - 'public'对应true, 'private'对应false
      const isPublic = permissionModal.permission === 'public';
      const newPermission = permissionModal.permission;

      // 调用后端API修改用户公开状态，传递isPublic参数
      const response = await userAPI.changePublicStatus(userEmail, isPublic);

      // 检查响应状态 - API成功返回时通常有success字段或者直接检查message
      const isSuccess = response.success === true || response.success !== false;

      if (isSuccess) {
        // 先更新用户上下文中的权限状态
        updateUserPermission(newPermission);

        // 更新前端状态
        setFolderList(prev =>
          folderUtils.updateNodePermission(
            prev,
            permissionModal.key,
            newPermission,
          ),
        );

        setPermissionModal({
          visible: false,
          key: '',
          name: '',
          permission: 'private',
          loading: false,
        });

        // 重新获取协同文档数据，因为用户权限发生了变化
        await fetchCollaborationData();

        const permissionText =
          newPermission === 'public' ? '公开空间' : '私有空间';
        message.success(`工作空间已设置为${permissionText}`);
      } else {
        throw new Error(response.message || '权限修改失败');
      }
    } catch (error) {
      console.error('修改权限失败:', error);
      message.error(error.message || '修改权限失败，请重试');
      setPermissionModal(prev => ({ ...prev, loading: false }));
    }
  };

  // 处理权限弹窗取消
  const handlePermissionCancel = () => {
    setPermissionModal({
      visible: false,
      key: '',
      name: '',
      permission: 'private',
      loading: false,
    });
  };

  // 处理删除确认
  const handleDeleteConfirm = async () => {
    const { key } = deleteModal;

    // 设置加载状态
    setDeleteModal(prev => ({ ...prev, loading: true }));

    try {
      // 获取要删除的项目信息
      const targetItem = folderUtils.findNodeByKey(folderList, key);

      // 判断是文档还是文件夹
      const isDocument = key.startsWith('doc_') || key.startsWith('doc');

      let response;

      if (isDocument) {
        // 获取文档ID（优先使用 documentId，如果没有则使用 autoDocumentId）
        const documentId =
          targetItem?.documentId ||
          targetItem?.backendData?.documentId ||
          targetItem?.backendData?.autoDocumentId;

        if (!documentId) {
          throw new Error('无法获取文档ID，删除失败');
        }

        // 调用删除文档API
        response = await documentAPI.deleteDocument(documentId);

        if (response.success) {
          message.success('文档删除成功！');
        }
      } else {
        // 获取文件夹自增ID
        const autoFolderId =
          targetItem?.autoFolderId ||
          targetItem?.backendData?.autoFolderId ||
          targetItem?.backendData?.folderId;

        // 优先使用自增ID删除，如果没有则使用MongoDB ID（兼容性）
        response =
          typeof autoFolderId === 'number' && autoFolderId > 0
            ? await folderAPI.deleteFolderByFolderId(autoFolderId)
            : await folderAPI.deleteFolder(key);

        if (response.success) {
          // 显示删除统计信息
          const { deletedFoldersCount, deletedDocumentsCount } = response.data;
          message.success(
            `删除成功！共删除 ${deletedFoldersCount} 个文件夹，${deletedDocumentsCount} 个文档`,
          );
        }
      }

      if (response.success) {
        // 重新获取文件夹列表以确保数据同步
        await fetchFolders();
        // 重新获取协同文档数据，因为用户文件夹或文档数据发生了变化
        await fetchCollaborationData();
      } else {
        throw new Error(response.message || '删除失败');
      }
    } catch (error) {
      console.error('删除失败:', error);
      message.error(error.message || '删除失败，请重试');
    } finally {
      // 关闭弹窗并重置状态
      setDeleteModal({
        visible: false,
        key: '',
        name: '',
        loading: false,
      });
    }
  };

  // 获取权限图标（只有根文件夹显示权限图标）
  const getPermissionIcon = (permission, isRoot = false) => {
    if (!isRoot) return null; // 只有根文件夹显示权限图标

    return permission === 'public' ? (
      <Tooltip title="公开空间 - 其他用户可协同编辑您的所有文档">
        <TeamOutlined style={{ color: '#52c41a', marginLeft: 4 }} />
      </Tooltip>
    ) : (
      <Tooltip title="私有空间 - 仅您可编辑您的所有文档">
        <UserOutlined style={{ color: '#8c8c8c', marginLeft: 4 }} />
      </Tooltip>
    );
  };

  // 生成带更多操作按钮的菜单项label
  const getMenuLabel = item => {
    // 安全检查：确保item和item.key存在
    if (!item || !item.key) {
      console.warn('⚠️ getMenuLabel: item或item.key未定义', item);
      return <span>未知项目</span>;
    }

    // 获取原始文本（用于重命名弹窗）
    const text = item.label?.props?.text || item.label;

    // 首页和协同文档不显示操作按钮
    if (item.key === 'home' || item.key === 'collaboration') {
      return (
        <div
          className={styles.menuLabelContainer}
          onClick={() => {
            if (item.key === 'collaboration') {
              console.log('🚀 导航到协同空间页面');

              navigate('/collaboration');
            }
          }}
        >
          <div className={styles.labelContent}>
            <EllipsisLabel
              text={text}
              isEditing={editingKey === item.key}
              onSave={newName => handleRenameSave(item.key, newName)}
              onCancel={() => handleRenameCancel(item.key)}
            />
          </div>
        </div>
      );
    }

    // 协同文档的子项（其他用户的公开空间）不显示操作按钮，只显示所有者信息
    if (item.key.startsWith('collab_user_')) {
      return (
        <div className={styles.menuLabelContainer}>
          <div className={styles.labelContent}>
            <EllipsisLabel
              text={text}
              isEditing={false} // 协同文档不允许编辑
              onSave={() => {}}
              onCancel={() => {}}
            />
            {/* 只有协同文档根目录的用户空间才显示公开空间图标 */}
            {item.key.match(/^collab_user_\d+$/) && (
              <Tooltip title={`${item.owner}的公开空间 - 可协同编辑`}>
                <TeamOutlined
                  style={{ color: '#52c41a', marginLeft: 4, fontSize: '12px' }}
                />
              </Tooltip>
            )}
          </div>
        </div>
      );
    }

    // 协同文档下的文件夹和文档不显示操作按钮
    if (item.key.includes('collab_user_')) {
      return (
        <div className={styles.menuLabelContainer}>
          <EllipsisLabel
            text={text}
            isEditing={false} // 协同文档不允许编辑
            onSave={() => {}}
            onCancel={() => {}}
          />
        </div>
      );
    }

    // 根文件夹特殊处理，显示权限图标和权限管理按钮
    if (item.key === 'root') {
      return (
        <div className={styles.menuLabelContainer}>
          <div className={styles.labelContent}>
            <EllipsisLabel
              text={text}
              isEditing={editingKey === item.key}
              onSave={newName => handleRenameSave(item.key, newName)}
              onCancel={() => handleRenameCancel(item.key)}
            />
            {/* 根文件夹显示权限图标 */}
            {item.permission && getPermissionIcon(item.permission, true)}
          </div>
          {/* 显示权限管理按钮 */}
          <Tooltip title="工作空间权限设置">
            <Button
              type="text"
              icon={
                item.permission === 'public' ? (
                  <UnlockOutlined />
                ) : (
                  <LockOutlined />
                )
              }
              size="small"
              className={styles.permissionButton}
              data-permission={item.permission || 'private'}
              onClick={() => {
                handlePermissionManage(
                  item.key,
                  text,
                  item.permission || 'private',
                );
              }}
            />
          </Tooltip>
        </div>
      );
    }

    // 判断是否为文件（以doc开头的key为文件）
    const isFile = item.key.startsWith('doc');

    // Dropdown 菜单项配置
    const dropdownMenuItems = [
      {
        key: 'rename',
        label: '重命名',
        onClick: e => {
          e.domEvent && e.domEvent.stopPropagation();
          setEditingKey(item.key);
        },
      },
      // 只有根文件夹才显示权限管理选项
      ...(item.key === 'root'
        ? [
            {
              key: 'permission',
              label: (
                <Space>
                  {item.permission === 'public' ? (
                    <UnlockOutlined />
                  ) : (
                    <LockOutlined />
                  )}
                  空间权限管理
                </Space>
              ),
              onClick: e => {
                e.domEvent && e.domEvent.stopPropagation();
                handlePermissionManage(
                  item.key,
                  text,
                  item.permission || 'private',
                );
              },
            },
          ]
        : []),
      // 只有文件才显示历史版本记录选项
      ...(isFile
        ? [
            {
              key: 'history',
              label: '历史版本记录',
              onClick: e => {
                e.domEvent && e.domEvent.stopPropagation();
                // 跳转到历史版本页面
                const documentId = item.key.replace('doc_', '');
                if (documentId) {
                  navigate(`/history-version/${documentId}`);
                } else {
                  message.error('无法获取文档ID');
                }
              },
            },
          ]
        : []),
      {
        key: 'delete',
        label: '删除',
        danger: true,
        onClick: e => {
          e.domEvent && e.domEvent.stopPropagation();
          setDeleteModal({
            visible: true,
            key: item.key,
            name: text,
            loading: false,
          });
        },
      },
    ];

    return (
      <div className={styles.menuLabelContainer}>
        <div
          className={styles.labelContent}
          onClick={() => {
            // 如果是文档项，点击文档名可以直接跳转
            if (isFile && !item.key.includes('collab_user_')) {
              // 新的key格式: doc_${documentId}_${index}
              const parts = item.key.split('_');
              const documentId = parts[1]; // 获取documentId部分
              if (documentId) {
                // 阻止事件冒泡，因为我们要自己处理导航
                navigate(`/doc-editor/${documentId}`);
              }
            } else if (
              isFile &&
              item.key.includes('collab_user_') &&
              item.key.includes('_doc_')
            ) {
              // 处理协同空间的文档项
              const parts = item.key.split('_');
              const documentId = parts[parts.length - 2]; // 获取倒数第二个部分作为documentId
              if (documentId) {
                // 阻止事件冒泡，因为我们要自己处理导航
                // 跳转到协同编辑器，添加协同标识
                navigate(`/doc-editor/${documentId}?collaborative=true`);
              }
            } else if (!isFile && !item.key.includes('recent-docs')) {
              // 区分协同空间的文件夹和普通文件夹
              const isCollabRootSpace = item.key.match(/^collab_user_\d+$/); // 匹配协同空间根节点
              const isCollabFolder =
                item.key.includes('collab_user_') &&
                item.key.includes('_folder_');

              // 对于任何类型的文件夹，都处理展开/折叠逻辑
              console.log(
                '📁 文件夹名称点击，key:',
                item.key,
                isCollabRootSpace
                  ? '(协同空间根节点)'
                  : isCollabFolder
                    ? '(协同空间文件夹)'
                    : '(普通文件夹)',
              );

              // 阻止事件冒泡，我们自己处理导航
              // e.stopPropagation();

              // 手动处理展开/折叠逻辑（对所有文件夹通用）
              if (item.children && item.children.length > 0) {
                if (!openKeys.includes(item.key)) {
                  setOpenKeys([...openKeys, item.key]);
                }
              }

              // 更新选中状态（对所有文件夹通用）
              setUserSelectedKeys([item.key]);

              // 执行导航（对普通文件夹和协同空间文件夹，但不包括协同空间根节点）
              navigate(`/folderListPage/${item.key}`);
              console.log(
                '🚀 导航到文件夹页面：',
                `/folderListPage/${item.key}`,
              );
            }
          }}
          style={
            isFile && !item.key.includes('collab_user_')
              ? { cursor: 'pointer' }
              : !isFile && !item.key.includes('collab_user_')
                ? { cursor: 'pointer' }
                : {}
          }
        >
          <EllipsisLabel
            text={text}
            isEditing={editingKey === item.key}
            onSave={newName => handleRenameSave(item.key, newName)}
            onCancel={() => handleRenameCancel(item.key)}
          />
          {/* 子文件夹不再显示权限图标，权限由根文件夹控制 */}
        </div>
        {editingKey !== item.key && (
          <Dropdown
            menu={{ items: dropdownMenuItems }}
            trigger={['click']}
            placement="bottomLeft"
          >
            <Button
              type="text"
              icon={<MoreOutlined />}
              size="small"
              className={styles.moreButton}
              onClick={e => e.stopPropagation()}
            />
          </Dropdown>
        )}
      </div>
    );
  };

  // 递归为每个菜单项加上带操作按钮的label
  function withMenuActions(list) {
    return list
      .map(item => {
        // 安全检查：确保item存在
        if (!item) {
          console.warn('⚠️ withMenuActions: item未定义', item);
          return null;
        }

        // 过滤掉不应该传递到DOM的属性，但保留documentId用于文档导航
        const {
          autoFolderId: _autoFolderId,
          backendData: _backendData,
          parentFolderIds: _parentFolderIds,
          childrenCount: _childrenCount,
          isLeaf: _isLeaf,
          depth: _depth,
          create_time: _createTime,
          update_time: _updateTime,
          ...menuProps
        } = item;

        const result = {
          ...menuProps,
          label: getMenuLabel(item),
          children: item.children ? withMenuActions(item.children) : undefined,
        };

        // 为所有菜单项添加 data-key 属性，用于CSS选择器
        result['data-key'] = item.key;

        // 特殊处理文档菜单项
        if (item.key && item.key.startsWith('doc_')) {
          result.disabled = false; // 确保文档菜单项不被禁用
          result.children = undefined; // 文档项不应该有子项，强制设置为undefined
        }

        // 为文件夹添加权限样式
        // 文件夹的key通常是MongoDB ObjectId（24位十六进制字符串）或者'root'
        const isFolderKey =
          item.key === 'root' ||
          (!item.key.startsWith('doc_') &&
            !item.key.startsWith('doc') &&
            !item.key.includes('collab_user_') &&
            !['home', 'recent-docs', 'collaboration'].includes(item.key));

        if (isFolderKey) {
          // 为文件夹添加权限相关的CSS类名
          if (item.permission) {
            result.className = `${item.permission}-folder`;
          }
          // 确保文件夹是可选中的（不禁用）
          result.disabled = false;
        }

        // 为协同文档的用户空间添加特殊样式
        if (item.key && item.key.startsWith('collab_user_')) {
          // 添加协同用户空间的CSS类名
          result.className = 'collaboration-user-space';
        }

        // 为协同文档下的文件夹添加特殊样式
        if (
          item.key &&
          item.key.includes('collab_user_') &&
          item.key.includes('folder')
        ) {
          result.className = 'collaboration-folder';
          // 确保文件夹是可选中的（不禁用）
          result.disabled = false;
        }

        // 为协同文档菜单项添加特殊处理
        if (item.key === 'collaboration') {
          result.className = 'collaboration-menu-item';
          result.selectable = true;
          result.disabled = false;
        }

        return result;
      })
      .filter(Boolean); // 过滤掉null值
  }

  // 搜索文件夹
  const onSearch = useCallback(
    value => {
      console.log('🔍 搜索文件夹:', value);
      performSearch(value);
    },
    [performSearch],
  );

  return (
    <div className={styles.folderMenuRoot}>
      {contextHolder}
      <div className={styles.buttonContainer}>
        <Tooltip title="新建文件">
          <Button
            icon={<PlusSquareOutlined style={{ fontSize: '20px' }} />}
            onClick={handleAddFile}
            size="middle"
            style={hoveredButton === 'file' ? buttonHoverStyle : buttonStyle}
            onMouseEnter={() => setHoveredButton('file')}
            onMouseLeave={() => setHoveredButton(null)}
          />
        </Tooltip>
        <Tooltip title="新建文件夹">
          <Button
            icon={<FolderAddOutlined style={{ fontSize: '20px' }} />}
            onClick={handleAddFolder}
            size="middle"
            style={hoveredButton === 'folder' ? buttonHoverStyle : buttonStyle}
            onMouseEnter={() => setHoveredButton('folder')}
            onMouseLeave={() => setHoveredButton(null)}
          />
        </Tooltip>
      </div>
      <div className={styles.searchContainer}>
        <Search
          placeholder="在我的文件夹中搜索文件夹"
          allowClear
          onSearch={onSearch}
          onChange={e => {
            // 当搜索框被清空时，恢复原始列表
            if (!e.target.value) {
              performSearch('');
            }
          }}
        />
      </div>

      {/* 删除确认弹窗 */}
      <Modal
        title="确认删除"
        open={deleteModal.visible}
        onOk={handleDeleteConfirm}
        onCancel={() =>
          setDeleteModal({ visible: false, key: '', name: '', loading: false })
        }
        okText="删除"
        okButtonProps={{ danger: true }}
        cancelText="取消"
        confirmLoading={deleteModal.loading}
      >
        <span>
          {(() => {
            // 判断是否为文档
            const isDocument =
              deleteModal.key.startsWith('doc_') ||
              deleteModal.key.startsWith('doc');

            if (isDocument) {
              return `确定要删除文档"${deleteModal.name}"吗？此操作不可恢复。`;
            } else {
              return `确定要删除文件夹"${deleteModal.name}"吗？此操作不可恢复，且会递归删除其下所有子文件夹和文档。`;
            }
          })()}
        </span>
      </Modal>

      {/* 权限管理弹窗 */}
      <Modal
        title="工作空间权限设置"
        open={permissionModal.visible}
        onOk={handlePermissionSave}
        onCancel={handlePermissionCancel}
        okText="保存"
        cancelText="取消"
        width={480}
        confirmLoading={permissionModal.loading}
      >
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ marginBottom: 12 }}>选择工作空间权限：</h4>
          <Radio.Group
            value={permissionModal.permission}
            onChange={e =>
              setPermissionModal(prev => ({
                ...prev,
                permission: e.target.value,
              }))
            }
          >
            <Space direction="vertical" size={16}>
              <Radio value="private">
                <Space>
                  <UserOutlined style={{ color: '#8c8c8c' }} />
                  <div>
                    <div style={{ fontWeight: 500 }}>私有空间</div>
                    <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                      只有您可以查看和编辑您工作空间中的所有文档
                    </div>
                  </div>
                </Space>
              </Radio>
              <Radio value="public">
                <Space>
                  <TeamOutlined style={{ color: '#52c41a' }} />
                  <div>
                    <div style={{ fontWeight: 500 }}>公开空间</div>
                    <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                      其他用户可以与您协同编辑您工作空间中的所有文档
                    </div>
                  </div>
                </Space>
              </Radio>
            </Space>
          </Radio.Group>
        </div>
        <div
          style={{ padding: 12, backgroundColor: '#f6f8fa', borderRadius: 6 }}
        >
          <Space>
            <span style={{ fontSize: 12, color: '#666' }}>💡 提示：</span>
            <span style={{ fontSize: 12, color: '#666' }}>
              公开空间支持多人实时协同编辑，私有空间仅您可访问
            </span>
          </Space>
        </div>
      </Modal>

      <div className={styles.menu}>
        <Menu
          mode="inline"
          selectedKeys={
            selectedKeys.length > 0 ? selectedKeys : userSelectedKeys
          }
          openKeys={openKeys}
          onSelect={handleMenuSelect}
          onOpenChange={handleMenuOpenChange}
          onClick={({ key }) => {
            // 处理菜单项点击事件（包括文件夹点击）
            console.log('📁 Menu onClick事件，key:', key);

            // 更新用户选中状态
            setUserSelectedKeys([key]);

            // 如果是文件夹类型，不在此处进行导航操作（由handleMenuSelect处理）
            const isFolderKey =
              key === 'root' ||
              (!key.startsWith('doc_') &&
                !key.includes('collab_user_') &&
                !['home', 'recent-docs', 'collaboration'].includes(key));

            if (isFolderKey) {
              console.log('📁 文件夹点击，key:', key);
            }
          }}
          className="folder-menu-theme"
          items={withMenuActions(validateMenuData(folderList))}
          selectable={true}
          multiple={false}
          style={{ border: 'none', background: 'transparent' }}
        />
      </div>
    </div>
  );
};

export { FolderMenu, EllipsisLabel };
