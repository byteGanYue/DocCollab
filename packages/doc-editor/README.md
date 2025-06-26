## 基于Slate实现的协同富文本编辑SDK

packages/doc-editor/
├── src/
│ ├── index.jsx // SDK 入口
│ ├── components/ // 封装的 React 组件
│ │ ├── Editor.jsx // 主编辑器组件
│ │ ├── HoveringToolbar.jsx // 悬浮工具栏组件
│ │ ├── Portal.jsx // Portal组件
│ │ ├── Menu.jsx // 菜单容器组件
│ │ └── ... // 其他组件
│ ├── examples/ // 示例组件
│ │ └── HoveringToolbarExample.jsx // 悬浮工具栏示例
│ ├── utils/ // 工具函数
├── package.json
└── README.md

## 主要文件说明

**src/index.jsx**
SDK 的对外入口，导出主编辑器组件、hooks、工具等。

**src/components/HoveringToolbar.jsx**
悬浮工具栏组件，当用户选中文本时自动显示在选中区域上方，提供格式化功能。

**src/components/Portal.jsx**
Portal组件，用于将悬浮工具栏渲染到document.body中，避免被父容器的样式影响。

**src/components/Menu.jsx**
菜单容器组件，作为悬浮工具栏的容器。

**src/examples/HoveringToolbarExample.jsx**
悬浮工具栏的完整使用示例。

**src/utils/editorHelpers.js**
Slate 相关的工具函数，包含格式化、布局等辅助功能。

## 悬浮工具栏功能特点

- **自动定位**: 根据选中文本的位置自动调整工具栏位置
- **智能显示**: 只在选中文本时显示，取消选择时自动隐藏
- **格式支持**: 支持粗体、斜体、下划线、代码等基本格式
- **无缝集成**: 可以轻松集成到现有的Slate编辑器中
- **样式可定制**: 支持自定义样式和主题

## 使用方法

```javascript
import { HoveringToolbar } from './components';

// 在Slate编辑器中使用
<Slate editor={editor} initialValue={initialValue}>
  <HoveringToolbar />
  <Editable />
</Slate>
```
