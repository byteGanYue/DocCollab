import React from 'react';
import { Button, Input, Tooltip } from 'antd';
import {
  SaveOutlined,
  ShareAltOutlined,
  DownloadOutlined,
  DownOutlined,
} from '@ant-design/icons';
import styles from './editor.module.less';

const EditorHeader = ({
  documentTitle,
  setDocumentTitle,
  username,
  handleUsernameChange,
  users,
  saveLoading,
  onSave,
  onShare,
  onDownload,
}) => {
  return (
    <>
      {/* 文档操作栏 */}
      <div className="editor-actions">
        <div className="document-title">
          <Input
            value={documentTitle}
            onChange={e => setDocumentTitle(e.target.value)}
            placeholder="输入文档标题"
            bordered={false}
            style={{ fontSize: '16px', fontWeight: '600' }}
          />
        </div>
        <div className="action-buttons">
          <Tooltip title="保存文档">
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={saveLoading}
              onClick={onSave}
            >
              保存
            </Button>
          </Tooltip>
          <Tooltip title="分享文档">
            <Button icon={<ShareAltOutlined />} onClick={onShare}>
              分享
            </Button>
          </Tooltip>
          <Tooltip title="下载文档 (支持多种格式)">
            <Button
              icon={<DownloadOutlined />}
              onClick={onDownload}
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              下载
              <DownOutlined style={{ fontSize: '12px' }} />
            </Button>
          </Tooltip>
        </div>
      </div>

      <div className={styles.editorHeader}>
        <input
          type="text"
          value={username}
          onChange={handleUsernameChange}
          placeholder="输入用户名"
          className={styles.usernameInput}
        />
        <div className={styles.usersList}>
          {users.map((user, index) => (
            <div
              key={index}
              style={{ color: user.color }}
              className={styles.userItem}
            >
              • {user.name}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default EditorHeader;
