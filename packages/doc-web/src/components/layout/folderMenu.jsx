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
import { useNavigate } from 'react-router-dom';
import styles from './folderMenu.module.less';
import folderUtils from '../../utils/folder';
// 导入 API
import { folderAPI } from '../../utils/api';
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

// Mock数据：模拟其他用户的公开文件夹
const mockCollaborationUsers = [
  {
    userId: 'user_001',
    username: '张三',
    avatar: '👨‍💻',
    folderData: {
      key: 'collab_user_001',
      icon: React.createElement(UserOutlined),
      label: <EllipsisLabel text="张三的公开空间" />,
      permission: 'public',
      owner: '张三',
      ownerId: 'user_001',
      children: [
        {
          key: 'collab_user_001_folder1',
          icon: React.createElement(FolderOpenOutlined),
          label: <EllipsisLabel text="前端开发资料" />,
          children: [
            {
              key: 'collab_user_001_doc1',
              label: <EllipsisLabel text="React 最佳实践" />,
            },
            {
              key: 'collab_user_001_doc2',
              label: <EllipsisLabel text="TypeScript 进阶指南" />,
            },
          ],
        },
        {
          key: 'collab_user_001_folder2',
          icon: React.createElement(FolderOpenOutlined),
          label: <EllipsisLabel text="项目文档" />,
          children: [
            {
              key: 'collab_user_001_doc3',
              label: <EllipsisLabel text="需求分析文档" />,
            },
          ],
        },
      ],
    },
  },
  {
    userId: 'user_002',
    username: '李四',
    avatar: '👩‍💼',
    folderData: {
      key: 'collab_user_002',
      icon: React.createElement(UserOutlined),
      label: <EllipsisLabel text="李四的公开空间" />,
      permission: 'public',
      owner: '李四',
      ownerId: 'user_002',
      children: [
        {
          key: 'collab_user_002_folder1',
          icon: React.createElement(FolderOpenOutlined),
          label: <EllipsisLabel text="设计规范" />,
          children: [
            {
              key: 'collab_user_002_doc1',
              label: <EllipsisLabel text="UI设计规范" />,
            },
            {
              key: 'collab_user_002_doc2',
              label: <EllipsisLabel text="交互设计指南" />,
            },
          ],
        },
      ],
    },
  },
  {
    userId: 'user_003',
    username: '王五',
    avatar: '🧑‍🔬',
    folderData: {
      key: 'collab_user_003',
      icon: React.createElement(UserOutlined),
      label: <EllipsisLabel text="王五的公开空间" />,
      permission: 'public',
      owner: '王五',
      ownerId: 'user_003',
      children: [
        {
          key: 'collab_user_003_folder1',
          icon: React.createElement(FolderOpenOutlined),
          label: <EllipsisLabel text="技术分享" />,
          children: [
            {
              key: 'collab_user_003_doc1',
              label: <EllipsisLabel text="微服务架构实践" />,
            },
            {
              key: 'collab_user_003_doc2',
              label: <EllipsisLabel text="数据库优化技巧" />,
            },
            {
              key: 'collab_user_003_doc3',
              label: <EllipsisLabel text="DevOps 最佳实践" />,
            },
          ],
        },
        {
          key: 'collab_user_003_folder2',
          icon: React.createElement(FolderOpenOutlined),
          label: <EllipsisLabel text="学习笔记" />,
          children: [
            {
              key: 'collab_user_003_doc4',
              label: <EllipsisLabel text="算法与数据结构" />,
            },
          ],
        },
      ],
    },
  },
];

/**
 * FolderMenu 组件
 *
 * 用于显示和管理文件夹和文件的侧边栏菜单组件。
 *
 * @returns {JSX.Element} 渲染的组件
 */
