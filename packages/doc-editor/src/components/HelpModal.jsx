import React from 'react';

/**
 * 帮助弹窗组件
 * 显示富文本编辑器的使用说明和功能介绍
 * @param {boolean} isOpen - 弹窗是否打开
 * @param {function} onClose - 关闭弹窗的回调函数
 */
const HelpModal = ({ isOpen, onClose }) => {
  // 如果弹窗未打开，不渲染任何内容
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={e => {
        // 点击弹窗外部区域关闭弹窗
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          maxWidth: '800px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
          position: 'relative',
        }}
      >
        {/* 弹窗头部 */}
        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid #e9ecef',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            backgroundColor: '#ffffff',
            borderRadius: '12px 12px 0 0',
          }}
        >
          <h3
            style={{
              margin: 0,
              color: '#212529',
              fontSize: '18px',
              fontWeight: '600',
            }}
          >
            富文本编辑器使用说明
          </h3>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6c757d',
              transition: 'all 0.2s ease-in-out',
            }}
            onMouseEnter={e => {
              e.target.style.backgroundColor = '#f8f9fa';
              e.target.style.color = '#495057';
            }}
            onMouseLeave={e => {
              e.target.style.backgroundColor = 'none';
              e.target.style.color = '#6c757d';
            }}
          >
            <span className="material-icons" style={{ fontSize: '20px' }}>
              close
            </span>
          </button>
        </div>

        {/* 弹窗内容 */}
        <div
          style={{
            padding: '24px',
            fontSize: '14px',
            color: '#495057',
            lineHeight: '1.6',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '24px',
            }}
          >
            {/* 左侧内容 */}
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h4
                  style={{
                    margin: '0 0 12px 0',
                    color: '#212529',
                    fontSize: '16px',
                    fontWeight: '600',
                  }}
                >
                  🎯 强制布局特性
                </h4>
                <ul style={{ margin: '0', paddingLeft: '20px' }}>
                  <li style={{ marginBottom: '4px' }}>
                    文档始终保持标题在顶部
                  </li>
                  <li style={{ marginBottom: '4px' }}>至少保持一个段落内容</li>
                  <li style={{ marginBottom: '4px' }}>
                    删除所有内容会自动恢复
                  </li>
                  <li style={{ marginBottom: '4px' }}>
                    标题和段落的强制性结构
                  </li>
                </ul>
              </div>

              <div>
                <h4
                  style={{
                    margin: '0 0 12px 0',
                    color: '#212529',
                    fontSize: '16px',
                    fontWeight: '600',
                  }}
                >
                  ⌨️ 键盘快捷键
                </h4>
                <ul style={{ margin: '0', paddingLeft: '20px' }}>
                  <li style={{ marginBottom: '4px' }}>
                    <kbd
                      style={{
                        padding: '2px 6px',
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #dee2e6',
                        borderRadius: '3px',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                      }}
                    >
                      Ctrl/Cmd + B
                    </kbd>{' '}
                    - 粗体
                  </li>
                  <li style={{ marginBottom: '4px' }}>
                    <kbd
                      style={{
                        padding: '2px 6px',
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #dee2e6',
                        borderRadius: '3px',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                      }}
                    >
                      Ctrl/Cmd + I
                    </kbd>{' '}
                    - 斜体
                  </li>
                  <li style={{ marginBottom: '4px' }}>
                    <kbd
                      style={{
                        padding: '2px 6px',
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #dee2e6',
                        borderRadius: '3px',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                      }}
                    >
                      Ctrl/Cmd + U
                    </kbd>{' '}
                    - 下划线
                  </li>
                  <li style={{ marginBottom: '4px' }}>
                    <kbd
                      style={{
                        padding: '2px 6px',
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #dee2e6',
                        borderRadius: '3px',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                      }}
                    >
                      Ctrl/Cmd + `
                    </kbd>{' '}
                    - 代码
                  </li>
                </ul>
              </div>
            </div>

            {/* 右侧内容 */}
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h4
                  style={{
                    margin: '0 0 12px 0',
                    color: '#212529',
                    fontSize: '16px',
                    fontWeight: '600',
                  }}
                >
                  🛠️ 工具栏功能
                </h4>
                <ul style={{ margin: '0', paddingLeft: '20px' }}>
                  <li style={{ marginBottom: '4px' }}>
                    文本格式化（粗体、斜体、下划线、代码）
                  </li>
                  <li style={{ marginBottom: '4px' }}>标题设置（H1、H2）</li>
                  <li style={{ marginBottom: '4px' }}>
                    引用块、列表（有序、无序）
                  </li>
                  <li style={{ marginBottom: '4px' }}>
                    文本对齐（左、中、右、两端对齐）
                  </li>
                </ul>
              </div>

              <div>
                <h4
                  style={{
                    margin: '0 0 12px 0',
                    color: '#212529',
                    fontSize: '16px',
                    fontWeight: '600',
                  }}
                >
                  🧪 实验功能
                </h4>
                <ul style={{ margin: '0', paddingLeft: '20px' }}>
                  <li style={{ marginBottom: '4px' }}>
                    尝试删除标题，看看会发生什么
                  </li>
                  <li style={{ marginBottom: '4px' }}>尝试删除所有段落内容</li>
                  <li style={{ marginBottom: '4px' }}>
                    编辑器会自动恢复必要的结构
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* 底部提示 */}
          <div
            style={{
              marginTop: '24px',
              padding: '16px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef',
              textAlign: 'center',
            }}
          >
            <p style={{ margin: 0, color: '#6c757d', fontSize: '13px' }}>
              💡 提示：点击弹窗外部区域或右上角关闭按钮即可关闭此说明窗口
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
