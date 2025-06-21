/**
 * 评论管理器 - 处理Quill编辑器的划词评论功能
 * 支持实时协同、评论创建、显示和管理
 */
class CommentManager {
  constructor(quill, yDoc, awareness, callbacks = {}) {
    this.quill = quill;
    this.yDoc = yDoc;
    this.awareness = awareness;
    this.comments = new Map(); // 本地评论缓存
    this.yComments = yDoc.getMap('comments'); // Yjs共享评论数据
    this.selectedRange = null;
    this.isSelecting = false;

    // 回调函数，用于通知React组件
    this.onCommentsChange = callbacks.onCommentsChange || (() => {});
    this.onCommentCreate = callbacks.onCommentCreate || (() => {});
    this.onCommentClick = callbacks.onCommentClick || (() => {}); // 新增：点击评论文本的回调
    this.onShowCommentButton = callbacks.onShowCommentButton || (() => {}); // 显示评论按钮
    this.onHideCommentButton = callbacks.onHideCommentButton || (() => {}); // 隐藏评论按钮
    this.onShowCommentModal = callbacks.onShowCommentModal || (() => {}); // 显示评论模态框

    this.init();
  }

  /**
   * 初始化评论管理器
   */
  init() {
    console.log('Initializing CommentManager');

    // 监听文本选择事件
    this.quill.on('selection-change', this.handleSelectionChange.bind(this));

    // 监听Yjs评论数据变化
    this.yComments.observe(this.handleCommentsChange.bind(this));

    // 初始化现有评论
    this.loadExistingComments();

    // 监听点击事件，用于隐藏评论按钮和处理评论文本点击
    document.addEventListener('click', this.handleDocumentClick.bind(this));

    // 监听自定义评论点击事件
    document.addEventListener(
      'commentClick',
      this.handleCommentClickEvent.bind(this),
    );

    console.log('CommentManager initialized successfully');
  }

  /**
   * 处理自定义评论点击事件
   */
  handleCommentClickEvent(event) {
    const { commentId } = event.detail;
    const comment = this.comments.get(commentId);
    if (comment) {
      console.log('Comment clicked via custom event:', commentId);
      // 通知React组件打开侧边栏并跳转到对应评论
      this.onCommentClick(comment, commentId);
    }
  }

  /**
   * 处理文本选择变化
   */
  handleSelectionChange(range, oldRange, source) {
    console.log('Selection change:', {
      range,
      oldRange,
      source,
      isSelecting: this.isSelecting,
    });

    // 防止在输入评论时触发
    if (this.isSelecting) return;

    // 清除之前的定时器
    if (this.selectionTimer) {
      clearTimeout(this.selectionTimer);
    }

    if (range && range.length > 0) {
      console.log('Text selected, showing comment button');
      // 用户选择了文本
      this.selectedRange = range;
      this.showCommentButton(range);
    } else {
      // 延迟隐藏评论按钮，给用户时间点击
      this.selectionTimer = setTimeout(() => {
        console.log('Selection cleared, hiding comment button');
        // 只有在没有存储的选择时才隐藏按钮
        if (!this.currentSelectedRange) {
          this.hideCommentButton();
          this.selectedRange = null;
        }
      }, 100); // 100ms延迟
    }
  }
  /**
   * 处理文档点击事件
   */
  handleDocumentClick(event) {
    // 检查是否点击了评论文本
    const commentElement = event.target.closest('[data-comment-id]');
    if (commentElement) {
      const commentId = commentElement.getAttribute('data-comment-id');
      const comment = this.comments.get(commentId);
      if (comment) {
        console.log('Comment text clicked:', commentId);
        // 通知React组件打开侧边栏并跳转到对应评论
        this.onCommentClick(comment, commentId);
        return;
      }
    }

    // 检查是否点击了评论相关的UI元素
    const isCommentRelated =
      event.target.closest('.comment-button') ||
      event.target.closest('[data-testid="comment-button"]') ||
      event.target.closest('.ant-btn') ||
      event.target.closest('.ql-editor') ||
      event.target.closest('.ant-modal') ||
      event.target.closest('.ant-drawer');

    // 如果点击的不是评论相关元素，隐藏评论按钮
    if (!isCommentRelated) {
      this.hideCommentButton();
    }
  }
  /**
   * 创建浮动评论按钮
   */
  createCommentButton() {
    console.log('Creating comment button');
    this.commentButton = document.createElement('div');
    this.commentButton.className = 'comment-button';
    this.commentButton.innerHTML = `
      <button class="comment-btn">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 2h12a1 1 0 011 1v8a1 1 0 01-1 1H4l-2 2V3a1 1 0 011-1z"
                fill="currentColor"/>
        </svg>
        <span>添加评论</span>
          </button>
    `;

    // 修复样式 - 使用fixed定位和更高z-index
    this.commentButton.style.cssText = `
      position: fixed !important;
      z-index: 9999 !important;
      display: none;
      background: white !important;
      border: 2px solid #007bff !important;
      border-radius: 6px !important;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2) !important;
      padding: 4px !important;
    `;

    document.body.appendChild(this.commentButton);

    // 绑定点击事件
    this.commentButton.addEventListener('click', e => {
      e.stopPropagation();
      console.log('Comment button clicked');
      this.createComment();
    });

    console.log('Comment button created and added to DOM');
  }
  /**
   * 显示评论按钮 - 使用React组件
   */
  showCommentButton(range) {
    console.log('Showing comment button for range:', range);
    try {
      const bounds = this.quill.getBounds(range.index, range.length);
      const editorRect = this.quill.container.getBoundingClientRect();

      // 计算按钮位置
      const left = editorRect.left + bounds.right + 10;
      const top = editorRect.top + bounds.top;

      console.log('Button position:', { bounds, editorRect, left, top });

      // 通知React组件显示按钮
      this.onShowCommentButton({
        visible: true,
        position: { left, top },
      });

      console.log('Comment button shown via React component');
    } catch (error) {
      console.error('Error showing comment button:', error);
    }
  }