const FolderMenu = () => {
  const navigate = useNavigate();
  // 使用用户上下文获取用户信息
  const { userInfo } = useContext(UserContext);

  const [folderList, setFolderList] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState(['home']); // 默认选中首页
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
  });
  // 新增：加载状态
  const [loading, setLoading] = useState(false);

  // 获取文件夹列表
  const fetchFolders = useCallback(async () => {
    try {
      setLoading(true);
      // 使用用户上下文获取用户ID，支持多种格式
      let userId =
        userInfo?.userId ||
        userInfo?._id ||
        localStorage.getItem('userId') ||
        'current_user';

      // 如果从localStorage获取的是对象字符串，尝试解析
      if (typeof userId === 'string' && userId.startsWith('{')) {
        try {
          const userObj = JSON.parse(userId);
          userId = userObj.userId || userObj._id || userId;
        } catch {
          // 解析失败，继续使用原值
        }
      }

      console.log('📁 使用的用户ID:', userId);

      // 确保userId是number类型（后端期望number类型）
      const numericUserId =
        userId === 'current_user' ? 1 : parseInt(userId, 10);

      // 验证转换结果
      if (isNaN(numericUserId) || numericUserId <= 0) {
        throw new Error('无效的用户ID，请重新登录');
      }

      console.log('📁 转换后的用户ID:', numericUserId);

      const response = await folderAPI.getFolders({ userId: numericUserId });
      console.log('📁 从后端获取的文件夹数据:', response);

      // 转换后端数据为前端菜单格式
      const convertedFolders = convertBackendFoldersToMenuFormat(
        response.data || [],
      );

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
        {
          key: 'collaboration',
          icon: React.createElement(TeamOutlined),
          label: <EllipsisLabel text="协同文档" />,
          children: mockCollaborationUsers.map(user => user.folderData),
        },
      ];

      setFolderList([...baseMenuItems, ...convertedFolders]);
    } catch (error) {
      console.error('获取文件夹列表失败:', error);
      message.error('获取文件夹列表失败');

      // 失败时使用基础菜单项
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
          label: <EllipsisLabel text="协同文档" />,
          children: mockCollaborationUsers.map(user => user.folderData),
        },
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
  }, [userInfo]);

  // 将后端文件夹数据转换为前端菜单格式
  const convertBackendFoldersToMenuFormat = backendFolders => {
    console.log('转换后端文件夹数据:', backendFolders);

    // 递归转换后端文件夹数据为前端菜单格式
    const convertFolderToMenuItem = folder => {
      const menuItem = {
        key: folder.folderId,
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
          return nameA.localeCompare(nameB);
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

    // 创建"我的文件夹"根节点，包含所有后端文件夹数据
    const myFoldersRoot = {
      key: 'root',
      icon: React.createElement(FolderOpenOutlined),
      label: <EllipsisLabel text="我的文件夹" />,
      permission: 'private',
      children: sortedFolderTree, // 将所有文件夹作为子项
    };

    return [myFoldersRoot];
  };

  // 组件挂载时获取文件夹列表
  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  const handleMenuSelect = ({ selectedKeys }) => {
    setSelectedKeys(selectedKeys);

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
    // 处理文档点击导航 - 以doc开头的key表示文档（包括协同文档）
    else if (
      selectedKey &&
      (selectedKey.startsWith('doc') || selectedKey.includes('_doc'))
    ) {
      // 如果是协同文档，添加协同标识
      if (selectedKey.includes('collab_user_')) {
        navigate(`/doc-editor/${selectedKey}?collaborative=true`);
      } else {
        navigate(`/doc-editor/${selectedKey}`);
      }
    }
    // 处理文件夹点击 - 以sub开头的key表示文件夹，不需要导航，只是展开/折叠
    // 协同文档的用户空间和文件夹也不需要导航
    // 其他情况暂不处理导航
  };

  const handleMenuOpenChange = newOpenKeys => {
    setOpenKeys(newOpenKeys);

    // 重要修复：当文件夹展开/折叠时，也需要更新选中状态
    // 找到新增的展开项（用户点击的文件夹）
    const addedKeys = newOpenKeys.filter(key => !openKeys.includes(key));
    if (addedKeys.length > 0) {
      // 选择最后一个新增的展开项作为选中项
      const lastAddedKey = addedKeys[addedKeys.length - 1];
      setSelectedKeys([lastAddedKey]);
    }
  };

  // 新建文件功能（目前暂时只是占位，后续可以扩展）
  const handleAddFile = () => {
    message.info('新建文件功能开发中，请先创建文件夹');
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

      // 获取当前用户ID和用户名
      let userId =
        userInfo?.userId ||
        userInfo?._id ||
        localStorage.getItem('userId') ||
        'current_user';

      // 如果从localStorage获取的是对象字符串，尝试解析
      if (typeof userId === 'string' && userId.startsWith('{')) {
        try {
          const userObj = JSON.parse(userId);
          userId = userObj.userId || userObj._id || userId;
        } catch {
          // 解析失败，继续使用原值
        }
      }

      // 确保userId是number类型（后端期望number类型）
      const numericUserId =
        userId === 'current_user' ? 1 : parseInt(userId, 10);

      // 验证转换结果
      if (isNaN(numericUserId) || numericUserId <= 0) {
        throw new Error('无效的用户ID，请重新登录');
      }

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
        // 找到目标文件夹并构建父文件夹路径
        const targetFolder = folderUtils.findNodeByKey(folderList, targetKey);
        if (targetFolder && targetFolder.backendData) {
          // 如果目标文件夹存在，继承其路径并添加自身
          parentFolderIds = [
            ...(targetFolder.backendData.parentFolderIds || []),
            targetKey,
          ];
        } else {
          // 如果找不到详细信息，直接使用targetKey作为父级
          parentFolderIds = [targetKey];
        }
      }

      // 准备创建文件夹的数据
      const createFolderData = {
        folderName: defaultName,
        userId: numericUserId,
        create_username: username,
        parentFolderIds: parentFolderIds,
      };

      console.log('创建文件夹请求数据:', createFolderData);

      // 调用后端 API 创建文件夹
      const response = await folderAPI.createFolder(createFolderData);
      console.log('创建文件夹响应:', response);

      if (response.success) {
        message.success('新建文件夹成功');

        // 重新获取文件夹列表以显示最新数据
        await fetchFolders();

        // 更新计数器
        setCounters(prev => ({ ...prev, folder: prev.folder + 1 }));

        // 选中新建的文件夹
        setSelectedKeys([response.data.folderId]);

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

      // 调用更新 API
      const response = await folderAPI.updateFolder(key, {
        folderName: newName,
      });

      if (response.success) {
        // 重新获取文件夹列表
        await fetchFolders();
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
        await folderAPI.deleteFolder(key);
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
  const handlePermissionManage = (key, name, currentPermission) => {
    setPermissionModal({
      visible: true,
      key,
      name,
      permission: currentPermission,
    });
  };

  // 处理权限保存
  const handlePermissionSave = () => {
    if (permissionModal.key !== 'root') {
      message.error('只能修改工作空间的权限设置');
      return;
    }

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
    });

    const permissionText =
      permissionModal.permission === 'public' ? '公开空间' : '私有空间';
    message.success(`工作空间已设置为${permissionText}`);
  };

  // 处理权限弹窗取消
  const handlePermissionCancel = () => {
    setPermissionModal({
      visible: false,
      key: '',
      name: '',
      permission: 'private',
    });
  };

  // 处理删除确认
  const handleDeleteConfirm = async () => {
    const { key } = deleteModal;

    // 设置加载状态
    setDeleteModal(prev => ({ ...prev, loading: true }));

    try {
      // 调用后端删除接口
      const response = await folderAPI.deleteFolder(key);

      if (response.success) {
        // 显示删除统计信息
        const { deletedFoldersCount, deletedDocumentsCount } = response.data;
        message.success(
          `删除成功！共删除 ${deletedFoldersCount} 个文件夹，${deletedDocumentsCount} 个文档`,
        );

        // 如果删除的是当前选中的项，清空选中状态
        if (selectedKeys.includes(key)) {
          setSelectedKeys([]);
        }

        // 重新获取文件夹列表以确保数据同步
        await fetchFolders();
      } else {
        throw new Error(response.message || '删除失败');
      }
    } catch (error) {
      console.error('删除文件夹失败:', error);
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
            {/* 显示公开空间图标 */}
            <Tooltip title={`${item.owner}的公开空间 - 可协同编辑`}>
              <TeamOutlined
                style={{ color: '#52c41a', marginLeft: 4, fontSize: '12px' }}
              />
            </Tooltip>
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

    // Dropdown 菜单内容
    const dropdownMenu = (
      <AntdMenu>
        <AntdMenu.Item
          key="rename"
          onClick={e => {
            e.domEvent.stopPropagation();
            setEditingKey(item.key);
          }}
        >
          重命名
        </AntdMenu.Item>
        {/* 只有根文件夹才显示权限管理选项 */}
        {item.key === 'root' && (
          <AntdMenu.Item
            key="permission"
            onClick={e => {
              e.domEvent.stopPropagation();
              handlePermissionManage(
                item.key,
                text,
                item.permission || 'private',
              );
            }}
          >
            <Space>
              {item.permission === 'public' ? (
                <UnlockOutlined />
              ) : (
                <LockOutlined />
              )}
              空间权限管理
            </Space>
          </AntdMenu.Item>
        )}
        {/* 只有文件才显示历史版本记录选项 */}
        {isFile && (
          <AntdMenu.Item
            key="history"
            onClick={e => {
              e.domEvent.stopPropagation();
              // TODO: 处理历史版本记录的逻辑
              message.info('查看历史版本记录');
            }}
          >
            历史版本记录
          </AntdMenu.Item>
        )}
        <AntdMenu.Item
          key="delete"
          danger
          onClick={e => {
            e.domEvent.stopPropagation();
            setDeleteModal({
              visible: true,
              key: item.key,
              name: text,
              loading: false,
            });
          }}
        >
          删除
        </AntdMenu.Item>
      </AntdMenu>
    );

    return (
      <div className={styles.menuLabelContainer}>
        <div className={styles.labelContent}>
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
            overlay={dropdownMenu}
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
    return list.map(item => {
      const result = {
        ...item,
        label: getMenuLabel(item),
        children: item.children ? withMenuActions(item.children) : undefined,
      };

      // 为所有菜单项添加 data-key 属性，用于CSS选择器
      result['data-key'] = item.key;

      // 为文件夹添加点击选中功能和权限样式
      if (item.key && (item.key.startsWith('sub') || item.key === 'root')) {
        result.onTitleClick = ({ key }) => {
          setSelectedKeys([key]);
        };

        // 为文件夹添加权限相关的CSS类名
        if (item.permission) {
          result.className = `${item.permission}-folder`;
        }
      }

      // 为协同文档的用户空间添加特殊样式
      if (item.key && item.key.startsWith('collab_user_')) {
        result.onTitleClick = ({ key }) => {
          setSelectedKeys([key]);
        };

        // 添加协同用户空间的CSS类名
        result.className = 'collaboration-user-space';
      }

      // 为协同文档下的文件夹添加特殊样式
      if (
        item.key &&
        item.key.includes('collab_user_') &&
        item.key.includes('folder')
      ) {
        result.onTitleClick = ({ key }) => {
          setSelectedKeys([key]);
        };

        result.className = 'collaboration-folder';
      }

      return result;
    });
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
          确定要删除"{deleteModal.name}
          "吗？此操作不可恢复，且会递归删除其下所有子文件夹和文档。
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
        items={withMenuActions(folderList)}
        selectable={true}
        multiple={false}
        loading={loading}
      />
    </Layout.Sider>
  );
};

export { FolderMenu, EllipsisLabel };
