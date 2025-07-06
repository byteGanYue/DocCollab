import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DocumentArchiveService } from '../document/services/document-archive.service';
import { DocumentService } from '../document/document.service';

@Injectable()
export class ArchiveSchedulerService {
    private readonly logger = new Logger(ArchiveSchedulerService.name);

    constructor(
        private readonly documentArchiveService: DocumentArchiveService,
        private readonly documentService: DocumentService,
    ) { }

    /**
     * 每日归档任务 - 每天凌晨2点执行
     */
    @Cron(CronExpression.EVERY_DAY_AT_2AM)
    async handleDailyArchive() {
        this.logger.log('开始执行每日归档任务');

        try {
            const result = await this.documentArchiveService.batchArchive({
                archiveType: 'daily',
                createdBy: '系统自动归档',
                createdByUserId: 0,
                tags: ['自动归档', '每日归档'],
            });

            if (result.success && result.data) {
                this.logger.log(`每日归档完成: 成功 ${result.data.archivedCount} 个，失败 ${result.data.failedCount} 个`);
            } else {
                this.logger.error(`每日归档失败: ${result.message}`);
            }
        } catch (error) {
            this.logger.error(`每日归档任务异常: ${error.message}`, error.stack);
        }
    }

    /**
     * 里程碑归档任务 - 每周日凌晨3点执行
     */
    @Cron('0 3 * * 0')
    async handleMilestoneArchive() {
        this.logger.log('开始执行里程碑归档任务');

        try {
            const result = await this.documentArchiveService.batchArchive({
                archiveType: 'milestone',
                createdBy: '系统自动归档',
                createdByUserId: 0,
                tags: ['自动归档', '里程碑归档'],
            });

            if (result.success && result.data) {
                this.logger.log(`里程碑归档完成: 成功 ${result.data.archivedCount} 个，失败 ${result.data.failedCount} 个`);
            } else {
                this.logger.error(`里程碑归档失败: ${result.message}`);
            }
        } catch (error) {
            this.logger.error(`里程碑归档任务异常: ${error.message}`, error.stack);
        }
    }

    /**
     * 清理过期归档任务 - 每天凌晨4点执行
     */
    @Cron(CronExpression.EVERY_DAY_AT_4AM)
    async handleExpiredArchiveCleanup() {
        this.logger.log('开始执行过期归档清理任务');

        try {
            // 获取所有文档的归档
            const documents = await this.documentService.findAll({
                page: 1,
                pageSize: 1000,
                userId: 0, // 系统用户ID，获取所有文档
            });

            let cleanedCount = 0;
            let failedCount = 0;

            for (const document of documents.data.documents) {
                try {
                    // 获取该文档的所有归档
                    const archives = await this.documentArchiveService.getArchivesByDocumentId(
                        document.documentId.toString(),
                        { page: 1, pageSize: 1000 }
                    );

                    // 检查过期归档
                    const now = new Date();
                    for (const archive of archives.archives) {
                        if (archive.retentionUntil && new Date(archive.retentionUntil) < now) {
                            // 删除过期归档
                            const deleteResult = await this.documentArchiveService.deleteArchive(
                                archive.archiveId,
                                0, // 系统用户ID
                                true // 强制删除
                            );

                            if (deleteResult.success) {
                                cleanedCount++;
                                this.logger.log(`删除过期归档: ${archive.archiveId}`);
                            } else {
                                failedCount++;
                                this.logger.error(`删除过期归档失败: ${archive.archiveId} - ${deleteResult.message}`);
                            }
                        }
                    }
                } catch (error) {
                    failedCount++;
                    this.logger.error(`处理文档归档清理失败: ${document.documentId}`, error);
                }
            }

            this.logger.log(`过期归档清理完成: 成功 ${cleanedCount} 个，失败 ${failedCount} 个`);
        } catch (error) {
            this.logger.error(`过期归档清理任务异常: ${error.message}`, error.stack);
        }
    }

