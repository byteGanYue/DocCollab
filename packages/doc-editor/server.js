// 实时协同编辑服务器示例
// 基于Hocuspocus实现的WebSocket服务器

// 安装依赖: npm install @hocuspocus/server

import { Server } from '@hocuspocus/server';
import { Database } from '@hocuspocus/extension-database';
import fs from 'fs';
import path from 'path';
import express from 'express';

// 跟踪文档访问统计
const documentStats = new Map();

// 确保数据目录存在
const dataDir = './data';
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 创建Hocuspocus服务器实例
const server = new Server({
  port: 1234,
  address: '0.0.0.0', // 允许从任何IP访问
  extensions: [
    // 启用数据库扩展用于持久化文档数据
    new Database({
      fetch: async ({ documentName }) => {
        try {
          const filePath = path.join(dataDir, `${documentName}.yjs`);
          if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath);
            console.log(`[数据库] 从文件加载文档: ${documentName}`);
            return data;
          }
          console.log(`[数据库] 文档不存在，创建新文档: ${documentName}`);
          return null;
        } catch (error) {
          console.error(`[数据库] 加载文档失败: ${documentName}`, error);
          return null;
        }
      },
      store: async ({ documentName, state }) => {
        try {
          const filePath = path.join(dataDir, `${documentName}.yjs`);
          fs.writeFileSync(filePath, state);
          console.log(`[数据库] 文档已保存: ${documentName}`);
        } catch (error) {
          console.error(`[数据库] 保存文档失败: ${documentName}`, error);
        }
      },
    }),
  ],
  async onAuthenticate(data) {
    // 这里可以实现身份验证逻辑
    const { token } = data;

    // 记录连接请求和房间信息
    console.log(
      `[认证] 连接到房间: "${data.documentName}"，客户端ID: ${data.socketId}`,
    );

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
    console.log(
      `[加载] 文档 "${data.documentName}" 被加载，客户端: ${data.clientsCount}`,
    );

    // 更新文档访问统计
    if (!documentStats.has(data.documentName)) {
      documentStats.set(data.documentName, {
        loads: 0,
        updates: 0,
        clients: new Set(),
      });
    }
    const stats = documentStats.get(data.documentName);
    stats.loads += 1;

    // 打印当前所有活跃文档
    console.log('[状态] 当前活跃文档:', Array.from(documentStats.keys()));

    // 如果是新文档，可以返回初始内容
    // 返回null则由客户端决定初始内容
    return null;
  },
  async onChange(data) {
    // 当文档变更时调用
    console.log(
      `[更新] 文档 "${data.documentName}" 被修改，客户端ID: ${data.update.clientID}`,
    );

    // 更新文档修改统计
    if (documentStats.has(data.documentName)) {
      const stats = documentStats.get(data.documentName);
      stats.updates += 1;
      stats.clients.add(data.update.clientID);

      // 每10次更新打印一次文档统计信息
      if (stats.updates % 10 === 0) {
        console.log(
          `[统计] 文档 "${data.documentName}" 累计加载 ${stats.loads} 次，更新 ${stats.updates} 次，累计客户端 ${stats.clients.size} 个`,
        );
      }
    }
  },

  // 监听连接关闭事件
  async onDisconnect(data) {
    console.log(
      `[断开] 客户端断开连接，房间: "${data.documentName}"，剩余客户端: ${data.clientsCount}`,
    );

    // 如果房间没有客户端了，打印房间清理信息
    if (data.clientsCount === 0) {
      console.log(`[清理] 房间 "${data.documentName}" 已无客户端连接`);
    }
  },
});

// 新增：暴露HTTP接口用于删除本地yjs文件
const app = express();
app.delete('/internal/yjs-file/:documentId', (req, res) => {
  const { documentId } = req.params;
  const filePath = path.join(dataDir, `${documentId}.yjs`);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    res.status(200).send('deleted');
    console.log(`[API] 已删除本地yjs文件: ${filePath}`);
  } else {
    res.status(404).send('not found');
  }
});

// 保证Hocuspocus Server和Express都能监听
const PORT = 1234;
server.listen();
app.listen(PORT + 1, () => {
  console.log(
    `Express API for yjs file ops running at http://localhost:${PORT + 1}`,
  );
});

console.log('实时协同编辑服务器运行在端口 1234');
console.log('提示: 服务器已支持文档隔离，每个文档ID将创建独立的房间');
