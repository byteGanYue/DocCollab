import React, { useState, useRef, useEffect } from 'react';
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
import { folderUtils } from '@/utils';
import styles from './folderMenu.module.less';

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

// TODO: mock数据来的
const initialFolderList = [
  {
    key: 'home', // 首页菜单项
    icon: React.createElement(HomeOutlined),
    label: <EllipsisLabel text="首页" />,
    children: null, // 首页没有子项
  },
  {
    key: 'recent-docs', // 最近访问文档列表菜单项
    icon: React.createElement(ClockCircleOutlined),
    label: <EllipsisLabel text="最近访问文档列表" />,
    children: null, // 最近访问文档列表没有子项
  },
  {
    key: 'root', // 根文件夹的key固定为'root'
    icon: React.createElement(FolderOpenOutlined),
    label: <EllipsisLabel text="我的文件夹" />,
    permission: 'private', // 根文件夹默认私有
    children: [FolderOpenOutlined].map((icon, index) => {
      const key = String(index + 1);
      return {
        key: `sub${key}`,
        icon: React.createElement(icon),
        label: <EllipsisLabel text={`文件夹 ${key}`} />,
        permission: index === 0 ? 'public' : 'private', // 第一个文件夹公开，其他私有
        children: Array.from({ length: 4 }).map((_, j) => {
          const subKey = index * 4 + j + 1;
          return {
            key: `doc${subKey}`,
            label: <EllipsisLabel text={`文档${subKey}`} />,
          };
        }),
      };
    }),
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
  const [folderList, setFolderList] = useState(initialFolderList);
  const [selectedKeys, setSelectedKeys] = useState(['home']); // 默认选中首页
  const [openKeys, setOpenKeys] = useState(['root']);
  // 新增：控制编辑状态的key
  const [editingKey, setEditingKey] = useState(null);
  // 新增：控制删除弹窗显示和目标key
  const [deleteModal, setDeleteModal] = useState({
    visible: false,
    key: '',
    name: '',
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

  // 监听folderList变化
  useEffect(() => {
    console.log('📁 folderList 数据变化监听 📁');
    console.log('当前folderList状态:', folderList);

    // // 统计各类型节点数量
    // const stats = {
    //   totalFolders: 0,
    //   totalFiles: 0,
    //   publicFolders: 0,
    //   privateFolders: 0,
    // };

    // const countNodes = (nodes) => {
    //   nodes.forEach(node => {
    //     if (node.key.startsWith('sub') || node.key === 'root') {
    //       stats.totalFolders++;
    //       if (node.permission === 'public') {
    //         stats.publicFolders++;
    //       } else if (node.permission === 'private') {
    //         stats.privateFolders++;
    //       }
    //     } else if (node.key.startsWith('doc')) {
    //       stats.totalFiles++;
    //     }

    //     if (node.children && node.children.length > 0) {
    //       countNodes(node.children);
    //     }
    //   });
    // };

    // countNodes(folderList);

    console.log('========================================');
  }, [folderList]); // 监听folderList的变化

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
    // 处理文档点击导航 - 以doc开头的key表示文档
    else if (selectedKey && selectedKey.startsWith('doc')) {
      navigate(`/doc-editor/${selectedKey}`);
    }
    // 处理文件夹点击 - 以sub开头的key表示文件夹，不需要导航，只是展开/折叠
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

  // 修改：直接创建文件，只能在文件夹下创建
  const handleAddFile = () => {
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
        : '根目录';
      message.info(`文件将在文件夹"${parentName}"中创建`);
    }

    // 生成新文件的key和默认名称
    const newFileKey = `doc${Date.now()}`;
    const defaultName = `新建文档${counters.file}`;

    const newFile = {
      key: newFileKey,
      label: <EllipsisLabel text={defaultName} />,
      isNew: true, // 标记为新创建的项目
    };

    // 更新文件夹列表
    setFolderList(prev => folderUtils.insertToTarget(prev, targetKey, newFile));

    // 更新计数器
    setCounters(prev => ({ ...prev, file: prev.file + 1 }));

    // 进入编辑状态
    setEditingKey(newFileKey);

    // 选中新建的文件
    setSelectedKeys([newFileKey]);

    // 确保目标文件夹展开
    if (targetKey !== 'root' && !openKeys.includes(targetKey)) {
      setOpenKeys(prev => [...prev, targetKey]);
    }

    message.success('新建文档成功，请输入文档名称');
  };

  // 修改：直接创建文件夹，只能在文件夹下创建
  const handleAddFolder = () => {
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
        : '根目录';
      message.info(`文件夹将在文件夹"${parentName}"中创建`);
    }

    // 生成新文件夹的key和默认名称
    const newFolderKey = `sub${Date.now()}`;
    const defaultName = `新建文件夹${counters.folder}`;

    const newFolder = {
      key: newFolderKey,
      icon: <FolderOpenOutlined />,
      label: <EllipsisLabel text={defaultName} />,
      children: [],
      permission: 'private', // 新建文件夹默认为私有
      isNew: true, // 标记为新创建的项目
    };

    // 更新文件夹列表
    setFolderList(prev =>
      folderUtils.insertToTarget(prev, targetKey, newFolder),
    );

    // 更新计数器
    setCounters(prev => ({ ...prev, folder: prev.folder + 1 }));

    // 进入编辑状态
    setEditingKey(newFolderKey);

    // 选中新建的文件夹
    setSelectedKeys([newFolderKey]);

    // 确保目标文件夹展开
    if (targetKey !== 'root' && !openKeys.includes(targetKey)) {
      setOpenKeys(prev => [...prev, targetKey]);
    }

    message.success('新建文件夹成功，请输入文件夹名称');
  };

  // 处理重命名保存
  const handleRenameSave = (key, newName) => {
    setFolderList(prev => folderUtils.renameNodeByKey(prev, key, newName));
    setEditingKey(null);
    message.success('重命名成功');
  };

  // 处理重命名取消
  const handleRenameCancel = key => {
    // 如果是新创建的项目且取消了重命名，则删除该项目
    const item = folderUtils.findNodeByKey(folderList, key);
    if (item?.isNew) {
      setFolderList(prev => folderUtils.deleteNodeByKey(prev, key));
      message.info('已取消创建');
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
    message.success('权限设置已保存');
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

  // 获取权限图标
  const getPermissionIcon = permission => {
    return permission === 'public' ? (
      <Tooltip title="公开文件夹 - 支持协同编辑">
        <TeamOutlined style={{ color: '#52c41a', marginLeft: 4 }} />
      </Tooltip>
    ) : (
      <Tooltip title="私有文件夹 - 仅自己可编辑">
        <UserOutlined style={{ color: '#8c8c8c', marginLeft: 4 }} />
      </Tooltip>
    );
  };

  // 生成带更多操作按钮的菜单项label
  const getMenuLabel = item => {
    // 获取原始文本（用于重命名弹窗）
    const text = item.label?.props?.text || item.label;

    // 如果是根文件夹（key === 'root'）或首页（key === 'home'），则不显示操作按钮
    if (item.key === 'root' || item.key === 'home') {
      return (
        <div className={styles.menuLabelContainer}>
          <EllipsisLabel
            text={text}
            isEditing={editingKey === item.key}
            onSave={newName => handleRenameSave(item.key, newName)}
            onCancel={() => handleRenameCancel(item.key)}
          />
          {/* 根文件夹也显示权限图标 */}
          {item.key === 'root' &&
            item.permission &&
            getPermissionIcon(item.permission)}
        </div>
      );
    }

    // 判断是否为文件（以doc开头的key为文件）
    const isFile = item.key.startsWith('doc');
    // 判断是否为文件夹（以sub开头的key为文件夹）
    const isFolder = item.key.startsWith('sub');

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
        {/* 只有文件夹才显示权限管理选项 */}
        {isFolder && (
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
              权限管理
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
            setDeleteModal({ visible: true, key: item.key, name: text });
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
          {/* 文件夹显示权限图标 */}
          {isFolder && item.permission && getPermissionIcon(item.permission)}
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
        onOk={() => {
          setFolderList(prev =>
            folderUtils.deleteNodeByKey(prev, deleteModal.key),
          );
          setDeleteModal({ visible: false, key: '', name: '' });
          message.success('删除成功');
        }}
        onCancel={() => setDeleteModal({ visible: false, key: '', name: '' })}
        okText="删除"
        okButtonProps={{ danger: true }}
        cancelText="取消"
      >
        <span>
          确定要删除"{deleteModal.name}
          "吗？此操作不可恢复，且会删除其下所有内容。
        </span>
      </Modal>

      {/* 权限管理弹窗 */}
      <Modal
        title={`"${permissionModal.name}" 权限设置`}
        open={permissionModal.visible}
        onOk={handlePermissionSave}
        onCancel={handlePermissionCancel}
        okText="保存"
        cancelText="取消"
        width={480}
      >
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ marginBottom: 12 }}>选择文件夹权限：</h4>
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
                    <div style={{ fontWeight: 500 }}>私有</div>
                    <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                      只有您可以查看和编辑此文件夹中的内容
                    </div>
                  </div>
                </Space>
              </Radio>
              <Radio value="public">
                <Space>
                  <TeamOutlined style={{ color: '#52c41a' }} />
                  <div>
                    <div style={{ fontWeight: 500 }}>公开</div>
                    <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                      其他用户可以与您协同编辑此文件夹中的内容
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
              公开文件夹支持多人实时协同编辑，私有文件夹仅您可访问
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
      />
    </Layout.Sider>
  );
};

export { FolderMenu, EllipsisLabel };
