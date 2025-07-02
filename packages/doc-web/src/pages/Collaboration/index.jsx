import React, { useState, useEffect, useContext, useRef } from 'react';
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
  Spin,
  Tree,
  message,
} from 'antd';
import {
  FileTextOutlined,
  TeamOutlined,
  UserOutlined,
  SearchOutlined,
  EditOutlined,
  EyeOutlined,
  FolderOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { folderAPI, documentAPI } from '../../utils/api';
import { ThemeContext } from '../../contexts/ThemeContext';
import styles from './index.module.less';

const { Title, Text } = Typography;
const { Search } = Input;

/**
 * 协同文档页面
 * 展示所有公开用户的文件夹和文档，允许用户查看和编辑
 */
const Collaboration = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [collaborationData, setCollaborationData] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [showSearchInput, setShowSearchInput] = useState(false);
  const searchInputRef = useRef(null);
  const searchWrapperRef = useRef(null);
  const { getCurrentTheme } = useContext(ThemeContext);
  const theme = getCurrentTheme();

  /**
   * 获取协同文档数据
   */
  const fetchCollaborationData = async () => {
    try {
      setLoading(true);

      // 获取所有公开用户的文件夹结构
      const foldersResponse = await folderAPI.getPublicFolders();
      // 获取所有公开用户的文档
      const documentsResponse = await documentAPI.getPublicDocuments();

      if (foldersResponse.success && documentsResponse.success) {
        // 合并并转换数据
        const mergedData = mergeUserData(
          foldersResponse.data,
          documentsResponse.data,
        );
        setCollaborationData(mergedData);
        setFilteredData(mergedData);
      }
    } catch (error) {
      console.error('获取协同文档数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 合并用户文件夹和文档数据
   * @param {Array} publicFolders 公开用户文件夹数据
   * @param {Array} publicDocuments 公开用户文档数据
   * @returns {Array} 合并后的用户数据
   */
  const mergeUserData = (publicFolders, publicDocuments) => {
    const userMap = new Map();

    // 处理文件夹数据
    publicFolders.forEach(userFolders => {
      if (!userMap.has(userFolders.userId)) {
        userMap.set(userFolders.userId, {
          userId: userFolders.userId,
          username: userFolders.username,
          isPublic: userFolders.isPublic,
          folders: [],
          documents: [],
          totalFolders: 0,
          totalDocuments: 0,
        });
      }
      const userData = userMap.get(userFolders.userId);
      userData.folders = userFolders.folders;
      userData.totalFolders = countTotalFolders(userFolders.folders);
    });

    // 处理文档数据
    publicDocuments.forEach(userDocuments => {
      if (!userMap.has(userDocuments.userId)) {
        userMap.set(userDocuments.userId, {
          userId: userDocuments.userId,
          username: userDocuments.username,
          isPublic: userDocuments.isPublic,
          folders: [],
          documents: [],
          totalFolders: 0,
          totalDocuments: 0,
        });
      }
      const userData = userMap.get(userDocuments.userId);
      userData.documents = userDocuments.documents;
      userData.totalDocuments = userDocuments.documents.length;
    });

    return Array.from(userMap.values());
  };

  /**
   * 递归计算总文件夹数量
   * @param {Array} folders 文件夹数组
   * @returns {number} 总文件夹数量
   */
  const countTotalFolders = folders => {
    let count = folders.length;
    folders.forEach(folder => {
      if (folder.children && folder.children.length > 0) {
        count += countTotalFolders(folder.children);
      }
    });
    return count;
  };

  /**
   * 搜索文件夹和文档
   * @param {string} keyword 搜索关键字
   */
  const handleSearch = keyword => {
    setSearchKeyword(keyword);

    if (!keyword.trim()) {
      setFilteredData(collaborationData);
      return;
    }

    const lowerKeyword = keyword.toLowerCase().trim();

    // 深拷贝协同数据以避免修改原始数据
    const filteredResult = collaborationData
      .map(userInfo => {
        const result = { ...userInfo };

        // 搜索匹配的文档
        const matchedDocuments = userInfo.documents.filter(doc =>
          doc.documentName.toLowerCase().includes(lowerKeyword),
        );

        // 收集需要保留的文件夹ID
        const folderIdsToKeep = new Set();

        // 收集匹配文档的所有父文件夹ID路径
        matchedDocuments.forEach(doc => {
          if (doc.parentFolderIds && doc.parentFolderIds.length > 0) {
            doc.parentFolderIds.forEach(folderId => {
              folderIdsToKeep.add(folderId);
            });
          }
        });

        // 搜索匹配的文件夹，包含名称匹配和需要保留的父文件夹
        const matchedFolders = searchFoldersWithPath(
          userInfo.folders,
          lowerKeyword,
          folderIdsToKeep,
        );

        // 更新过滤后的文件夹和文档
        result.folders = matchedFolders;
        result.documents = matchedDocuments;
        result.totalFolders = countTotalFolders(matchedFolders);
        result.totalDocuments = matchedDocuments.length;

        return result;
      })
      .filter(
        userInfo =>
          // 仅保留有匹配文件夹或文档的用户
          userInfo.totalFolders > 0 || userInfo.totalDocuments > 0,
      );

    setFilteredData(filteredResult);

    // 如果没有搜索结果，显示提示信息
    if (filteredResult.length === 0) {
      message.info(`没有找到包含"${keyword}"的文件夹或文档`);
    }
  };

  /**
   * 递归搜索匹配的文件夹，包含需要保留的路径
   * @param {Array} folders 文件夹数组
   * @param {string} keyword 搜索关键字
   * @param {Set} folderIdsToKeep 需要保留的文件夹ID集合
   * @returns {Array} 匹配的文件夹数组
   */
  const searchFoldersWithPath = (folders, keyword, folderIdsToKeep) => {
    if (!folders || folders.length === 0) return [];

    // 递归检查文件夹是否需要保留（自身或子级匹配，或者ID在需保留集合中）
    const shouldKeepFolder = folder => {
      // 检查当前文件夹是否匹配关键字
      const nameMatches = folder.folderName.toLowerCase().includes(keyword);

      // 检查当前文件夹ID是否在需保留集合中
      const idMatches = folderIdsToKeep.has(folder.autoFolderId);

      // 如果当前文件夹名称匹配或ID在保留集合中，直接返回true
      if (nameMatches || idMatches) {
        return true;
      }

      // 检查子文件夹是否有匹配的
      if (folder.children && folder.children.length > 0) {
        return folder.children.some(childFolder =>
          shouldKeepFolder(childFolder),
        );
      }

      return false;
    };

    // 过滤并处理每个文件夹
    return folders.filter(shouldKeepFolder).map(folder => {
      // 递归处理子文件夹
      const filteredChildren =
        folder.children && folder.children.length > 0
          ? searchFoldersWithPath(folder.children, keyword, folderIdsToKeep)
          : [];

      // 返回包含过滤后子文件夹的当前文件夹
      return {
        ...folder,
        children: filteredChildren,
      };
    });
  };

  /**
   * 将文件夹数据转换为Tree组件格式
   * @param {Array} folders 文件夹数组
   * @param {Array} documents 文档数组
   * @param {Object} userInfo 用户信息
   * @returns {Array} Tree格式数据
   */
  const convertToTreeData = (folders, documents, userInfo) => {
    // 构建文档映射，按父文件夹ID分组
    const documentsByFolder = new Map();

    // 初始化根级文档数组
    documentsByFolder.set('root', []);

    documents.forEach(doc => {
      if (doc.parentFolderIds && doc.parentFolderIds.length > 0) {
        // 文档属于最后一个父文件夹ID（最直接的父级）
        const directParentId =
          doc.parentFolderIds[doc.parentFolderIds.length - 1];
        if (!documentsByFolder.has(directParentId)) {
          documentsByFolder.set(directParentId, []);
        }
        documentsByFolder.get(directParentId).push(doc);
      } else {
        // 根级文档
        documentsByFolder.get('root').push(doc);
      }
    });

    // 构建文件夹映射，方便查找
    const folderMap = new Map();
    const buildFolderMap = folders => {
      folders.forEach(folder => {
        folderMap.set(folder.autoFolderId, folder);
        if (folder.children && folder.children.length > 0) {
          buildFolderMap(folder.children);
        }
      });
    };
    buildFolderMap(folders);

    // 递归转换文件夹
    const convertFolder = folder => {
      // 获取该文件夹下的直接文档
      const folderDocs = documentsByFolder.get(folder.autoFolderId) || [];

      const documentNodes = folderDocs.map(doc => ({
        title: (
          <Space>
            <FileTextOutlined
              style={{ color: theme?.colors?.primary || '#1890ff' }}
            />
            <Text>{doc.documentName}</Text>
            <Tag size="small" color="blue">
              文档
            </Tag>
          </Space>
        ),
        key: `doc_${doc.documentId}`,
        isLeaf: true,
        documentId: doc.documentId,
        userId: userInfo.userId,
        userName: userInfo.username,
      }));

      // 递归处理子文件夹
      const childFolders = folder.children
        ? folder.children.map(convertFolder)
        : [];

      // 合并子文件夹和文档，文件夹在前，文档在后
      const allChildren = [...childFolders, ...documentNodes];

      return {
        title: (
          <Space>
            <FolderOutlined
              style={{ color: theme?.colors?.warning || '#faad14' }}
            />
            <Text>{folder.folderName}</Text>
            <Tag size="small" color="orange">
              {folder.children?.length || 0}个子文件夹
            </Tag>
          </Space>
        ),
        key: `folder_${folder.folderId}`,
        children: allChildren.length > 0 ? allChildren : undefined,
      };
    };

    // 处理根级文件夹
    const rootFolders = folders.map(convertFolder);

    // 处理根级文档
    const rootDocuments = documentsByFolder.get('root').map(doc => ({
      title: (
        <Space>
          <FileTextOutlined
            style={{ color: theme?.colors?.primary || '#1890ff' }}
          />
          <Text>{doc.documentName}</Text>
          <Tag size="small" color="blue">
            文档
          </Tag>
        </Space>
      ),
      key: `doc_${doc.documentId}`,
      isLeaf: true,
      documentId: doc.documentId,
      userId: userInfo.userId,
      userName: userInfo.username,
    }));

    // 合并根级文件夹和文档
    return [...rootFolders, ...rootDocuments];
  };

  /**
   * 处理树节点点击事件
   * @param {Array} selectedKeys 选中的节点key数组
   * @param {Object} info 节点信息
   */
  const handleTreeSelect = (selectedKeys, info) => {
    if (selectedKeys.length > 0) {
      const key = selectedKeys[0];
      console.log('这是key', key);
      if (key.startsWith('doc_')) {
        const documentId = key.replace('doc_', '');
        // 跳转到文档编辑器，并标记为协同文档
        navigate(
          `/doc-editor/${documentId}?collaborative=true&owner=${info.node.userName}`,
        );
      } else if (key.startsWith('folder_')) {
        const folderId = key.replace('folder_', '');
        navigate(`/folderListPage/${folderId}`);
      }
    }
  };

  /**
   * 处理搜索框显示/隐藏
   */
  const toggleSearchInput = () => {
    const newVisible = !showSearchInput;
    setShowSearchInput(newVisible);

    // 当显示搜索框时，自动聚焦到输入框
    if (newVisible) {
      setTimeout(() => {
        searchInputRef.current?.focus();
        // 当搜索框显示时设置容器宽度
        if (searchWrapperRef.current) {
          searchWrapperRef.current.style.width = '240px';
        }
      }, 10);
    } else {
      // 当搜索框隐藏时恢复容器宽度
      if (searchWrapperRef.current) {
        // 使用延时确保过渡效果结束后再改变宽度
        setTimeout(() => {
          if (!showSearchInput && searchWrapperRef.current) {
            searchWrapperRef.current.style.width = '40px';
          }
        }, 200);
      }

      if (!searchKeyword.trim()) {
        // 当隐藏搜索框且没有搜索关键字时，恢复全部数据
        setFilteredData(collaborationData);
      }
    }
  };

  /**
   * 处理搜索结果清空
   */
  const handleClearSearch = () => {
    setSearchKeyword('');
    setFilteredData(collaborationData);
  };

  /**
   * 处理搜索按键事件
   */
  const handleSearchKeyPress = e => {
    if (e.key === 'Enter') {
      handleSearch(searchKeyword);
    } else if (e.key === 'Escape') {
      toggleSearchInput();
    }
  };

  useEffect(() => {
    fetchCollaborationData();
  }, []);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" />
        <Text style={{ marginTop: 16, color: theme?.colors?.textSecondary }}>
          正在加载协同文档...
        </Text>
      </div>
    );
  }

  if (collaborationData.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Title level={2}>协同文档</Title>
          <Text type="secondary">与其他用户协同编辑文档</Text>
        </div>
        <Empty
          description="暂无公开的协同文档"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <Title level={2} style={{ color: theme?.colors?.primary }}>
            协同文档
          </Title>
          <Text type="secondary">
            发现 {collaborationData.length} 个用户的公开空间，
            点击文档即可开始协同编辑
          </Text>
        </div>

        <div
          className={styles.searchWrapper}
          ref={searchWrapperRef}
          style={{
            width: showSearchInput ? '240px' : '40px',
            transition: 'width 0.2s ease-in-out',
          }}
        >
          {searchKeyword && !showSearchInput && (
            <Tag
              closable
              onClose={handleClearSearch}
              className={styles.searchTag}
            >
              {`搜索: ${searchKeyword}`}
            </Tag>
          )}

          {!showSearchInput ? (
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={toggleSearchInput}
              className={styles.searchButton}
            />
          ) : (
            <div className={styles.compactSearchContainer}>
              <Input
                ref={searchInputRef}
                placeholder="输入关键词搜索..."
                value={searchKeyword}
                onChange={e => setSearchKeyword(e.target.value)}
                onKeyDown={handleSearchKeyPress}
                suffix={
                  <Space>
                    {searchKeyword && (
                      <CloseOutlined
                        onClick={handleClearSearch}
                        className={styles.clearIcon}
                      />
                    )}
                    <SearchOutlined
                      onClick={() => handleSearch(searchKeyword)}
                      className={styles.searchIcon}
                    />
                    <CloseOutlined
                      onClick={toggleSearchInput}
                      className={styles.closeIcon}
                    />
                  </Space>
                }
                className={styles.compactSearchInput}
              />
            </div>
          )}
        </div>
      </div>

      <div className={styles.content}>
        {filteredData.length > 0 ? (
          filteredData.map(userInfo => (
            <Card
              key={userInfo.userId}
              title={
                <Space>
                  <Avatar
                    icon={<UserOutlined />}
                    style={{ backgroundColor: theme?.colors?.primary }}
                  />
                  <span>{userInfo.username}的公开空间</span>
                  <Tag color="green">公开</Tag>
                </Space>
              }
              extra={
                <Space>
                  <Text type="secondary">{userInfo.totalFolders} 个文件夹</Text>
                  <Text type="secondary">{userInfo.totalDocuments} 个文档</Text>
                </Space>
              }
              className={styles.userCard}
            >
              {userInfo.folders.length > 0 || userInfo.documents.length > 0 ? (
                <Tree
                  showLine
                  showIcon={false}
                  defaultExpandAll
                  onSelect={handleTreeSelect}
                  treeData={convertToTreeData(
                    userInfo.folders,
                    userInfo.documents,
                    userInfo,
                  )}
                  className={styles.tree}
                />
              ) : (
                <Empty
                  description="该用户暂无公开内容"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  style={{ margin: '20px 0' }}
                />
              )}
            </Card>
          ))
        ) : searchKeyword ? (
          <Empty
            description={`没有找到包含"${searchKeyword}"的文件夹或文档`}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Empty
            description="暂无搜索结果"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </div>
    </div>
  );
};

export default Collaboration;
