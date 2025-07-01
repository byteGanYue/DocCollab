# 编辑器数据持久化问题修复说明

## 问题描述

用户反映编辑器写完内容后刷新页面无法重新展示之前写的内容，这是一个数据持久化问题。

## 问题原因分析

### 1. 服务器端持久化缺失
- **问题**: `server.js` 中的数据库扩展被注释掉了
- **影响**: Yjs文档内容无法持久化到服务器端
- **结果**: 当WebSocket连接断开或页面刷新时，协同编辑的内容丢失

### 2. 缺少本地持久化机制
- **问题**: 没有使用IndexedDB进行本地数据持久化
- **影响**: 离线模式下无法保存和恢复编辑内容
- **结果**: 即使有网络连接，刷新页面也会丢失未同步的内容

## 解决方案

### 1. 启用服务器端持久化

**修改文件**: `packages/doc-editor/server.js`

**主要改动**:
- 启用了 `Database` 扩展
- 实现了基于文件系统的持久化存储
- 添加了详细的日志记录

**核心代码**:
```javascript
new Database({
  fetch: async ({ documentName }) => {
    // 从文件系统加载文档数据
    const filePath = path.join(dataDir, `${documentName}.yjs`);
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath);
    }
    return null;
  },
  store: async ({ documentName, state }) => {
    // 保存文档数据到文件系统
    const filePath = path.join(dataDir, `${documentName}.yjs`);
    fs.writeFileSync(filePath, state);
  },
})
```

### 2. 添加IndexedDB本地持久化

**修改文件**: `packages/doc-editor/src/hooks/useCollaborativeEditor.jsx`

**主要改动**:
- 添加了 `y-indexeddb` 依赖
- 实现了IndexedDB持久化Provider
- 优化了文档内容初始化逻辑

**核心功能**:
- **离线支持**: 即使服务器断开连接，内容也会保存在本地
- **自动恢复**: 页面刷新后自动从IndexedDB恢复内容
- **双重保障**: 服务器端和客户端双重持久化

### 3. 更新依赖

**修改文件**: `packages/doc-editor/package.json`

**添加依赖**:
```json
"y-indexeddb": "^9.0.12"
```

## 数据流程说明

### 修复前的问题流程
```
用户编辑 → Yjs内存 → WebSocket传输 → 服务器内存 → ❌ 数据丢失
                ↓
            页面刷新 → ❌ 内容丢失
```

### 修复后的完整流程
```
用户编辑 → Yjs内存 → IndexedDB本地存储 ✅
           ↓
       WebSocket传输 → 服务器 → 文件系统存储 ✅
           ↓
       页面刷新 → IndexedDB恢复 → 内容保持 ✅
```

## 使用说明

### 1. 安装依赖
```bash
cd packages/doc-editor
npm install
```

### 2. 启动服务器
```bash
node server.js
```

### 3. 验证修复
1. 在编辑器中输入内容
2. 刷新页面
3. 确认内容能够正常恢复

## 技术特性

### 1. 双重持久化保障
- **服务器端**: 基于文件系统的Yjs状态持久化
- **客户端**: 基于IndexedDB的本地持久化

### 2. 离线模式支持
- 即使服务器断开连接，编辑内容也会保存在本地
- 重新连接后自动同步到服务器

### 3. 智能内容恢复
- 优先使用外部传入的初始值
- 其次使用IndexedDB中的本地内容
- 最后使用默认初始值

### 4. 详细日志记录
- 服务器端和客户端都有详细的操作日志
- 便于调试和监控数据同步状态

## 注意事项

1. **数据目录**: 服务器会在 `./data` 目录下创建 `.yjs` 文件存储文档数据
2. **浏览器兼容性**: IndexedDB需要现代浏览器支持
3. **性能考虑**: 大文档的持久化可能需要一定时间
4. **数据安全**: 生产环境建议使用更安全的存储方案

## 后续优化建议

1. **数据库集成**: 将文件系统存储替换为数据库存储
2. **压缩优化**: 对存储的Yjs状态进行压缩
3. **增量同步**: 实现增量数据同步机制
4. **冲突处理**: 优化离线编辑后的冲突解决策略