import React, { useState } from 'react';
import { Breadcrumb, Layout, Menu, Button, Space } from 'antd';
import DocEditor from '@/pages/DocEditor';
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
  const [selectedMenuKey, setSelectedMenuKey] = useState(['1']); // 默认选中第一个

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
          {/* 编辑器功能区域 */}
          <div style={{ padding: 24 }}>
            <DocEditor />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default LayoutComponent;
