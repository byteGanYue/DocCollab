import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { FolderService } from './folder.service';
import {
  CreateFolderDto,
  QueryFolderTreeDto,
  CreateFolderResponseDto,
  FindFolderDetailResponseDto,
} from './dto/create-folder.dto';
import {
  UpdateFolderDto,
  UpdateFolderResponseDto,
} from './dto/update-folder.dto';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
@Controller('/folder')
export class FolderController {
  constructor(private readonly folderService: FolderService) {}

  /**
   * 创建文件夹
   * @param createFolderDto 创建文件夹数据
   * @returns 创建结果
   */
  @Post('create')
  @ApiOperation({ summary: '创建文件夹' })
  async create(
    @Body() createFolderDto: CreateFolderDto,
  ): Promise<CreateFolderResponseDto> {
    return this.folderService.create(createFolderDto);
  }

  /**
   * 查询文件夹列表（支持分页和条件筛选）
   * @param queryDto 查询参数
   * @returns 文件夹列表
   */
  @Get('getFoldersList')
  @ApiOperation({ summary: '根据用户userId获取文件夹列表' })
  findAll(@Query() queryDto: QueryFolderTreeDto) {
    return this.folderService.findAll(queryDto);
  }

  /**
   * 查询文件夹树形结构
   * @param parentFolderId 父文件夹ID
   * @param userId 用户ID
   * @returns 树形结构的文件夹列表
   */
  @Get('getFoldersTree')
  @ApiOperation({ summary: '获取文件夹树形结构' })
  @ApiQuery({
    name: 'parentFolderId',
    required: false,
    description: '父文件夹ID',
    type: String,
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    description: '用户ID',
    type: Number,
  })
  findFolderTree(
    @Query('parentFolderId') parentFolderId?: string,
    @Query('userId') userId?: number,
  ) {
    return this.folderService.findFolderTree(parentFolderId, userId);
  }

  /**
   * 根据自增folderId查询文件夹详情
   * @param folderId 自增的文件夹ID
   * @returns 文件夹详情
   */
  @Get('getFolderDetailByFolderId/:folderId')
  @ApiOperation({ summary: '根据自增folderId获取文件夹详情' })
  @ApiParam({
    name: 'folderId',
    description: '自增的文件夹ID',
    example: '1',
  })
  findByFolderId(
    @Param('folderId') folderId: number,
  ): Promise<FindFolderDetailResponseDto> {
    return this.folderService.findByFolderId(Number(folderId));
  }

  /**
   * 查询单个文件夹详情
   * @param id 文件夹ID
   * @returns 文件夹详情
   */
  @Get('getFolderDetailById/:id')
  @ApiOperation({ summary: '获取文件夹详情' })
  @ApiParam({
    name: 'id',
    description: '文件夹ID',
    example: '685660003a7988baf7809f44',
  })
  findOne(@Param('id') id: string): Promise<FindFolderDetailResponseDto> {
    return this.folderService.findOne(id);
  }

  /**
   * 更新文件夹（使用自增folderId）
   * @param folderId 自增的文件夹ID
   * @param updateFolderDto 更新数据
   * @returns 更新结果
   */
  @Patch('update/:folderId')
  @ApiOperation({ summary: '根据自增folderId修改文件夹名称' })
  @ApiParam({
    name: 'folderId',
    description: '自增的文件夹ID',
    example: '1',
  })
  async update(
    @Param('folderId') folderId: number,
    @Body() updateFolderDto: UpdateFolderDto,
  ): Promise<UpdateFolderResponseDto> {
    return await this.folderService.updateByFolderId(
      Number(folderId),
      updateFolderDto,
    );
  }

  /**
   * 更新文件夹（使用MongoDB ObjectId）
   * @param id 文件夹MongoDB ID
   * @param updateFolderDto 更新数据
   * @returns 更新结果
   */
  @Patch('updateById/:id')
  @ApiOperation({ summary: '根据MongoDB ID修改文件夹名称' })
  @ApiParam({
    name: 'id',
    description: '文件夹MongoDB ID',
    example: '6856aacc90ea7201152ec98f',
  })
  async updateById(
    @Param('id') id: string,
    @Body() updateFolderDto: UpdateFolderDto,
  ): Promise<UpdateFolderResponseDto> {
    return this.folderService.update(id, updateFolderDto);
  }

  /**
   * 删除文件夹（递归删除所有子文件夹和子文档）
   * @param id 文件夹ID
   * @returns 删除结果
   */
  @Delete('deleteFolderById/:id')
  @ApiOperation({
    summary: '递归删除文件夹',
    description: '删除指定文件夹及其所有子文件夹和子文档',
  })
  @ApiParam({
    name: 'id',
    description: '文件夹ID',
    example: '6856aacc90ea7201152ec98f',
  })
  remove(@Param('id') id: string) {
    return this.folderService.remove(id);
  }

  /**
   * 根据自增folderId删除文件夹（递归删除所有子文件夹和子文档）
   * @param folderId 自增的文件夹ID
   * @returns 删除结果
   */
  @Delete('deleteFolderByFolderId/:folderId')
  @ApiOperation({
    summary: '根据自增folderId递归删除文件夹',
    description: '删除指定文件夹及其所有子文件夹和子文档（使用自增ID）',
  })
  @ApiParam({
    name: 'folderId',
    description: '自增的文件夹ID',
    example: '1',
  })
  removeByFolderId(@Param('folderId') folderId: number) {
    return this.folderService.removeByFolderId(Number(folderId));
  }

  @Get('/public-folders')
  @ApiOperation({ summary: '获取所有公开用户的文件夹结构' })
  @ApiResponse({ status: 200, description: '成功获取所有公开用户的文件夹结构' })
  async getPublicFolders() {
    return this.folderService.findAllPublicFolders();
  }
}
