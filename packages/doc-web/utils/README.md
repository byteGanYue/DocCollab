# 编辑器工具模块

这个目录包含了DocEditor编辑器的所有工具函数和配置，按功能分类组织。

## 目录结构

```
utils/
├── index.js              # 统一导出文件
├── toolbar/           # 工具栏相关
│   ├── toolbarConfig.js    # 工具栏配置
│   └── toolbarUtils.js     # 工具栏工具函数
├── document/          # 文档操作相关
│   └── documentActions.js  # 文档保存、分享、下载等功能
├── collaboration/     # 协同编辑相关
│   └── collaboration.js    # Yjs协同编辑功能
└── stats/            # 统计功能相关
    └── textStats.js        # 字数统计功能
```

## 模块说明

### toolbar/
- **toolbarConfig.js**: 定义Quill编辑器的工具栏配置，包括按钮、格式、颜色等
- **toolbarUtils.js**: 工具栏相关的工具函数，如样式添加、提示功能等

### document/
- **documentActions.js**: 文档操作功能，包括保存、分享、下载（支持txt/md/pdf格式）

### collaboration/
- **collaboration.js**: 基于Yjs的实时协同编辑功能，包括用户状态管理

### stats/
- **textStats.js**: 文档统计功能，计算字符数、单词数、行数、段落数

## 使用方式

### 推荐方式（使用索引文件）
```javascript
import { 
  TOOLBAR_CONFIG, 
  handleSave, 
  initCollaboration, 
  calculateStats 
} from '../../../../utils/index.js';
```

### 直接导入方式
```javascript
import { TOOLBAR_CONFIG } from '../../../../utils/toolbar/toolbarConfig.js';
import { handleSave } from '../../../../utils/document/documentActions.js';
import { initCollaboration } from '../../../../utils/collaboration/collaboration.js';
import { calculateStats } from '../../../../utils/stats/textStats.js';
```

## 依赖库

- **jspdf**: PDF生成
- **html2canvas**: HTML转Canvas
- **turndown**: HTML转Markdown
- **yjs/y-webrtc**: 协同编辑
- **quill-cursors**: 光标显示 