import React from 'react';
import { FolderOpenOutlined } from '@ant-design/icons';
import { Breadcrumb, Layout, Menu, theme, Button } from 'antd';
import DocEditor from '../../DocEditor';
import 'quill/dist/quill.snow.css';
const { Header, Content, Sider } = Layout;
// TODO: mock数据来的
const EditorList = ['1', '2', '3'].map(key => ({
  key,
  label: `最近访问文档 ${key}`,
}));

// TODO: mock数据来的
const FolderList = [FolderOpenOutlined].map((icon, index) => {
  const key = String(index + 1);
  return {
    key: `sub${key}`,
    icon: React.createElement(icon),
    label: `文件夹 ${key}`,
    children: Array.from({ length: 4 }).map((_, j) => {
      const subKey = index * 4 + j + 1;
      return {
        key: subKey,
        label: `文档${subKey}`,
      };
    }),
  };
});
const LayoutComponent = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  return (
    <Layout style={{ height: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center' }}>
        <div className="demo-logo" />
        <Menu
          theme="dark"
          mode="horizontal"
          items={EditorList}
          style={{ flex: 1, minWidth: 0 }}
        />
      </Header>
      <Layout style={{ height: 'calc(100vh - 64px)' }}>
        <Sider width={200} style={{ background: colorBgContainer }}>
          <Menu
            mode="inline"
            defaultSelectedKeys={['1']}
            defaultOpenKeys={['sub1']}
            style={{ height: '100%', borderRight: 0 }}
            items={FolderList}
          />
        </Sider>
        <Layout style={{ padding: '0 24px 24px' }}>
          <Breadcrumb
            // TODO: 需要根据路由来设置
            items={[{ title: 'Home' }, { title: 'List' }, { title: 'App' }]}
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
                justifyContent: 'flex-end',
                padding: '0 16px',
                background: 'transparent',
              }}
            >
              <Button type="primary">保存</Button>
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
