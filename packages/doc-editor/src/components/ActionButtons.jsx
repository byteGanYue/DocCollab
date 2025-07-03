import React, { useState } from 'react';
import { Button, Modal } from 'antd';
const ActionButtons = ({ onBackHistoryProps, onAI, onHelp }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Ensure onBackHistoryProps has default values
  const backHistoryProps = onBackHistoryProps || {
    versionId: null,
    isShow: false,
    onClick: () => {},
  };

  // 显示确认弹窗
  const showModal = () => {
    setIsModalOpen(true);
  };

  // 确认回退版本
  const handleOk = () => {
    setIsModalOpen(false);
    if (backHistoryProps.onClick) {
      backHistoryProps.onClick();
    }
  };

  // 取消回退版本
  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: '12px',
      }}
    >
      {backHistoryProps.isShow && (
        <Button type="warning" onClick={showModal}>
          版本回退
        </Button>
      )}
      <Button onClick={onAI} type="primary">
        AI摘要
      </Button>
      <button
        onClick={onHelp}
        style={{
          padding: '8px 16px',
          fontSize: '14px',
          fontWeight: '500',
          border: '1px solid #6c757d',
          borderRadius: '6px',
          backgroundColor: '#ffffff',
          color: '#6c757d',
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out',
          outline: 'none',
          minWidth: '80px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        <span className="material-icons" style={{ fontSize: '16px' }}>
          help_outline
        </span>
        使用说明
      </button>

      {/* Antd Modal 确认弹窗 */}
      <Modal
        title="确认回退版本"
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        okText="确认回退"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <p>您确定要回退到版本 #{backHistoryProps.versionId} 吗？</p>
        <p>回退后当前版本的内容将被覆盖，此操作不可逆。</p>
      </Modal>
    </div>
  );
};

export default ActionButtons;
