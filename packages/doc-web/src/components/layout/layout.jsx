import React from 'react';
import {
  Breadcrumb,
  Layout,
  Menu,
  Button,
  Space,
  Dropdown,
  Avatar,
} from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { FolderMenu } from './folderMenu';
import { useUser } from '@/hooks/useAuth';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import styles from './layout.module.less';
import 'quill/dist/quill.snow.css';

const { Header, Content, Sider } = Layout;
// TODO: mock数据来的
const EditorList = ['1', '2', '3'].map(key => ({
  key,
  label: `最近访问文档 ${key}`,
}));

const LayoutComponent = () => {
  const location = useLocation(); // 获取当前路由信息
  const navigate = useNavigate(); // 路由导航
  const { userInfo, logout } = useUser(); // 获取用户信息和登出方法

  // 根据当前路由生成面包屑导航
  const getBreadcrumbItems = () => {
    const path = location.pathname;
    switch (path) {
      case '/home':
        return [{ title: '首页' }];
      case '/recent-docs':
        return [{ title: '最近访问文档列表' }];
      case '/doc-editor':
        return [{ title: '文档编辑' }];
      default:
        return [{ title: '文档编辑' }];
    }
  };

  // 处理登出
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // 用户下拉菜单项
  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '登出',
      onClick: handleLogout,
    },
  ];

  return (
    <Layout className={styles.layout}>
      <Header className={styles.header}>
        {/* 左侧：Logo和菜单 */}
        <div className={styles.headerLeft}>
          <div
            className={styles.logo}
            onClick={() => navigate('/home')}
            style={{ cursor: 'pointer' }}
          >
            📝 DocCollab
          </div>
        </div>

        {/* 右侧：主题切换器和用户信息 */}
        <div className={styles.headerRight}>
          <ThemeSwitcher />
          <Space className={styles.userInfo}>
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              trigger={['click']}
            >
              <div className={styles.userDropdown}>
                <Avatar
                  size="small"
                  icon={<UserOutlined />}
                  className={styles.userAvatar}
                />
                <span className={styles.userName}>
                  {userInfo?.username || '用户'}
                </span>
              </div>
            </Dropdown>
          </Space>
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
            <Breadcrumb
              className={styles.breadcrumb}
              items={getBreadcrumbItems()}
            />
          </div>
          {/* 使用Outlet渲染子路由内容 */}
          <div className={styles.outletContainer}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default LayoutComponent;
