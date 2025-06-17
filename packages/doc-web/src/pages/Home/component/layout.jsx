import React, { useState, useEffect } from 'react';
import {
  FolderOpenOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import {
  Breadcrumb,
  Layout,
  Menu,
  Button,
  Avatar,
  Dropdown,
  Space,
  message,
} from 'antd';
import { useNavigate } from 'react-router-dom';
import DocEditor from '../../DocEditor';
import FolderMenu from './folderMenu';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import styles from './layout.module.less';
import 'quill/dist/quill.snow.css';

// 添加样式到head
const addStyles = () => {
  const styleId = 'user-header-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .user-info-trigger:hover {
        background-color: rgba(255, 255, 255, 0.1) !important;
      }
      
      .user-status-info {
        transition: all 0.3s ease;
      }
      
      .user-status-info:hover {
        color: #333 !important;
      }
      
      /* 顶部导航栏菜单选中项样式 - 使用更强的选择器 */
      .header-menu.ant-menu-dark .ant-menu-item-selected,
      .header-menu.ant-menu-dark .ant-menu-item-selected:hover {
        color: white !important;
        border-bottom-color: white !important;
        background-color: transparent !important;
      }
      
      .header-menu.ant-menu-dark .ant-menu-item:hover {
        color: white !important;
        border-bottom-color: rgba(255, 255, 255, 0.3) !important;
        background-color: transparent !important;
      }
      
      /* 确保选中项的文字内容也是白色 */
      .header-menu.ant-menu-dark .ant-menu-item-selected .ant-menu-title-content {
        color: white !important;
      }
      
      .header-menu.ant-menu-dark .ant-menu-item:hover .ant-menu-title-content {
        color: white !important;
      }
    `;
    document.head.appendChild(style);
  }
};
const { Header, Content, Sider } = Layout;
// TODO: mock数据来的
const EditorList = ['1', '2', '3'].map(key => ({
  key,
  label: `最近访问文档 ${key}`,
}));

const LayoutComponent = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMenuKey, setSelectedMenuKey] = useState(['1']); // 默认选中第一个
  const navigate = useNavigate();

  // 获取用户信息并初始化样式
  useEffect(() => {
    // 添加样式
    addStyles();

    // 获取用户信息（此时已经通过路由守卫确保用户已登录）
    const userInfo = localStorage.getItem('user');

    if (userInfo) {
      try {
        const parsedUser = JSON.parse(userInfo);
        setUser(parsedUser);
      } catch {
        console.error('解析用户信息失败');
        // 如果解析失败，跳转到登录页
        navigate('/login');
      }
    }

    setLoading(false);
  }, [navigate]);

  // 处理用户登出
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    message.success('已成功登出');
    navigate('/login');
  };

  // 用户头像下拉菜单配置
  const userMenuItems = [
    // {
    //   key: 'profile',
    //   icon: <UserOutlined />,
    //   label: '个人资料',
    //   onClick: () => message.info('个人资料功能开发中...')
    // },
    // {
    //   key: 'settings',
    //   icon: <SettingOutlined />,
    //   label: '设置',
    //   onClick: () => message.info('设置功能开发中...')
    // },
    // {
    //   type: 'divider',
    // },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  // 加载状态
  if (loading) {
    return <div className={styles.loadingContainer}>正在加载...</div>;
  }

  // 如果没有用户信息，显示错误状态
  if (!user) {
    return (
      <div className={styles.errorContainer}>用户信息加载失败，请重新登录</div>
    );
  }
  return (
    <Layout className={styles.layout}>
      <Header className={styles.header}>
        {/* 左侧：Logo和菜单 */}
        <div className={styles.headerLeft}>
          <div className={styles.logo}>📝 DocCollab</div>
          <Menu
            theme="dark"
            mode="horizontal"
            items={EditorList}
            className={`${styles.menu} header-menu`}
            selectedKeys={selectedMenuKey}
            onSelect={key => setSelectedMenuKey(key.keyPath)}
          />
        </div>

        {/* 右侧：主题切换器和用户信息 */}
        <div className={styles.headerRight}>
          <ThemeSwitcher />
          <Dropdown
            menu={{ items: userMenuItems }}
            placement="bottomRight"
            trigger={['click']}
          >
            <Space className={styles.userInfo}>
              <Avatar className={styles.avatar} icon={<UserOutlined />} />
              <span className={styles.userName}>
                {user.username || user.email}
              </span>
            </Space>
          </Dropdown>
        </div>
      </Header>
      <Layout>
        <Sider width={280} className={styles.sider}>
          <div className={styles.siderContent}>
            <FolderMenu />
          </div>
        </Sider>
        <Content className={styles.content}>
          <div className={styles.contentHeader}>
            <Breadcrumb className={styles.breadcrumb}>
              <Breadcrumb.Item>首页</Breadcrumb.Item>
              <Breadcrumb.Item>文档编辑</Breadcrumb.Item>
            </Breadcrumb>

            <div className={styles.actions}>
              <Button className={`${styles.actionButton} ${styles.default}`}>
                分享
              </Button>
              <Button className={`${styles.actionButton} ${styles.primary}`}>
                保存
              </Button>
            </div>
          </div>
          <div className={styles.contentBody}>
            <DocEditor />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};
export default LayoutComponent;
