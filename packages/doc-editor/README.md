# @byteganyue/editorsdk —— 基于Slate的协同富文本编辑器SDK

## 简介

`@byteganyue/editorsdk` 是一个基于 [Slate.js](https://docs.slatejs.org/) 实现的现代化富文本编辑器SDK，支持代码高亮、悬浮工具栏、丰富的文本格式化、可扩展的React组件体系，适合集成到各类文档协作、知识管理、内容创作等场景。

---

## 主要特性

- **富文本编辑**：支持粗体、斜体、下划线、删除线、代码、对齐等常用格式。
- **代码高亮**：内置 Prism.js，支持多种主流编程语言的高亮显示和切换。
- **悬浮工具栏**：选中文本时自动浮现，便捷进行格式化操作。
- **可扩展组件体系**：所有UI均为React组件，易于二次开发和自定义。
- **强制布局**：文档始终包含标题和至少一个段落，结构清晰。
- **快捷键支持**：常用格式化操作支持快捷键（如Ctrl+B加粗）。
- **多端适配**：样式简洁，适合PC和移动端。
- **帮助弹窗**：内置使用说明弹窗，提升用户体验。

---

## 目录结构

```
packages/doc-editor/
├── src/
│   ├── index.jsx                // SDK主入口
│   ├── components/              // 组件库
│   ├── examples/                // 示例
│   └── utils/                   // 工具函数
├── dist/                        // 构建产物
├── package.json
└── README.md
```

---

## 安装

```bash
npm install @byteganyue/editorsdk
# 或
yarn add @byteganyue/editorsdk
```

> 依赖：React 18+、Slate 0.117+ 及其相关依赖

---

## 快速上手

```jsx
import React from 'react';
import { EditorSDK } from '@byteganyue/editorsdk';

export default function App() {
  return <EditorSDK />;
}
```

---

## 组件与API

SDK对外暴露了丰富的组件和工具函数，支持灵活组合和自定义：

- **EditorSDK**：主编辑器组件，集成全部功能。
- **Toolbar**：顶部工具栏容器。
- **MarkButton**、**BlockButton**、**CodeBlockButton**、**ColorButton**：格式化按钮。
- **HoveringToolbar**：悬浮工具栏，选中文本时显示。
- **HelpModal**：帮助说明弹窗。
- **Element**、**Leaf**：自定义渲染节点。
- **LanguageSelect**：代码块语言选择器。
- **Portal**、**Menu**、**Icon**、**Button**：基础UI组件。

> 你可以按需引入上述组件，或直接使用 `EditorSDK` 一站式集成。

---

## 代码高亮与多语言支持

- 支持 `javascript`、`jsx`、`typescript`、`tsx`、`css`、`python`、`php`、`sql`、`markdown` 等多种语言。
- 代码块右上角可切换语言，自动高亮。

---

## 悬浮工具栏功能

- 自动定位于选中文本上方
- 支持加粗、斜体、下划线、删除线、代码等格式
- 可自定义扩展按钮和样式

---

## 示例

```jsx
import { Slate, Editable } from 'slate-react';
import { HoveringToolbar } from '@byteganyue/editorsdk';

<Slate editor={editor} initialValue={initialValue}>
  <HoveringToolbar />
  <Editable />
</Slate>
```

---

## 快捷键

- **加粗**：Ctrl+B
- **斜体**：Ctrl+I
- **下划线**：Ctrl+U
- **删除线**：Ctrl+Shift+X
- **行内代码**：Ctrl+`

---

## 高级用法

- 支持自定义工具栏、扩展节点类型、集成评论、协同编辑等高级功能（详见源码和示例）。
- 可通过 `onChange` 监听内容变化，集成到你的业务流中。

---

## 依赖

- `react`、`react-dom`
- `slate`、`slate-react`、`slate-history`
- `prismjs`（代码高亮）
- `is-hotkey`（快捷键支持）

---

## 许可证

ISC
