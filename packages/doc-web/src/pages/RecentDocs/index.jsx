import React, { useState, useEffect } from 'react';
import { Table, Avatar, Button, Dropdown, Space, Tag, Typography } from 'antd';
import {
  FileTextOutlined,
  UserOutlined,
  MoreOutlined,
  TableOutlined,
  FileImageOutlined,
  BranchesOutlined,
  CalculatorOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import styles from './index.module.css';

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

  // 文档数据状态
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

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
   * 模拟获取最近访问文档数据
   * 实际项目中这里应该调用API接口
   */
  const fetchRecentDocs = async () => {
    setLoading(true);

    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 800));

    // 模拟文档数据
    const mockDocs = [
      {
        id: 1,
        title: '思维导图',
        type: 'mindmap',
        owner: { name: 'Ni0duann', avatar: '' },
        lastModified: new Date(Date.now() - 16 * 60 * 1000).toISOString(), // 16分钟前
        isTemplate: false,
      },
      {
        id: 2,
        title: '富文本知识库系统',
        type: 'document',
        owner: { name: '邱志锋', avatar: '' },
        lastModified: new Date(Date.now() - 13 * 60 * 1000).toISOString(), // 13分钟前
        isTemplate: false,
        hasAttachment: true,
      },
      {
        id: 3,
        title: '部门TOKR与周报',
        type: 'spreadsheet',
        owner: { name: 'Ni0duann', avatar: '' },
        lastModified: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(), // 22小时前
        isTemplate: false,
      },
      {
        id: 4,
        title: 'DocCollab',
        type: 'document',
        owner: { name: 'Ni0duann', avatar: '' },
        lastModified: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(), // 22小时前
        isTemplate: false,
      },
      {
        id: 5,
        title: '智能纪要：前端训练营启动会 2025年6月19日',
        type: 'document',
        owner: { name: '邱志锋', avatar: '' },
        lastModified: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(), // 22小时前
        isTemplate: false,
      },
      {
        id: 6,
        title: '智能纪要：前端训练营启动会 2025年6月14日',
        type: 'document',
        owner: { name: '邱志锋', avatar: '' },
        lastModified: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24小时前
        isTemplate: false,
      },
      {
        id: 7,
        title: '经营分析（仅表态）',
        type: 'form',
        owner: { name: '云文档助手', avatar: '' },
        lastModified: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24小时前
        isTemplate: true,
      },
      {
        id: 8,
        title: '数据库连接文档',
        type: 'document',
        owner: { name: '巫祖奇', avatar: '' },
        lastModified: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24小时前
        isTemplate: false,
      },
      {
        id: 9,
        title: '训练营问题统计',
        type: 'form',
        owner: { name: '巫祖奇', avatar: '' },
        lastModified: new Date(
          Date.now() - 7 * 24 * 60 * 60 * 1000,
        ).toISOString(), // 7天前
        isTemplate: false,
      },
    ];

    setDocuments(mockDocs);
    setLoading(false);
  };

  /**
   * 处理文档点击，跳转到文档编辑页面
   * @param {Object} doc - 文档对象
   */
  const handleDocClick = doc => {
    navigate(`/doc-editor/${doc.id}`);
  };

  /**
   * 获取更多操作菜单
   * @param {Object} doc - 文档对象
   * @returns {React.ReactElement} 下拉菜单组件
   */
  const getMoreActions = doc => {
    const menuItems = [
      {
        key: 'open',
        label: '打开',
        onClick: () => handleDocClick(doc),
      },
      {
        key: 'share',
        label: '分享',
        onClick: () => console.log('分享文档', doc.id),
      },
      {
        key: 'copy',
        label: '复制链接',
        onClick: () => console.log('复制链接', doc.id),
      },
      {
        key: 'remove',
        label: '从最近访问中移除',
        onClick: () => console.log('移除文档', doc.id),
      },
    ];

    return (
      <Dropdown
        menu={{ items: menuItems }}
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
          <Avatar size="small" src={owner.avatar} icon={<UserOutlined />} />
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

  // 组件挂载时获取数据
  useEffect(() => {
    fetchRecentDocs();
  }, []);

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
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `共 ${total} 个文档，显示 ${range[0]}-${range[1]} 个`,
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
