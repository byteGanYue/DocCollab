import { Editor, Element as SlateElement, Transforms } from 'slate';

// 常量定义
export const HOTKEYS = {
  'mod+b': 'bold',
  'mod+i': 'italic',
  'mod+u': 'underline',
  'mod+`': 'code',
};

export const LIST_TYPES = ['numbered-list', 'bulleted-list'];
export const TEXT_ALIGN_TYPES = ['left', 'center', 'right', 'justify'];

/**
 * 切换块级元素格式
 * @param {Object} editor - Slate编辑器实例
 * @param {string} format - 要切换的格式
 */
export const toggleBlock = (editor, format) => {
  const isActive = isBlockActive(
    editor,
    format,
    isAlignType(format) ? 'align' : 'type',
  );
  const isList = isListType(format);

  // 展开列表节点
  Transforms.unwrapNodes(editor, {
    match: n =>
      !Editor.isEditor(n) &&
      SlateElement.isElement(n) &&
      isListType(n.type) &&
      !isAlignType(format),
    split: true,
  });

  let newProperties;
  if (isAlignType(format)) {
    newProperties = {
      align: isActive ? undefined : format,
    };
  } else {
    newProperties = {
      type: isActive ? 'paragraph' : isList ? 'list-item' : format,
    };
  }

  Transforms.setNodes(editor, newProperties);

  if (!isActive && isList) {
    const block = { type: format, children: [] };
    Transforms.wrapNodes(editor, block);
  }
};

/**
 * 切换文本标记格式
 * @param {Object} editor - Slate编辑器实例
 * @param {string} format - 要切换的格式
 */
export const toggleMark = (editor, format) => {
  const isActive = isMarkActive(editor, format);

  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

/**
 * 检查块级元素是否处于活动状态
 * @param {Object} editor - Slate编辑器实例
 * @param {string} format - 格式类型
 * @param {string} blockType - 块类型 ('type' | 'align')
 * @returns {boolean} 是否活动
 */
export const isBlockActive = (editor, format, blockType = 'type') => {
  const { selection } = editor;
  if (!selection) return false;

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: n => {
        if (!Editor.isEditor(n) && SlateElement.isElement(n)) {
          if (blockType === 'align' && isAlignElement(n)) {
            return n.align === format;
          }
          return n.type === format;
        }
        return false;
      },
    }),
  );

  return !!match;
};

/**
 * 检查文本标记是否处于活动状态
 * @param {Object} editor - Slate编辑器实例
 * @param {string} format - 格式类型
 * @returns {boolean} 是否活动
 */
export const isMarkActive = (editor, format) => {
  const marks = Editor.marks(editor);
  return marks ? marks[format] === true : false;
};

/**
 * 检查格式是否为对齐类型
 * @param {string} format - 格式
 * @returns {boolean} 是否为对齐类型
 */
export const isAlignType = format => {
  return TEXT_ALIGN_TYPES.includes(format);
};

/**
 * 检查格式是否为列表类型
 * @param {string} format - 格式
 * @returns {boolean} 是否为列表类型
 */
export const isListType = format => {
  return LIST_TYPES.includes(format);
};

/**
 * 检查元素是否有对齐属性
 * @param {Object} element - 元素
 * @returns {boolean} 是否有对齐属性
 */
export const isAlignElement = element => {
  return 'align' in element;
};
