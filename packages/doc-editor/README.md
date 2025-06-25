## 基于Slate实现的协同富文本编辑SDK

packages/doc-editor/
├── src/
│ ├── index.js // SDK 入口
│ ├── components/ // 封装的 React 组件
│ │ └── Editor.jsx // 主编辑器组件
│ ├── hooks/ // 自定义 hooks（如 useEditor、useComments）
│ ├── plugins/ // 插件机制（如历史、协同、评论等）
│ ├── utils/ // 工具函数
├── package.json
└── README.md

## 主要文件说明

src/index.js
SDK 的对外入口，导出主编辑器组件、hooks、工具等。
src/components/Editor.jsx
封装 Slate 的主编辑器组件，暴露自定义 props，支持插件、协同等扩展。
src/hooks/
封装常用的编辑器相关 hooks，比如 useEditor（初始化编辑器）、useSlateValue（获取/设置内容）、useComments（评论功能）等。
src/plugins/
插件机制，方便后续扩展（如协同、评论、历史、表格等）。
src/utils/
Slate 相关的工具函数，如内容序列化、反序列化、格式转换等。
