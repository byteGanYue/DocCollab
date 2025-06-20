import React, { useState, useEffect } from 'react';
import {
  Card,
  List,
  Avatar,
  Tag,
  Button,
  Space,
  Typography,
  Empty,
  Input,
} from 'antd';
import {
  FileTextOutlined,
  TeamOutlined,
  UserOutlined,
  SearchOutlined,
  EditOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import folderUtils from '@/utils/folder';
import styles from './index.module.less';

const { Title, Text } = Typography;
const { Search } = Input;

/**
 * 协同文档页面组件
 * 展示所有可协同编辑的文档
 */
const Collaboration = () => {
  const navigate = useNavigate();
  const [collaborationDocs, setCollaborationDocs] = useState([]);
  const [filteredDocs, setFilteredDocs] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loading, setLoading] = useState(true);

  // Mock数据：模拟从菜单中获取协同文档
  const mockFolderList = [
    {
      key: 'collaboration',
      children: [
        {
          key: 'collab_user_001',
          owner: '张三',
          ownerId: 'user_001',
          children: [
            {
              key: 'collab_user_001_folder1',
              children: [
                {
                  key: 'collab_user_001_doc1',
                  label: { props: { text: 'React 最佳实践' } },
                },
                {
                  key: 'collab_user_001_doc2',
                  label: { props: { text: 'TypeScript 进阶指南' } },
                },
              ],
            },
            {
              key: 'collab_user_001_folder2',
              children: [
                {
                  key: 'collab_user_001_doc3',
                  label: { props: { text: '需求分析文档' } },
                },
              ],
            },
          ],
        },
        {
          key: 'collab_user_002',
          owner: '李四',
          ownerId: 'user_002',
          children: [
            {
              key: 'collab_user_002_folder1',
              children: [
                {
                  key: 'collab_user_002_doc1',
                  label: { props: { text: 'UI设计规范' } },
                },
                {
                  key: 'collab_user_002_doc2',
                  label: { props: { text: '交互设计指南' } },
                },
              ],
            },
          ],
        },
        {
          key: 'collab_user_003',
          owner: '王五',
          ownerId: 'user_003',
          children: [
            {
              key: 'collab_user_003_folder1',
              children: [
                {
                  key: 'collab_user_003_doc1',
                  label: { props: { text: '微服务架构实践' } },
                },
                {
                  key: 'collab_user_003_doc2',
                  label: { props: { text: '数据库优化技巧' } },
                },
                {
                  key: 'collab_user_003_doc3',
                  label: { props: { text: 'DevOps 最佳实践' } },
                },
              ],
            },
            {
              key: 'collab_user_003_folder2',
              children: [
                {
                  key: 'collab_user_003_doc4',
                  label: { props: { text: '算法与数据结构' } },
                },
              ],
            },
          ],
        },
      ],
    },
  ];

  // 获取协同文档列表
  useEffect(() => {
    setLoading(true);
    try {
      // 使用工具函数获取协同文档
      const docs = folderUtils.getCollaborationDocuments(
        mockFolderList,
        'current_user',
      );
      setCollaborationDocs(docs);
      setFilteredDocs(docs);
    } catch (error) {
      console.error('获取协同文档失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 搜索功能
  const handleSearch = value => {
    setSearchKeyword(value);
    if (!value.trim()) {
      setFilteredDocs(collaborationDocs);
      return;
    }

    const filtered = collaborationDocs.filter(doc => {
      const docName = doc.label?.props?.text || '';
      const ownerName = doc.ownerInfo || '';
      return (
        docName.toLowerCase().includes(value.toLowerCase()) ||
        ownerName.toLowerCase().includes(value.toLowerCase())
      );
    });
    setFilteredDocs(filtered);
  };

  // 处理文档点击
  const handleDocumentClick = doc => {
    navigate(`/doc-editor/${doc.key}?collaborative=true`);
  };

  // 获取用户头像
  const getUserAvatar = ownerId => {
    const avatarMap = {
      user_001: '👨‍💻',
      user_002: '👩‍💼',
      user_003: '🧑‍🔬',
    };
    return avatarMap[ownerId] || '👤';
  };

  // 获取文档类型标签颜色
  const getDocTypeColor = docName => {
    if (docName.includes('React') || docName.includes('前端')) return 'blue';
    if (docName.includes('设计') || docName.includes('UI')) return 'purple';
    if (docName.includes('架构') || docName.includes('技术')) return 'green';
    if (docName.includes('需求') || docName.includes('文档')) return 'orange';
    return 'default';
  };

  return (
    <div className={styles.collaborationContainer}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <TeamOutlined className={styles.titleIcon} />
          <Title level={2} className={styles.title}>
            协同文档
          </Title>
          <Text type="secondary" className={styles.subtitle}>
            与团队成员协同编辑文档，实时同步更新
          </Text>
        </div>

        <div className={styles.searchSection}>
          <Search
            placeholder="搜索文档名称或作者..."
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            onSearch={handleSearch}
            onChange={e => handleSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      <div className={styles.content}>
        {filteredDocs.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              searchKeyword
                ? `未找到包含"${searchKeyword}"的文档`
                : '暂无协同文档'
            }
          />
        ) : (
          <List
            grid={{
              gutter: 16,
              xs: 1,
              sm: 2,
              md: 2,
              lg: 3,
              xl: 3,
              xxl: 4,
            }}
            dataSource={filteredDocs}
            loading={loading}
            renderItem={doc => (
              <List.Item>
                <Card
                  hoverable
                  className={styles.docCard}
                  actions={[
                    <Button
                      type="text"
                      icon={<EyeOutlined />}
                      onClick={() => handleDocumentClick(doc)}
                    >
                      查看
                    </Button>,
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      onClick={() => handleDocumentClick(doc)}
                    >
                      编辑
                    </Button>,
                  ]}
                >
                  <Card.Meta
                    avatar={
                      <Avatar size={40} className={styles.userAvatar}>
                        {getUserAvatar(doc.ownerId)}
                      </Avatar>
                    }
                    title={
                      <div className={styles.docTitle}>
                        <FileTextOutlined className={styles.docIcon} />
                        <span className={styles.docName}>
                          {doc.label?.props?.text || '未命名文档'}
                        </span>
                      </div>
                    }
                    description={
                      <div className={styles.docMeta}>
                        <div className={styles.ownerInfo}>
                          <UserOutlined className={styles.ownerIcon} />
                          <span>{doc.ownerInfo}</span>
                        </div>
                        <div className={styles.tags}>
                          <Tag
                            color={getDocTypeColor(
                              doc.label?.props?.text || '',
                            )}
                            className={styles.docTag}
                          >
                            可协同编辑
                          </Tag>
                        </div>
                      </div>
                    }
                  />
                </Card>
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  );
};

export default Collaboration;
