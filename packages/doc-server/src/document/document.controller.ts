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
import {
  CreateDocumentDto,
  QueryDocumentDto,
  UserDocumentQueryDto,
} from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
@Controller('document')
export class DocumentController {
  private readonly logger = new Logger(DocumentController.name);

  constructor(private readonly documentService: DocumentService) {}

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
  @Patch('update/:id')
  @ApiOperation({ summary: '根据文档documentId更新文档' })
  update(
    @Param('id', ParseIntPipe) documentId: number,
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
  @Delete('deleteDocumentById/:id')
  @ApiOperation({ summary: '根据文档documentId删除文档' })
  remove(@Param('id', ParseIntPipe) documentId: number) {
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
}
