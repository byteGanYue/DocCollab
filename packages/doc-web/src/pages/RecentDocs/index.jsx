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
} from 'antd';
import {
  FileTextOutlined,
  MoreOutlined,
  TableOutlined,
  FileImageOutlined,
  BranchesOutlined,
  CalculatorOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { recentVisitsAPI } from '@/utils/api';
import styles from './index.module.css';
import { useUser } from '@/hooks/useAuth';

const { Text } = Typography;

/**
 * 最近访问文档列表页面组件
 *
 * 功能特性：
 * - 头部筛选栏：支持按文档类型、归属、排序方式筛选
 * - 文档列表：展示最近访问的文档信息
 * - 响应式设计：适配不同屏幕尺寸
 * - 交互操作：支持点击跳转、更多操作等
 */
const RecentDocs = () => {
  const navigate = useNavigate();
  const { userInfo } = useUser(); // 获取用户信息和登出方法

  // 文档数据状态
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  // 分页状态
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  /**
   * 获取文档类型图标
   * @param {string} type - 文档类型
   * @returns {React.ReactElement} 图标组件
   */
  const getDocTypeIcon = type => {
    const iconMap = {
      document: <FileTextOutlined style={{ color: '#1890ff' }} />,
      spreadsheet: <TableOutlined style={{ color: '#52c41a' }} />,
      presentation: <FileImageOutlined style={{ color: '#ff7a45' }} />,
      mindmap: <BranchesOutlined style={{ color: '#722ed1' }} />,
      form: <CalculatorOutlined style={{ color: '#13c2c2' }} />,
    };
    return iconMap[type] || <FileTextOutlined style={{ color: '#1890ff' }} />;
  };

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
      return date.toLocaleDateString('zh-CN');
    }
  };

  /**
   * 获取最近访问文档数据
   * 调用后端API获取用户的最近访问记录（分页）
   * @param {number} page - 页码
   * @param {number} pageSize - 每页数量
   */
  const fetchRecentDocs = useCallback(
    async (page = 1, pageSize = 10) => {
      if (!userInfo) {
        console.warn('用户未登录');
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        // 调用API获取用户的最近访问记录（分页）
        const response = await recentVisitsAPI.getUserVisits({
          userId: userInfo.userId,
          page,
          pageSize,
        });

        if (response.code === 200) {
          const { list, pagination: paginationInfo } = response.data;
          // 将后端数据转换为前端需要的格式
          const formattedDocs = list.map(visit => ({
            id: visit.documentId,
            title: visit.documentName,
            type: 'document', // 默认类型，可以根据需要扩展
            owner: {
              name: userInfo.username || '未知用户',
              avatar: '',
            },
            lastModified: visit.visitTime,
            isTemplate: false,
            visitRecordId: visit._id, // 保存访问记录ID，用于删除操作
          }));

          setDocuments(formattedDocs);

          // 更新分页信息
          setPagination({
            current: paginationInfo.page,
            pageSize: paginationInfo.pageSize,
            total: paginationInfo.total,
          });
        } else {
          message.error('获取最近访问记录失败');
          setDocuments([]);
          setPagination(prev => ({ ...prev, total: 0 }));
        }
      } catch (error) {
        console.error('获取最近访问记录时出错:', error);
        message.error('获取最近访问记录失败，请稍后重试');
        setDocuments([]);
        setPagination(prev => ({ ...prev, total: 0 }));
      } finally {
        setLoading(false);
      }
    },
    [userInfo],
  );

  /**
   * 处理文档点击，跳转到文档编辑页面
   * @param {Object} doc - 文档对象
   */
  const handleDocClick = async doc => {
    // 跳转到文档编辑页面
    navigate(`/doc-editor/${doc.id}`);
  };

  /**
   * 从最近访问中移除文档
   * @param {Object} doc - 文档对象
   */
  const removeFromRecent = async doc => {
    if (!doc.visitRecordId) {
      message.error('无法移除该记录：缺少访问记录ID');
      return;
    }

    try {
      const response = await recentVisitsAPI.deleteVisit(doc.visitRecordId);

      if (response && response.code === 200) {
        message.success('已从最近访问中移除');
        // 刷新列表
        fetchRecentDocs(pagination.current, pagination.pageSize);
      } else {
        message.error(`移除失败：${response?.message || '请稍后重试'}`);
      }
    } catch (error) {
      message.error(`移除失败：${error.message || '请稍后重试'}`);
    }
  };

  /**
   * 获取更多操作菜单
   * @param {Object} doc - 文档对象
   * @returns {React.ReactElement} 下拉菜单组件
   */
  const getMoreActions = doc => {
    const menuItems = [
      {
        key: 'copy',
        label: '复制链接',
      },
      {
        key: 'remove',
        label: '从最近访问中移除',
      },
    ];

    // 处理菜单点击事件
    const handleMenuClick = ({ key, domEvent }) => {
      console.log('菜单项被点击:', {
        key,
        doc: doc.title,
        visitRecordId: doc.visitRecordId,
      });
      domEvent.stopPropagation(); // 阻止事件冒泡

      if (key === 'copy') {
        message.info('复制链接功能开发中...');
      } else if (key === 'remove') {
        removeFromRecent(doc);
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
      title: '名称',
      dataIndex: 'title',
      key: 'title',
      width: '50%',
      render: (title, record) => (
        <div className={styles.titleCell}>
          <Space size="small">
            {getDocTypeIcon(record.type)}
            <Text
              className={styles.titleText}
              onClick={() => handleDocClick(record)}
            >
              {title}
            </Text>
            {record.isTemplate && (
              <Tag color="blue" size="small">
                模板
              </Tag>
            )}
            {record.hasAttachment && (
              <Tag color="orange" size="small">
                附件
              </Tag>
            )}
          </Space>
        </div>
      ),
    },
    {
      title: '创建者',
      dataIndex: 'owner',
      key: 'owner',
      width: '25%',
      render: owner => (
        <div className={styles.ownerCell}>
          <Text className={styles.ownerName}>{owner.name}</Text>
        </div>
      ),
    },
    {
      title: '最后编辑时间',
      dataIndex: 'lastModified',
      key: 'lastModified',
      width: '20%',
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
    fetchRecentDocs(page, pageSize);
  };
  // 组件挂载时获取数据
  useEffect(() => {
    if (userInfo) {
      fetchRecentDocs(1, 10); // 重置到第一页，每页10条
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfo]); // 依赖用户信息，用户登录后重新获取数据

  // 组件挂载时获取数据

  return (
    <div className={styles.container}>
      {/* 页面头部 */}
      <div className={styles.header}>
        <h1 className={styles.title}>最近访问文档列表</h1>
      </div>

      {/* 文档列表 */}
      <div className={styles.content}>
        <Table
          columns={columns}
          dataSource={documents}
          loading={loading}
          rowKey="id"
          locale={{
            emptyText: userInfo
              ? '暂无最近访问的文档'
              : '请先登录查看最近访问记录',
          }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            position: ['bottomCenter'],
            showTotal: (total, range) =>
              `共 ${total} 个文档，显示 ${range[0]}-${range[1]} 个`,
            onChange: handlePageChange,
            onShowSizeChange: handlePageChange,
            pageSizeOptions: ['5', '10', '20', '50'],
          }}
          className={styles.table}
          onRow={record => ({
            className: styles.tableRow,
            onClick: () => handleDocClick(record),
          })}
        />
      </div>
    </div>
  );
};

export default RecentDocs;
