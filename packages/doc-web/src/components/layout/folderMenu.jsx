import React, { useState, useRef, useEffect } from 'react';
import {
  FolderOpenOutlined,
  PlusSquareOutlined,
  FolderAddOutlined,
  MoreOutlined,
  HomeOutlined,
  ClockCircleOutlined,
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
} from 'antd';
import { useNavigate } from 'react-router-dom';
import { folderUtils } from '@/utils';
import styles from './folderMenu.module.less';

/**
 * EllipsisLabel 组件
 *
 * @param {Object} props - 组件属性
 * @param {string} props.text - 要显示的文本
 *
 * @returns {JSX.Element} 返回 Tooltip 组件包裹的文本元素，只有文字溢出时才显示tooltip
 */
const EllipsisLabel = ({ text }) => {
  const textRef = useRef(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

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
    children: [FolderOpenOutlined].map((icon, index) => {
      const key = String(index + 1);
      return {
        key: `sub${key}`,
        icon: React.createElement(icon),
        label: <EllipsisLabel text={`文件夹 ${key}`} />,
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
  const [isAddFolderModalOpen, setIsAddFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [modalType, setModalType] = useState('folder');
  // 新增：控制删除弹窗显示和目标key
  const [deleteModal, setDeleteModal] = useState({
    visible: false,
    key: '',
    name: '',
  });
  // 新增：控制重命名弹窗显示和目标key
  const [renameModal, setRenameModal] = useState({
    visible: false,
    key: '',
    oldName: '',
    newName: '',
  });
  // 新增：按钮悬停状态
  const [hoveredButton, setHoveredButton] = useState(null);

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
  };

  const handleAddFile = () => {
    setModalType('file');
    setIsAddFolderModalOpen(true);
  };

  const handleAddFolder = () => {
    setModalType('folder');
    setIsAddFolderModalOpen(true);
  };

  const handleModalOk = () => {
    if (!newFolderName.trim()) {
      message.error(
        modalType === 'folder' ? '文件夹名称不能为空' : '文件名称不能为空',
      );
      return;
    }

    // 工具函数：递归插入节点到指定key的children

    // 获取当前选中的文件夹
    const currentKey = selectedKeys[0];
    // 判断当前选中项是否为文件夹
    const isFolder = currentKey?.startsWith('sub');
    // 确定目标文件夹：
    // 1. 如果选中了文件夹，就在该文件夹下新建
    // 2. 如果选中了文件，就在其父文件夹下新建
    // 3. 如果没有选中任何项，就在根文件夹下新建
    const targetKey = isFolder
      ? currentKey
      : openKeys.length > 0
        ? openKeys[openKeys.length - 1]
        : 'root';

    if (modalType === 'folder') {
      // 新建文件夹节点
      const newFolderKey = `sub${Date.now()}`;
      const newFolder = {
        key: newFolderKey,
        icon: <FolderOpenOutlined />,
        label: <EllipsisLabel text={newFolderName} />,
        children: [],
      };
      setFolderList(prev =>
        folderUtils.insertToTarget(prev, targetKey, newFolder),
      );
      message.success('新建文件夹成功');
    } else {
      // 新建文件节点
      const newFileKey = `doc${Date.now()}`;
      const newFile = {
        key: newFileKey,
        label: <EllipsisLabel text={newFolderName} />,
      };
      setFolderList(prev =>
        folderUtils.insertToTarget(prev, targetKey, newFile),
      );
      message.success('新建文档成功');
    }
    setIsAddFolderModalOpen(false);
    setNewFolderName('');
  };

  const handleAddFolderCancel = () => {
    setIsAddFolderModalOpen(false);
    setNewFolderName('');
  };

  // 生成带更多操作按钮的菜单项label
  const getMenuLabel = item => {
    // 获取原始文本（用于重命名弹窗）
    const text = item.label?.props?.text || item.label;

    // 如果是根文件夹（key === 'root'）或首页（key === 'home'），则不显示操作按钮
    if (item.key === 'root' || item.key === 'home') {
      return <EllipsisLabel text={text} />;
    }

    // 判断是否为文件（以doc开头的key为文件）
    const isFile = item.key.startsWith('doc');

    // Dropdown 菜单内容
    const menu = (
      <AntdMenu>
        <AntdMenu.Item
          key="rename"
          onClick={e => {
            e.domEvent.stopPropagation();
            setRenameModal({
              visible: true,
              key: item.key,
              oldName: text,
              newName: text,
            });
          }}
        >
          重命名
        </AntdMenu.Item>
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
        <EllipsisLabel text={text} />
        <Dropdown overlay={menu} trigger={['click']} placement="bottomLeft">
          <Button
            type="text"
            icon={<MoreOutlined />}
            size="small"
            className={styles.moreButton}
            onClick={e => e.stopPropagation()}
          />
        </Dropdown>
      </div>
    );
  };
  // 递归为每个菜单项加上带操作按钮的label
  function withMenuActions(list) {
    return list.map(item => ({
      ...item,
      label: getMenuLabel(item),
      children: item.children ? withMenuActions(item.children) : undefined,
    }));
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
      <Modal
        title={modalType === 'folder' ? '新建文件夹' : '新建文档'}
        open={isAddFolderModalOpen}
        onOk={handleModalOk}
        onCancel={handleAddFolderCancel}
        okText="创建"
        cancelText="取消"
        destroyOnClose
      >
        <Input
          placeholder={
            modalType === 'folder' ? '请输入文件夹名称' : '请输入文档名称'
          }
          value={newFolderName}
          onChange={e => setNewFolderName(e.target.value)}
          onPressEnter={handleModalOk}
          maxLength={50}
          autoFocus
        />
      </Modal>
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
      {/* 重命名弹窗 */}
      <Modal
        title="重命名"
        open={renameModal.visible}
        onOk={() => {
          if (!renameModal.newName.trim()) {
            message.error('名称不能为空');
            return;
          }
          setFolderList(prev =>
            folderUtils.renameNodeByKey(
              prev,
              renameModal.key,
              renameModal.newName,
            ),
          );
          setRenameModal({ visible: false, key: '', oldName: '', newName: '' });
          message.success('重命名成功');
        }}
        onCancel={() =>
          setRenameModal({ visible: false, key: '', oldName: '', newName: '' })
        }
        okText="确定"
        cancelText="取消"
      >
        <Input
          value={renameModal.newName}
          onChange={e =>
            setRenameModal(modal => ({ ...modal, newName: e.target.value }))
          }
          onPressEnter={() => {
            if (!renameModal.newName.trim()) {
              message.error('名称不能为空');
              return;
            }
            setFolderList(prev =>
              folderUtils.renameNodeByKey(
                prev,
                renameModal.key,
                renameModal.newName,
              ),
            );
            setRenameModal({
              visible: false,
              key: '',
              oldName: '',
              newName: '',
            });
            message.success('重命名成功');
          }}
          maxLength={50}
          autoFocus
        />
      </Modal>
      <Menu
        mode="inline"
        selectedKeys={selectedKeys}
        openKeys={openKeys}
        onSelect={handleMenuSelect}
        onOpenChange={handleMenuOpenChange}
        className={`${styles.menu} folder-menu-theme`}
        items={withMenuActions(folderList)}
      />
    </Layout.Sider>
  );
};

export { FolderMenu, EllipsisLabel };
