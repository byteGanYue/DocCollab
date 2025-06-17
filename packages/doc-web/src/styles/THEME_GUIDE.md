# 主题系统使用指南

## 概述

本项目实现了基于 CSS Variables + React Context 的主题切换系统，支持三种预设主题：

- **深空紫**：高端深空紫主题
- **协作蓝**：专业协作蓝主题  
- **生态绿**：生态友好绿主题

## 主题配置

### 1. 主题定义

主题配置位于 `src/styles/themes.js`：

```javascript
export const themes = {
  purple: {
    name: '深空紫',
    description: '高端深空紫主题',
    colors: {
      primary: '#805AD5',      // 主色
      background: '#FAF5FF',   // 背景色
      hover: '#6B46C1',        // 悬停色
      text: '#2D3748',         // 文字色
      textSecondary: '#4A5568', // 次要文字色
      border: '#E2E8F0',       // 边框色
      success: '#48BB78',      // 成功色
      warning: '#ED8936',      // 警告色
      error: '#F56565',        // 错误色
    },
  },
  // ... 其他主题
};
```

### 2. CSS 变量

主题通过 CSS 变量实现，在 `global.less` 中定义：

```less
:root {
  --color-primary: #805AD5;
  --color-background: #FAF5FF;
  --color-hover: #6B46C1;
  --color-text: #2D3748;
  --color-textSecondary: #4A5568;
  --color-border: #E2E8F0;
  --color-success: #48BB78;
  --color-warning: #ED8936;
  --color-error: #F56565;
}
```

## 使用方法

### 1. 在组件中使用主题

```jsx
import { useTheme } from '@/contexts/ThemeContext';

const MyComponent = () => {
  const { currentTheme, toggleTheme, getCurrentTheme } = useTheme();
  
  return (
    <div>
      <p>当前主题：{getCurrentTheme().name}</p>
      <button onClick={() => toggleTheme('blue')}>
        切换到协作蓝主题
      </button>
    </div>
  );
};
```

### 2. 在样式中使用 CSS 变量

```less
.myComponent {
  background-color: var(--color-background);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  
  &:hover {
    background-color: var(--color-hover);
  }
  
  .title {
    color: var(--color-primary);
  }
}
```

### 3. 主题切换器组件

项目提供了 `ThemeSwitcher` 组件，可以直接使用：

```jsx
import ThemeSwitcher from '@/components/ThemeSwitcher';

const Header = () => {
  return (
    <header>
      <h1>DocCollab</h1>
      <ThemeSwitcher />
    </header>
  );
};
```

## 主题切换流程

1. **用户点击主题切换器**
2. **调用 `toggleTheme(themeKey)`**
3. **更新 Context 状态**
4. **应用 CSS 变量到 `:root`**
5. **添加主题类名到 `document.documentElement`**
6. **保存到 localStorage**

## 主题持久化

主题选择会自动保存到 localStorage，页面刷新后会恢复上次选择的主题：

```javascript
// 保存主题
localStorage.setItem('theme', themeKey);

// 恢复主题
const savedTheme = localStorage.getItem('theme') || defaultTheme;
```

## 响应式主题

主题系统支持响应式设计，在不同屏幕尺寸下自动调整：

```less
.myComponent {
  background-color: var(--color-background);
  
  @media (max-width: 768px) {
    background-color: var(--color-primary);
  }
}
```

## 最佳实践

### 1. 颜色使用规范

- **主色**：用于主要按钮、链接、重要元素
- **背景色**：用于页面背景、卡片背景
- **悬停色**：用于按钮悬停、链接悬停
- **文字色**：用于主要文字内容
- **次要文字色**：用于辅助信息、说明文字
- **边框色**：用于边框、分割线

### 2. 样式编写规范

```less
// ✅ 推荐：使用 CSS 变量
.button {
  background-color: var(--color-primary);
  color: white;
  
  &:hover {
    background-color: var(--color-hover);
  }
}

// ❌ 不推荐：使用固定颜色值
.button {
  background-color: #805AD5;
  color: white;
  
  &:hover {
    background-color: #6B46C1;
  }
}
```

### 3. 组件设计规范

- 所有颜色相关的样式都应该使用 CSS 变量
- 避免在组件中硬编码颜色值
- 使用语义化的变量名（如 `--color-primary` 而不是 `--color-purple`）

## 扩展新主题

### 1. 添加新主题配置

在 `themes.js` 中添加新主题：

```javascript
export const themes = {
  // ... 现有主题
  orange: {
    name: '活力橙',
    description: '活力四射的橙色主题',
    colors: {
      primary: '#FF6B35',
      background: '#FFF5F0',
      hover: '#E55A2B',
      // ... 其他颜色
    },
  },
};
```

### 2. 添加主题选项

在 `themeOptions` 中添加：

```javascript
export const themeOptions = [
  // ... 现有选项
  {
    key: 'orange',
    label: '活力橙',
    icon: '🟠',
    description: '活力四射的橙色主题',
  },
];
```

### 3. 添加 CSS 类名

在 `global.less` 中添加：

```less
.theme-orange {
  --color-primary: #FF6B35;
  --color-background: #FFF5F0;
  --color-hover: #E55A2B;
  // ... 其他变量
}
```

## 性能优化

1. **CSS 变量**：使用 CSS 变量而不是 JavaScript 动态修改样式，性能更好
2. **过渡动画**：添加适当的过渡动画，提升用户体验
3. **懒加载**：主题切换器组件按需加载
4. **缓存**：主题选择缓存到 localStorage，避免重复设置

## 调试技巧

### 1. 检查当前主题

```javascript
// 在浏览器控制台中
console.log(document.documentElement.className); // 查看主题类名
console.log(getComputedStyle(document.documentElement).getPropertyValue('--color-primary')); // 查看主色值
```

### 2. 手动切换主题

```javascript
// 在浏览器控制台中
document.documentElement.className = 'theme-blue';
```

### 3. 检查 CSS 变量

```javascript
// 获取所有 CSS 变量
const root = document.documentElement;
const styles = getComputedStyle(root);
console.log(styles.getPropertyValue('--color-primary'));
``` 