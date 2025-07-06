import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Table,
    Button,
    Space,
    Card,
    Modal,
    Form,
    Input,
    Select,
    DatePicker,
    message,
    Tag,
    Tooltip,
    Popconfirm,
    Drawer,
    Typography,
    Divider,
    Alert,
    Spin,
    Row,
    Col,
    Statistic,
} from 'antd';
import {
    PlusOutlined,
    HistoryOutlined,
    FileTextOutlined,
    DeleteOutlined,
    EyeOutlined,
    SwapOutlined,
    DownloadOutlined,
    ReloadOutlined,
    CalendarOutlined,
    TagOutlined,
    UserOutlined,
    ClockCircleOutlined,
    SafetyOutlined,
} from '@ant-design/icons';
import { documentAPI, documentArchiveAPI } from '../../utils/api';
import styles from './index.module.less';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

/**
 * 归档管理页面
 * 提供文档归档的创建、查看、恢复、比较等功能
 */
const ArchiveManagement = () => {
    const { id: documentId } = useParams();
    const navigate = useNavigate();
    const [messageApi, contextHolder] = message.useMessage();

    // 状态管理
    const [archives, setArchives] = useState([]);
    const [loading, setLoading] = useState(false);
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [compareModalVisible, setCompareModalVisible] = useState(false);
    const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
    const [selectedArchive, setSelectedArchive] = useState(null);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });
    const [filters, setFilters] = useState({
        archiveType: undefined,
        tags: undefined,
        startDate: undefined,
        endDate: undefined,
    });

    // 表单实例
    const [createForm] = Form.useForm();
    const [compareForm] = Form.useForm();

    /**
 * 获取当前用户信息
 */
    const getCurrentUser = () => {
        const userInfoStr = localStorage.getItem('userInfo');
        let currentUser = {
            username: '当前用户',
            userId: 1
        };

        if (userInfoStr) {
            try {
                const userInfo = JSON.parse(userInfoStr);
                currentUser = {
                    username: userInfo.username || userInfo.create_username || '当前用户',
                    userId: userInfo.userId || userInfo._id || 1
                };
            } catch (error) {
                console.error('解析用户信息失败:', error);
            }
        }

        return currentUser;
    };

    /**
     * 格式化存储大小
     */
    const formatStorageSize = (bytes) => {
        if (!bytes || bytes === 0) return '0 B';
        if (bytes >= 1024 * 1024) {
            return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
        } else if (bytes >= 1024) {
            return `${(bytes / 1024).toFixed(2)} KB`;
        } else {
            return `${bytes} B`;
        }
    };

    /**
     * 获取归档列表
     */
    const fetchArchives = useCallback(async (page = 1, pageSize = 10) => {
        if (!documentId) return;

        setLoading(true);
        try {
            const params = {
                page,
                pageSize,
                ...filters,
            };

            const response = await documentArchiveAPI.getDocumentArchives(documentId, params);
            if (response.success) {
                setArchives(response.data.archives);
                setPagination({
                    current: response.data.page,
                    pageSize: response.data.pageSize,
                    total: response.data.total,
                });
            } else {
                messageApi.error(response.message || '获取归档列表失败');
            }
        } catch (error) {
            console.error('获取归档列表失败:', error);
            messageApi.error('获取归档列表失败');
        } finally {
            setLoading(false);
        }
    }, [documentId, filters, messageApi]);

    // 首次加载和参数变化时获取数据
    useEffect(() => {
        fetchArchives();
    }, [fetchArchives]);

    /**
     * 创建归档
     */
    const handleCreateArchive = async (values) => {
        try {
            // 检查文档ID是否存在
            if (!documentId) {
                messageApi.error('文档ID不存在');
                return;
            }

            // 获取当前文档内容
            const userId = parseInt(localStorage.getItem('userId') || '1');
            const documentResponse = await documentAPI.getDocument(documentId, userId);
            if (!documentResponse.success) {
                messageApi.error('获取文档内容失败');
                return;
            }

            const document = documentResponse.data;
            const currentUser = getCurrentUser();

            const archiveData = {
                ...values,
                yjsState: document.yjsState || [],
                structuredContent: document.content,
                createdBy: currentUser.username,
                createdByUserId: currentUser.userId,
                metadata: {
                    userCount: 0,
                    sessionDuration: 0,
                    changeCount: 0,
                    collaborators: [],
                    systemInfo: {
                        version: '1.0.0',
                        platform: 'web',
                        userAgent: navigator.userAgent,
                    },
                },
                auditInfo: {
                    ipAddress: '127.0.0.1',
                    userAgent: navigator.userAgent,
                    sessionId: 'web-session',
                    operationType: 'manual-archive',
                    reason: values.archiveDescription,
                    complianceLevel: 'normal',
                },
            };

            const response = await documentArchiveAPI.createDocumentArchive(documentId, archiveData);
            if (response.success) {
                messageApi.success('归档创建成功');
                setCreateModalVisible(false);
                createForm.resetFields();
                fetchArchives();
            } else {
                messageApi.error(response.message || '归档创建失败');
            }
        } catch (error) {
            console.error('创建归档失败:', error);
            messageApi.error('创建归档失败');
        }
    };

    /**
 * 从归档恢复文档
 */
    const handleRestoreArchive = async (archiveId) => {
        try {
            const currentUser = getCurrentUser();

            const response = await documentArchiveAPI.restoreFromArchive(documentId, archiveId, {
                userId: currentUser.userId,
                username: currentUser.username,
            });

            if (response.success) {
                messageApi.success('从归档恢复成功');
                navigate(`/doc-editor/${documentId}`);
            } else {
                messageApi.error(response.message || '恢复失败');
            }
        } catch (error) {
            console.error('恢复归档失败:', error);
            messageApi.error('恢复归档失败');
        }
    };

    /**
     * 比较归档
     */
    const handleCompareArchives = async (values) => {
        try {
            const response = await documentArchiveAPI.compareArchives({
                archiveId1: values.archiveId1,
                archiveId2: values.archiveId2,
            });

            if (response.success) {
                messageApi.success('比较完成');
                setCompareModalVisible(false);
                compareForm.resetFields();
                // 这里可以显示比较结果
                console.log('比较结果:', response.data);
            } else {
                messageApi.error(response.message || '比较失败');
            }
        } catch (error) {
            console.error('比较归档失败:', error);
            messageApi.error('比较归档失败');
        }
    };

    /**
 * 删除归档
 */
    const handleDeleteArchive = async (archiveId, force = false) => {
        try {
            const currentUser = getCurrentUser();

            const response = await documentArchiveAPI.deleteArchive(archiveId, {
                userId: currentUser.userId,
                force,
            });

            if (response.success) {
                messageApi.success('删除归档成功');
                fetchArchives();
            } else {
                messageApi.error(response.message || '删除失败');
            }
        } catch (error) {
            console.error('删除归档失败:', error);
            messageApi.error('删除归档失败');
        }
    };

    /**
     * 查看归档详情
     */
    const handleViewArchiveDetail = async (archiveId) => {
        try {
            const response = await documentArchiveAPI.getArchiveDetail(archiveId);
            if (response.success) {
                setSelectedArchive(response.data);
                setDetailDrawerVisible(true);
            } else {
                messageApi.error(response.message || '获取归档详情失败');
            }
        } catch (error) {
            console.error('获取归档详情失败:', error);
            messageApi.error('获取归档详情失败');
        }
    };

    // 表格列定义
    const columns = [
        {
            title: '归档名称',
            dataIndex: 'archiveName',
            key: 'archiveName',
            render: (text, record) => (
                <Space>
                    <FileTextOutlined style={{ color: '#1890ff' }} />
                    <span>{text}</span>
                    {record.isProtected && (
                        <SafetyOutlined style={{ color: '#faad14' }} title="受保护" />
                    )}
                    {record.isCompliance && (
                        <Tag color="green">合规</Tag>
                    )}
                </Space>
            ),
        },
        {
            title: '归档类型',
            dataIndex: 'archiveType',
            key: 'archiveType',
            render: (type) => {
                const typeMap = {
                    daily: { text: '每日归档', color: 'blue' },
                    manual: { text: '手动归档', color: 'green' },
                    milestone: { text: '里程碑归档', color: 'orange' },
                    compliance: { text: '合规归档', color: 'red' },
                };
                const config = typeMap[type] || { text: type, color: 'default' };
                return <Tag color={config.color}>{config.text}</Tag>;
            },
        },
        {
            title: '创建时间',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => new Date(date).toLocaleString(),
        },
        {
            title: '创建人',
            dataIndex: 'createdBy',
            key: 'createdBy',
        },
        {
            title: '内容大小',
            dataIndex: 'contentSize',
            key: 'contentSize',
            render: (size) => formatStorageSize(size),
        },
        {
            title: '标签',
            dataIndex: 'tags',
            key: 'tags',
            render: (tags) => (
                <Space>
                    {tags?.map((tag, index) => (
                        <Tag key={index} color="blue">
                            {tag}
                        </Tag>
                    ))}
                </Space>
            ),
        },
        {
            title: '操作',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Tooltip title="查看详情">
                        <Button
                            type="link"
                            icon={<EyeOutlined />}
                            onClick={() => handleViewArchiveDetail(record.archiveId)}
                        />
                    </Tooltip>
                    <Tooltip title="恢复文档">
                        <Button
                            type="link"
                            icon={<HistoryOutlined />}
                            onClick={() => handleRestoreArchive(record.archiveId)}
                        />
                    </Tooltip>
                    <Tooltip title="删除归档">
                        <Popconfirm
                            title="确定要删除这个归档吗？"
                            onConfirm={() => handleDeleteArchive(record.archiveId)}
                            okText="确定"
                            cancelText="取消"
                        >
                            <Button
                                type="link"
                                danger
                                icon={<DeleteOutlined />}
                                disabled={record.isProtected}
                            />
                        </Popconfirm>
                    </Tooltip>
                </Space>
            ),
        },
    ];

    // 处理表格变化
    const handleTableChange = (pagination, filters, sorter) => {
        fetchArchives(pagination.current, pagination.pageSize);
    };

    return (
        <div className={styles.archiveContainer}>
            {contextHolder}

            {/* 页面头部 */}
            <div className={styles.pageHeader}>
                <Title level={3}>文档归档管理</Title>
                <Space>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setCreateModalVisible(true)}
                    >
                        创建归档
                    </Button>
                    <Button
                        icon={<SwapOutlined />}
                        onClick={() => setCompareModalVisible(true)}
                    >
                        比较归档
                    </Button>
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={() => fetchArchives()}
                    >
                        刷新
                    </Button>
                </Space>
            </div>

            {/* 统计信息 */}
            <Row gutter={16} className={styles.statistics}>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="总归档数"
                            value={pagination.total}
                            prefix={<FileTextOutlined />}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="受保护归档"
                            value={archives.filter(a => a.isProtected).length}
                            prefix={<SafetyOutlined />}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="合规归档"
                            value={archives.filter(a => a.isCompliance).length}
                            prefix={<SafetyOutlined />}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="总存储大小"
                            value={(() => {
                                const totalBytes = archives.reduce((sum, a) => sum + (a.contentSize || 0), 0);
                                const formatted = formatStorageSize(totalBytes);
                                const [value, unit] = formatted.split(' ');
                                return parseFloat(value);
                            })()}
                            suffix={(() => {
                                const totalBytes = archives.reduce((sum, a) => sum + (a.contentSize || 0), 0);
                                const formatted = formatStorageSize(totalBytes);
                                const [, unit] = formatted.split(' ');
                                return unit;
                            })()}
                            precision={2}
                        />
                    </Card>
                </Col>
            </Row>

            {/* 归档列表 */}
            <Card title="归档列表" className={styles.archiveList}>
                <Table
                    columns={columns}
                    dataSource={archives}
                    rowKey="archiveId"
                    pagination={pagination}
                    loading={loading}
                    onChange={handleTableChange}
                    className={styles.archiveTable}
                />
            </Card>

            {/* 创建归档弹窗 */}
            <Modal
                title="创建归档"
                open={createModalVisible}
                onCancel={() => setCreateModalVisible(false)}
                footer={null}
                width={600}
            >
                <Form
                    form={createForm}
                    layout="vertical"
                    onFinish={handleCreateArchive}
                >
                    <Form.Item
                        name="archiveType"
                        label="归档类型"
                        rules={[{ required: true, message: '请选择归档类型' }]}
                    >
                        <Select placeholder="请选择归档类型">
                            <Option value="daily">每日归档</Option>
                            <Option value="manual">手动归档</Option>
                            <Option value="milestone">里程碑归档</Option>
                            <Option value="compliance">合规归档</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="archiveName"
                        label="归档名称"
                        rules={[{ required: true, message: '请输入归档名称' }]}
                    >
                        <Input placeholder="请输入归档名称" />
                    </Form.Item>

                    <Form.Item
                        name="archiveDescription"
                        label="归档描述"
                        rules={[{ required: true, message: '请输入归档描述' }]}
                    >
                        <TextArea
                            rows={3}
                            placeholder="请输入归档描述"
                        />
                    </Form.Item>

                    <Form.Item
                        name="tags"
                        label="标签"
                    >
                        <Select
                            mode="tags"
                            placeholder="请输入标签"
                            style={{ width: '100%' }}
                        />
                    </Form.Item>

                    <Form.Item
                        name="isProtected"
                        label="受保护"
                        valuePropName="checked"
                    >
                        <Select placeholder="是否受保护">
                            <Option value={false}>否</Option>
                            <Option value={true}>是</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="isCompliance"
                        label="合规归档"
                        valuePropName="checked"
                    >
                        <Select placeholder="是否合规归档">
                            <Option value={false}>否</Option>
                            <Option value={true}>是</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item>
                        <Space>
                            <Button type="primary" htmlType="submit">
                                创建归档
                            </Button>
                            <Button onClick={() => setCreateModalVisible(false)}>
                                取消
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            {/* 比较归档弹窗 */}
            <Modal
                title="比较归档"
                open={compareModalVisible}
                onCancel={() => setCompareModalVisible(false)}
                footer={null}
                width={500}
            >
                <Form
                    form={compareForm}
                    layout="vertical"
                    onFinish={handleCompareArchives}
                >
                    <Form.Item
                        name="archiveId1"
                        label="归档 1"
                        rules={[{ required: true, message: '请选择第一个归档' }]}
                    >
                        <Select placeholder="请选择第一个归档">
                            {archives.map(archive => (
                                <Option key={archive.archiveId} value={archive.archiveId}>
                                    {archive.archiveName}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="archiveId2"
                        label="归档 2"
                        rules={[{ required: true, message: '请选择第二个归档' }]}
                    >
                        <Select placeholder="请选择第二个归档">
                            {archives.map(archive => (
                                <Option key={archive.archiveId} value={archive.archiveId}>
                                    {archive.archiveName}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item>
                        <Space>
                            <Button type="primary" htmlType="submit">
                                开始比较
                            </Button>
                            <Button onClick={() => setCompareModalVisible(false)}>
                                取消
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            {/* 归档详情抽屉 */}
            <Drawer
                title="归档详情"
                placement="right"
                onClose={() => setDetailDrawerVisible(false)}
                open={detailDrawerVisible}
                width={600}
            >
                {selectedArchive && (
                    <div>
                        <Title level={4}>{selectedArchive.archiveName}</Title>
                        <Paragraph>{selectedArchive.archiveDescription}</Paragraph>

                        <Divider />

                        <Row gutter={16}>
                            <Col span={12}>
                                <Text strong>归档类型:</Text>
                                <br />
                                <Tag color="blue">{selectedArchive.archiveType}</Tag>
                            </Col>
                            <Col span={12}>
                                <Text strong>创建时间:</Text>
                                <br />
                                <Text>{new Date(selectedArchive.createdAt).toLocaleString()}</Text>
                            </Col>
                        </Row>

                        <Row gutter={16} style={{ marginTop: 16 }}>
                            <Col span={12}>
                                <Text strong>创建人:</Text>
                                <br />
                                <Text>{selectedArchive.createdBy}</Text>
                            </Col>
                            <Col span={12}>
                                <Text strong>内容大小:</Text>
                                <br />
                                <Text>{(selectedArchive.contentSize / 1024).toFixed(2)} KB</Text>
                            </Col>
                        </Row>

                        <Divider />

                        <Text strong>标签:</Text>
                        <br />
                        <Space style={{ marginTop: 8 }}>
                            {selectedArchive.tags?.map((tag, index) => (
                                <Tag key={index} color="blue">
                                    {tag}
                                </Tag>
                            ))}
                        </Space>

                        <Divider />

                        <Text strong>元数据:</Text>
                        <br />
                        <pre style={{ marginTop: 8, fontSize: 12 }}>
                            {JSON.stringify(selectedArchive.metadata, null, 2)}
                        </pre>

                        <Divider />

                        <Text strong>审计信息:</Text>
                        <br />
                        <pre style={{ marginTop: 8, fontSize: 12 }}>
                            {JSON.stringify(selectedArchive.auditInfo, null, 2)}
                        </pre>
                    </div>
                )}
            </Drawer>
        </div>
    );
};

export default ArchiveManagement; 