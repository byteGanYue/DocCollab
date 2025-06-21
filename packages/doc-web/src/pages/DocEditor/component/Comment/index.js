/**
 * 评论功能统一入口文件
 * 导出所有评论相关的组件、管理器和工具
 */

// 核心管理器
export { default as CommentManager } from './CommentManager.js';
export { default as CommentToolbar } from './CommentToolbar.js';

// UI组件
export { default as CommentDrawer } from './CommentDrawer.jsx';
export { default as CommentTrigger } from './CommentTrigger.jsx';
export { default as CommentButton } from './CommentButton.jsx';
export { default as CommentModal } from './CommentModal.jsx';

// 格式和样式
export { default as CommentFormat } from './commentFormat.js';
import './comment.module.less'; // 导入样式

// 测试和调试组件（开发环境使用）
export { default as CommentManagerSimple } from './CommentManagerSimple.js';
export { default as CommentTest } from './CommentTest.jsx';
export { default as CommentDebug } from './CommentDebug.jsx';

// 默认导出主要的评论管理器
export { default } from './CommentManager.js';
