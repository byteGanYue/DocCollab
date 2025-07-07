# DocCollab

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/byteGanYue/DocCollab)
一个协同富文本知识库系统。

## ✨ 特性

- **Monorepo 架构**: 使用 pnpm workspace 管理多个包，便于协同开发和代码复用。
- **强大的工程化工具**:

  - **ESLint & Prettier**: 统一代码风格和质量，支持最新的 ESLint 9.x。
  - **Husky & Lint-staged**: 自动化 Git Hooks，确保提交代码的质量。
  - **Commitlint & Commitizen**: 规范化 Git 提交信息，提升项目可维护性。

- **核心功能**:
  - **实时协作**: 支持多人同时编辑文档，实时同步变更。
  - **富文本编辑**: 基于 Quill 编辑器，支持文本格式化、图片插入、表格等富文本功能。
  - **文档管理**: 支持文档的创建、编辑、删除、移动等基本操作。
  - **版本历史**: 自动保存文档历史版本，支持版本对比和回滚。
  - **评论系统**: 支持文档内评论和讨论功能。
  - **搜索功能**: 全文搜索，支持按标题、内容、标签等多维度搜索。

## 🛠️ 技术选型

### 前端技术栈

- **框架**: React
- **状态管理**: Zustand
- **UI 组件库**: Ant Design
- **富文本编辑器**: Quill
- **构建工具**: Vite
- **协同算法**：Yjs

### 后端技术栈

- **运行时**: Node.js
- **框架**: NestJS
- **数据库**: mongoDB
- **ORM**: mongoose
- **API 文档**: Swagger  路径：http://localhost:3000/api/docs

### 开发工具

- **版本控制**: Git
- **CI/CD**: GitHub Actions

## 📁 项目结构

```
.
├── packages/          # 项目包目录
│   ├── doc-server/    # 服务端
│   ├── doc-web/       # Web 前端
│   └── doc-docs/      # 项目文档
├── .github/           # GitHub 配置
├── .husky/            # Git Hooks 配置
├── commitlint.config.js # Commitlint 配置
├── eslint.config.mjs  # ESLint 配置
├── .prettierrc        # Prettier 配置
├── package.json       # 项目依赖配置
└── README.md          # 项目说明文档
```

## 🚀 快速开始

### 📦 安装依赖

```bash
pnpm install
```

### 🏃‍♂️ 启动项目

```bash
# 启动 Web 前端
pnpm dev:doc-web

# 启动服务端
pnpm start:doc-server

# 启动文档站点
pnpm docs:dev
```

### 💬 Git 提交

项目提供了跨平台的便捷提交脚本，帮助您规范提交信息：

```
pnpm commit
```

## 📄 许可证

MIT
