import React from 'react';
import { Layout, Space, Dropdown, Avatar, ConfigProvider } from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { Outlet, useNavigate } from 'react-router-dom';
import { FolderMenu } from './folderMenu';
import ContentHeader from './contentHeader';
import { useUser } from '@/hooks/useAuth';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import styles from './layout.module.less';
import 'quill/dist/quill.snow.css';

const { Header, Content, Sider } = Layout;

const LayoutComponent = () => {
  const navigate = useNavigate(); // 路由导航
  const { userInfo, logout } = useUser(); // 获取用户信息和登出方法

  // 自定义主题令牌，修复废弃警告
  const customThemeTokens = {
    components: {
      Layout: {
        bodyBg: '#f0f2f5',
        headerBg: '#fff',
        triggerBg: '#fff',
      },
    },
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
    <ConfigProvider theme={customThemeTokens}>
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
            <ContentHeader />
            {/* 使用Outlet渲染子路由内容 */}
            <div className={styles.outletContainer}>
              <Outlet />
            </div>
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
};

export default LayoutComponent;
