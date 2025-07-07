import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Select,
  Button,
  Card,
  Space,
  Typography,
  Spin,
  message,
  Tabs,
} from 'antd';
import { ArrowLeftOutlined, DiffOutlined } from '@ant-design/icons';
import { documentAPI } from '@/utils/api';
import VersionDiff from '@/components/VersionDiff';

const { Text, Title } = Typography;

const VersionCompare = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  // 获取 userId
  const userInfo = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('userInfo') || '{}');
    } catch {
      return {};
    }
  }, []);
  const userId = userInfo.userId || userInfo._id;

  const [versions, setVersions] = useState([]);
  const [currentContent, setCurrentContent] = useState(null);
  const [leftVersionId, setLeftVersionId] = useState(null);
  const [rightVersionId, setRightVersionId] = useState(null);
  const [leftContent, setLeftContent] = useState(null);
  const [rightContent, setRightContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showOnlyDiff, setShowOnlyDiff] = useState(false);

  // 拉取历史版本列表和当前内容
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const historyRes = await documentAPI.getDocumentHistory(
          documentId,
          1,
          100,
        );
        const docRes = await documentAPI.getDocument(documentId, userId);
        if (historyRes.success && historyRes.data && historyRes.data.versions) {
          setVersions(historyRes.data.versions);
        } else {
          setVersions([]);
        }
        if (docRes.success && docRes.data && docRes.data.content) {
          setCurrentContent(docRes.data.content);
        } else {
          setCurrentContent('');
        }
      } catch (e) {
        message.error('获取版本数据失败');
        setVersions([]);
        setCurrentContent('');
      } finally {
        setLoading(false);
      }
    }
    if (userId) fetchData();
  }, [documentId, userId]);

  // 支持 URL 参数自动选中版本
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const left = params.get('left');
    const right = params.get('right');
    if (left) setLeftVersionId(left);
    if (right) setRightVersionId(right);
  }, [location.search]);

  // 拉取选中版本内容
  useEffect(() => {
    async function fetchContent(versionId, setter) {
      if (!versionId) {
        setter(null);
        return;
      }
      if (versionId === 'current') {
        setter(currentContent);
        return;
      }
      const res = await documentAPI.getDocumentVersion(
        documentId,
        versionId,
        userId,
      );
      if (res.success && res.data && res.data.content) {
        setter(res.data.content);
      } else {
        setter('');
      }
    }
    if (userId) fetchContent(leftVersionId, setLeftContent);
    // eslint-disable-next-line
  }, [leftVersionId, currentContent, documentId, userId]);

  useEffect(() => {
    async function fetchContent(versionId, setter) {
      if (!versionId) {
        setter(null);
        return;
      }
      if (versionId === 'current') {
        setter(currentContent);
        return;
      }
      const res = await documentAPI.getDocumentVersion(
        documentId,
        versionId,
        userId,
      );
      if (res.success && res.data && res.data.content) {
        setter(res.data.content);
      } else {
        setter('');
      }
    }
    if (userId) fetchContent(rightVersionId, setRightContent);
    // eslint-disable-next-line
  }, [rightVersionId, currentContent, documentId, userId]);

  // 版本选择下拉数据
  const versionOptions = useMemo(() => {
    const opts = versions.map((v, idx) => {
      const versionNum = v.versionNumber || v.versionId || idx + 1;
      return {
        label: `版本${versionNum}`,
        value: v.versionId || v.versionNumber || '',
      };
    });
    opts.unshift({ label: '当前版本', value: 'current' });
    return opts;
  }, [versions]);

  return (
    <div style={{ padding: 32, background: '#f7f8fa', minHeight: '100vh' }}>
      <Space align="center" style={{ marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          返回
        </Button>
        <Title level={3} style={{ margin: 0 }}>
          <DiffOutlined style={{ color: '#1890ff', marginRight: 8 }} />
          版本结构化对比
        </Title>
      </Space>
      <Card style={{ marginBottom: 24 }}>
        <Space size="large" align="center">
          <span>左侧版本：</span>
          <Select
            style={{ width: 260 }}
            options={versionOptions}
            value={leftVersionId}
            onChange={setLeftVersionId}
            placeholder="选择基准版本"
            showSearch
            optionFilterProp="label"
            allowClear
          />
          <span>右侧版本：</span>
          <Select
            style={{ width: 260 }}
            options={versionOptions}
            value={rightVersionId}
            onChange={setRightVersionId}
            placeholder="选择对比版本"
            showSearch
            optionFilterProp="label"
            allowClear
          />
          <Button
            type={showOnlyDiff ? 'primary' : 'default'}
            onClick={() => setShowOnlyDiff(v => !v)}
          >
            {showOnlyDiff ? '显示全部' : '只看不同'}
          </Button>
        </Space>
      </Card>
      <Spin spinning={loading} tip="加载中...">
        <Tabs
          defaultActiveKey="diff"
          items={[
            {
              key: 'diff',
              label: '差异对比',
              children: (
                <div style={{ display: 'flex', gap: 24 }}>
                  <Card
                    title={<span>左侧版本内容</span>}
                    style={{ flex: 1, minHeight: 600 }}
                  >
                    {leftContent !== null && rightContent !== null ? (
                      <VersionDiff
                        oldContent={
                          typeof leftContent === 'string' && leftContent.trim()
                            ? leftContent
                            : '[]'
                        }
                        newContent={
                          typeof rightContent === 'string' &&
                          rightContent.trim()
                            ? rightContent
                            : '[]'
                        }
                        mode="split"
                        showOnlyDiff={showOnlyDiff}
                      />
                    ) : (
                      <Text type="secondary">请选择左侧和右侧版本</Text>
                    )}
                  </Card>
                </div>
              ),
            },
            {
              key: 'left',
              label: '旧版本',
              children: (
                <div style={{ display: 'flex', gap: 24 }}>
                  <Card
                    title={<span>左侧版本内容</span>}
                    style={{ flex: 1, minHeight: 600 }}
                  >
                    {leftContent !== null ? (
                      <pre
                        style={{
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-all',
                        }}
                      >
                        {typeof leftContent === 'string'
                          ? leftContent
                          : JSON.stringify(leftContent, null, 2)}
                      </pre>
                    ) : (
                      <Text type="secondary">请选择左侧版本</Text>
                    )}
                  </Card>
                </div>
              ),
            },
            {
              key: 'right',
              label: '新版本',
              children: (
                <div style={{ display: 'flex', gap: 24 }}>
                  <Card
                    title={<span>右侧版本内容</span>}
                    style={{ flex: 1, minHeight: 600 }}
                  >
                    {rightContent !== null ? (
                      <pre
                        style={{
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-all',
                        }}
                      >
                        {typeof rightContent === 'string'
                          ? rightContent
                          : JSON.stringify(rightContent, null, 2)}
                      </pre>
                    ) : (
                      <Text type="secondary">请选择右侧版本</Text>
                    )}
                  </Card>
                </div>
              ),
            },
          ]}
        />
      </Spin>
    </div>
  );
};

export default VersionCompare;
