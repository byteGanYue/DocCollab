// 实时协同编辑服务器示例
// 基于Hocuspocus实现的WebSocket服务器

// 安装依赖: npm install @hocuspocus/server

import { Server } from '@hocuspocus/server';
import { Database } from '@hocuspocus/extension-database';

// 创建Hocuspocus服务器实例
const server = new Server({
  port: 1234,
  address: '0.0.0.0', // 允许从任何IP访问
  extensions: [
    // 可选：添加数据库扩展用于持久化文档数据
    // new Database({
    //   type: 'sqlite',
    //   database: 'hocuspocus.sqlite',
    // }),
  ],
  async onAuthenticate(data) {
    // 这里可以实现身份验证逻辑
    const { token } = data;

    // 示例: 简单的身份验证检查 (正式环境需要更完善的验证)
    // if (token !== 'valid-token') {
    //   throw new Error('Invalid token')
    // }

    // 返回用户信息，这将被附加到awareness状态
    return {
      name: 'Guest User',
      color: '#' + Math.floor(Math.random() * 16777215).toString(16),
    };
  },
  async onLoadDocument(data) {
    // 当文档加载时调用
    console.log(`文档 "${data.documentName}" 被加载`);

    // 如果是新文档，可以返回初始内容
    // 返回null则由客户端决定初始内容
    return null;
  },
  async onChange(data) {
    // 当文档变更时调用
    console.log(
      `文档 "${data.documentName}" 被修改，${data.update.clientID} 客户端`,
    );
  },
});

// 启动服务器
server.listen();
console.log('实时协同编辑服务器运行在端口 1234');
