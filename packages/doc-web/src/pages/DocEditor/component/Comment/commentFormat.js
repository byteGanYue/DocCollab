import Quill from 'quill';

// 获取Quill的内联格式基类
const Inline = Quill.import('blots/inline');

/**
 * 评论格式 - 用于标记文本中的评论区域
 * 继承自Quill的Inline格式，可以应用到选中的文本上
 */
class CommentBlot extends Inline {
  /**
   * 创建评论标记元素
   * @param {string} commentId - 评论ID
   * @returns {HTMLElement} 创建的DOM元素
   */
  static create(commentId) {
    const node = super.create();
    node.setAttribute('data-comment-id', commentId);
    node.className = 'comment-highlight';

    // 添加点击事件处理
    node.addEventListener('click', e => {
      e.stopPropagation();
      // 触发自定义事件，通知评论管理器
      const event = new CustomEvent('commentClick', {
        detail: { commentId },
      });
      document.dispatchEvent(event);
    });

    return node;
  }

  /**
   * 获取评论ID格式
   * @param {HTMLElement} node - DOM元素
   * @returns {string} 评论ID
   */
  static formats(node) {
    return node.getAttribute('data-comment-id');
  }

  /**
   * 格式化方法
   * @param {string} name - 格式名称
   * @param {string|boolean} value - 格式值
   */
  format(name, value) {
    if (name !== this.statics.blotName || !value) {
      super.format(name, value);
    } else {
      this.domNode.setAttribute('data-comment-id', value);
    }
  }

  /**
   * 优化方法 - 合并相邻的相同评论标记
   * @param {CommentBlot} other - 另一个评论标记
   * @returns {boolean} 是否可以合并
   */
  optimize(context) {
    super.optimize(context);

    // 如果相邻的元素也是评论标记且ID相同，则合并
    if (
      this.next != null &&
      this.next.statics.blotName === this.statics.blotName &&
      this.next.domNode.getAttribute('data-comment-id') ===
        this.domNode.getAttribute('data-comment-id')
    ) {
      this.next.moveChildren(this);
      this.next.remove();
    }
  }
}

// 设置格式名称和标签
CommentBlot.blotName = 'comment';
CommentBlot.tagName = 'span';

// 注册自定义格式到Quill
Quill.register(CommentBlot);

export default CommentBlot;
