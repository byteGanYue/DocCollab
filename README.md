# DocCollab

一个协同富文本知识库系统。

## ✨ 特性

- **Monorepo 架构**: 使用 pnpm workspace 管理多个包，便于协同开发和代码复用。
- **强大的工程化工具**:
  - **ESLint & Prettier**: 统一代码风格和质量，支持最新的 ESLint 9.x。
  - **Husky & Lint-staged**: 自动化 Git Hooks，确保提交代码的质量。
  - **Commitlint & Commitizen**: 规范化 Git 提交信息，提升项目可维护性。

## 📁 项目结构

```
.
├── packages/          # 项目包目录
│   ├── doc-server/    # 服务端
│   ├── doc-web/       # Web 前端
│   └── doc-docs/      # 项目文档
├── .github/           # GitHub 配置
├── .husky/            # Git Hooks 配置
├── node_modules/      # 依赖包
├── commit.bat         # Windows 提交脚本
├── commit.sh          # Mac/Linux 提交脚本
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

**Windows:**

双击运行 `commit.bat` 或在终端执行：

```bash
.\commit.bat
```

**Mac/Linux:**

首先添加执行权限，然后在终端执行：

```bash
chmod +x commit.sh
./commit.sh
```

## 📄 许可证

MIT

weee