    /**
     * 归档健康检查任务 - 每小时执行一次
     */
    @Cron(CronExpression.EVERY_HOUR)
    async handleArchiveHealthCheck() {
        this.logger.log('开始执行归档健康检查任务');

        try {
            // 获取所有文档的归档统计
            const documents = await this.documentService.findAll({
                page: 1,
                pageSize: 1000,
                userId: 0, // 系统用户ID，获取所有文档
            });

            let totalArchives = 0;
            let totalSize = 0;
            let protectedArchives = 0;
            let complianceArchives = 0;

            for (const document of documents.data.documents) {
                try {
                    const archives = await this.documentArchiveService.getArchivesByDocumentId(
                        document.documentId.toString(),
                        { page: 1, pageSize: 1000 }
                    );

                    totalArchives += archives.total;
                    totalSize += archives.archives.reduce((sum, archive) => sum + archive.contentSize, 0);
                    protectedArchives += archives.archives.filter(a => a.isProtected).length;
                    complianceArchives += archives.archives.filter(a => a.isCompliance).length;
                } catch (error) {
                    this.logger.error(`检查文档归档健康状态失败: ${document.documentId}`, error);
                }
            }

            // 记录健康状态
            this.logger.log(`归档健康状态: 总归档数 ${totalArchives}, 总大小 ${(totalSize / 1024 / 1024).toFixed(2)} MB, 受保护 ${protectedArchives}, 合规 ${complianceArchives}`);

            // 检查存储空间使用情况
            const totalSizeMB = totalSize / 1024 / 1024;
            if (totalSizeMB > 1024) { // 超过1GB
                this.logger.warn(`归档存储空间使用过多: ${totalSizeMB.toFixed(2)} MB`);
            }

            // 检查归档数量
            if (totalArchives > 10000) { // 超过1万个归档
                this.logger.warn(`归档数量过多: ${totalArchives} 个`);
            }
        } catch (error) {
            this.logger.error(`归档健康检查任务异常: ${error.message}`, error.stack);
        }
    }

    /**
     * 手动触发归档任务
     */
    async triggerManualArchive(documentId: string, archiveType: 'daily' | 'milestone' | 'manual' | 'compliance') {
        this.logger.log(`手动触发归档任务: ${documentId}, 类型: ${archiveType}`);

        try {
            // 获取文档内容
            const document = await this.documentService.findOne(parseInt(documentId), 0);
            if (!document || !document.success) {
                throw new Error('文档不存在');
            }

            // 创建归档
            const archiveName = `手动归档-${new Date().toISOString().split('T')[0]}`;
            const archiveDescription = `手动触发的${archiveType}归档`;

            const archive = await this.documentArchiveService.createArchive(documentId, {
                archiveType,
                archiveName,
                archiveDescription,
                yjsState: new Uint8Array(document.data.yjsState || []),
                structuredContent: document.data.content,
                createdBy: '手动触发',
                createdByUserId: 0,
                tags: ['手动归档'],
                metadata: {
                    userCount: 0,
                    sessionDuration: 0,
                    changeCount: 0,
                    collaborators: [],
                    systemInfo: {
                        version: '1.0.0',
                        platform: 'server',
                        userAgent: 'manual-trigger',
                    },
                },
                auditInfo: {
                    ipAddress: '127.0.0.1',
                    userAgent: 'manual-trigger',
                    sessionId: 'manual-session',
                    operationType: 'manual-archive',
                    reason: '手动触发归档',
                    complianceLevel: 'normal',
                },
            });

            this.logger.log(`手动归档创建成功: ${archive.archiveId}`);
            return {
                success: true,
                message: '手动归档创建成功',
                data: archive,
            };
        } catch (error) {
            this.logger.error(`手动归档失败: ${error.message}`, error.stack);
            return {
                success: false,
                message: `手动归档失败: ${error.message}`,
                data: null,
            };
        }
    }

    /**
     * 获取归档统计信息
     */
    async getArchiveStatistics() {
        try {
            const documents = await this.documentService.findAll({
                page: 1,
                pageSize: 1000,
                userId: 0, // 系统用户ID，获取所有文档
            });

            let totalArchives = 0;
            let totalSize = 0;
            let typeStats = {
                daily: 0,
                manual: 0,
                milestone: 0,
                compliance: 0,
            };
            let protectedCount = 0;
            let complianceCount = 0;

            for (const document of documents.data.documents) {
                try {
                    const archives = await this.documentArchiveService.getArchivesByDocumentId(
                        document.documentId.toString(),
                        { page: 1, pageSize: 1000 }
                    );

                    totalArchives += archives.total;
                    totalSize += archives.archives.reduce((sum, archive) => sum + archive.contentSize, 0);

                    // 统计各类型归档数量
                    archives.archives.forEach(archive => {
                        typeStats[archive.archiveType]++;
                        if (archive.isProtected) protectedCount++;
                        if (archive.isCompliance) complianceCount++;
                    });
                } catch (error) {
                    this.logger.error(`获取文档归档统计失败: ${document.documentId}`, error);
                }
            }

            return {
                success: true,
                data: {
                    totalArchives,
                    totalSize: totalSize / 1024 / 1024, // MB
                    typeStats,
                    protectedCount,
                    complianceCount,
                    averageSize: totalArchives > 0 ? (totalSize / totalArchives / 1024).toFixed(2) : 0, // KB
                },
            };
        } catch (error) {
            this.logger.error(`获取归档统计信息失败: ${error.message}`, error.stack);
            return {
                success: false,
                message: `获取统计信息失败: ${error.message}`,
                data: null,
            };
        }
    }
} 