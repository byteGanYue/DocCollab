import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Dropdown,
  Space,
  Tag,
  Typography,
  message,
  Modal,
  Breadcrumb,
} from 'antd';
import {
  FileTextOutlined,
  MoreOutlined,
  HistoryOutlined,
  HomeOutlined,
  ReloadOutlined,
  EyeOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { documentAPI } from '@/utils/api';
import styles from './index.module.less';
import { useUser } from '@/hooks/useAuth';

const { Text } = Typography;

/**
 * 文档历史版本页面组件
 *
 * 功能特性：
 * - 显示指定文档的所有历史版本
 * - 支持查看版本详情、恢复版本等操作
 * - 响应式设计：适配不同屏幕尺寸
 * - 交互操作：支持点击查看版本、恢复版本等
 */
const HistoryVersion = () => {
  const navigate = useNavigate();
  const { id: documentId } = useParams(); // 从路由参数获取文档ID
  const { userInfo } = useUser(); // 获取用户信息

  // 版本历史数据状态
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [documentInfo, setDocumentInfo] = useState(null);

  // 分页状态
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50,
    total: 0,
  });

  // 恢复版本确认弹窗状态
  const [restoreModal, setRestoreModal] = useState({
    visible: false,
    version: null,
    loading: false,
  });

  /**
   * 格式化时间显示
   * @param {string} dateString - 时间字符串
   * @returns {string} 格式化后的时间文本
   */
  const formatTime = dateString => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      const diffMinutes = Math.floor(diffTime / (1000 * 60));

      if (diffHours === 0) {
        return `${diffMinutes < 1 ? 1 : diffMinutes}分钟前`;
      }
      return `${diffHours}小时前`;
    } else if (diffDays === 1) {
      return '昨天';
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  /**
   * 获取文档基本信息
   */
  const fetchDocumentInfo = useCallback(async () => {
    if (!documentId || !userInfo) return;

    try {
      const userId = userInfo.userId || userInfo._id;
      const response = await documentAPI.getDocument(documentId, userId);

      if (response.success) {
        setDocumentInfo(response.data);
      } else {
        message.error('获取文档信息失败');
      }
    } catch (error) {
      console.error('获取文档信息失败:', error);
      message.error('获取文档信息失败，请重试');
    }
  }, [documentId, userInfo]);

  /**
   * 获取文档历史版本数据
   * @param {number} page - 页码
   * @param {number} pageSize - 每页数量
   */
  const fetchVersionHistory = useCallback(
    async (page = 1, pageSize = 50) => {
      if (!documentId || !userInfo) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        // 调用后端历史版本API
        const response = await documentAPI.getDocumentHistory(
          documentId,
          page,
          pageSize,
        );

        if (response.success) {
          const {
            versions: versionList,
            total,
            page: currentPage,
            limit,
          } = response.data;

          // 将后端数据转换为前端需要的格式
          const formattedVersions = versionList.map((version, index) => ({
            id: version._id,
            versionId: version.versionId, // 保留原始版本ID用于API调用
            versionNumber: `v${version.versionId}`,
            documentName: version.documentName || '未知文档',
            updatedBy:
              version.update_username || version.create_username || '未知用户',
            updatedAt: version.update_time || version.create_time,
            content: version.content || '', // 版本内容
            isCurrent: index === 0 && page === 1, // 只有第一页的第一个版本才是当前版本
            changeDescription: version.changeDescription || '', // 版本变更描述
          }));

          setVersions(formattedVersions);

          // 更新分页信息
          setPagination({
            current: currentPage || page,
            pageSize: limit || pageSize,
            total: total || formattedVersions.length,
          });
        } else {
          throw new Error(response.message || '获取历史版本失败');
        }
      } catch (error) {
        console.error('获取历史版本失败:', error);

        // 如果API不存在，使用模拟数据
        console.warn('历史版本API可能未实现，使用模拟数据');
        const mockVersions = [
          {
            id: 'v1',
            versionId: 1,
            versionNumber: 'v1.0',
            documentName: documentInfo?.documentName || '文档标题',
            updatedBy: userInfo.username || '当前用户',
            updatedAt: new Date().toISOString(),
            content: '',
            isCurrent: true,
            changeDescription: '初始版本',
          },
        ];

        setVersions(mockVersions);
        setPagination({
          current: 1,
          pageSize: pageSize,
          total: mockVersions.length,
        });

        message.warning('历史版本功能正在开发中，显示模拟数据');
      } finally {
        setLoading(false);
      }
    },
    [documentId, userInfo, documentInfo?.documentName],
  );

  /**
   * 处理查看版本详情 - 跳转到文档编辑页面
   * @param {Object} version - 版本对象
   */
  const handleViewVersion = async version => {
    try {
      // 判断是否为当前版本
      if (version.isCurrent) {
        // 最新版本，跳转到普通编辑页面
        navigate(`/doc-editor/${documentId}`);
      } else {
        // 历史版本，跳转到版本查看页面
        navigate(`/doc-editor/${documentId}?version=${version.versionId}`);
      }
    } catch (error) {
      console.error('跳转到文档编辑页面失败:', error);
      message.error('跳转失败，请重试');
    }
  };

  /**
   * 处理表格行点击事件
   * @param {Object} record - 行数据
   */
  const handleRowClick = record => {
    handleViewVersion(record);
  };

  /**
   * 处理恢复版本
   * @param {Object} version - 版本对象
   */
  const handleRestoreVersion = version => {
    if (version.isCurrent) {
      message.info('这已经是当前版本了');
      return;
    }

    setRestoreModal({
      visible: true,
      version,
      loading: false,
    });
  };

  /**
   * 确认恢复版本
   */
  const confirmRestoreVersion = async () => {
    const { version } = restoreModal;
    if (!version) return;

    setRestoreModal(prev => ({ ...prev, loading: true }));

    try {
      // 调用恢复版本API
      const response = await documentAPI.restoreDocument(
        documentId,
        version.versionId,
      );

      if (response.success) {
        message.success(`已恢复到版本 ${version.versionNumber}`);
        setRestoreModal({ visible: false, version: null, loading: false });

        // 刷新版本列表
        fetchVersionHistory(pagination.current, pagination.pageSize);

        // 刷新文档信息
        fetchDocumentInfo();
      } else {
        throw new Error(response.message || '恢复版本失败');
      }
    } catch (error) {
      console.error('恢复版本失败:', error);
      message.error('恢复版本功能正在开发中');
      setRestoreModal(prev => ({ ...prev, loading: false }));
    }
  };

  /**
   * 取消恢复版本
   */
  const cancelRestoreVersion = () => {
    setRestoreModal({ visible: false, version: null, loading: false });
  };

  /**
   * 获取更多操作菜单
   * @param {Object} version - 版本对象
   * @returns {React.ReactElement} 下拉菜单组件
   */
  const getMoreActions = version => {
    const menuItems = [
      {
        key: 'view',
        label: '查看版本详情',
        icon: <EyeOutlined />,
      },
      ...(version.isCurrent
        ? []
        : [
            {
              key: 'restore',
              label: '恢复到此版本',
              icon: <ReloadOutlined />,
            },
          ]),
    ];

    // 处理菜单点击事件
    const handleMenuClick = ({ key, domEvent }) => {
      domEvent.stopPropagation(); // 阻止事件冒泡

      if (key === 'view') {
        handleViewVersion(version);
      } else if (key === 'restore') {
        handleRestoreVersion(version);
      }
    };

    return (
      <Dropdown
        menu={{
          items: menuItems,
          onClick: handleMenuClick,
        }}
        trigger={['click']}
        placement="bottomRight"
      >
        <Button
          type="text"
          icon={<MoreOutlined />}
          size="small"
          onClick={e => e.stopPropagation()}
        />
      </Dropdown>
    );
  };

  // 表格列定义
  const columns = [
    {
      title: '版本',
      dataIndex: 'versionNumber',
      key: 'versionNumber',
      width: '15%',
      render: (versionNumber, record) => (
        <div className={styles.versionCell}>
          <Space size="small">
            <HistoryOutlined style={{ color: '#1890ff' }} />
            <Text className={styles.versionText}>{versionNumber}</Text>
            {record.isCurrent && (
              <Tag color="green" size="small">
                当前版本
              </Tag>
            )}
          </Space>
        </div>
      ),
    },
    {
      title: '文档名称',
      dataIndex: 'documentName',
      key: 'documentName',
      width: '35%',
      render: documentName => (
        <div className={styles.titleCell}>
          <Space size="small">
            <FileTextOutlined style={{ color: '#8c8c8c' }} />
            <Text className={styles.titleText}>{documentName}</Text>
          </Space>
        </div>
      ),
    },
    {
      title: '更新人',
      dataIndex: 'updatedBy',
      key: 'updatedBy',
      width: '20%',
      render: updatedBy => (
        <div className={styles.ownerCell}>
          <Text className={styles.ownerName}>{updatedBy}</Text>
        </div>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: '25%',
      render: time => (
        <Text className={styles.timeText}>{formatTime(time)}</Text>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: '5%',
      render: (_, record) => getMoreActions(record),
    },
  ];

  /**
   * 处理分页变化
   * @param {number} page - 新页码
   * @param {number} pageSize - 新的每页数量
   */
  const handlePageChange = (page, pageSize) => {
    fetchVersionHistory(page, pageSize || 50);
  };

  // 组件挂载时获取数据
  useEffect(() => {
    if (userInfo && documentId) {
      fetchDocumentInfo();
      fetchVersionHistory(1, 50);
    }
  }, [userInfo, documentId, fetchDocumentInfo, fetchVersionHistory]);

  return (
    <div className={styles.container}>
      {/* 面包屑导航 */}
      <div className={styles.breadcrumb}>
        <Breadcrumb
          items={[
            {
              title: (
                <Button
                  type="link"
                  icon={<HomeOutlined />}
                  onClick={() => navigate('/home')}
                  className={styles.breadcrumbLink}
                >
                  首页
                </Button>
              ),
            },
            {
              title: (
                <Button
                  type="link"
                  icon={<ArrowLeftOutlined />}
                  onClick={() => navigate(`/doc-editor/${documentId}`)}
                  className={styles.breadcrumbLink}
                >
                  返回编辑器
                </Button>
              ),
            },
            {
              title: (
                <Space>
                  <HistoryOutlined />
                  历史版本
                </Space>
              ),
            },
          ]}
        />
      </div>

      {/* 页面头部 */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>
            {documentInfo?.documentName || '文档'} - 历史版本
          </h1>
          <Text className={styles.subtitle}>查看和管理文档的历史版本记录</Text>
        </div>
        <div className={styles.actions}>
          <Button
            icon={<ReloadOutlined />}
            onClick={() =>
              fetchVersionHistory(pagination.current, pagination.pageSize || 50)
            }
            loading={loading}
          >
            刷新
          </Button>
        </div>
      </div>

      {/* 版本列表 */}
      <div className={styles.content}>
        <Table
          columns={columns}
          dataSource={versions}
          loading={loading}
          rowKey="id"
          locale={{
            emptyText: '暂无历史版本记录',
          }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showQuickJumper: true,
            position: ['bottomCenter'],
            showTotal: (total, range) =>
              `共 ${total} 个版本，显示 ${range[0]}-${range[1]} 个`,
            onChange: handlePageChange,
            showSizeChanger: false, // 不显示每页条数选择器，固定为50
          }}
          className={styles.table}
          onRow={record => ({
            onClick: () => handleRowClick(record),
            style: { cursor: 'pointer' },
          })}
        />
      </div>

      {/* 恢复版本确认弹窗 */}
      <Modal
        title="确认恢复版本"
        open={restoreModal.visible}
        onOk={confirmRestoreVersion}
        onCancel={cancelRestoreVersion}
        okText="确认恢复"
        cancelText="取消"
        confirmLoading={restoreModal.loading}
        width={480}
      >
        {restoreModal.version && (
          <div>
            <p>
              您确定要将文档恢复到版本{' '}
              <strong>{restoreModal.version.versionNumber}</strong> 吗？
            </p>
            <div
              style={{
                marginTop: 16,
                padding: 12,
                backgroundColor: '#f6f8fa',
                borderRadius: 6,
              }}
            >
              <div style={{ marginBottom: 8 }}>
                <Text strong>版本信息：</Text>
              </div>
              <div>
                <Text>更新人：{restoreModal.version.updatedBy}</Text>
              </div>
              <div>
                <Text>
                  更新时间：{formatTime(restoreModal.version.updatedAt)}
                </Text>
              </div>
              {restoreModal.version.changeDescription && (
                <div style={{ marginTop: 8 }}>
                  <Text>
                    变更说明：{restoreModal.version.changeDescription}
                  </Text>
                </div>
              )}
            </div>
            <div style={{ marginTop: 16, color: '#ff4d4f', fontSize: 12 }}>
              ⚠️
              恢复操作将创建一个新的版本，原有的当前版本会被保留在历史记录中。
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default HistoryVersion;
