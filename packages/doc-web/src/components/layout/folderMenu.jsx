import React, {
  useState,
  useRef,
  useEffect,
  useContext,
  useCallback,
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
      const folderKey = `collab_user_${userData.userId}_folder_${folder.autoFolderId}`;

      // 获取该文件夹下的直接文档
      const folderDocuments = documentsByFolder.get(folder.autoFolderId) || [];

      // 转换文档为菜单项
      const documentMenuItems = folderDocuments.map(doc => ({
        key: `collab_user_${userData.userId}_doc_${doc.documentId}`,
        label: <EllipsisLabel text={doc.documentName} />,
        isLeaf: true,
        backendData: doc,
        documentId: doc.documentId,
        userId: userData.userId,
        userName: userData.username,
        isCollaborative: true,
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
        label: <EllipsisLabel text={folder.folderName} />,
        children: allChildren.length > 0 ? allChildren : undefined,
        backendData: folder,
        userId: userData.userId,
        userName: userData.username,
        isCollaborative: true,
      };
    };

    // 处理根级文件夹
    const rootFolders = userData.folders.map(folder =>
      convertFolderToMenuItem(folder),
    );

    // 处理根级文档
    const rootDocuments = documentsByFolder.get('root').map(doc => ({
      key: `collab_user_${userData.userId}_doc_${doc.documentId}`,
      label: <EllipsisLabel text={doc.documentName} />,
      isLeaf: true,
      backendData: doc,
      documentId: doc.documentId,
      userId: userData.userId,
      userName: userData.username,
      isCollaborative: true,
    }));

    // 合并根级文件夹和文档
    const allChildren = [...rootFolders, ...rootDocuments];

    return {
      key: `collab_user_${userData.userId}`,
      icon: React.createElement(UserOutlined),
      label: <EllipsisLabel text={`${userData.username}的公开空间`} />,
      permission: 'public',
      owner: userData.username,
      ownerId: userData.userId,
      children: allChildren.length > 0 ? allChildren : undefined,
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
  // 新增：计数器，用于生成默认名称
  const [counters, setCounters] = useState({ folder: 1, file: 1 });
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
  const getSelectedKeysFromRoute = useCallback(() => {
    const path = location.pathname;

    // 根据路由路径确定选中的菜单项
    if (path === '/home') {
      return ['home'];
    } else if (path === '/recent-docs') {
      return ['recent-docs'];
    } else if (path === '/collaboration') {
      return ['collaboration'];
    } else if (path.startsWith('/doc-editor/')) {
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
              // 协同文档的key格式：collab_user_{userId}_doc_{documentId}
              if (
                item.key &&
                item.key.includes('collab_user_') &&
                item.key.endsWith(`_doc_${documentId}`)
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
        const documentId = path.split('/doc-editor/')[1];
        if (documentId) {
          // 尝试在菜单数据中找到对应的文档
          const findDocumentInMenu = items => {
            if (!Array.isArray(items)) return null;
            for (const item of items) {
              if (item.key === `doc_${documentId}`) {
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

          // 如果没找到对应的文档菜单项，返回默认选中
          return ['home'];
        }
      }
    }

    // 默认返回首页选中
    return ['home'];
  }, [location.pathname, location.search, folderList]);

  // 基于路由计算的选中状态
  const selectedKeys = getSelectedKeysFromRoute();

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

    return menuData
      .filter(item => {
        if (!item) {
          console.warn('⚠️ 发现空菜单项');
          return false;
        }
        if (!item.key) {
          console.warn('⚠️ 菜单项缺少key:', item);
          return false;
        }
        return true;
      })
      .map(item => ({
        ...item,
        children: item.children ? validateMenuData(item.children) : undefined,
      }));
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

      setFolderList([...baseMenuItems, ...convertedFolders]);
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
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const documentMenuItems = folderDocumentList.map(doc => ({
        key: `doc_${doc.documentId}`,
        label: (
          <EllipsisLabel
            text={doc.documentName}
            isEditing={false}
            onSave={() => {}}
            onCancel={() => {}}
          />
        ),
        isLeaf: true,
        backendData: doc,
        documentId: doc.documentId,
        // 移除onClick属性，因为Antd Menu不支持，改为在handleMenuSelect中处理
      }));

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
    const rootDocumentMenuItems = rootDocuments.map(doc => ({
      key: `doc_${doc.documentId}`,
      label: (
        <EllipsisLabel
          text={doc.documentName}
          isEditing={false}
          onSave={() => {}}
          onCancel={() => {}}
        />
      ),
      isLeaf: true,
      backendData: doc,
      documentId: doc.documentId,
      // 移除onClick属性，因为Antd Menu不支持，改为在handleMenuSelect中处理
    }));

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
    // 移除 setSelectedKeys 调用，因为现在选中状态基于路由计算
    const selectedKey = selectedKeys[0];

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
      navigate('/collaboration');
    }
    // 处理协同文档中的文档点击
    else if (
      selectedKey &&
      selectedKey.includes('collab_user_') &&
      selectedKey.includes('_doc_')
    ) {
      // 解析协同文档的key: collab_user_{userId}_doc_{documentId}
      const parts = selectedKey.split('_');
      const documentId = parts[parts.length - 1]; // 获取文档ID

      // 跳转到协同编辑器，添加协同标识
      navigate(`/doc-editor/${documentId}?collaborative=true`);
    }
    // 处理普通文档点击导航
    else if (selectedKey && selectedKey.startsWith('doc_')) {
      const documentId = selectedKey.replace('doc_', '');

      if (documentId) {
        navigate(`/doc-editor/${documentId}`);
      } else {
        console.warn('⚠️ 无法从key中解析documentId:', selectedKey);
      }
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
  };

  const handleMenuOpenChange = newOpenKeys => {
    setOpenKeys(newOpenKeys);

    // 移除选中状态的更新逻辑，因为现在选中状态基于路由计算
    // 文件夹的展开/折叠不再影响菜单高亮状态
  };

  // 新建文件功能
  const handleAddFile = async () => {
    try {
      // 使用工具函数获取有效的目标文件夹
      const targetKey = folderUtils.getValidTargetKey(
        folderList,
        selectedKeys[0],
        openKeys,
      );

      // 检查是否选中了文件，如果是则给出提示
      const currentKey = selectedKeys[0];
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

      // 生成默认名称
      const defaultName = `新建文档${counters.file || 1}`;

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

        // 更新计数器
        setCounters(prev => ({
          ...prev,
          file: (prev.file || 0) + 1,
        }));

        // 刷新文件夹列表以显示新文档
        try {
          await fetchFolders();
          // 重新获取协同文档数据，因为用户文档数据发生了变化
          await fetchCollaborationData();
        } catch (fetchError) {
          console.warn('刷新文件夹列表失败:', fetchError);
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

        // 延迟一下再跳转，让用户看到文档创建的反馈
        setTimeout(() => {
          const documentId = response.data.documentId;
          if (documentId) {
            navigate(`/doc-editor/${documentId}`);
          } else {
            console.warn('创建文档成功但未返回documentId');
            message.warning('文档创建成功，请刷新页面查看');
          }
        }, 500);
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
      // 使用工具函数获取有效的目标文件夹
      const targetKey = folderUtils.getValidTargetKey(
        folderList,
        selectedKeys[0],
        openKeys,
      );

      // 检查是否选中了文件，如果是则给出提示
      const currentKey = selectedKeys[0];
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

      // 生成默认名称
      const defaultName = `新建文件夹${counters.folder}`;

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

        // 更新计数器
        setCounters(prev => ({ ...prev, folder: prev.folder + 1 }));

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
      } else {
        throw new Error(response.message || '重命名失败');
      }
    } catch (error) {
      console.error('重命名失败:', error);
      message.error(error.message || '重命名失败，请重试');
    }
  };

  // 处理重命名取消
  const handleRenameCancel = async key => {
    // 如果是新创建的项目且取消了重命名，则删除该项目
    const item = folderUtils.findNodeByKey(folderList, key);
    if (item?.isNew) {
      try {
        // 获取自增ID用于删除
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

        await fetchFolders();
        message.info('已取消创建');
      } catch (error) {
        console.error('删除文件夹失败:', error);
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

      // 调用后端API修改用户公开状态
      const response = await userAPI.changePublicStatus(userEmail);

      // 检查响应状态 - API成功返回时通常有success字段或者直接检查message
      const isSuccess = response.success === true || response.success !== false;

      if (isSuccess) {
        // 更新用户上下文中的权限状态
        updateUserPermission(permissionModal.permission);

        // 更新前端状态
        setFolderList(prev =>
          folderUtils.updateNodePermission(
            prev,
            permissionModal.key,
            permissionModal.permission,
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
          permissionModal.permission === 'public' ? '公开空间' : '私有空间';
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
        <div className={styles.menuLabelContainer}>
          <EllipsisLabel
            text={text}
            isEditing={editingKey === item.key}
            onSave={newName => handleRenameSave(item.key, newName)}
            onCancel={() => handleRenameCancel(item.key)}
          />
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
              onClick={e => {
                e.stopPropagation();
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
                // TODO: 处理历史版本记录的逻辑
                message.info('查看历史版本记录');
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
              const documentId = item.key.replace('doc_', '');
              if (documentId) {
                navigate(`/doc-editor/${documentId}`);
              }
            }
          }}
          style={
            isFile && !item.key.includes('collab_user_')
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

        // 为文件夹添加权限样式（移除点击选中功能，因为菜单高亮基于路由）
        if (item.key && (item.key.startsWith('sub') || item.key === 'root')) {
          // 为文件夹添加权限相关的CSS类名
          if (item.permission) {
            result.className = `${item.permission}-folder`;
          }
        }

        // 为协同文档的用户空间添加特殊样式（移除点击选中功能）
        if (item.key && item.key.startsWith('collab_user_')) {
          // 添加协同用户空间的CSS类名
          result.className = 'collaboration-user-space';
        }

        // 为协同文档下的文件夹添加特殊样式（移除点击选中功能）
        if (
          item.key &&
          item.key.includes('collab_user_') &&
          item.key.includes('folder')
        ) {
          result.className = 'collaboration-folder';
        }

        return result;
      })
      .filter(Boolean); // 过滤掉null值
  }

  return (
    <Layout.Sider width={280} className={styles.sider}>
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

      <Menu
        mode="inline"
        selectedKeys={selectedKeys}
        openKeys={openKeys}
        onSelect={handleMenuSelect}
        onOpenChange={handleMenuOpenChange}
        className={`${styles.menu} folder-menu-theme`}
        items={withMenuActions(validateMenuData(folderList))}
        selectable={true}
        multiple={false}
      />
    </Layout.Sider>
  );
};

export { FolderMenu, EllipsisLabel };
