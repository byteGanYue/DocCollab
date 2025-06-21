import Quill from 'quill';

/**
 * 评论工具栏按钮处理器
 * 为Quill工具栏添加自定义评论按钮功能
 */
class CommentToolbar {
  constructor(quill, options = {}) {
    this.quill = quill;
    this.options = options;
    this.commentManager = options.commentManager;

    this.init();
  }

  /**
   * 初始化评论工具栏
   */
  init() {
    // 添加评论按钮处理器
    const toolbar = this.quill.getModule('toolbar');
    if (toolbar) {
      toolbar.addHandler('comment', this.handleCommentClick.bind(this));
    }

    // 监听工具栏按钮创建
    setTimeout(() => {
      this.setupCommentButton();
    }, 100);
  }

  /**
   * 设置评论按钮
   */
  setupCommentButton() {
    const commentBtn = document.querySelector('.ql-comment');
    if (commentBtn) {
      // 添加提示
      commentBtn.setAttribute('data-tooltip', '添加评论');

      // 添加点击事件
      commentBtn.addEventListener('click', this.handleCommentClick.bind(this));

      console.log('Comment toolbar button setup complete');
    }
  }

  /**
   * 处理评论按钮点击
   */
  handleCommentClick() {
    console.log('Comment toolbar button clicked');

    const selection = this.quill.getSelection();

    if (!selection || selection.length === 0) {
      // 没有选中文本，提示用户
      alert('请先选择要评论的文本');
      return;
    }

    // 如果有评论管理器，调用其创建评论方法
    if (this.commentManager) {
      // 设置选中范围
      this.commentManager.selectedRange = selection;
      this.commentManager.createComment();
    } else {
      // 备用方案：简单的prompt
      const selectedText = this.quill.getText(
        selection.index,
        selection.length,
      );
      const comment = prompt(`为 "${selectedText}" 添加评论:`);
      if (comment) {
        console.log('Comment added:', comment);
        // 这里可以添加保存评论的逻辑
      }
    }
  }

  /**
   * 更新按钮状态
   */
  updateButtonState() {
    const commentBtn = document.querySelector('.ql-comment');
    const selection = this.quill.getSelection();

    if (commentBtn) {
      if (selection && selection.length > 0) {
        commentBtn.classList.add('ql-active');
        commentBtn.style.opacity = '1';
      } else {
        commentBtn.classList.remove('ql-active');
        commentBtn.style.opacity = '0.6';
      }
    }
  }

  /**
   * 销毁
   */
  destroy() {
    const commentBtn = document.querySelector('.ql-comment');
    if (commentBtn) {
      commentBtn.removeEventListener(
        'click',
        this.handleCommentClick.bind(this),
      );
    }
  }
}

// 注册为Quill模块
Quill.register('modules/commentToolbar', CommentToolbar);

export default CommentToolbar;
