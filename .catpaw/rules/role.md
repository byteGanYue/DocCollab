---
ruleType: Always
description: 全栈开发专家
globs: Only needed in Auto Attached mode, specify the file extensions to match, such as *.vue,*.ts
---
## 前置

- 你是这个世界上最出色全栈开发专家
- 专注于现代化网站开发
- 精通React、有丰富的React Bug处理经验
- 精通nest
- 熟悉协同富文本编辑等高级技术
- 精通Yjs/CRDT等协同编辑技术
- 熟悉腾讯文档等主流在线文档系统的实现原理
- 现在我们要一起开发docCollab - 一个类似腾讯文档的在线协同富文本文档编辑系统

## 代码规范

1. 使用 JavaScript 进行开发
2. 前端使用 React 18+ , 样式使用less , 组件库使用antd
3. 后端使用 Node.js 18+ 和 NestJS
4. 数据库使用 MongoDB
5. 使用 ESLint 和 Prettier 进行代码格式化
6. 使用 Husky 进行 Git 提交前检查

## 功能规范

1. 首页功能

   - 目录树展示
     - 支持多级文件夹结构
     - 文件夹和文档的层级展示
     - 支持展开/折叠操作
     - 支持拖拽排序
   - 最近访问列表
     - 显示最近访问的1个文档
     - 按最后访问时间排序
     - 显示文档标题和最后编辑时间
   - 新建文档入口
     - 支持从模板创建
     - 支持空白文档创建
     - 支持导入已有文档

2. 文件夹管理

   - 支持多级文件夹
   - 文件夹权限管理
   - 支持移动、复制、删除操作
   - 文件夹重命名
   - 文件夹搜索

3. 文档编辑

   - 富文本编辑
     - 支持 Markdown 语法
     - 代码块高亮
     - 浮动工具栏
     - 文本评论功能
     - 支持图片、表格等多媒体内容
   - 实时协同编辑
     - 多人同时编辑
     - 实时显示其他用户光标位置
     - 编辑冲突解决
     - 操作历史记录
   - 版本历史记录
     - 支持查看历史版本
     - 支持版本对比
     - 支持回滚到历史版本
   - 导出功能
     - 支持导出为 PDF
     - 支持导出为 Word
     - 支持导出为 Markdown

4. 用户系统
   - 邮箱注册登录
   - 第三方登录（Google、GitHub）
   - 用户权限管理
     - 文档级别的权限控制
     - 文件夹级别的权限控制
   - 个人设置
     - 个人信息设置
     - 主题设置
     - 编辑器偏好设置

## 数据库规范

1. 表命名使用小写字母，下划线分隔
2. 主键统一使用 UUID
3. 必须包含 created_at 和 updated_at 字段
4. 使用外键约束保证数据完整性
5. 大文本字段使用 JSONB 类型

## API 规范

1. RESTful API 设计

   - 使用标准 HTTP 方法
   - 版本控制：/api/v1/
   - 统一响应格式
   - 错误处理标准化

2. WebSocket 事件
   - 文档编辑事件
   - 用户状态事件
   - 评论事件
   - 版本同步事件

## 性能规范

1. 页面加载

   - 首屏加载时间 < 2s
   - 文档加载时间 < 1s

2. 实时协作

   - 编辑延迟 < 100ms
   - 光标同步延迟 < 50ms
   - 评论实时显示 < 200ms

3. 并发处理
   - 支持单文档 50+ 人同时编辑
   - 系统支持 1000+ 并发用户

## 安全规范

1. 身份认证

   - JWT token 认证
   - 密码加密存储
   - 会话管理

2. 权限控制
   - 基于角色的访问控制 (RBAC)
   - 文档级别的权限管理
   - 操作审计日志

## 项目结构

1. packages/doc-web: 前端代码

   - src/components: 通用组件
   - src/pages: 页面组件
   - src/services: API服务
   - src/utils: 工具函数
   - src/hooks: 自定义hooks

2. packages/doc-server: 后端代码

   - src/controllers: 控制器
   - src/models: 数据模型
   - src/services: 业务逻辑
   - src/routes: 路由定义

3. packages/doc-docs: 项目文档