  /**
   * 隐藏评论按钮 - 使用React组件
   */
  hideCommentButton() {
    // 通知React组件隐藏按钮
    this.onHideCommentButton();
    console.log('Comment button hidden via React component');
  }

  /**
   * 创建评论 - 使用React组件
   */
  createComment() {
    console.log('createComment called, selectedRange:', this.selectedRange);

    if (!this.selectedRange) {
      console.warn('No selected range for comment');
      return;
    }

    const selectedText = this.quill.getText(
      this.selectedRange.index,
      this.selectedRange.length,
    );

    console.log('Selected text for comment:', selectedText);

    // 存储当前选中的文本和范围，以便在提交时使用
    this.currentSelectedText = selectedText;
    this.currentSelectedRange = { ...this.selectedRange };

    // 通知React组件显示评论模态框
    console.log('Calling onShowCommentModal with:', {
      visible: true,
      selectedText: selectedText,
      textLength: selectedText.length,
    });

    this.onShowCommentModal({
      visible: true,
      selectedText: selectedText,
      onSubmit: content => this.handleCommentSubmit(content, selectedText),
    });
  }

  /**
   * 处理评论提交
   */
  handleCommentSubmit(content, selectedText) {
    console.log('Handling comment submit:', { content, selectedText });

    // 使用存储的选中文本和范围，确保数据一致性
    const finalSelectedText = selectedText || this.currentSelectedText;
    const finalSelectedRange = this.currentSelectedRange || this.selectedRange;

    if (!finalSelectedRange) {
      console.error('No selected range available for comment');
      return Promise.reject(new Error('No selected range'));
    }

    const commentId = this.generateId();
    this.saveComment(commentId, content, finalSelectedText, finalSelectedRange);

    // 隐藏按钮和模态框
    this.hideCommentButton();

    // 清理临时存储的数据
    this.currentSelectedText = null;
    this.currentSelectedRange = null;

    return Promise.resolve(); // 返回Promise以支持async处理
  }

  /**
   * 保存评论
   */
  saveComment(commentId, content, selectedText, selectedRange) {
    const userState = this.awareness.getLocalState();
    const range = selectedRange || this.selectedRange;

    const comment = {
      id: commentId,
      range: { ...range },
      content: content,
      selectedText: selectedText,
      author: userState?.user?.name || '匿名用户',
      authorColor: userState?.user?.color || '#007bff',
      timestamp: Date.now(),
      resolved: false,
      replies: [],
    };

    console.log('Saving comment:', comment);

    // 保存到本地缓存
    this.comments.set(commentId, comment);

    // 同步到Yjs
    this.yComments.set(commentId, comment);

    // 添加文本标记
    this.addCommentMark(comment);

    // 通知React组件评论数据变化
    this.onCommentsChange(Array.from(this.comments.values()));
    this.onCommentCreate(comment);
  }

  /**
   * 添加评论标记到文本
   */
  addCommentMark(comment) {
    const { range } = comment;
    try {
      // 使用Quill的formatText方法添加自定义格式
      this.quill.formatText(range.index, range.length, 'comment', comment.id);
      console.log('Comment mark added for:', comment.id);
    } catch (error) {
      console.error('Error adding comment mark:', error);
    }
  }

