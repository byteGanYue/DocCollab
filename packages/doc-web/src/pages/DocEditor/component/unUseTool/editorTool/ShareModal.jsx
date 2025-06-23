import React from 'react';
import { Modal, Button, Input, Space } from 'antd';
import { CopyOutlined } from '@ant-design/icons';

const ShareModal = ({
  shareModalVisible,
  setShareModalVisible,
  shareUrl,
  onCopyUrl,
}) => {
  return (
    <Modal
      title="分享文档"
      open={shareModalVisible}
      onCancel={() => setShareModalVisible(false)}
      footer={[
        <Button key="copy" icon={<CopyOutlined />} onClick={onCopyUrl}>
          复制链接
        </Button>,
        <Button key="cancel" onClick={() => setShareModalVisible(false)}>
          关闭
        </Button>,
      ]}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <p>复制以下链接分享给其他人：</p>
        <Input.TextArea
          value={shareUrl}
          rows={3}
          readOnly
          placeholder="分享链接"
        />
      </Space>
    </Modal>
  );
};

export default ShareModal;
