# Doc Server

NestJS 后端服务，提供文档协作系统的 API。

## 功能模块

### 用户模块 (User)
- 用户注册、登录
- 用户信息管理

### 文件夹模块 (Folder) 
- 文件夹的增删改查
- 文件夹树形结构管理
- 支持多级文件夹

### 文档模块 (Document)
- 文档的增删改查
- 文档ID自增长管理
- 协同编辑者管理
- 支持文档分类到文件夹
- 自动记录最近访问

### 最近访问模块 (RecentVisits)
- 记录用户最近访问的文档
- 支持分页查询

## 文档模块 API

### 基础接口

#### 创建文档
```
POST /document/create
Body: {
  userId: number,           // 拥有者ID (number类型)
  documentName: string,     // 文档名称  
  content?: string,         // 文档内容，可选
  create_username: string,  // 创建者用户名
  parentFolderIds?: number[] // 父文件夹ID数组，可选 (number数组)
}
```

#### 获取文档列表
```
GET /document/getDocumentsList
Query: {
  userId?: number,          // 用户ID (number类型)
  parentFolderId?: number,  // 父文件夹ID (number类型)
  search?: string,          // 搜索关键词
  page?: number,            // 页码
  pageSize?: number         // 每页大小
}
```

#### 获取单个文档（自动记录访问）
```
GET /document/getDocumentById/:id?userId=:userId
参数说明：
- id: 文档ID (number类型)
- userId: 访问用户ID (number类型，必需)

功能：
- 查询文档详情
- 自动记录/更新最近访问记录
```

#### 更新文档
```
PATCH /document/update/:id
Body: {
  documentName?: string,    // 文档名称
  content?: string,         // 文档内容
  update_username?: string, // 更新者用户名
  editorId?: number[],      // 协同编辑者ID数组 (number数组)
  parentFolderIds?: number[] // 父文件夹ID数组 (number数组)
}
```

#### 删除文档
```
DELETE /document/deleteDocumentById/:id
```

### 协同编辑接口

#### 添加协同编辑者
```
POST /document/:id/editors
Body: {
  userId: number  // 用户ID (number类型)
}
```

#### 移除协同编辑者
```
DELETE /document/:id/editors/:userId
参数说明：
- userId: 用户ID (number类型)
```

## 数据结构

### 文档表 (Document)
- `userId`: 拥有者的用户ID (number类型)
- `documentId`: 文档ID，从1开始自增，作为文档的唯一标识
- `documentName`: 文档名称
- `content`: 文档内容
- `create_username`: 创建者用户名
- `update_username`: 更新者用户名
- `create_time`: 创建时间
- `update_time`: 更新时间
- `editorId`: 正在协同编辑人的用户ID数组 (number数组)
- `parentFolderIds`: 父文件夹ID数组，支持多级文件夹路径 (number数组)

### 计数器表 (Counter)
- `name`: 计数器名称（如'documentId'）
- `value`: 当前计数值

### 最近访问表 (RecentVisit)
- `visitId`: 访问用户ID (string类型)
- `userId`: 文档拥有者ID (string类型)
- `documentId`: 文档ID (string类型)
- `documentName`: 文档名称
- `visitTime`: 访问时间

## 重要说明

### 数据类型统一
- 所有用户ID使用 `number` 类型
- 所有文件夹ID使用 `number` 类型
- 文档ID使用 `number` 类型，从1开始自增
- 保持与用户表的数据类型一致

### 自动访问记录
- 当用户访问文档详情时，系统会自动记录到最近访问表
- 如果用户已访问过该文档，则更新访问时间
- 如果是首次访问，则创建新的访问记录

## 运行方式

```bash
npm install
npm run start:dev
```


## 前提终端进入 doc-server 目录下

```
cd /packages/doc-server
```


## 模块开发流程

全局安装 @nestjs/cli

```
pnpm install -g @nestjs/cli
```

创建模块
比如创建user模块,
```
nest generate res user
```
然后选择 第一个 REST API 