  /**
   * 移除评论标记
   */
  removeCommentMark(commentId) {
    const comment = this.comments.get(commentId);
    if (comment) {
      try {
        this.quill.formatText(
          comment.range.index,
          comment.range.length,
          'comment',
          false,
        );
        console.log('Comment mark removed for:', commentId);
      } catch (error) {
        console.error('Error removing comment mark:', error);
      }
    }
  }

  /**
   * 处理Yjs评论数据变化
   */
  handleCommentsChange(event) {
    console.log('Comments changed:', event);

    event.changes.keys.forEach((change, key) => {
      if (change.action === 'add') {
        const comment = this.yComments.get(key);
        this.comments.set(key, comment);
        this.addCommentMark(comment);
      } else if (change.action === 'delete') {
        this.removeCommentMark(key);
        this.comments.delete(key);
      } else if (change.action === 'update') {
        const comment = this.yComments.get(key);
        this.comments.set(key, comment);
      }
    });

    // 通知React组件评论数据变化
    this.onCommentsChange(Array.from(this.comments.values()));
  }

  /**
   * 创建评论面板
   */
  createCommentPanel() {
    this.commentPanel = document.createElement('div');
    this.commentPanel.className = 'comments-panel';
    this.commentPanel.innerHTML = `
      <div class="comments-header">
        <h3>评论 (<span class="comments-count">0</span>)</h3>
        <button class="toggle-panel" type="button">−</button>
      </div>
      <div class="comments-list"></div>
    `;
    // 设置面板样式
    this.commentPanel.style.cssText = `
      position: fixed;
      right: 20px;
      top: 100px;
      width: 320px;
      max-height: 60vh;
      background: white;
      border: 1px solid #dee2e6;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
      z-index: 1000;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: none;
    `;

    document.body.appendChild(this.commentPanel);

    // 绑定折叠事件
    const toggleBtn = this.commentPanel.querySelector('.toggle-panel');
    const commentsList = this.commentPanel.querySelector('.comments-list');

    toggleBtn.addEventListener('click', () => {
      const isCollapsed = commentsList.style.display === 'none';
      commentsList.style.display = isCollapsed ? 'block' : 'none';
      toggleBtn.textContent = isCollapsed ? '−' : '+';
    });

    console.log('Comment panel created');
  }

  /**
   * 显示评论面板
   */
  showCommentPanel() {
    if (this.commentPanel) {
      this.commentPanel.style.display = 'block';
      console.log('Comment panel shown');
    }
  }

  /**
   * 渲染评论面板
   */
  renderCommentPanel() {
    if (!this.commentPanel) return;

    const commentsList = this.commentPanel.querySelector('.comments-list');
    const commentsCount = this.commentPanel.querySelector('.comments-count');

    commentsList.innerHTML = '';

    // 按时间排序评论
    const sortedComments = Array.from(this.comments.values()).sort(
      (a, b) => b.timestamp - a.timestamp,
    );

    commentsCount.textContent = sortedComments.length;

    if (sortedComments.length === 0) {
      commentsList.innerHTML =
        '<div class="no-comments" style="padding: 40px 20px; text-align: center; color: #6c757d; font-style: italic;">暂无评论</div>';
      return;
    }

    sortedComments.forEach(comment => {
      const commentElement = this.createCommentElement(comment);
      commentsList.appendChild(commentElement);
    });

    console.log(
      'Comment panel rendered with',
      sortedComments.length,
      'comments',
    );
  }

