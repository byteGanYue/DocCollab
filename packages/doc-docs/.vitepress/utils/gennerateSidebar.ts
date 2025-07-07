import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface SidebarItem {
  text: string;
  items?: SidebarItem[];
  link?: string;
  collapsible?: boolean;
  collapsed?: boolean;
}

interface SidebarConfig {
  [key: string]: SidebarItem[];
}

const EXCLUDE_FILES = [
  '.vitepress',
  'node_modules',
  '.git',
  'public',
  'assets',
];

/**
 * 生成侧边栏配置
 * @returns 侧边栏配置对象
 */
export function generateSidebar(): SidebarConfig {
  const docsPath = path.resolve(__dirname, '../../');
  const sidebarConfig: SidebarConfig = {};

  // 获取所有一级目录
  const directories = fs.readdirSync(docsPath).filter(file => {
    const filePath = path.join(docsPath, file);
    return fs.statSync(filePath).isDirectory() && !EXCLUDE_FILES.includes(file);
  });

  // 为每个一级目录生成侧边栏配置
  directories.forEach(dir => {
    const dirPath = path.join(docsPath, dir);
    sidebarConfig[`/${dir}/`] = walkDir(dirPath, docsPath);
  });

  // 根目录的侧边栏配置
  sidebarConfig['/'] = generateRootSidebar(docsPath);

  return sidebarConfig;
}

/**
 * 生成根目录侧边栏配置
 * @param docsPath 文档根目录路径
 * @returns 根目录侧边栏项数组
 */
function generateRootSidebar(docsPath: string): SidebarItem[] {
  const items: SidebarItem[] = [];
  const files = fs
    .readdirSync(docsPath)
    .filter(
      file =>
        !EXCLUDE_FILES.includes(file) &&
        file.endsWith('.md') &&
        file !== 'README.md',
    )
    .sort();

  files.forEach(file => {
    items.push({
      text: formatText(file.replace('.md', '')),
      link: `/${file.replace('.md', '')}`,
    });
  });

  return items;
}

/**
 * 递归遍历目录生成侧边栏项
 * @param dir 当前目录路径
 * @param docsPath 文档根目录路径
 * @returns 侧边栏项数组
 */
function walkDir(dir: string, docsPath: string): SidebarItem[] {
  const items: SidebarItem[] = [];
  const files = fs
    .readdirSync(dir)
    .filter(file => !file.startsWith('.'))
    .sort((a, b) => {
      const aStats = fs.statSync(path.join(dir, a));
      const bStats = fs.statSync(path.join(dir, b));
      if (aStats.isDirectory() && !bStats.isDirectory()) return -1;
      if (!aStats.isDirectory() && bStats.isDirectory()) return 1;
      return a.localeCompare(b);
    });

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    const relativePath = path
      .relative(docsPath, filePath)
      .split(path.sep)
      .join('/');

    if (stat.isDirectory()) {
      const children = walkDir(filePath, docsPath);
      if (children.length > 0) {
        items.push({
          text: formatText(file),
          items: children,
          collapsible: true,
          collapsed: false,
        });
      }
    } else if (file.endsWith('.md') && file !== 'README.md') {
      items.push({
        text: formatText(file.replace('.md', '')),
        link: `/${relativePath.replace('.md', '')}`,
      });
    }
  });

  return items;
}

/**
 * 格式化文本，将连字符替换为空格并首字母大写
 * @param text 原始文本
 * @returns 格式化后的文本
 */
function formatText(text: string): string {
  return text
    .replace(/-/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
