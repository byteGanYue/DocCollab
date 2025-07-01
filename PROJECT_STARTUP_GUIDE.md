# DocCollab 项目启动测试指南

## 🚀 快速启动步骤

### 1. 环境准备

#### 必需环境
- **Node.js**: 版本 >= 18.0.0
- **pnpm**: 版本 >= 8.0.0
- **MongoDB**: 版本 >= 5.0.0

#### 环境检查
```bash
# 检查 Node.js 版本
node --version

# 检查 pnpm 版本
pnpm --version

# 检查 MongoDB 状态
mongosh --eval "db.runCommand({connectionStatus: 1})"
```

### 2. 项目初始化

#### 克隆项目（如果还没有）
```bash
git clone <repository-url>
cd DocCollab
```

#### 安装依赖
```bash
# 安装所有包的依赖
pnpm install

# 验证安装
pnpm list --depth=0
```

### 3. 数据库配置

#### 启动 MongoDB
```bash
# Windows (如果使用 MongoDB 服务)
net start MongoDB

# 或者直接启动 mongod
mongod --dbpath="C:\data\db"
```

#### 创建数据库和集合
```bash
# 连接到 MongoDB
mongosh

# 创建数据库
use doccollab

# 创建基础集合
db.createCollection("documents")
db.createCollection("users")
db.createCollection("folders")

# 退出
exit
```

### 4. 环境变量配置

#### 服务端环境变量
在 `packages/doc-server/` 目录下创建 `.env` 文件：
```bash
# packages/doc-server/.env
MONGODB_URI=mongodb://localhost:27017/doccollab
PORT=3000
JWT_SECRET=your-jwt-secret-key
NODE_ENV=development
```

#### 前端环境变量
在 `packages/doc-web/` 目录下创建 `.env` 文件：
```bash
# packages/doc-web/.env
VITE_API_BASE_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:1234
```

### 5. 启动服务

#### 方式一：分别启动各个服务

**启动后端服务**
```bash
# 在项目根目录
cd packages/doc-server
pnpm start:dev

# 或者使用根目录命令
pnpm --filter doc-server start:dev
```

**启动协同编辑服务器**
```bash
# 在新的终端窗口
cd packages/doc-editor
pnpm start

# 或者使用根目录命令
pnpm --filter doc-editor start
```

**启动前端服务**
```bash
# 在新的终端窗口
cd packages/doc-web
pnpm dev

# 或者使用根目录命令
pnpm dev:doc-web
```

#### 方式二：使用 Turbo 并行启动
```bash
# 启动所有开发服务
pnpm start:all

# 或者只启动前端
pnpm dev:doc-web
```

### 6. 验证服务状态

#### 检查服务端口
```bash
# 检查端口占用情况
netstat -ano | findstr :3000  # 后端 API 服务
netstat -ano | findstr :1234  # 协同编辑服务
netstat -ano | findstr :5173  # 前端开发服务
```

#### 访问服务
- **前端应用**: http://localhost:5173
- **后端 API**: http://localhost:3000
- **API 文档**: http://localhost:3000/api/docs
- **协同编辑服务**: ws://localhost:1234

### 7. 功能测试

#### 基础功能测试
1. **用户注册/登录**
   - 访问前端应用
   - 测试用户注册功能
   - 测试用户登录功能

2. **文档管理**
   - 创建新文档
   - 编辑文档内容
   - 保存文档
   - 删除文档

3. **协同编辑测试**
   - 在多个浏览器标签页中打开同一文档
   - 同时编辑，观察实时同步效果
   - 测试离线编辑和重新连接

#### MongoDB 数据同步测试
1. **实时同步测试**
   ```bash
   # 在 MongoDB 中查看文档数据
   mongosh
   use doccollab
   db.documents.find().pretty()
   
   # 观察 yjsState 字段的变化
   db.documents.find({}, {yjsState: 1, lastYjsSyncTime: 1}).pretty()
   ```

2. **离线恢复测试**
   - 断开网络连接
   - 继续编辑文档
   - 重新连接网络
   - 验证数据是否正确同步

### 8. 常见问题排查

#### 端口冲突
```bash
# 查找占用端口的进程
netstat -ano | findstr :3000

# 终止进程（替换 PID）
taskkill /PID <PID> /F
```

#### MongoDB 连接问题
```bash
# 检查 MongoDB 服务状态
sc query MongoDB

# 重启 MongoDB 服务
net stop MongoDB
net start MongoDB
```

#### 依赖安装问题
```bash
# 清理缓存和重新安装
pnpm clean
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

#### 协同编辑连接问题
```bash
# 检查 WebSocket 连接
# 在浏览器控制台中执行
const ws = new WebSocket('ws://localhost:1234');
ws.onopen = () => console.log('WebSocket 连接成功');
ws.onerror = (error) => console.error('WebSocket 连接失败:', error);
```

### 9. 开发调试

#### 启用调试模式
```bash
# 后端调试模式
cd packages/doc-server
pnpm start:debug

# 前端开发模式（默认已启用热重载）
cd packages/doc-web
pnpm dev
```

#### 查看日志
```bash
# 后端日志
tail -f packages/doc-server/logs/app.log

# MongoDB 日志
tail -f /var/log/mongodb/mongod.log  # Linux/Mac
# Windows: 查看事件查看器中的 MongoDB 日志
```

#### 性能监控
```javascript
// 在浏览器控制台中监控同步性能
yjsMongoSyncService.getSyncStats();

// 监听同步事件
yjsMongoSyncService.on('syncCompleted', (data) => {
  console.log('同步完成:', data);
});
```

### 10. 生产环境部署

#### 构建项目
```bash
# 构建所有包
pnpm build:all

# 单独构建
pnpm --filter doc-web build
pnpm --filter doc-server build
```

#### 生产环境启动
```bash
# 后端生产模式
cd packages/doc-server
pnpm start:prod

# 前端生产预览
cd packages/doc-web
pnpm preview
```

## 🔧 高级配置

### MongoDB 索引优化
```javascript
// 在 MongoDB 中创建性能索引
use doccollab

// 文档查询索引
db.documents.createIndex({ "documentId": 1, "userId": 1 });
db.documents.createIndex({ "lastYjsSyncTime": -1 });
db.documents.createIndex({ "lastSyncSource": 1 });

// 用户相关索引
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "username": 1 }, { unique: true });

// 文件夹索引
db.folders.createIndex({ "userId": 1, "parentFolderId": 1 });
```

### 协同编辑优化
```javascript
// 在 useCollaborativeEditor.jsx 中调整配置
const syncService = new YjsMongoSyncService({
  syncDelay: 500,        // 减少同步延迟
  maxRetries: 5,         // 增加重试次数
  batchSize: 20,         // 增加批量处理大小
  debug: true            // 启用调试模式
});
```

## 📊 监控和维护

### 系统监控
```bash
# 监控系统资源
top -p $(pgrep -f "node.*doc-server")
top -p $(pgrep -f "node.*doc-editor")

# 监控 MongoDB 性能
mongosh --eval "db.runCommand({serverStatus: 1})"
```

### 数据备份
```bash
# MongoDB 数据备份
mongodump --db doccollab --out ./backup/$(date +%Y%m%d)

# 恢复数据
mongorestore --db doccollab ./backup/20240101/doccollab
```

通过以上步骤，您应该能够成功启动和测试 DocCollab 项目的所有功能。如果遇到问题，请参考常见问题排查部分或查看项目日志获取更多信息。