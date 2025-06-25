import React from 'react';

// 导入组件
import Editor from './components/Editor.jsx';

// 导入插件
import withHistory from './plugins/withHistory.js';
import withLogger from './plugins/withLogger.js';

// 默认的DocEditor组件
const DocEditor = () => {
  return <div>DocEditor SDK 初始化成功！</div>;
};

// 导出所有组件和插件
export {
  Editor, // 主编辑器组件
  withHistory, // 历史记录插件
  withLogger, // 日志插件
  DocEditor, // 默认组件
};

// 默认导出
export default DocEditor;
