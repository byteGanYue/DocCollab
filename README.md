# Init-Template

一个现代化的前端开发项目模板，集成了完整的工程化工具链。

## ✨ 亮点特性

### 🛠️ 工程化工具链

- **TypeScript** - 强类型支持，提供更好的开发体验
- **ESLint** - 最新的 ESLint 9.x 版本，支持 TypeScript
- **Prettier** - 代码格式化，保持代码风格统一
- **TypeScript ESLint** - 专为 TypeScript 优化的 ESLint 规则

### 🚀 Git 工作流

- **Husky** - Git hooks 管理，确保代码质量
- **Commitlint** - 提交信息规范检查
- **Commitizen** - 交互式提交信息生成
- **cz-git** - 增强的 Git 提交体验
- **lint-staged** - 只对暂存区的文件进行 lint

### 📦 包管理

- **pnpm** - 快速、节省空间的包管理器
- **workspace** - 支持 monorepo 开发

## 项目结构

```
.
├── packages/
│   └── package1
│   └── package2
├── commit.bat         # Windows 提交脚本
├── commit.sh          # Mac/Linux 提交脚本
├── tsconfig.json      # TypeScript 配置
├── package.json       # 项目依赖配置
└── README.md         # 项目说明文档
```

## 快速提交

项目提供了便捷的提交脚本，支持跨平台使用：

### Windows

1. 双击执行：

   - 双击 `commit.bat` 文件即可启动交互式提交流程

2. 终端执行（以下方式任选其一）：

   ```bash
   # 方式1：直接执行
   .\commit.bat

   # 方式2：使用 cmd 执行
   cmd /c commit.bat

   # 方式3：使用完整路径
   "C:\完整路径\commit.bat"
   ```

### Mac/Linux

1. 添加执行权限：

```bash
chmod +x commit.sh
```

2. 执行脚本：

```bash
# 方式1：直接执行
./commit.sh

# 方式2：使用 bash 执行
bash commit.sh
```

## 许可证

MIT
