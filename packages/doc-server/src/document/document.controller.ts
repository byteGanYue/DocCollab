import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  Logger,
} from '@nestjs/common';
import { DocumentService } from './document.service';
import { DocumentHistoryService } from './services/document-history.service';
import {
  CreateDocumentDto,
  QueryDocumentDto,
  UserDocumentQueryDto,
} from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { ApiOperation, ApiBody, ApiResponse, ApiParam } from '@nestjs/swagger';
@Controller('document')
export class DocumentController {
  private readonly logger = new Logger(DocumentController.name);

  constructor(
    private readonly documentService: DocumentService,
    private readonly documentHistoryService: DocumentHistoryService,
  ) {}

  /**
   * 创建文档
   * @param createDocumentDto 创建文档数据
   * @returns 创建结果
   */
  @Post('create')
  @ApiOperation({
    summary: '创建文档',
    description: '创建一个新的文档，支持指定父文件夹',
  })
  @ApiBody({
    type: CreateDocumentDto,
    description: '创建文档的数据',
    examples: {
      example1: {
        summary: '创建基本文档',
        description: '创建一个基本的文档示例',
        value: {
          userId: 1,
          documentName: '我的新文档',
          content: '这是文档的初始内容',
          create_username: 'user123',
          parentFolderIds: [1, 2, 3],
        },
      },
      example2: {
        summary: '创建空白文档',
        description: '创建一个空白文档',
        value: {
          userId: 1,
          documentName: '空白文档',
          create_username: 'user123',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: '文档创建成功',
    schema: {
      example: {
        success: true,
        message: '文档创建成功',
        data: {
          _id: '507f1f77bcf86cd799439011',
          documentId: 1,
          documentName: '我的新文档',
          userId: 1,
          content: '这是文档的初始内容',
          create_username: 'user123',
          update_username: 'user123',
          editorId: [],
          parentFolderIds: [1, 2, 3],
          create_time: '2024-01-01T00:00:00.000Z',
          update_time: '2024-01-01T00:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误',
    schema: {
      example: {
        success: false,
        message: '文档名称不能为空',
        statusCode: 400,
        error: 'Bad Request',
      },
    },
  })
  create(@Body() createDocumentDto: CreateDocumentDto) {
    this.logger.log('接收到创建文档请求', createDocumentDto);
    return this.documentService.create(createDocumentDto);
  }

  /**
   * 获取文档列表
   * @param query 查询参数
   * @returns 文档列表
   */
  @Get('getDocumentsList')
  findAll(@Query() query: QueryDocumentDto) {
    this.logger.log('接收到查询文档列表请求', query);
    return this.documentService.findAll(query);
  }

  /**
   * 根据用户ID获取文档列表
   * @param userId 用户ID
   * @param query 其他查询参数（可选）
   * @returns 用户的文档列表
   */
  @Get('getUserDocuments/:userId')
  @ApiOperation({ summary: '根据用户userId获取文档列表' })
  findDocumentsByUserId(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() query: UserDocumentQueryDto,
  ) {
    this.logger.log('接收到根据用户ID查询文档列表请求', {
      userId,
      queryParams: query,
      pageType: typeof query.page,
      pageSizeType: typeof query.pageSize,
      pageValue: query.page,
      pageSizeValue: query.pageSize,
    });
    return this.documentService.findAllByUserId(userId, query);
  }

  /**
   * 根据文档ID获取单个文档详情，并处理最近访问记录
   * @param documentId 文档ID
   * @param userId 访问用户ID（从查询参数获取）
   * @returns 文档详情
   */
  @Get('getDocumentById/:id')
  @ApiOperation({ summary: '根据文档documentId获取单个文档详情' })
  findOne(
    @Param('id', ParseIntPipe) documentId: number,
    @Query('userId', ParseIntPipe) userId: number,
  ) {
    this.logger.log('接收到查询文档详情请求', { documentId, userId });
    return this.documentService.findOne(documentId, userId);
  }

  /**
   * 更新文档
   * @param documentId 文档ID
   * @param updateDocumentDto 更新数据
   * @returns 更新结果
   */
  @Patch('update/:documentId')
  @ApiOperation({ summary: '根据文档documentId更新文档' })
  update(
    @Param('documentId', ParseIntPipe) documentId: number,
    @Body() updateDocumentDto: UpdateDocumentDto,
  ) {
    this.logger.log('接收到更新文档请求', { documentId, ...updateDocumentDto });
    return this.documentService.update(documentId, updateDocumentDto);
  }

  /**
   * 删除文档
   * @param documentId 文档ID
   * @returns 删除结果
   */
  @Delete('deleteDocumentByDocumentId/:documentId')
  @ApiOperation({
    summary: '根据文档documentId删除文档',
    description: '根据文档ID删除指定文档，删除后文档将无法恢复',
  })
  @ApiParam({
    name: 'documentId',
    description: '要删除的文档ID',
    type: 'number',
    example: 123,
  })
  @ApiResponse({
    status: 200,
    description: '文档删除成功',
    schema: {
      example: {
        success: true,
        message: '文档删除成功',
        data: {
          deletedCount: 1,
          documentId: 123,
          documentName: '已删除的文档名称',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '文档不存在',
    schema: {
      example: {
        success: false,
        message: '文档不存在或已被删除',
        statusCode: 404,
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误',
    schema: {
      example: {
        success: false,
        message: '文档ID格式错误',
        statusCode: 400,
        error: 'Bad Request',
      },
    },
  })
  remove(@Param('documentId', ParseIntPipe) documentId: number) {
    this.logger.log('接收到删除文档请求', { documentId });
    return this.documentService.remove(documentId);
  }

  /**
   * 添加协同编辑者
   * @param documentId 文档ID
   * @param body 包含用户ID的请求体
   * @returns 操作结果
   */
  @Post(':id/editors')
  @ApiOperation({ summary: '根据文档documentId添加协同编辑者' })
  addEditor(
    @Param('id', ParseIntPipe) documentId: number,
    @Body() body: { userId: number },
  ) {
    this.logger.log('接收到添加协同编辑者请求', {
      documentId,
      userId: body.userId,
    });
    return this.documentService.addEditor(documentId, body.userId);
  }

  /**
   * 移除协同编辑者
   * @param documentId 文档ID
   * @param userId 用户ID
   * @returns 操作结果
   */
  @Delete(':id/editors/:userId')
  removeEditor(
    @Param('id', ParseIntPipe) documentId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    this.logger.log('接收到移除协同编辑者请求', { documentId, userId });
    return this.documentService.removeEditor(documentId, userId);
  }

  @Get('public-documents')
  @ApiOperation({ summary: '获取所有公开用户的文档' })
  @ApiResponse({
    status: 200,
    description: '成功获取所有公开用户的文档',
  })
  async getPublicDocuments(): Promise<
    Awaited<ReturnType<DocumentService['findAllPublicDocuments']>>
  > {
    return this.documentService.findAllPublicDocuments();
  }

  @Get('public-documents/folder/:folderIds')
  @ApiOperation({ summary: '获取指定文件夹下的公开文档' })
  @ApiParam({
    name: 'folderIds',
    description: '文件夹ID数组，用逗号分隔',
    example: '1,2,3',
  })
  @ApiResponse({
    status: 200,
    description: '成功获取指定文件夹下的公开文档',
  })
  async getPublicDocumentsByFolder(@Param('folderIds') folderIds: string) {
    const folderIdArray = folderIds
      .split(',')
      .map((id) => parseInt(id.trim(), 10));
    return this.documentService.findPublicDocumentsByFolder(folderIdArray);
  }

  /**
   * 获取文档历史版本
   * @param documentId 文档ID
   * @param page 页码
   * @param limit 每页数量
   * @returns 历史版本列表
   */
  @Get(':id/history')
  @ApiOperation({
    summary: '获取文档历史版本',
    description: '获取指定文档的所有历史版本记录',
  })
  @ApiParam({
    name: 'id',
    description: '文档ID',
    type: 'number',
    example: 123,
  })
  @ApiResponse({
    status: 200,
    description: '获取历史版本成功',
    schema: {
      example: {
        success: true,
        message: '获取历史版本成功',
        data: {
          versions: [
            {
              _id: '507f1f77bcf86cd799439011',
              userId: 1,
              documentId: 123,
              documentName: '文档标题',
              content: '文档内容',
              create_username: 'user123',
              update_username: 'user456',
              versionId: 2,
              create_time: '2024-01-01T00:00:00.000Z',
              update_time: '2024-01-01T00:00:00.000Z',
            },
          ],
          total: 10,
          page: 1,
          limit: 20,
          totalPages: 1,
        },
      },
    },
  })
  async getDocumentHistory(
    @Param('id', ParseIntPipe) documentId: number,
    @Query('page') pageParam?: string,
    @Query('limit') limitParam?: string,
  ) {
    // 解析分页参数，提供默认值
    const page = pageParam ? parseInt(pageParam, 10) : 1;
    const limit = limitParam ? parseInt(limitParam, 10) : 20;

    // 验证参数有效性
    const validPage = isNaN(page) || page < 1 ? 1 : page;
    const validLimit = isNaN(limit) || limit < 1 || limit > 100 ? 20 : limit;

    this.logger.log('接收到获取文档历史版本请求', {
      documentId,
      page: validPage,
      limit: validLimit,
    });

    const result = await this.documentHistoryService.getDocumentHistory(
      documentId,
      validPage,
      validLimit,
    );
    return {
      success: true,
      message: '获取历史版本成功',
      data: result,
    };
  }

  /**
   * 获取特定版本的文档内容
   * @param documentId 文档ID
   * @param versionId 版本号
   * @returns 特定版本的文档内容
   */
  @Get(':id/version/:versionId')
  @ApiOperation({
    summary: '获取特定版本的文档内容',
    description: '获取文档的特定版本内容',
  })
  @ApiParam({
    name: 'id',
    description: '文档ID',
    type: 'number',
    example: 123,
  })
  @ApiParam({
    name: 'versionId',
    description: '版本号',
    type: 'number',
    example: 2,
  })
  @ApiResponse({
    status: 200,
    description: '获取版本内容成功',
    schema: {
      example: {
        success: true,
        message: '获取版本内容成功',
        data: {
          _id: '507f1f77bcf86cd799439011',
          userId: 1,
          documentId: 123,
          documentName: '文档标题',
          content: '文档内容',
          create_username: 'user123',
          update_username: 'user456',
          versionId: 2,
          create_time: '2024-01-01T00:00:00.000Z',
          update_time: '2024-01-01T00:00:00.000Z',
        },
      },
    },
  })
  async getDocumentVersion(
    @Param('id', ParseIntPipe) documentId: number,
    @Param('versionId', ParseIntPipe) versionId: number,
  ) {
    this.logger.log('接收到获取特定版本文档请求', {
      documentId,
      versionId,
    });
    const version = await this.documentHistoryService.getDocumentVersion(
      documentId,
      versionId,
    );
    if (!version) {
      return {
        success: false,
        message: '指定版本不存在',
        data: null,
      };
    }
    return {
      success: true,
      message: '获取版本内容成功',
      data: version,
    };
  }

  /**
   * 恢复文档到指定版本
   * @param documentId 文档ID
   * @param body 包含版本ID的请求体
   * @returns 恢复结果
   */
  @Post(':id/restore')
  @ApiOperation({
    summary: '根据文档ID恢复到指定历史版本',
    description: '恢复文档到指定的历史版本，并删除该版本之后的所有版本记录',
  })
  @ApiParam({
    name: 'id',
    description: '文档ID',
    type: 'number',
    example: 123,
  })
  @ApiBody({
    description: '版本恢复数据',
    schema: {
      type: 'object',
      properties: {
        versionId: {
          type: 'number',
          description: '要恢复到的版本号',
          example: 2,
        },
      },
      required: ['versionId'],
    },
  })
  @ApiResponse({
    status: 200,
    description: '版本恢复成功',
    schema: {
      example: {
        success: true,
        message: '版本恢复成功，并已删除该版本后的所有历史记录',
        data: {
          documentId: 123,
          restoredToVersion: 2,
          deletedVersionsCount: 3,
        },
      },
    },
  })
  async restoreDocument(
    @Param('id', ParseIntPipe) documentId: number,
    @Body() body: { versionId: number },
  ) {
    this.logger.log('接收到恢复文档版本请求', {
      documentId,
      versionId: body.versionId,
    });

    // 获取要恢复的版本
    const targetVersion = await this.documentHistoryService.getDocumentVersion(
      documentId,
      body.versionId,
    );

    if (!targetVersion) {
      return {
        success: false,
        message: '指定版本不存在',
        data: null,
      };
    }

    // 使用目标版本的内容更新文档
    const updateResult = await this.documentService.update(documentId, {
      documentName: targetVersion.documentName,
      content: targetVersion.content,
      yjsState: targetVersion.yjsState,
      update_username: targetVersion.create_username,
      // 注意: update_time 会通过 MongoDB 的 timestamps 选项自动更新为当前时间
    });

    if (updateResult.success) {
      // 更新目标版本的时间戳为当前时间
      await this.documentHistoryService.updateVersionTimestamp(
        documentId,
        body.versionId,
      );

      // 删除该版本之后的所有版本记录
      const deleteResult =
        await this.documentHistoryService.deleteVersionsAfter(
          documentId,
          body.versionId,
        );

      return {
        success: true,
        message: '版本恢复成功，并已删除该版本后的所有历史记录',
        data: {
          documentId,
          restoredToVersion: body.versionId,
          deletedVersionsCount: deleteResult.deletedCount,
        },
      };
    }

    return {
      success: false,
      message: '版本恢复失败',
      data: null,
    };
  }

  /**
   * 搜索文档内容
   * @param searchText 搜索文本
   * @param userId 用户ID
   * @returns 搜索结果
   */
  @Get('search')
  @ApiOperation({
    summary: '搜索文档内容',
    description: '根据搜索文本在用户可访问的文档中搜索内容',
  })
  @ApiResponse({
    status: 200,
    description: '搜索成功',
    schema: {
      example: {
        success: true,
        message: '搜索成功',
        data: [
          {
            documentId: 1,
            documentName: '示例文档',
            content: '这是包含搜索关键词的文档内容...',
            matchedText: '搜索关键词',
            userId: 1,
            create_username: 'user123',
            update_time: '2024-01-01T00:00:00.000Z',
          },
        ],
      },
    },
  })
  searchDocuments(
    @Query('searchText') searchText: string,
    @Query('userId', ParseIntPipe) userId: number,
  ) {
    this.logger.log('接收到文档搜索请求', { searchText, userId });
    return this.documentService.searchDocuments(searchText, userId);
  }

  /**
   * 同步Yjs状态到MongoDB
   * @param documentId 文档ID
   * @param body 包含Yjs状态和内容的请求体
   * @returns 同步结果
   */
  @Post(':id/sync-yjs')
  @ApiOperation({
    summary: '同步Yjs状态到MongoDB',
    description: '将协同编辑器的Yjs状态同步到MongoDB数据库',
  })
  @ApiParam({
    name: 'id',
    description: '文档ID',
    type: 'number',
    example: 123,
  })
  @ApiBody({
    description: 'Yjs同步数据',
    schema: {
      type: 'object',
      properties: {
        yjsState: {
          type: 'array',
          items: { type: 'number' },
          description: 'Yjs文档状态数据',
        },
        content: {
          type: 'string',
          description: '文档内容',
        },
        username: {
          type: 'string',
          description: '更新用户名',
        },
      },
      required: ['yjsState', 'content', 'username'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Yjs状态同步成功',
    schema: {
      example: {
        success: true,
        message: 'Yjs状态同步成功',
        data: {
          documentId: 123,
          lastYjsSyncTime: '2024-01-01T00:00:00.000Z',
          contentLength: 1024,
        },
      },
    },
  })
  async syncYjsState(
    @Param('id', ParseIntPipe) documentId: number,
    @Body() body: { yjsState: number[]; content: string; username: string },
  ) {
    this.logger.log('接收到Yjs状态同步请求', {
      documentId,
      username: body.username,
      contentLength: body.content?.length || 0,
      yjsStateLength: body.yjsState?.length || 0,
    });
    return this.documentService.syncYjsState(
      documentId,
      body.yjsState,
      body.content,
      body.username,
    );
  }

  /**
   * 获取文档的Yjs状态
   * @param documentId 文档ID
   * @returns Yjs状态数据
   */
  @Get(':id/yjs-state')
  @ApiOperation({
    summary: '获取文档的Yjs状态',
    description: '获取文档的Yjs状态数据，用于协同编辑同步',
  })
  @ApiParam({
    name: 'id',
    description: '文档ID',
    type: 'number',
    example: 123,
  })
  @ApiResponse({
    status: 200,
    description: '获取Yjs状态成功',
    schema: {
      example: {
        success: true,
        message: '获取Yjs状态成功',
        data: {
          documentId: 123,
          yjsState: [1, 2, 3, 4, 5],
          lastYjsSyncTime: '2024-01-01T00:00:00.000Z',
          lastSyncSource: 'yjs',
        },
      },
    },
  })
  async getYjsState(@Param('id', ParseIntPipe) documentId: number) {
    this.logger.log('接收到获取Yjs状态请求', { documentId });
    return this.documentService.getYjsState(documentId);
  }

  /**
   * 创建文档历史版本记录并更新文档内容
   * @param documentId 文档ID
   * @returns 创建结果
   */
  @Post(':id/create-history')
  @ApiOperation({
    summary: '根据文档ID创建一条历史版本记录并更新文档内容',
    description:
      '当用户离开编辑页面时，调用此接口将当前文档内容保存为一条历史版本记录，同时更新文档表的内容为最新版本',
  })
  @ApiParam({
    name: 'id',
    description: '文档ID',
    type: 'number',
    example: 123,
  })
  @ApiBody({
    description: '历史版本创建数据',
    schema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: '文档内容（可选，如果不提供则使用当前文档内容）',
        },
        yjsState: {
          type: 'array',
          items: { type: 'number' },
          description: 'Yjs状态数据（可选，如果不提供则使用当前文档的Yjs状态）',
        },
        update_username: {
          type: 'string',
          description:
            '更新用户名（可选，如果不提供则使用当前文档的更新用户名）',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: '历史版本创建成功',
    schema: {
      example: {
        success: true,
        message: '历史版本创建成功，文档内容已更新',
        data: {
          versionId: 3,
          documentId: 123,
          updatedContent: true,
        },
      },
    },
  })
  async createHistoryVersion(
    @Param('id', ParseIntPipe) documentId: number,
    @Body()
    body: {
      content?: string;
      yjsState?: number[];
      update_username?: string;
    },
  ) {
    this.logger.log('接收到创建历史版本请求', { documentId });

    try {
      // 查找当前文档
      const document =
        await this.documentService.findOneDocumentById(documentId);

      if (!document) {
        return {
          success: false,
          message: '文档不存在',
          data: null,
        };
      }

      // 优先用前端传来的内容，如果没有则使用当前文档内容
      const content = body.content ?? document.content;
      const yjsState = body.yjsState ?? document.yjsState;
      const update_username = body.update_username ?? document.update_username;

      // 创建历史版本记录
      const historyVersion =
        await this.documentHistoryService.addDocumentHistory({
          userId: document.userId,
          documentId: document.documentId,
          documentName: document.documentName,
          content,
          create_username: document.create_username,
          update_username,
          yjsState,
        });

      // 同时更新文档表的内容为最新版本
      const updateResult = await this.documentService.update(documentId, {
        content,
        yjsState,
        update_username,
        // 注意: update_time 会通过 MongoDB 的 timestamps 选项自动更新为当前时间
      });

      if (!updateResult.success) {
        this.logger.warn('历史版本创建成功，但文档内容更新失败', {
          documentId,
          updateResult,
        });
        return {
          success: true,
          message: '历史版本创建成功，但文档内容更新失败',
          data: {
            versionId: historyVersion.versionId,
            documentId: historyVersion.documentId,
            updatedContent: false,
            updateError: updateResult.message,
          },
        };
      }

      return {
        success: true,
        message: '历史版本创建成功，文档内容已更新',
        data: {
          versionId: historyVersion.versionId,
          documentId: historyVersion.documentId,
          updatedContent: true,
        },
      };
    } catch (error) {
      this.logger.error('创建历史版本失败:', error);
      return {
        success: false,
        message: '创建历史版本失败',
        error: error instanceof Error ? error.message : '未知错误',
      };
    }
  }

  /**
   * 恢复30天前归档的历史版本到数据库
   * @param documentId 文档ID
   * @returns 恢复结果和最新历史版本列表
   */
  @Post(':id/history/restore')
  async restoreArchivedHistory(@Param('id', ParseIntPipe) documentId: number) {
    try {
      const result =
        await this.documentHistoryService.restoreArchivedHistory(documentId);
      return {
        success: true,
        message: '历史版本恢复成功',
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : '历史版本恢复失败',
        data: null,
      };
    }
  }
}
