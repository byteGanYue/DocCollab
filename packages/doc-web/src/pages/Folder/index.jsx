import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Table,
  Button,
  Space,
  Card,
  Tooltip,
  message,
  Empty,
  Breadcrumb,
  Spin,
} from 'antd';
import {
  FileTextOutlined,
  FolderOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  HomeOutlined,
  FileAddOutlined,
  FolderAddOutlined,
} from '@ant-design/icons';
import styles from './index.module.less';
import { folderAPI, documentAPI } from '../../utils/api';
import folderUtils from '../../utils/folder';

/**
 * Folder 组件 - 展示特定文件夹的内容
 *
 * 功能：
 * 1. 展示文件夹内的子文件夹和文档
 * 2. 提供文档和文件夹的基本操作
 * 3. 面包屑导航
 * 4. 排序和筛选功能
 * 5. 分页功能
 */
const Folder = () => {
  // 获取路由参数
  const { id } = useParams();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  // 状态定义
  const [folderContents, setFolderContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [sortedInfo, setSortedInfo] = useState({});
  const [filteredInfo, setFilteredInfo] = useState({});
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
    pageSizeOptions: ['10', '20', '50'],
    showTotal: total => `共 ${total} 项`,
  });

  /**
   * 获取文件夹内容（子文件夹和文档）
   */
  const fetchFolderContents = useCallback(
    async (folderId, page = 1, pageSize = 10) => {
      setLoading(true);
      try {
        // 使用新的getFolderContentsById方法获取数据
        const result = await folderUtils.getFolderContentsById(folderId, {
          page,
          pageSize,
        });

        if (result.success) {
          const {
            folders,
            documents,
            pagination: paginationInfo,
            folderDetail,
          } = result.data;

          // 更新当前文件夹信息
          if (folderDetail) {
            setCurrentFolder(folderDetail);
            // 构建面包屑导航
            const breadcrumbData = [];
            breadcrumbData.push({
              name: folderDetail.folderName,
              id: folderId,
            });
            setBreadcrumbs(breadcrumbData);
          }

          // 合并文件夹和文档数据
          const contents = [
            // 处理文件夹数据
            ...folders.map(folder => ({
              key: `folder_${folder.folderId}`,
              id: folder.folderId,
              name: folder.folderName,
              type: 'folder',
              updateTime: folder.update_time,
              createTime: folder.create_time,
              createdBy: folder.create_username,
              childrenCount: folder.childrenCount,
            })),
            // 处理文档数据
            ...documents.map(doc => ({
              key: `doc_${doc.documentId}`,
              id: doc.documentId,
              name: doc.documentName,
              type: 'document',
              updateTime: doc.update_time,
              createTime: doc.create_time,
              createdBy: doc.create_username,
              lastEditedBy: doc.update_username || doc.create_username,
            })),
          ];

          setFolderContents(contents);

          // 更新分页信息
          setPagination(prev => ({
            ...prev,
            current: paginationInfo.page,
            pageSize: paginationInfo.pageSize,
            total: paginationInfo.total,
          }));
        } else {
          throw new Error(result.message || '获取文件夹内容失败');
        }
      } catch (error) {
        console.error('获取文件夹内容失败:', error);
        messageApi.error('获取文件夹内容失败');
      } finally {
        setLoading(false);
      }
    },
    [messageApi],
  );

  // 首次加载和ID变更时获取数据
  useEffect(() => {
    if (id) {
      if (id === 'root') {
        // 处理根文件夹
        setCurrentFolder({
          folderName: '我的文件夹',
          autoFolderId: 'root',
          parentFolderIds: [],
        });
        setBreadcrumbs([{ name: '我的文件夹', id: 'root' }]);
      }
      fetchFolderContents(id, pagination.current, pagination.pageSize);
    }
  }, [id, fetchFolderContents, pagination.current, pagination.pageSize]);

  /**
   * 处理删除操作
   */
  const handleDelete = async record => {
    try {
      if (record.type === 'folder') {
        const response = await folderAPI.deleteFolder(record.id);
        if (response.success) {
          messageApi.success(`文件夹 "${record.name}" 已删除`);
          fetchFolderContents(id, pagination.current, pagination.pageSize);
        } else {
          throw new Error(response.message || '删除文件夹失败');
        }
      } else {
        const response = await documentAPI.deleteDocument(record.id);
        if (response.success) {
          messageApi.success(`文档 "${record.name}" 已删除`);
          fetchFolderContents(id, pagination.current, pagination.pageSize);
        } else {
          throw new Error(response.message || '删除文档失败');
        }
      }
    } catch (error) {
      console.error('删除失败:', error);
      messageApi.error(`删除失败: ${error.message || '未知错误'}`);
    }
  };

  /**
   * 处理打开/进入操作
   */
  const handleOpen = record => {
    if (record.type === 'folder') {
      navigate(`/folderListPage/${record.id}`);
    } else {
      navigate(`/doc-editor/${record.id}`);
    }
  };

  /**
   * 处理表格变化（排序、筛选和分页）
   */
  const handleTableChange = (pagination, filters, sorter) => {
    setFilteredInfo(filters);
    setSortedInfo(sorter);
    // 处理分页变化
    fetchFolderContents(id, pagination.current, pagination.pageSize);
  };

  /**
   * 清除所有筛选和排序
   */
  const clearFilters = () => {
    setFilteredInfo({});
    setSortedInfo({});
  };

  /**
   * 处理新建文档
   */
  const handleCreateDocument = async () => {
    try {
      const response = await documentAPI.createDocument({
        parentFolderId: id,
        documentName: '新建文档',
      });
      if (response.success) {
        navigate(`/doc-editor/${response.data.documentId}`);
      } else {
        throw new Error(response.message || '创建文档失败');
      }
    } catch (error) {
      console.error('创建文档失败:', error);
      messageApi.error('创建文档失败');
    }
  };

  /**
   * 处理新建文件夹
   */
  const handleCreateFolder = async () => {
    try {
      const response = await folderAPI.createFolder({
        parentFolderId: id,
        folderName: '新建文件夹',
      });
      if (response.success) {
        fetchFolderContents(id, pagination.current, pagination.pageSize);
        messageApi.success('文件夹创建成功');
      } else {
        throw new Error(response.message || '创建文件夹失败');
      }
    } catch (error) {
      console.error('创建文件夹失败:', error);
      messageApi.error('创建文件夹失败');
    }
  };

  /**
   * 表格列定义
   */
  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          {record.type === 'folder' ? (
            <FolderOutlined style={{ color: '#ffc53d' }} />
          ) : (
            <FileTextOutlined style={{ color: '#1890ff' }} />
          )}
          <a onClick={() => handleOpen(record)}>{text}</a>
        </Space>
      ),
      sorter: (a, b) => a.name.localeCompare(b.name),
      sortOrder: sortedInfo.columnKey === 'name' && sortedInfo.order,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: text => (text === 'folder' ? '文件夹' : '文档'),
      filters: [
        { text: '文件夹', value: 'folder' },
        { text: '文档', value: 'document' },
      ],
      filteredValue: filteredInfo.type || null,
      onFilter: (value, record) => record.type === value,
    },
    {
      title: '修改时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
      render: text => new Date(text).toLocaleString(),
      sorter: (a, b) => new Date(a.updateTime) - new Date(b.updateTime),
      sortOrder: sortedInfo.columnKey === 'updateTime' && sortedInfo.order,
    },
    {
      title: '创建者',
      dataIndex: 'createdBy',
      key: 'createdBy',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title={record.type === 'folder' ? '进入文件夹' : '编辑文档'}>
            <Button
              type="link"
              icon={
                record.type === 'folder' ? <EyeOutlined /> : <EditOutlined />
              }
              onClick={() => handleOpen(record)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // 面包屑导航点击处理
  const handleBreadcrumbClick = item => {
    navigate(`/folderListPage/${item.id}`);
  };

  // 渲染面包屑导航
  const renderBreadcrumb = () => (
    <Breadcrumb className={styles.breadcrumb}>
      {breadcrumbs.map((item, index) => (
        <Breadcrumb.Item
          key={item.id}
          onClick={() => handleBreadcrumbClick(item)}
          className={styles.breadcrumbItem}
        >
          {index === 0 && <HomeOutlined />} {item.name}
        </Breadcrumb.Item>
      ))}
    </Breadcrumb>
  );

  return (
    <div className={styles.folderContainer}>
      {contextHolder}

      {/* 面包屑导航 */}
      {renderBreadcrumb()}

      {/* 文件夹标题和操作按钮 */}
      <div className={styles.folderHeader}>
        <div>
          <h2>{currentFolder?.folderName || '加载中...'}</h2>
          {folderContents.length > 0 && (
            <div className={styles.folderStats}>
              共 {folderContents.filter(item => item.type === 'folder').length}{' '}
              个文件夹，
              {
                folderContents.filter(item => item.type === 'document').length
              }{' '}
              个文档
            </div>
          )}
        </div>

        {/* 操作按钮组 */}
        <Space>
          <Button icon={<FileAddOutlined />} onClick={handleCreateDocument}>
            新建文档
          </Button>
          <Button icon={<FolderAddOutlined />} onClick={handleCreateFolder}>
            新建文件夹
          </Button>
          {(filteredInfo.type || sortedInfo.order) && (
            <Button onClick={clearFilters}>清除筛选和排序</Button>
          )}
        </Space>
      </div>

      {/* 文件夹内容表格 */}
      <Card className={styles.folderCard}>
        <Spin spinning={loading}>
          {folderContents.length > 0 ? (
            <Table
              dataSource={folderContents}
              columns={columns}
              onChange={handleTableChange}
              pagination={pagination}
              rowClassName={styles.tableRow}
            />
          ) : (
            !loading && (
              <Empty
                description="此文件夹为空"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )
          )}
        </Spin>
      </Card>
    </div>
  );
};

export default Folder;
