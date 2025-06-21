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
import { CreateDocumentDto, QueryDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

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
   * 根据文档ID获取单个文档详情，并处理最近访问记录
   * @param documentId 文档ID
   * @param userId 访问用户ID（从查询参数获取）
   * @returns 文档详情
   */
  @Get('getDocumentById/:id')
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
