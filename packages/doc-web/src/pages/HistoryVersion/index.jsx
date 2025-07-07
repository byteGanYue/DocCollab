import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Dropdown,
  Space,
  Tag,
  Typography,
  Modal,
  Breadcrumb,
  Radio,
  Divider,
  message,
} from 'antd';
import {
  FileTextOutlined,
  MoreOutlined,
  HistoryOutlined,
  ReloadOutlined,
  EyeOutlined,
  ArrowLeftOutlined,
  RollbackOutlined,
  DiffOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { documentAPI } from '@/utils/api';
import styles from './index.module.less';
import { useUser } from '@/hooks/useAuth';
import { formatTime } from '@/utils/dealTime';
import VersionDiff from '@/components/VersionDiff/index';
// import { UserContext } from '@/contexts/UserContext';
const { Text } = Typography;

// 工具函数：Uint8Array转base64
function uint8ToBase64(u8arr) {
  let binary = '';
  for (let i = 0; i < u8arr.length; i++) {
    binary += String.fromCharCode(u8arr[i]);
  }
  return btoa(binary);
}

/**
 * 文档历史版本页面组件
 *
 * 功能特性：
 * - 显示指定文档的所有历史版本
 * - 支持查看版本详情、恢复版本等操作
 * - 支持版本对比功能
 * - 响应式设计：适配不同屏幕尺寸
 * - 交互操作：支持点击查看版本、恢复版本等
 */
const HistoryVersion = () => {
  const navigate = useNavigate();
  const { id: documentId } = useParams(); // 从路由参数获取文档ID
  const { userInfo } = useUser(); // 获取用户信息
  const [messageApi, contextHolder] = message.useMessage();
  // const { userInfo: userContextInfo } = useContext(UserContext);

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

  // 版本对比弹窗状态
  const [compareModal, setCompareModal] = useState({
    visible: false,
    loading: false,
    oldVersion: null,
    newVersion: null,
    diffResult: null,
  });

  // 选中的对比版本
  const [selectedVersions, setSelectedVersions] = useState({
    oldVersion: null,
    newVersion: null,
  });

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
            restoreFromVersionId: version.restoreFromVersionId || null, // 新增字段
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
            documentName: '文档标题',
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
    [documentId, userInfo],
  );

  /**
   * 处理查看版本详情 - 跳转到文档编辑页面
   * @param {Object} version - 版本对象
   */
  const handleViewVersion = async version => {
    try {
      // 判断是否为当前版本
      // if (version.isCurrent) {
      //   // 最新版本，跳转到普通编辑页面
      //   navigate(`/doc-editor/${documentId}`);
      // } else {
      // 历史版本，跳转到版本查看页面
      navigate(`/doc-editor/${documentId}?version=${version.versionId}`);
      // }
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
      // 1. 获取历史版本的yjsState和content
      const versionRes = await documentAPI.getDocumentVersion(
        documentId,
        version.versionId,
      );
      if (!versionRes.success || !versionRes.data) {
        throw new Error('无法获取历史版本数据');
      }

      const yjsStateArr = versionRes.data.yjsState || [];
      const contentData = versionRes.data.content || '';

      // 2. 将快照数据编码为 base64，通过 URL 参数传递
      // 只传递Yjs快照，content字段只用于只读/历史对比
      const snapshotBase64 = uint8ToBase64(new Uint8Array(yjsStateArr));
      // 不再传递contentBase64给协同流
      const editorUrl = `/doc-editor/${documentId}?restoreSnapshot=${snapshotBase64}&versionId=${version.versionId}`;
      console.log('[HistoryVersion] 跳转到编辑器页面:', editorUrl);
      // navigate(editorUrl);

      // 4. 调用后端回滚接口（用于记录）
      const response = await documentAPI.restoreDocument(
        documentId,
        version.versionId,
      );
      if (!response.success) {
        console.warn(
          '后端版本回退记录失败，但不影响前端回滚:',
          response.message,
        );
      }
      documentAPI.updateDocument(documentId, {
        content: contentData,
        yjsState: yjsStateArr,
      });

      message.success(`正在恢复到版本 ${version.versionNumber}...`);
      setRestoreModal({ visible: false, version: null, loading: false });

      // 5. 延迟刷新历史版本列表，确保数据库更新完成
      setTimeout(() => {
        console.log('[HistoryVersion] 回滚完成后刷新历史版本列表');
        fetchVersionHistory(pagination.current, pagination.pageSize);

        messageApi.success('回滚成功，文档已恢复到历史版本！');
        // 断开并重连 provider，强制拉取数据库最新内容
      }, 2000);
      if (window.provider) {
        window.provider.disconnect();
        setTimeout(() => {
          window.provider.connect();
          console.log('[DocEditor] 回滚后已断开并重连provider，拉取数据库最新内容');
        }, 400);
      }
      // 6. 添加调试信息
      console.log('[HistoryVersion] 回滚操作完成，等待数据刷新...');
      console.log('[HistoryVersion] 目标版本ID:', version.versionId);
      console.log('[HistoryVersion] 目标版本内容:', contentData);
      console.log('[HistoryVersion] 回滚快照内容预览:', yjsStateArr);
      console.log('[HistoryVersion] 回滚contentData预览:', contentData);
    } catch (error) {
      console.error('[HistoryVersion] 版本恢复失败:', error);
      message.error('恢复版本失败，请重试');
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
   * 处理版本对比
   * @param {Object} oldVersion - 旧版本
   * @param {Object} newVersion - 新版本
   */
  const handleCompareVersions = async (oldVersion, newVersion) => {
    console.log('[HistoryVersion] 开始版本对比:', { oldVersion, newVersion });

    if (!oldVersion || !newVersion) {
      message.error('请选择两个版本进行对比');
      return;
    }

    if (oldVersion.versionId === newVersion.versionId) {
      message.warning('请选择不同的版本进行对比');
      return;
    }

    console.log('[HistoryVersion] 设置对比弹窗状态');
    setCompareModal({
      visible: true,
      loading: true,
      oldVersion,
      newVersion,
      oldContent: null,
      newContent: null,
      diffResult: null,
    });

    try {
      console.log('[HistoryVersion] 开始获取版本内容');
      // 获取两个版本的详细内容
      const [oldRes, newRes] = await Promise.all([
        documentAPI.getDocumentVersion(documentId, oldVersion.versionId),
        documentAPI.getDocumentVersion(documentId, newVersion.versionId),
      ]);

      console.log('[HistoryVersion] 版本内容获取结果:', { oldRes, newRes });

      if (!oldRes.success || !newRes.success) {
        throw new Error('获取版本内容失败');
      }

      const oldContent = oldRes.data.content || '';
      const newContent = newRes.data.content || '';

      console.log('[HistoryVersion] 版本内容长度:', {
        oldContentLength: oldContent.length,
        newContentLength: newContent.length,
      });

      setCompareModal(prev => ({
        ...prev,
        loading: false,
        oldContent,
        newContent,
      }));

      console.log('[HistoryVersion] 版本对比弹窗已更新');
    } catch (error) {
      console.error('[HistoryVersion] 版本对比失败:', error);
      message.error('版本对比失败，请重试');
      setCompareModal(prev => ({
        ...prev,
        loading: false,
      }));
    }
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
      {
        key: 'structural-compare',
        label: '版本对比',
        icon: <DiffOutlined style={{ color: '#722ed1' }} />,
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
      } else if (key === 'compare') {
        // 处理版本对比选择
        if (!selectedVersions.oldVersion) {
          setSelectedVersions({
            oldVersion: version,
            newVersion: null,
          });
          message.success(
            `已选择 ${version.versionNumber} 作为对比基准版本，请选择第二个版本`,
          );
        } else if (!selectedVersions.newVersion) {
          // 如果已经选择了旧版本，则设置为新版本并开始对比
          const newSelectedVersions = {
            oldVersion: selectedVersions.oldVersion,
            newVersion: version,
          };
          setSelectedVersions(newSelectedVersions);
          handleCompareVersions(newSelectedVersions.oldVersion, version);
        } else {
          // 如果已经选择了两个版本，重置选择
          setSelectedVersions({
            oldVersion: version,
            newVersion: null,
          });
          message.info(
            `重新选择对比版本，已选择 ${version.versionNumber} 作为基准版本`,
          );
        }
      } else if (key === 'structural-compare') {
        // 跳转到结构化对比页面，带上当前版本和已选版本
        let leftId = version.versionId;
        let rightId = selectedVersions.oldVersion?.versionId || null;
        if (rightId === leftId) rightId = null;
        navigate(`/version-compare/${documentId}?left=${leftId}${rightId ? `&right=${rightId}` : ''}`);
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

  // 恢复归档历史版本
  const handleRestoreArchivedHistory = async () => {
    if (!documentId) return;
    try {
      const hide = message.loading('正在恢复归档历史版本...', 0);
      const res = await documentAPI.restoreArchivedHistory(documentId);
      hide();
      if (res.success) {
        message.success('归档历史版本恢复成功！');
        fetchVersionHistory(1, pagination.pageSize);
      } else {
        message.error(res.message || '归档历史版本恢复失败');
      }
    } catch {
      message.error('归档历史版本恢复失败');
    }
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
            {record.changeDescription && (
              <Tag color="orange" size="small">
                {record.changeDescription}
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
      title: '回溯来源',
      dataIndex: 'restoreFromVersionId',
      key: 'restoreFromVersionId',
      width: '10%',
      render: (restoreFromVersionId) =>
        restoreFromVersionId ? (
          <Tag color="blue">回溯自 v{restoreFromVersionId}</Tag>
        ) : null,
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

  // 显示快照恢复功能状态
  useEffect(() => {
    console.log('[HistoryVersion] 快照恢复功能已启用，使用 URL 参数传递方式');
  }, []);

  return (
    <div className={styles.container}>
      {contextHolder}
      {/* 面包屑导航 */}
      <div className={styles.breadcrumb}>
        <Breadcrumb
          items={[
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
          <div style={{ marginTop: 8 }}>
            <Text type="success" style={{ fontSize: 12 }}>
              ✅ 快照恢复功能已启用，版本回滚将使用新的高效恢复机制
            </Text>
          </div>
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
          <Button
            icon={<RollbackOutlined />}
            onClick={handleRestoreArchivedHistory}
            style={{ marginLeft: 12 }}
          >
            恢复30天前历史版本
          </Button>
       
          <Button
            icon={<DiffOutlined />}
            onClick={() => navigate(`/version-compare/${documentId}`)}
            style={{ marginLeft: 12 }}
            type="primary"
          >
            版本对比
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
              {restoreModal.version.restoreFromVersionId && (
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary">
                    该版本回溯自 v{restoreModal.version.restoreFromVersionId}
                  </Text>
                </div>
              )}
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
            <div style={{ marginTop: 12, color: '#1890ff', fontSize: 12 }}>
              🔄 使用新的快照恢复机制，无需重建实例，恢复速度更快更稳定。
            </div>
          </div>
        )}
      </Modal>

      {/* 版本对比弹窗 */}
      <Modal
        title="版本对比"
        open={compareModal.visible}
        onCancel={() => {
          setCompareModal({
            visible: false,
            loading: false,
            oldVersion: null,
            newVersion: null,
            diffResult: null,
          });
          setSelectedVersions({ oldVersion: null, newVersion: null });
        }}
        footer={null}
        width={1000}
        style={{ top: 20 }}
        bodyStyle={{ padding: 0, height: '80vh' }}
      >
        {compareModal.loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Text>正在计算版本差异...</Text>
          </div>
        ) : compareModal.oldVersion && compareModal.newVersion ? (
          <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: 16 }}>
              <Text strong>对比版本：</Text>
              <Tag color="blue">{compareModal.oldVersion.versionNumber}</Tag>
              <Text>→</Text>
              <Tag color="green">{compareModal.newVersion.versionNumber}</Tag>
            </div>
            <VersionDiff
              oldVersion={compareModal.oldVersion}
              newVersion={compareModal.newVersion}
              oldContent={compareModal.oldContent}
              newContent={compareModal.newContent}
            />
            <Button
              onClick={() => {
                setCompareModal({
                  visible: false,
                  loading: false,
                  oldVersion: null,
                  newVersion: null,
                  diffResult: null,
                });
                setSelectedVersions({ oldVersion: null, newVersion: null });
              }}
              style={{ marginTop: 24 }}
            >
              关闭
            </Button>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Text>版本数据加载中...</Text>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default HistoryVersion;