  /**
   * 创建单个评论元素
   */
  createCommentElement(comment) {
    const element = document.createElement('div');
    element.className = `comment-item ${comment.resolved ? 'resolved' : ''}`;
    element.style.cssText = `
      padding: 16px 20px;
      border-bottom: 1px solid #f0f0f0;
      cursor: pointer;
      transition: background-color 0.2s ease;
    `;

    element.innerHTML = `
      <div class="comment-content">
        <div class="comment-meta" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span class="comment-author" style="font-size: 13px; font-weight: 600; color: ${comment.authorColor};">
            ${comment.author}
          </span>
          <span class="comment-time" style="font-size: 11px; color: #6c757d;">
            ${this.formatTime(comment.timestamp)}
          </span>
        </div>
        <div class="comment-text" style="font-style: italic; color: #6c757d; font-size: 12px; margin-bottom: 10px; padding: 6px 10px; background: #f8f9fa; border-radius: 6px; border-left: 3px solid ${comment.resolved ? '#28a745' : '#ffc107'}; line-height: 1.4;">
          "${comment.selectedText}"
        </div>
        <div class="comment-message" style="font-size: 14px; line-height: 1.5; margin-bottom: 12px; color: #333; word-wrap: break-word;">
          ${comment.content}
        </div>
        ${
          comment.resolved
            ? `
          <div class="comment-resolved-info" style="background: #d4edda; color: #155724; padding: 6px 10px; border-radius: 4px; font-size: 11px; margin-bottom: 8px; border-left: 3px solid #28a745;">
            ✅ 已由 <strong>${comment.resolvedBy}</strong> 于 ${this.formatTime(comment.resolvedAt)} 标记为已解决
          </div>
        `
            : ''
        }
        <div class="comment-actions" style="display: flex; gap: 8px;">
          <button class="reply-btn" data-id="${comment.id}" type="button" style="font-size: 11px; padding: 4px 8px; border: 1px solid #dee2e6; background: white; border-radius: 4px; cursor: pointer; color: #6c757d; font-weight: 500;">回复</button>
          <button class="resolve-btn" data-id="${comment.id}" type="button" style="font-size: 11px; padding: 4px 8px; border: 1px solid ${comment.resolved ? '#28a745' : '#ffc107'}; background: ${comment.resolved ? '#d4edda' : 'white'}; color: ${comment.resolved ? '#155724' : '#856404'}; border-radius: 4px; cursor: pointer; font-weight: 500;">
            ${comment.resolved ? '🔄 重新打开' : '✅ 标记解决'}
          </button>
          <button class="delete-btn" data-id="${comment.id}" type="button" style="font-size: 11px; padding: 4px 8px; border: 1px solid #dc3545; background: white; border-radius: 4px; cursor: pointer; color: #dc3545; font-weight: 500;">🗑️ 删除</button>
        </div>
      </div>
    `;

    // 绑定事件
    element.addEventListener('click', e => {
      if (!e.target.closest('.comment-actions')) {
        this.highlightCommentText(comment);
      }
    });

    element.addEventListener('mouseenter', () => {
      element.style.backgroundColor = '#f8f9fa';
    });

    element.addEventListener('mouseleave', () => {
      element.style.backgroundColor = 'transparent';
    });

    // 绑定按钮事件
    const resolveBtn = element.querySelector('.resolve-btn');
    const deleteBtn = element.querySelector('.delete-btn');

    resolveBtn.addEventListener('click', e => {
      e.stopPropagation();
      this.toggleResolveComment(comment.id);
    });

    deleteBtn.addEventListener('click', e => {
      e.stopPropagation();
      this.deleteComment(comment.id);
    });

    return element;
  }

  /**
   * 高亮评论对应的文本
   */
  highlightCommentText(comment) {
    this.quill.setSelection(comment.range.index, comment.range.length);

    // 滚动到对应位置
    try {
      const bounds = this.quill.getBounds(
        comment.range.index,
        comment.range.length,
      );
      this.quill.container.scrollTop = bounds.top - 100;
    } catch (error) {
      console.error('Error scrolling to comment:', error);
    }
  }

  /**
   * 切换评论解决状态
   */
  toggleResolveComment(commentId) {
    const comment = this.comments.get(commentId);
    if (!comment) return;

    const wasResolved = comment.resolved;
    const currentUser =
      this.awareness.getLocalState()?.user?.name || '匿名用户';

    // 更新解决状态
    comment.resolved = !comment.resolved;
    comment.resolvedBy = comment.resolved ? currentUser : null;
    comment.resolvedAt = comment.resolved ? Date.now() : null;

    // 如果是重新打开，记录操作
    if (wasResolved && !comment.resolved) {
      comment.reopenedBy = currentUser;
      comment.reopenedAt = Date.now();
    }

    // 更新数据
    this.comments.set(commentId, comment);
    this.yComments.set(commentId, comment);

    // 更新文本标记样式
    this.updateCommentMarkStyle(comment);

    // 通知React组件评论数据变化
    this.onCommentsChange(Array.from(this.comments.values()));

    // 日志记录
    console.log(
      `Comment ${comment.resolved ? 'resolved' : 'reopened'} by ${currentUser}:`,
      commentId,
    );

    // 可选：显示操作反馈
    this.showResolveNotification(comment);
  }

  /**
   * 更新评论标记样式
   */
  updateCommentMarkStyle(comment) {
    const elements = document.querySelectorAll(
      `[data-comment-id="${comment.id}"]`,
    );
    elements.forEach(element => {
      if (comment.resolved) {
        element.classList.add('comment-resolved');
        element.style.opacity = '0.6';
        element.style.backgroundColor = '#e8f5e8 !important';
        element.style.borderBottomColor = '#28a745 !important';
      } else {
        element.classList.remove('comment-resolved');
        element.style.opacity = '1';
        element.style.backgroundColor = '#fff3cd !important';
        element.style.borderBottomColor = '#ffc107 !important';
      }
    });
  }

