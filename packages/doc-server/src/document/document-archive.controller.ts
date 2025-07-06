import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Delete,
    Query,
    Logger,
} from '@nestjs/common';
import { DocumentArchiveService } from './services/document-archive.service';
import {
    ApiOperation,
    ApiBody,
    ApiResponse,
    ApiParam,
    ApiTags,
} from '@nestjs/swagger';

@ApiTags('文档归档')
@Controller('document-archive')
export class DocumentArchiveController {
    private readonly logger = new Logger(DocumentArchiveController.name);

    constructor(
        private readonly documentArchiveService: DocumentArchiveService
    ) { }

    @Post(':documentId/create')
    @ApiOperation({ summary: '创建文档归档' })
    @ApiParam({ name: 'documentId', description: '文档ID' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                archiveType: {
                    type: 'string',
                    enum: ['daily', 'manual', 'milestone', 'compliance'],
                    description: '归档类型',
                },
                archiveName: {
                    type: 'string',
                    description: '归档名称',
                },
                archiveDescription: {
                    type: 'string',
                    description: '归档描述',
                },
                yjsState: {
                    type: 'array',
                    items: { type: 'number' },
                    description: 'Yjs状态（二进制数组）',
                },
                structuredContent: {
                    type: 'object',
                    description: '结构化内容',
                },
                createdBy: {
                    type: 'string',
                    description: '创建人',
                },
                createdByUserId: {
                    type: 'number',
                    description: '创建人ID',
                },
                tags: {
                    type: 'array',
                    items: { type: 'string' },
                    description: '标签',
                },
                metadata: {
                    type: 'object',
                    description: '元数据',
                },
                auditInfo: {
                    type: 'object',
                    description: '审计信息',
                },
                isProtected: {
                    type: 'boolean',
                    description: '是否受保护',
                },
                isCompliance: {
                    type: 'boolean',
                    description: '是否合规归档',
                },
                retentionUntil: {
                    type: 'string',
                    format: 'date-time',
                    description: '保留期限',
                },
            },
            required: [
                'archiveType',
                'archiveName',
                'archiveDescription',
                'yjsState',
                'structuredContent',
                'createdBy',
                'createdByUserId',
            ],
        },
    })
    @ApiResponse({ status: 201, description: '归档创建成功' })
    async createArchive(
        @Param('documentId') documentId: string,
        @Body() archiveData: {
            archiveType: 'daily' | 'manual' | 'milestone' | 'compliance';
            archiveName: string;
            archiveDescription: string;
            yjsState: number[]; structuredContent: any;
            createdBy: string;
            createdByUserId: number;
            tags?: string[];
            metadata?: any;
            auditInfo?: any;
            isProtected?: boolean;
            isCompliance?: boolean;
            retentionUntil?: string;
        },
    ) {
        try {
            const archive = await this.documentArchiveService.createArchive(documentId, {
                ...archiveData,
                yjsState: new Uint8Array(archiveData.yjsState),
                retentionUntil: archiveData.retentionUntil ? new Date(archiveData.retentionUntil) : undefined,
            },

            )
            return {
                success: true,
                message: '归档创建成功',
                data: archive,
            };
        } catch (error: any) {
            this.logger.error(`创建归档失败: ${error?.message}`, error?.stack);
            return {
                success: false,
                message: `创建归档失败: ${error?.message}`,
                data: null,
            };
        }
    }

    @Get(':documentId/list')
    @ApiOperation({ summary: '获取文档归档列表' })
    @ApiParam({ name: 'documentId', description: '文档ID' })
    @ApiResponse({ status: 200, description: '获取归档列表成功' })
    async getArchivesByDocumentId(
        @Param('documentId') documentId: string,
        @Query('page') page: string = '1',
        @Query('pageSize') pageSize: string = '20',
        @Query('archiveType') archiveType?: string,
        @Query('tags') tags?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        try {
            const options = {
                page: parseInt(page, 10),
                pageSize: parseInt(pageSize, 10),
                archiveType,
                tags: tags ? tags.split(',') : undefined,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
            };

            const result = await this.documentArchiveService.getArchivesByDocumentId(documentId, options);

            return {
                success: true,
                message: '获取归档列表成功',
                data: result,
            };
        } catch (error: any) {
            this.logger.error(`获取归档列表失败: ${error?.message}`, error?.stack);
            return {
                success: false,
                message: `获取归档列表失败: ${error?.message}`,
                data: null,
            };
        }
    }

    @Get(':archiveId/detail')
    @ApiOperation({ summary: '获取归档详情' })
    @ApiParam({ name: 'archiveId', description: '归档ID' })
    @ApiResponse({ status: 200, description: '获取归档详情成功' })
    async getArchiveById(@Param('archiveId') archiveId: string) {
        try {
            const archive = await this.documentArchiveService.getArchiveById(archiveId);

            return {
                success: true,
                message: '获取归档详情成功',
                data: archive,
            };
        } catch (error: any) {
            this.logger.error(`获取归档详情失败: ${error.message}`, error.stack);
            return {
                success: false,
                message: `获取归档详情失败: ${error.message}`,
                data: null,
            };
        }
    }

    @Post(':documentId/restore/:archiveId')
    @ApiOperation({ summary: '从归档恢复文档' })
    @ApiParam({ name: 'documentId', description: '文档ID' })
    @ApiParam({ name: 'archiveId', description: '归档ID' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                userId: {
                    type: 'number',
                    description: '用户ID',
                },
                username: {
                    type: 'string',
                    description: '用户名',
                },
            },
            required: ['userId', 'username'],
        },
    })
    @ApiResponse({ status: 200, description: '恢复成功' })
    async restoreFromArchive(
        @Param('documentId') documentId: string,
        @Param('archiveId') archiveId: string,
        @Body() restoreData: { userId: number; username: string },
    ) {
        try {
            const result = await this.documentArchiveService.restoreFromArchive(
                documentId,
                archiveId,
                restoreData.userId,
                restoreData.username,
            );

            return result;
        } catch (error: any) {
            this.logger.error(`从归档恢复失败: ${error.message}`, error.stack);
            return {
                success: false,
                message: `恢复失败: ${error.message}`,
                data: null,
            };
        }
    }

    @Post('compare')
    @ApiOperation({ summary: '比较两个归档的内容差异' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                archiveId1: {
                    type: 'string',
                    description: '归档ID 1',
                },
                archiveId2: {
                    type: 'string',
                    description: '归档ID 2',
                },
            },
            required: ['archiveId1', 'archiveId2'],
        },
    })
    @ApiResponse({ status: 200, description: '比较完成' })
    async compareArchives(
        @Body() compareData: { archiveId1: string; archiveId2: string },
    ) {
        try {
            const result = await this.documentArchiveService.compareArchives(
                compareData.archiveId1,
                compareData.archiveId2,
            );

            return result;
        } catch (error: any) {
            this.logger.error(`比较归档失败: ${error.message}`, error.stack);
            return {
                success: false,
                message: `比较失败: ${error.message}`,
                data: null,
            };
        }
    }

    @Delete(':archiveId')
    @ApiOperation({ summary: '删除归档' })
    @ApiParam({ name: 'archiveId', description: '归档ID' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                userId: {
                    type: 'number',
                    description: '用户ID',
                },
                force: {
                    type: 'boolean',
                    description: '是否强制删除',
                },
            },
            required: ['userId'],
        },
    })
    @ApiResponse({ status: 200, description: '删除成功' })
    async deleteArchive(
        @Param('archiveId') archiveId: string,
        @Body() deleteData: { userId: number; force?: boolean },
    ) {
        try {
            const result = await this.documentArchiveService.deleteArchive(
                archiveId,
                deleteData.userId,
                deleteData.force || false,
            );

            return result;
        } catch (error: any) {
            this.logger.error(`删除归档失败: ${error.message}`, error.stack);
            return {
                success: false,
                message: `删除失败: ${error.message}`,
            };
        }
    }

    @Post('batch-archive')
    @ApiOperation({ summary: '批量归档（定时任务）' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                archiveType: {
                    type: 'string',
                    enum: ['daily', 'milestone'],
                    description: '归档类型',
                },
                createdBy: {
                    type: 'string',
                    description: '创建人',
                },
                createdByUserId: {
                    type: 'number',
                    description: '创建人ID',
                },
                tags: {
                    type: 'array',
                    items: { type: 'string' },
                    description: '标签',
                },
            },
            required: ['archiveType', 'createdBy', 'createdByUserId'],
        },
    })
    @ApiResponse({ status: 200, description: '批量归档完成' })
    async batchArchive(
        @Body() batchData: {
            archiveType: 'daily' | 'milestone';
            createdBy: string;
            createdByUserId: number;
            tags?: string[];
        },
    ) {
        try {
            const result = await this.documentArchiveService.batchArchive(batchData);

            return result;
        } catch (error: any) {
            this.logger.error(`批量归档失败: ${error?.message}`, error.stack);
            return {
                success: false,
                message: `批量归档失败: ${error?.message}`,
                data: null,
            };
        }
    }
}