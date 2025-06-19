import React from 'react';
import { Breadcrumb, Layout, Menu, Button, Space } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { FolderMenu } from './folderMenu';
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

  // 根据当前路由生成面包屑导航
  const getBreadcrumbItems = () => {
    const path = location.pathname;
    switch (path) {
      case '/home':
        return [{ title: '首页' }];
      case '/folder':
        return [{ title: '首页' }, { title: '文件夹管理' }];
      case '/doc-editor':
        return [{ title: '首页' }, { title: '文档编辑' }];
      default:
        return [{ title: '首页' }];
    }
  };

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

        {/* 右侧：主题切换器和静态用户信息 */}
        <div className={styles.headerRight}>
          <ThemeSwitcher />
          <Space className={styles.userInfo}>
            <span className={styles.userName}>静态用户</span>
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

            <div className={styles.actions}>
              <Button className={`${styles.actionButton} ${styles.default}`}>
                分享
              </Button>
              <Button className={`${styles.actionButton} ${styles.primary}`}>
                保存
              </Button>
            </div>
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