  /**
   * 显示解决操作的通知
   */
  showResolveNotification(comment) {
    const action = comment.resolved ? '已解决' : '重新打开';
    const message = `评论"${this.truncateText(comment.selectedText, 15)}"${action}`;

    // 创建通知元素
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${comment.resolved ? '#d4edda' : '#fff3cd'};
      color: ${comment.resolved ? '#155724' : '#856404'};
      padding: 12px 16px;
      border-radius: 6px;
      border: 1px solid ${comment.resolved ? '#c3e6cb' : '#ffeaa7'};
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      z-index: 10001;
      font-size: 14px;
      max-width: 300px;
      animation: slideInRight 0.3s ease;
    `;

    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span>${comment.resolved ? '✅' : '🔄'}</span>
        <span>${message}</span>
      </div>
    `;

    document.body.appendChild(notification);

    // 3秒后自动移除
    setTimeout(() => {
      if (document.body.contains(notification)) {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 300);
      }
    }, 3000);
  }

  /**
   * 获取评论统计信息
   */
  getCommentStats() {
    const allComments = Array.from(this.comments.values());
    return {
      total: allComments.length,
      resolved: allComments.filter(c => c.resolved).length,
      unresolved: allComments.filter(c => !c.resolved).length,
      byAuthor: allComments.reduce((acc, comment) => {
        acc[comment.author] = (acc[comment.author] || 0) + 1;
        return acc;
      }, {}),
    };
  }

  /**
   * 批量解决评论
   */
  resolveAllComments() {
    if (confirm('确定要将所有评论标记为已解决吗？')) {
      const currentUser =
        this.awareness.getLocalState()?.user?.name || '匿名用户';
      const currentTime = Date.now();

      this.comments.forEach((comment, commentId) => {
        if (!comment.resolved) {
          comment.resolved = true;
          comment.resolvedBy = currentUser;
          comment.resolvedAt = currentTime;

          this.comments.set(commentId, comment);
          this.yComments.set(commentId, comment);
          this.updateCommentMarkStyle(comment);
        }
      });

      this.renderCommentPanel();
      console.log(`All comments resolved by ${currentUser}`);
    }
  }

  /**
   * 过滤评论（显示/隐藏已解决的评论）
   */
  filterComments(showResolved = true) {
    this.showResolvedComments = showResolved;
    this.renderCommentPanel();
  }

  /**
   * 删除评论
   */
  deleteComment(commentId) {
    // 移除重复的确认逻辑，确认已在UI层处理
    this.removeCommentMark(commentId);
    this.comments.delete(commentId);
    this.yComments.delete(commentId);

    // 通知React组件评论数据变化
    this.onCommentsChange(Array.from(this.comments.values()));

    console.log('Comment deleted:', commentId);
  }

  /**
   * 加载现有评论
   */
  loadExistingComments() {
    this.yComments.forEach((comment, commentId) => {
      this.comments.set(commentId, comment);
      this.addCommentMark(comment);
    });
    this.renderCommentPanel();
    console.log('Existing comments loaded');
  }

  /**
   * 工具函数 - 生成唯一ID
   */
  generateId() {
    return (
      'comment_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    );
  }

  /**
   * 工具函数 - 格式化时间
   */
  formatTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) {
      // 1分钟内
      return '刚刚';
    } else if (diff < 3600000) {
      // 1小时内
      return `${Math.floor(diff / 60000)}分钟前`;
    } else if (diff < 86400000) {
      // 1天内
      return `${Math.floor(diff / 3600000)}小时前`;
    } else {
      return new Date(timestamp).toLocaleDateString();
    }
  }

  /**
   * 工具函数 - 截断文本
   */
  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  /**
   * 清理资源
   */
  destroy() {
    // 清理定时器
    if (this.selectionTimer) {
      clearTimeout(this.selectionTimer);
    }

    // 移除事件监听
    document.removeEventListener('click', this.handleDocumentClick.bind(this));
    document.removeEventListener(
      'commentClick',
      this.handleCommentClickEvent.bind(this),
    );

    // 移除DOM元素
    if (this.commentButton) {
      document.body.removeChild(this.commentButton);
    }

    if (this.commentPanel) {
      document.body.removeChild(this.commentPanel);
    }

    // 清理引用
    this.comments.clear();

    console.log('CommentManager destroyed');
  }
}

export default CommentManager;
