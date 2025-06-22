// 工具栏相关
export {
  TOOLBAR_CONFIG,
  USER_COLORS,
  TOOLBAR_TOOLTIPS,
} from './toolbar/toolbarConfig.js';
export {
  addToolbarStyles,
  addToolbarTooltips,
} from './toolbar/toolbarUtils.js';

// 文档操作相关
export {
  handleSave,
  handleShare,
  copyShareUrl,
  handleDownload,
  showDownloadMenu,
} from './document/documentActions.js';

// PDF生成功能
export {
  generateSummaryPDF,
  generateBilingualPDF,
  generateChinesePDFWithImage,
  generateSimpleChinesePDF,
  showPDFMenu,
} from './document/generateSummaryPDF.js';

// 协同编辑相关
export {
  initCollaboration,
  updateUsername,
  cleanupCollaboration,
} from './collaboration/collaboration.js';

// 统计功能相关
export { calculateStats } from './stats/textStats.js';
