# 样式系统说明

## 概述

本项目使用 **Less + CSS Modules** 作为样式解决方案，提供样式隔离和更好的开发体验。

## 文件结构

```
src/
├── styles/
│   ├── global.less          # 全局样式和变量
│   └── README.md            # 样式说明文档
├── pages/
│   ├── DocEditor/
│   │   └── component/
│   │       ├── editor.jsx
│   │       └── editor.module.less    # 编辑器样式
│   └── Login/
│       └── components/
│           ├── LoginForm.jsx
│           └── LoginForm.module.less # 登录表单样式
```

## 使用方法

### 1. 创建样式文件

创建 `.module.less` 文件：

```less
// component.module.less
@import '../../styles/global.less';

.container {
  padding: 16px;
  background-color: #fff;
  border-radius: @border-radius-base;
  
  .title {
    color: @heading-color;
    font-size: 18px;
    margin-bottom: 12px;
  }
  
  .content {
    color: @text-color;
    line-height: 1.6;
  }
}
```

### 2. 在组件中使用

```jsx
import React from 'react';
import styles from './component.module.less';

const MyComponent = () => {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>标题</h1>
      <p className={styles.content}>内容</p>
    </div>
  );
};

export default MyComponent;
```

## 全局变量

在 `global.less` 中定义的变量可以在所有样式文件中使用：

```less
// 颜色变量
@primary-color: #1890ff;
@success-color: #52c41a;
@warning-color: #faad14;
@error-color: #f5222d;

// 文字变量
@font-size-base: 14px;
@heading-color: rgba(0, 0, 0, 0.85);
@text-color: rgba(0, 0, 0, 0.65);

// 边框变量
@border-radius-base: 6px;
@border-color-base: #d9d9d9;
```

## 样式隔离

CSS Modules 会自动为类名添加唯一的哈希值，确保样式不会冲突：

```jsx
// 生成的类名类似：container__abc123
<div className={styles.container}>
```

## 全局样式

如果需要覆盖第三方组件的样式，使用 `:global()` 语法：

```less
.container {
  :global(.ant-button) {
    background-color: @primary-color;
  }
  
  :global(.ant-input) {
    border-color: @border-color-base;
  }
}
```

## 响应式设计

使用媒体查询进行响应式设计：

```less
.container {
  padding: 16px;
  
  @media (max-width: 768px) {
    padding: 12px;
  }
  
  @media (max-width: 480px) {
    padding: 8px;
  }
}
```

## 最佳实践

1. **命名规范**：使用 camelCase 命名类名
2. **嵌套层级**：避免超过 3 层嵌套
3. **变量使用**：优先使用全局变量
4. **响应式**：移动端优先设计
5. **性能优化**：避免过度使用伪选择器

## 工具类

全局提供了一些常用的工具类：

```less
.flex          // display: flex
.flex-center   // flex + center
.flex-between  // flex + space-between
.text-center   // text-align: center
.text-left     // text-align: left
.text-right    // text-align: right
``` 