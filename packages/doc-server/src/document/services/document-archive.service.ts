import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DocumentArchive, DocumentArchiveDocument } from '../schemas/document-archive.schema';
import { DocumentService } from '../document.service';
import { DocumentHistoryService } from './document-history.service';
import * as crypto from 'crypto';


@Injectable()
export class DocumentArchiveService {
    private readonly logger = new Logger(DocumentArchiveService.name);

    constructor(
        @InjectModel(DocumentArchive.name)
        private documentArchiveModel: Model<DocumentArchiveDocument>,
        private documentService: DocumentService,
        private documentHistoryService: DocumentHistoryService,
    ) { }

    /**
     * 创建文档归档
     */
    async createArchive(
        documentId: string,
        archiveData: {
            archiveType: 'daily' | 'manual' | 'milestone' | 'compliance';
            archiveName: string;
            archiveDescription: string;
            yjsState: Uint8Array;
            structuredContent: any;
            createdBy: string;
            createdByUserId: number;
            tags?: string[];
            metadata?: any;
            auditInfo?: any;
            isProtected?: boolean;
            isCompliance?: boolean;
            retentionUntil?: Date;
        },
    ): Promise<DocumentArchive> {
        try {
            // 生成归档ID
            const timestamp = Date.now();
            const random = Math.random().toString(36).substring(2, 15);
            const archiveId = `archive_${timestamp}_${random}`;

            // 计算内容哈希
            const contentHash = this.computeContentHash(archiveData.structuredContent);

            // 计算总存储大小（包括所有数据）
            const structuredContentSize = Buffer.byteLength(JSON.stringify(archiveData.structuredContent));
            const yjsStateSize = archiveData.yjsState ? archiveData.yjsState.length : 0;
            const metadataSize = Buffer.byteLength(JSON.stringify(archiveData.metadata || {}));
            const auditInfoSize = Buffer.byteLength(JSON.stringify(archiveData.auditInfo || {}));
            const tagsSize = Buffer.byteLength(JSON.stringify(archiveData.tags || []));

            // 总存储大小（字节）
            const totalSize = structuredContentSize + yjsStateSize + metadataSize + auditInfoSize + tagsSize;

            // 获取当前文档版本
            const documentVersion = 1; // 默认版本

            // 创建归档记录
            const archive = new this.documentArchiveModel({
                documentId,
                archiveId,
                archiveType: archiveData.archiveType,
                archiveName: archiveData.archiveName,
                archiveDescription: archiveData.archiveDescription,
                yjsState: Buffer.from(archiveData.yjsState),
                structuredContent: archiveData.structuredContent,
                contentHash,
                contentSize: totalSize, // 使用计算出的总大小
                documentVersion,
                createdBy: archiveData.createdBy,
                createdByUserId: archiveData.createdByUserId,
                createdAt: new Date(),
                tags: archiveData.tags || [],
                metadata: archiveData.metadata || {},
                auditInfo: archiveData.auditInfo || {},
                isProtected: archiveData.isProtected || false,
                isCompliance: archiveData.isCompliance || false,
                retentionUntil: archiveData.retentionUntil,
            });

            const savedArchive = await archive.save();
            this.logger.log(`创建归档成功: ${archiveId} for document: ${documentId}`);

            return savedArchive;
        } catch (error) {
            this.logger.error(`创建归档失败: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * 获取文档的所有归档
     */
    async getArchivesByDocumentId(
        documentId: string,
        options: {
            page?: number;
            pageSize?: number;
            archiveType?: string;
            tags?: string[];
            startDate?: Date;
            endDate?: Date;
        } = {},
    ): Promise<{
        archives: DocumentArchive[];
        total: number;
        page: number;
        pageSize: number;
    }> {
        try {
            const {
                page = 1,
                pageSize = 20,
                archiveType,
                tags,
                startDate,
                endDate,
            } = options;

            // 构建查询条件
            const query: any = { documentId };

            if (archiveType) {
                query.archiveType = archiveType;
            }

            if (tags && tags.length > 0) {
                query.tags = { $in: tags };
            }

            if (startDate || endDate) {
                query.createdAt = {};
                if (startDate) query.createdAt.$gte = startDate;
                if (endDate) query.createdAt.$lte = endDate;
            }

            // 执行查询
            const [archives, total] = await Promise.all([
                this.documentArchiveModel
                    .find(query)
                    .sort({ createdAt: -1 })
                    .skip((page - 1) * pageSize)
                    .limit(pageSize)
                    .exec(),
                this.documentArchiveModel.countDocuments(query),
            ]);

            return {
                archives,
                total,
                page,
                pageSize,
            };
        } catch (error) {
            this.logger.error(`获取归档列表失败: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * 获取单个归档详情
     */
    async getArchiveById(archiveId: string): Promise<DocumentArchive> {
        try {
            const archive = await this.documentArchiveModel.findOne({ archiveId });
            if (!archive) {
                throw new Error(`归档不存在: ${archiveId}`);
            }
            return archive;
        } catch (error) {
            this.logger.error(`获取归档详情失败: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * 从归档恢复文档
     */
    async restoreFromArchive(
        documentId: string,
        archiveId: string,
        userId: number,
        username: string,
    ): Promise<{
        success: boolean;
        message: string;
        data?: any;
    }> {
        try {
            // 获取归档数据
            const archive = await this.getArchiveById(archiveId);
            if (!archive) {
                return {
                    success: false,
                    message: '归档不存在',
                };
            }

            // 验证文档ID
            if (archive.documentId.toString() !== documentId) {
                return {
                    success: false,
                    message: '归档与文档不匹配',
                };
            }

            // 创建恢复历史版本
            const restoreResult = await this.documentHistoryService.addDocumentHistory({
                userId: parseInt(documentId),
                documentId: parseInt(documentId),
                documentName: archive.archiveName,
                content: archive.structuredContent,
                create_username: username,
                update_username: username,
                yjsState: Array.from(archive.yjsState),
            });

            if (!restoreResult) {
                return {
                    success: false,
                    message: '恢复历史版本失败',
                };
            }

            // 更新文档内容
            const updateResult = await this.documentService.update(parseInt(documentId), {
                content: archive.structuredContent,
                yjsState: Array.from(archive.yjsState),
                update_username: username,
            });

            if (!updateResult.success) {
                return {
                    success: false,
                    message: '更新文档内容失败',
                };
            }

            this.logger.log(`从归档恢复成功: ${archiveId} for document: ${documentId}`);

            return {
                success: true,
                message: '从归档恢复成功',
                data: {
                    archiveId: archive.archiveId,
                    archiveName: archive.archiveName,
                    restoredVersion: restoreResult.versionId,
                },
            };
        } catch (error) {
            this.logger.error(`从归档恢复失败: ${error.message}`, error.stack);
            return {
                success: false,
                message: `恢复失败: ${error.message}`,
            };
        }
    }

    /**
     * 比较两个归档的内容差异
     */
    async compareArchives(
        archiveId1: string,
        archiveId2: string,
    ): Promise<{
        success: boolean;
        message: string;
        data?: {
            differences: any[];
            similarity: number;
            summary: string;
        };
    }> {
        try {
            const [archive1, archive2] = await Promise.all([
                this.getArchiveById(archiveId1),
                this.getArchiveById(archiveId2),
            ]);

            if (!archive1 || !archive2) {
                return {
                    success: false,
                    message: '归档不存在',
                };
            }

            // 比较内容哈希
            const isIdentical = archive1.contentHash === archive2.contentHash;
            const similarity = isIdentical ? 100 : this.calculateSimilarity(
                archive1.structuredContent,
                archive2.structuredContent,
            );

            // 计算差异
            const differences = this.calculateDifferences(
                archive1.structuredContent,
                archive2.structuredContent,
            );

            return {
                success: true,
                message: '比较完成',
                data: {
                    differences,
                    similarity,
                    summary: `相似度: ${similarity}%，差异项: ${differences.length}个`,
                },
            };
        } catch (error) {
            this.logger.error(`比较归档失败: ${error.message}`, error.stack);
            return {
                success: false,
                message: `比较失败: ${error.message}`,
            };
        }
    }

    /**
     * 删除归档
     */
    async deleteArchive(
        archiveId: string,
        userId: number,
        force: boolean = false,
    ): Promise<{
        success: boolean;
        message: string;
    }> {
        try {
            const archive = await this.getArchiveById(archiveId);

            // 检查是否受保护
            if (archive.isProtected && !force) {
                return {
                    success: false,
                    message: '该归档受保护，无法删除',
                };
            }

            // 检查合规归档
            if (archive.isCompliance && !force) {
                return {
                    success: false,
                    message: '合规归档需要管理员权限才能删除',
                };
            }

            await this.documentArchiveModel.deleteOne({ archiveId });

            this.logger.log(`删除归档成功: ${archiveId} by user: ${userId}`);

            return {
                success: true,
                message: '删除归档成功',
            };
        } catch (error) {
            this.logger.error(`删除归档失败: ${error.message}`, error.stack);
            return {
                success: false,
                message: `删除失败: ${error.message}`,
            };
        }
    }

    /**
     * 批量归档（定时任务）
     */
    async batchArchive(
        options: {
            archiveType: 'daily' | 'milestone';
            createdBy: string;
            createdByUserId: number;
            tags?: string[];
        },
    ): Promise<{
        success: boolean;
        message: string;
        data?: {
            archivedCount: number;
            failedCount: number;
            archives: string[];
        };
    }> {
        try {
            const { archiveType, createdBy, createdByUserId, tags = [] } = options;

            // 获取需要归档的文档
            const documents = await this.documentService.findAll({
                page: 1,
                pageSize: 1000, // 获取所有文档
                userId: 0, // 系统用户ID，获取所有文档
            });

            let archivedCount = 0;
            let failedCount = 0;
            const archives: string[] = [];

            for (const document of (documents?.data?.documents || [])) {
                try {
                    // 创建归档
                    const archiveName = `${archiveType === 'daily' ? '每日' : '里程碑'}归档-${new Date().toISOString().split('T')[0]}`;
                    const archiveDescription = `自动${archiveType === 'daily' ? '每日' : '里程碑'}归档`;

                    await this.createArchive(document.documentId.toString(), {
                        archiveType,
                        archiveName,
                        archiveDescription,
                        yjsState: new Uint8Array([]), // DocumentDocument 没有 yjsState 属性
                        structuredContent: document.content,
                        createdBy,
                        createdByUserId,
                        tags: [...tags, '自动归档'],
                        metadata: {
                            userCount: 0,
                            sessionDuration: 0,
                            changeCount: 0,
                            collaborators: [],
                            systemInfo: {
                                version: '1.0.0',
                                platform: 'server',
                                userAgent: 'batch-archive',
                            },
                        },
                        auditInfo: {
                            ipAddress: '127.0.0.1',
                            userAgent: 'batch-archive',
                            sessionId: 'batch-session',
                            operationType: 'batch-archive',
                            reason: '定时归档',
                            complianceLevel: 'normal',
                        },
                    });

                    archivedCount++;
                    archives.push(document.documentId.toString());
                } catch (error) {
                    failedCount++;
                    this.logger.error(`归档文档失败: ${document.documentId}`, error);
                }
            }

            return {
                success: true,
                message: `批量归档完成，成功: ${archivedCount}，失败: ${failedCount}`,
                data: {
                    archivedCount,
                    failedCount,
                    archives,
                },
            };
        } catch (error) {
            this.logger.error(`批量归档失败: ${error.message}`, error.stack);
            return {
                success: false,
                message: `批量归档失败: ${error.message}`,
            };
        }
    }

    /**
     * 计算内容哈希
     */
    private computeContentHash(content: any): string {
        const contentStr = JSON.stringify(content);
        return crypto.createHash('sha256').update(contentStr).digest('hex');
    }

    /**
     * 计算内容相似度
     */
    private calculateSimilarity(content1: any, content2: any): number {
        // 简单的相似度计算，基于文本内容
        const text1 = JSON.stringify(content1);
        const text2 = JSON.stringify(content2);

        if (text1 === text2) return 100;

        // 使用编辑距离计算相似度
        const distance = this.levenshteinDistance(text1, text2);
        const maxLength = Math.max(text1.length, text2.length);

        return Math.max(0, 100 - (distance / maxLength) * 100);
    }

    /**
     * 计算编辑距离
     */
    private levenshteinDistance(str1: string, str2: string): number {
        const matrix: number[][] = [];
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [];
            for (let j = 0; j <= str1.length; j++) {
                matrix[i][j] = 0;
            }
        }

        for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
        for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

        for (let j = 1; j <= str2.length; j++) {
            for (let i = 1; i <= str1.length; i++) {
                const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[j][i] = Math.min(
                    matrix[j][i - 1] + 1,
                    matrix[j - 1][i] + 1,
                    matrix[j - 1][i - 1] + indicator,
                );
            }
        }

        return matrix[str2.length][str1.length];
    }

    /**
     * 计算内容差异
     */
    private calculateDifferences(content1: any, content2: any): any[] {
        const differences: any[] = [];

        // 简单的差异计算
        const keys1 = Object.keys(content1);
        const keys2 = Object.keys(content2);

        // 检查新增的键
        for (const key of keys2) {
            if (!keys1.includes(key)) {
                differences.push({
                    type: 'added',
                    key,
                    value: content2[key],
                });
            }
        }

        // 检查删除的键
        for (const key of keys1) {
            if (!keys2.includes(key)) {
                differences.push({
                    type: 'removed',
                    key,
                    value: content1[key],
                });
            }
        }

        // 检查修改的键
        for (const key of keys1) {
            if (keys2.includes(key) && JSON.stringify(content1[key]) !== JSON.stringify(content2[key])) {
                differences.push({
                    type: 'modified',
                    key,
                    oldValue: content1[key],
                    newValue: content2[key],
                });
            }
        }

        return differences;
    }
} 