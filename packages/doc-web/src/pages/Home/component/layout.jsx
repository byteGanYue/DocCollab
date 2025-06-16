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
  theme,
  Button,
  Avatar,
  Dropdown,
  Space,
  message,
} from 'antd';
import { useNavigate } from 'react-router-dom';
import DocEditor from '../../DocEditor';
import FolderMenu from './folderMenu';
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
  const navigate = useNavigate();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

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
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontSize: '16px',
          color: '#666',
        }}
      >
        正在加载...
      </div>
    );
  }

  // 如果没有用户信息，显示错误状态
  if (!user) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontSize: '16px',
          color: '#666',
        }}
      >
        用户信息加载失败，请重新登录
      </div>
    );
  }
  return (
    <Layout style={{ height: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
        }}
      >
        {/* 左侧：Logo和菜单 */}
        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <div
            style={{
              color: 'white',
              fontSize: '20px',
              fontWeight: 'bold',
              marginRight: '32px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            📝 DocCollab
          </div>
          <Menu
            theme="dark"
            mode="horizontal"
            items={EditorList}
            style={{ flex: 1, minWidth: 0 }}
          />
        </div>

        {/* 右侧：用户信息 */}
        <div style={{ marginLeft: '16px' }}>
          <Dropdown
            menu={{ items: userMenuItems }}
            placement="bottomRight"
            trigger={['click']}
          >
            <Space
              style={{
                cursor: 'pointer',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '6px',
                transition: 'background-color 0.3s',
                alignItems: 'center',
              }}
              className="user-info-trigger"
            >
              <Avatar src={user.avatar} icon={<UserOutlined />} size="small" />
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  marginLeft: '8px',
                }}
              >
                {user.username}
              </span>
            </Space>
          </Dropdown>
        </div>
      </Header>
      <Layout style={{ height: 'calc(100vh - 64px)' }}>
        <FolderMenu />
        <Layout style={{ padding: '0 24px 24px', marginLeft: '200px' }}>
          <Breadcrumb
            items={[
              { title: '首页' },
              { title: '我的文档' },
              { title: `欢迎，${user.username}` },
            ]}
            style={{ margin: '16px 0' }}
          />
          <Content
            style={{
              padding: 24,
              margin: 0,
              height: 'calc(100vh - 64px - 24px - 16px - 24px)',
              display: 'flex',
              flexDirection: 'column',
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
              overflow: 'hidden',
            }}
          >
            <Header
              style={{
                display: 'flex',
                height: '50px',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 16px',
                background: 'transparent',
                borderBottom: '1px solid #f0f0f0',
              }}
            >
              {/* 左侧：用户状态信息 */}
              <div
                className="user-status-info"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '14px',
                  color: '#666',
                  padding: '4px 8px',
                  borderRadius: '4px',
                }}
              >
                <span style={{ fontWeight: '500', color: '#1890ff' }}>
                  欢迎回来，{user.username}！
                </span>
                <span style={{ margin: '0 12px', color: '#d9d9d9' }}>•</span>
                {/* <span>
                  登录方式：
                  <span style={{ fontWeight: '500' }}>
                    {user.provider === 'email' ? '邮箱登录' : user.provider.toUpperCase()}
                  </span>
                </span> */}
                {user.loginTime && (
                  <>
                    <span style={{ margin: '0 12px', color: '#d9d9d9' }}>
                      •
                    </span>
                    <span>
                      登录时间：
                      <span style={{ fontWeight: '500' }}>
                        {new Date(user.loginTime).toLocaleString('zh-CN', {
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </span>
                  </>
                )}
              </div>

              {/* 右侧：操作按钮 */}
              <Space>
                <Button type="primary">保存</Button>
              </Space>
            </Header>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <DocEditor />
            </div>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};
export default LayoutComponent;
