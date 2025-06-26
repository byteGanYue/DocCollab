import React, { useState, useEffect, useRef } from 'react';
import { Breadcrumb, Input, Spin } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '@/hooks/useAuth';
import { documentAPI } from '@/utils/api';
import { formatTime } from '@/utils/dealTime';
import { ThemeContext } from '@/contexts/ThemeContext';
import { useContext } from 'react';
import styles from './contentHeader.module.less';

const { Search } = Input;

const ContentHeader = () => {
  const location = useLocation(); // 获取当前路由信息
  const navigate = useNavigate(); // 路由导航
  const { userInfo } = useUser(); // 获取用户信息
  const { getCurrentTheme } = useContext(ThemeContext); // 获取当前主题

  // 搜索相关状态
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeoutRef = useRef(null);
  const dropdownRef = useRef(null);

  // 根据当前路由生成面包屑导航
  const getBreadcrumbItems = () => {
    const path = location.pathname;
    if (path === '/home') {
      return [{ title: '首页' }];
    } else if (path === '/recent-docs') {
      return [{ title: '最近访问文档列表' }];
    } else if (path.startsWith('/doc-editor')) {
      return [{ title: '文档编辑' }];
    } else if (path.startsWith('/history-version')) {
      return [{ title: '历史版本记录' }];
    }
  };

  /**
   * 高亮搜索文本
   * @param {string} text - 原始文本
   * @param {string} searchText - 搜索文本
   * @returns {string} 高亮后的HTML字符串
   */
  const highlightText = (text, searchText) => {
    if (!searchText || !text) return text;

    const currentTheme = getCurrentTheme();
    const primaryColor = currentTheme?.colors?.primary || '#1890ff';

    const regex = new RegExp(`(${searchText})`, 'gi');
    return text.replace(
      regex,
      `<span style="color: ${primaryColor}; font-weight: 600;">$1</span>`,
    );
  };

  /**
   * 搜索文档内容
   * @param {string} text - 搜索文本
   */
  const searchDocuments = async text => {
    if (!text || !text.trim() || !userInfo?.userId) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setLoading(true);
    try {
      const params = {
        searchText: text.trim(),
        userId: userInfo.userId,
      };
      const response = await documentAPI.searchDocumentsContent(params);

      if (response.success) {
        setSearchResults(response.data);
        setShowDropdown(true);
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    } catch (error) {
      console.error('搜索文档失败:', error);
      setSearchResults([]);
      setShowDropdown(false);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 处理搜索输入变化
   * @param {string} value - 输入值
   */
  const handleSearchChange = value => {
    setSearchText(value);

    // 清除之前的定时器
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // 设置防抖延迟搜索
    searchTimeoutRef.current = setTimeout(() => {
      searchDocuments(value);
    }, 300);
  };

  /**
   * 处理搜索项点击
   * @param {Object} item - 搜索结果项
   */
  const handleSearchItemClick = item => {
    setShowDropdown(false);
    setSearchText('');
    // 跳转到文档编辑页面
    navigate(`/doc-editor/${item.documentId}`);
  };

  /**
   * 处理搜索框失去焦点
   */
  const handleSearchBlur = () => {
    // 延迟隐藏下拉菜单，避免点击搜索结果时立即隐藏
    setTimeout(() => {
      setShowDropdown(false);
    }, 200);
  };

  /**
   * 处理搜索框获得焦点
   */
  const handleSearchFocus = () => {
    if (searchText && searchResults.length > 0) {
      setShowDropdown(true);
    }
  };

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = event => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={styles.contentHeader}>
      <Breadcrumb className={styles.breadcrumb} items={getBreadcrumbItems()} />

      {/* 搜索框 */}
      <div className={styles.searchContainer} ref={dropdownRef}>
        <Search
          placeholder="搜索文档内容..."
          value={searchText}
          onChange={e => handleSearchChange(e.target.value)}
          onFocus={handleSearchFocus}
          onBlur={handleSearchBlur}
          className={styles.searchInput}
          prefix={<SearchOutlined />}
          allowClear
        />

        {/* 搜索结果下拉菜单 */}
        {showDropdown && (
          <div className={styles.searchDropdown}>
            {loading ? (
              <div className={styles.loading}>
                <Spin size="small" /> 搜索中...
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((item, index) => (
                <div
                  key={`${item.documentId}-${index}`}
                  className={styles.searchItem}
                  onClick={() => handleSearchItemClick(item)}
                >
                  <span
                    className={styles.documentName}
                    dangerouslySetInnerHTML={{
                      __html: highlightText(item.documentName, searchText),
                    }}
                  />
                  <div
                    className={styles.content}
                    dangerouslySetInnerHTML={{
                      __html: highlightText(item.content, searchText),
                    }}
                  />
                  <div className={styles.meta}>
                    {item.create_username} • {formatTime(item.update_time)}
                  </div>
                </div>
              ))
            ) : searchText ? (
              <div className={styles.noResults}>未找到相关文档</div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentHeader;
