import { Editor, Element as SlateElement, Transforms, Node } from 'slate';

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
 * 强制布局高阶函数
 * 确保文档始终有标题和至少一个段落
 * @param {Object} editor - Slate编辑器实例
 * @returns {Object} 增强后的编辑器实例
 */
export const withLayout = editor => {
  const { normalizeNode } = editor;

  editor.normalizeNode = ([node, path]) => {
    // 只处理根节点
    if (path.length === 0) {
      // 如果编辑器为空或只有一个空节点，插入标题
      if (
        editor.children.length === 0 ||
        (editor.children.length === 1 &&
          editor.children[0] &&
          Editor.string(editor, [0]) === '')
      ) {
        const title = {
          type: 'title',
          children: [{ text: '无标题文档' }],
        };
        Transforms.insertNodes(editor, title, {
          at: path.concat(0),
          select: true,
        });
      }

      // 确保至少有两个节点（标题 + 段落）
      if (editor.children.length < 2) {
        const paragraph = {
          type: 'paragraph',
          children: [{ text: '' }],
        };
        Transforms.insertNodes(editor, paragraph, { at: path.concat(1) });
      }

      // 强制第一个节点为标题，其余为段落或其他内容
      for (const [child, childPath] of Node.children(editor, path)) {
        const slateIndex = childPath[0];

        const enforceType = type => {
          if (SlateElement.isElement(child) && child.type !== type) {
            const newProperties = { type };
            Transforms.setNodes(editor, newProperties, {
              at: childPath,
            });
          }
        };

        // 第一个节点必须是标题
        if (slateIndex === 0) {
          enforceType('title');
        }
        // 第二个节点必须是段落（如果不是特殊类型）
        else if (slateIndex === 1 && SlateElement.isElement(child)) {
          // 如果不是列表、引用等特殊类型，则强制为段落
          if (
            !LIST_TYPES.includes(child.type) &&
            child.type !== 'block-quote' &&
            child.type !== 'heading-one' &&
            child.type !== 'heading-two' &&
            child.type !== 'code-block' &&
            child.type !== 'code-line'
          ) {
            enforceType('paragraph');
          }
        }
      }
    }

    return normalizeNode([node, path]);
  };

  return editor;
};

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
