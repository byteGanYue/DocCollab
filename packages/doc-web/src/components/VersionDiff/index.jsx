import React, { useState, useEffect } from 'react';
import { Card, Tabs, Typography, Space, Tag, Divider, Button } from 'antd';
import { DiffOutlined, EyeOutlined, FileTextOutlined } from '@ant-design/icons';
import styles from './index.module.less';

const { Text, Title } = Typography;
const { TabPane } = Tabs;

/**
 * 版本对比组件
 * 支持富文本内容的详细对比，类似于腾讯文档和飞书文档的版本对比功能
 */
const VersionDiff = ({
    oldVersion,
    newVersion,
    oldContent,
    newContent,
    onClose
}) => {
    const [activeTab, setActiveTab] = useState('diff');
    const [diffResult, setDiffResult] = useState(null);

    // 安全解析为数组
    function safeParseArray(strOrArr) {
        if (Array.isArray(strOrArr)) return strOrArr;
        if (typeof strOrArr === 'string') {
            try {
                const arr = JSON.parse(strOrArr);
                return Array.isArray(arr) ? arr : [];
            } catch {
                return [];
            }
        }
        return [];
    }

    // 计算富文本差异
    useEffect(() => {
        if (oldContent && newContent) {
            const result = calculateRichTextDiff(safeParseArray(oldContent), safeParseArray(newContent));
            setDiffResult(result);
        }
    }, [oldContent, newContent]);

    /**
     * 计算富文本差异
     * @param {string} oldContent - 旧内容
     * @param {string} newContent - 新内容
     * @returns {Object} 差异结果
     */
    const calculateRichTextDiff = (oldBlocks, newBlocks) => {
        try {
            oldBlocks = Array.isArray(oldBlocks) ? oldBlocks : [];
            newBlocks = Array.isArray(newBlocks) ? newBlocks : [];

            const differences = [];
            let addedBlocks = 0;
            let deletedBlocks = 0;
            let modifiedBlocks = 0;

            const maxLength = Math.max(oldBlocks.length, newBlocks.length);

            for (let i = 0; i < maxLength; i++) {
                const oldBlock = oldBlocks[i];
                const newBlock = newBlocks[i];

                if (!oldBlock && newBlock) {
                    // 新增块
                    differences.push({
                        type: 'added',
                        blockIndex: i,
                        content: newBlock,
                        lineNumber: i + 1,
                    });
                    addedBlocks++;
                } else if (oldBlock && !newBlock) {
                    // 删除块
                    differences.push({
                        type: 'deleted',
                        blockIndex: i,
                        content: oldBlock,
                        lineNumber: i + 1,
                    });
                    deletedBlocks++;
                } else if (oldBlock && newBlock) {
                    // 比较块内容
                    const blockDiff = compareBlock(oldBlock, newBlock, i);
                    if (blockDiff.hasChanges) {
                        differences.push(blockDiff);
                        modifiedBlocks++;
                    }
                }
            }

            // 计算相似度
            const totalChanges = addedBlocks + deletedBlocks + modifiedBlocks;
            const similarity = totalChanges === 0 ? 100 : Math.max(0, 100 - (totalChanges / maxLength) * 100);

            return {
                differences,
                summary: {
                    addedBlocks,
                    deletedBlocks,
                    modifiedBlocks,
                    totalChanges,
                    similarity: Math.round(similarity),
                },
            };
        } catch (error) {
            console.error('计算富文本差异失败:', error);
            // 回退到简单文本对比
            return calculateSimpleTextDiff(oldContent, newContent);
        }
    };

    /**
     * 比较块级元素
     * @param {Object} oldBlock - 旧块
     * @param {Object} newBlock - 新块
     * @param {number} index - 块索引
     * @returns {Object} 块差异
     */
    const compareBlock = (oldBlock, newBlock, index) => {
        const oldChildren = Array.isArray(oldBlock?.children) ? oldBlock.children : [];
        const newChildren = Array.isArray(newBlock?.children) ? newBlock.children : [];
        const childrenDiffs = diffChildren(oldChildren, newChildren);
        const hasChanges = childrenDiffs.some(d => d.diff);
        if (!hasChanges) {
            return { hasChanges: false };
        }
        return {
            type: 'modified',
            blockIndex: index,
            lineNumber: index + 1,
            oldContent: oldBlock,
            newContent: newBlock,
            childrenDiffs,
            hasChanges: true,
        };
    };

    /**
     * 比较children的text和所有富文本属性
     * @param {Array} oldChildren - 旧children
     * @param {Array} newChildren - 新children
     * @returns {Array} 差异结果
     */
    function diffChildren(oldChildren, newChildren) {
        oldChildren = Array.isArray(oldChildren) ? oldChildren : [];
        newChildren = Array.isArray(newChildren) ? newChildren : [];
        const maxLen = Math.max(oldChildren.length, newChildren.length);
        const diffs = [];
        for (let i = 0; i < maxLen; i++) {
            const oldChild = oldChildren[i] || {};
            const newChild = newChildren[i] || {};
            const childDiff = {};
            // 对比 text
            if (oldChild.text !== newChild.text) {
                childDiff.text = { old: oldChild.text, new: newChild.text };
            }
            // 对比所有富文本属性
            const allKeys = new Set([
                ...Object.keys(oldChild),
                ...Object.keys(newChild),
            ]);
            allKeys.delete('text');
            for (const key of allKeys) {
                if (oldChild[key] !== newChild[key]) {
                    childDiff[key] = { old: oldChild[key], new: newChild[key] };
                }
            }
            if (Object.keys(childDiff).length > 0) {
                diffs.push({ index: i, diff: childDiff, oldChild, newChild });
            } else {
                diffs.push({ index: i, diff: null, oldChild, newChild });
            }
        }
        return diffs;
    }

    /**
     * 简单文本对比（回退方案）
     * @param {string} oldText - 旧文本
     * @param {string} newText - 新文本
     * @returns {Object} 差异结果
     */
    const calculateSimpleTextDiff = (oldText, newText) => {
        const oldLines = String(oldText).split('\n');
        const newLines = String(newText).split('\n');

        const differences = [];
        let addedLines = 0;
        let deletedLines = 0;
        let modifiedLines = 0;

        const maxLength = Math.max(oldLines.length, newLines.length);

        for (let i = 0; i < maxLength; i++) {
            const oldLine = oldLines[i] || '';
            const newLine = newLines[i] || '';

            if (oldLine !== newLine) {
                if (oldLine && !newLine) {
                    differences.push({
                        type: 'deleted',
                        lineNumber: i + 1,
                        content: oldLine,
                    });
                    deletedLines++;
                } else if (!oldLine && newLine) {
                    differences.push({
                        type: 'added',
                        lineNumber: i + 1,
                        content: newLine,
                    });
                    addedLines++;
                } else {
                    differences.push({
                        type: 'modified',
                        lineNumber: i + 1,
                        oldContent: oldLine,
                        newContent: newLine,
                    });
                    modifiedLines++;
                }
            }
        }

        const totalChanges = addedLines + deletedLines + modifiedLines;
        const similarity = totalChanges === 0 ? 100 : Math.max(0, 100 - (totalChanges / maxLength) * 100);

        return {
            differences,
            summary: {
                addedLines,
                deletedLines,
                modifiedLines,
                totalChanges,
                similarity: Math.round(similarity),
            },
        };
    };

    /**
     * 渲染差异内容
     * @param {Object} diff - 差异对象
     * @returns {React.ReactElement} 渲染结果
     */
    const renderDiff = (diff) => {
        switch (diff.type) {
            case 'added':
                return (
                    <div className={styles.diffAdded}>
                        <div className={styles.diffHeader}>
                            <Tag color="green">+ 新增</Tag>
                            <Text type="secondary">第 {diff.lineNumber} 行</Text>
                        </div>
                        <div className={styles.diffContent}>
                            <Text type="success">+ {renderBlockContent(diff.content)}</Text>
                        </div>
                    </div>
                );

            case 'deleted':
                return (
                    <div className={styles.diffDeleted}>
                        <div className={styles.diffHeader}>
                            <Tag color="red">- 删除</Tag>
                            <Text type="secondary">第 {diff.lineNumber} 行</Text>
                        </div>
                        <div className={styles.diffContent}>
                            <Text type="danger">- {renderBlockContent(diff.content)}</Text>
                        </div>
                    </div>
                );

            case 'modified':
                return renderMergedBlockDiff(diff);

            default:
                return null;
        }
    };

    /**
     * 渲染合并视图
     * @param {Object} blockDiff - 块差异
     * @returns {React.ReactElement} 渲染结果
     */
    function renderMergedBlockDiff(blockDiff) {
        const { childrenDiffs, lineNumber } = blockDiff;
        // 合并视图：每个child并排高亮
        return (
            <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 13, marginBottom: 2 }}>
                    <Tag color="orange">~ 修改</Tag>
                    <Text type="secondary">第 {lineNumber} 行</Text>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {Array.isArray(childrenDiffs) ? childrenDiffs.map((child, idx) => (
                        <span key={idx} style={{ position: 'relative', marginRight: 8 }}>
                            {renderChildDiff(child)}
                        </span>
                    )) : null}
                </div>
            </div>
        );
    }

    /**
     * 渲染子差异
     * @param {Object} child - 子差异
     * @returns {React.ReactElement} 渲染结果
     */
    function renderChildDiff(child) {
        const { diff, oldChild, newChild } = child;
        if (!diff) {
            // 完全相同
            return <span>{oldChild.text}</span>;
        }
        // 高亮不同属性
        const style = {
            backgroundColor: diff.backgroundColor ? '#fff59d' : undefined,
            color: diff.color ? diff.color.new || '#d32f2f' : undefined,
            textDecoration: diff.strikethrough ? 'line-through' : undefined,
            fontWeight: diff.bold ? 'bold' : undefined,
            fontStyle: diff.italic ? 'italic' : undefined,
            borderBottom: diff.underline ? '2px solid #1976d2' : undefined,
            padding: '0 2px',
            borderRadius: 2,
        };
        return (
            <span style={style}>
                {diff.text ? (
                    <>
                        <del style={{ color: '#d32f2f', background: '#ffcdd2', padding: '0 2px', borderRadius: 2 }}>{diff.text.old}</del>
                        <ins style={{ color: '#388e3c', background: '#c8e6c9', padding: '0 2px', borderRadius: 2, textDecoration: 'none' }}>{diff.text.new}</ins>
                    </>
                ) : newChild.text}
            </span>
        );
    }

    /**
     * 渲染块内容
     * @param {Object|string} content - 内容
     * @returns {string} 渲染后的文本
     */
    const renderBlockContent = (content) => {
        if (typeof content === 'string') {
            return content;
        }

        if (content && typeof content === 'object') {
            // 处理富文本块
            if (content.type === 'paragraph' && content.children) {
                return content.children
                    .map(child => child.text || '')
                    .join('');
            }

            if (content.type === 'heading' && content.children) {
                return content.children
                    .map(child => child.text || '')
                    .join('');
            }

            return JSON.stringify(content);
        }

        return String(content);
    };

    if (!diffResult) {
        return (
            <div className={styles.loading}>
                <Text>正在计算版本差异...</Text>
            </div>
        );
    }

    return (
        <div className={styles.versionDiff}>
            {/* 版本信息头部 */}
            <div className={styles.header}>
                <Space>
                    <Title level={4}>
                        <DiffOutlined /> 版本对比
                    </Title>
                    <Tag color="blue">{oldVersion?.versionNumber || 'v1'}</Tag>
                    <Text>→</Text>
                    <Tag color="green">{newVersion?.versionNumber || 'v2'}</Tag>
                </Space>
            </div>

            {/* 差异统计 */}
            <Card className={styles.summaryCard}>
                <Space size="large">
                    <div>
                        <Text type="success">+{diffResult.summary.addedBlocks || diffResult.summary.addedLines} 新增</Text>
                    </div>
                    <div>
                        <Text type="danger">-{diffResult.summary.deletedBlocks || diffResult.summary.deletedLines} 删除</Text>
                    </div>
                    <div>
                        <Text type="warning">~{diffResult.summary.modifiedBlocks || diffResult.summary.modifiedLines} 修改</Text>
                    </div>
                    <div>
                        <Text>相似度：{diffResult.summary.similarity}%</Text>
                    </div>
                </Space>
            </Card>

            {/* 对比内容 */}
            <Tabs activeKey={activeTab} onChange={setActiveTab} className={styles.tabs}>
                <TabPane tab="差异对比" key="diff">
                    <div className={styles.diffContainer}>
                        {diffResult.differences.length === 0 ? (
                            <div className={styles.noDiff}>
                                <Text type="success">两个版本内容完全相同</Text>
                            </div>
                        ) : (
                            Array.isArray(diffResult.differences) ? diffResult.differences.map((diff, index) => (
                                <div key={index} className={styles.diffItem}>
                                    {renderDiff(diff)}
                                </div>
                            )) : null
                        )}
                    </div>
                </TabPane>

                <TabPane tab="旧版本" key="old">
                    <div className={styles.contentView}>
                        <div className={styles.contentHeader}>
                            <FileTextOutlined />
                            <Text strong>{oldVersion?.versionNumber || 'v1'}</Text>
                        </div>
                        <div className={styles.contentBody}>
                            <pre>{JSON.stringify(oldContent, null, 2)}</pre>
                        </div>
                    </div>
                </TabPane>

                <TabPane tab="新版本" key="new">
                    <div className={styles.contentView}>
                        <div className={styles.contentHeader}>
                            <FileTextOutlined />
                            <Text strong>{newVersion?.versionNumber || 'v2'}</Text>
                        </div>
                        <div className={styles.contentBody}>
                            <pre>{JSON.stringify(newContent, null, 2)}</pre>
                        </div>
                    </div>
                </TabPane>
            </Tabs>

            {/* 操作按钮 */}
            <div className={styles.actions}>
                <Button onClick={onClose}>关闭</Button>
            </div>
        </div>
    );
};

export default VersionDiff; 