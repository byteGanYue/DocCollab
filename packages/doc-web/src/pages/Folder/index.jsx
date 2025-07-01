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
} from '@ant-design/icons';
import styles from './index.module.less';
import { folderAPI, documentAPI } from '../../utils/api';

/**
 * Folder 组件 - 展示特定文件夹的内容
 *
 * 功能：
 * 1. 展示文件夹内的子文件夹和文档
 * 2. 提供文档和文件夹的基本操作
 * 3. 面包屑导航
 * 4. 排序功能
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

  /**
   * 获取当前文件夹信息
   */
  const fetchFolderInfo = useCallback(
    async folderId => {
      try {
        if (folderId === 'root') {
          // 处理根文件夹
          setCurrentFolder({
            folderName: '我的文件夹',
            autoFolderId: 'root',
            parentFolderIds: [],
          });
          setBreadcrumbs([{ name: '我的文件夹', id: 'root' }]);
          return;
        }

        const response = await folderAPI.getFolderById(folderId);
        if (response.success) {
          setCurrentFolder(response.data);

          // 构建面包屑导航
          const breadcrumbData = [];
          breadcrumbData.push({ name: '我的文件夹', id: 'root' });

          // 添加父文件夹路径
          if (
            response.data.parentFolderIds &&
            response.data.parentFolderIds.length > 0
          ) {
            // 这里需要根据实际API调整，可能需要获取每个父文件夹的名称
            const parentFoldersResponse = await folderAPI.getBatchFoldersByIds(
              response.data.parentFolderIds,
            );
            if (parentFoldersResponse.success) {
              parentFoldersResponse.data.forEach(folder => {
                breadcrumbData.push({
                  name: folder.folderName,
                  id: folder.autoFolderId,
                });
              });
            }
          }

          // 添加当前文件夹
          breadcrumbData.push({ name: response.data.folderName, id: folderId });
          setBreadcrumbs(breadcrumbData);
        } else {
          throw new Error(response.message || '获取文件夹信息失败');
        }
      } catch (error) {
        console.error('获取文件夹信息失败:', error);
        messageApi.error('获取文件夹信息失败');
        // 导航回首页
        navigate('/home');
      }
    },
    [messageApi, navigate],
  );

  /**
   * 获取文件夹内容（子文件夹和文档）
   */
  const fetchFolderContents = useCallback(
    async folderId => {
      setLoading(true);
      try {
        const userId = localStorage.getItem('userId');

        // 并行获取文件夹和文档
        const [foldersResponse, documentsResponse] = await Promise.all([
          folderAPI.getSubFolders(folderId),
          documentAPI.getFolderDocuments(folderId, userId),
        ]);

        const contents = [];

        // 处理子文件夹
        if (foldersResponse.success && foldersResponse.data) {
          foldersResponse.data.forEach(folder => {
            contents.push({
              key: `folder_${folder.autoFolderId}`,
              id: folder.autoFolderId,
              name: folder.folderName,
              type: 'folder',
              updateTime: folder.update_time,
              createTime: folder.create_time,
              createdBy: folder.create_username,
              childrenCount: folder.childrenCount || {
                folders: 0,
                documents: 0,
              },
            });
          });
        }

        // 处理文档
        if (
          documentsResponse.success &&
          documentsResponse.data &&
          documentsResponse.data.documents
        ) {
          documentsResponse.data.documents.forEach(doc => {
            contents.push({
              key: `doc_${doc.documentId}`,
              id: doc.documentId,
              name: doc.documentName,
              type: 'document',
              updateTime: doc.update_time,
              createTime: doc.create_time,
              createdBy: doc.create_username,
              lastEditedBy: doc.last_edit_username || doc.create_username,
            });
          });
        }

        setFolderContents(contents);
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
      // fetchFolderInfo(id);
      // fetchFolderContents(id);
      console.log(id);
    }
  }, [id, fetchFolderInfo, fetchFolderContents]);

  /**
   * 处理删除操作
   */
  const handleDelete = async record => {
    try {
      if (record.type === 'folder') {
        const response = await folderAPI.deleteFolderByFolderId(record.id);
        if (response.success) {
          messageApi.success(`文件夹 "${record.name}" 已删除`);
          fetchFolderContents(id);
        } else {
          throw new Error(response.message || '删除文件夹失败');
        }
      } else {
        const response = await documentAPI.deleteDocument(record.id);
        if (response.success) {
          messageApi.success(`文档 "${record.name}" 已删除`);
          fetchFolderContents(id);
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
      // 导航到子文件夹
      navigate(`/folderListPage/${record.id}`);
    } else {
      // 导航到文档编辑页
      navigate(`/doc-editor/${record.id}`);
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
      onFilter: (value, record) => record.type === value,
      width: 100,
    },
    {
      title: '最后修改时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
      render: text => new Date(text).toLocaleString(),
      sorter: (a, b) => new Date(a.updateTime) - new Date(b.updateTime),
      defaultSortOrder: 'descend',
    },
    {
      title: '创建者',
      dataIndex: 'createdBy',
      key: 'createdBy',
      width: 120,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title={record.type === 'folder' ? '打开' : '编辑'}>
            <Button
              type="primary"
              icon={
                record.type === 'folder' ? <EyeOutlined /> : <EditOutlined />
              }
              size="small"
              onClick={() => handleOpen(record)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Button
              danger
              icon={<DeleteOutlined />}
              size="small"
              onClick={() => handleDelete(record)}
            />
          </Tooltip>
        </Space>
      ),
      width: 120,
    },
  ];

  return (
    <div className={styles.folderContainer}>
      {contextHolder}
      <Card className={styles.folderCard}>
        <Breadcrumb className={styles.breadcrumb}>
          <Breadcrumb.Item href="#/home">
            <HomeOutlined />
          </Breadcrumb.Item>
          {breadcrumbs.map((item, index) => (
            <Breadcrumb.Item key={item.id}>
              {index < breadcrumbs.length - 1 ? (
                <a onClick={() => navigate(`/folderListPage/${item.id}`)}>
                  {item.name}
                </a>
              ) : (
                item.name
              )}
            </Breadcrumb.Item>
          ))}
        </Breadcrumb>

        <div className={styles.folderHeader}>
          <h2>{currentFolder?.folderName || '文件夹内容'}</h2>
          <div className={styles.folderStats}>
            <span>
              共 {folderContents.filter(item => item.type === 'folder').length}{' '}
              个子文件夹，
            </span>
            <span>
              {folderContents.filter(item => item.type === 'document').length}{' '}
              个文档
            </span>
          </div>
        </div>

        <Spin spinning={loading}>
          {folderContents.length > 0 ? (
            <Table
              columns={columns}
              dataSource={folderContents}
              rowKey="key"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50'],
              }}
            />
          ) : (
            <Empty
              description={
                <span>
                  该文件夹为空
                  <br />
                  <Button type="link" onClick={() => navigate('/home')}>
                    返回首页
                  </Button>
                </span>
              }
            />
          )}
        </Spin>
      </Card>
    </div>
  );
};

export default Folder;
