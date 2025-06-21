/**
 * 简化版评论管理器 - 用于测试和调试
 */
class CommentManagerSimple {
  constructor(quill) {
    this.quill = quill;
    this.selectedRange = null;
    this.commentButton = null;

    console.log('Simple CommentManager initialized');
    this.init();
  }

  init() {
    // 创建评论按钮
    this.createCommentButton();

    // 监听文本选择
    this.quill.on('selection-change', (range, oldRange, source) => {
      console.log('Simple selection change:', { range, source });

      if (range && range.length > 0) {
        console.log('Showing simple comment button');
        this.selectedRange = range;
        this.showCommentButton(range);
      } else {
        console.log('Hiding simple comment button');
        this.hideCommentButton();
      }
    });

    // 测试按钮创建
    setTimeout(() => {
      console.log('Button element:', this.commentButton);
      console.log('Button in DOM:', document.contains(this.commentButton));
    }, 1000);
  }

  createCommentButton() {
    this.commentButton = document.createElement('div');
    this.commentButton.innerHTML = `
      <button style="
        padding: 8px 12px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
      ">
        💬 添加评论
      </button>
    `;

    // 设置样式
    this.commentButton.style.cssText = `
      position: fixed !important;
      z-index: 9999 !important;
      display: none;
      background: white;
      padding: 4px;
      border: 2px solid #007bff;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;

    document.body.appendChild(this.commentButton);

    this.commentButton.addEventListener('click', () => {
      alert(
        '评论按钮被点击了！\n选中的文本: ' +
          this.quill.getText(
            this.selectedRange.index,
            this.selectedRange.length,
          ),
      );
    });

    console.log('Simple comment button created');
  }

  showCommentButton(range) {
    try {
      const bounds = this.quill.getBounds(range.index, range.length);
      const editorRect = this.quill.container.getBoundingClientRect();

      const left = editorRect.left + bounds.right + 10;
      const top = editorRect.top + bounds.top + window.scrollY;

      console.log('Positioning button at:', { left, top, bounds, editorRect });

      this.commentButton.style.display = 'block';
      this.commentButton.style.left = left + 'px';
      this.commentButton.style.top = top + 'px';

      console.log('Button should be visible now');
    } catch (error) {
      console.error('Error positioning button:', error);
    }
  }

  hideCommentButton() {
    if (this.commentButton) {
      this.commentButton.style.display = 'none';
    }
  }

  destroy() {
    if (this.commentButton) {
      document.body.removeChild(this.commentButton);
    }
  }
}

export default CommentManagerSimple;
