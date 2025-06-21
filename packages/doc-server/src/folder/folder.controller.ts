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
} from './dto/create-folder.dto';
import {
  UpdateFolderDto,
  UpdateFolderResponseDto,
} from './dto/update-folder.dto';
import { ApiOperation, ApiParam } from '@nestjs/swagger';
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
  @ApiOperation({ summary: '获取文件夹列表' })
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
  findFolderTree(
    @Query('parentFolderId') parentFolderId?: string,
    @Query('userId') userId?: string,
  ) {
    return this.folderService.findFolderTree(parentFolderId, userId);
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
  findOne(@Param('id') id: string) {
    return this.folderService.findOne(id);
  }

  /**
   * 更新文件夹
   * @param id 文件夹ID
   * @param updateFolderDto 更新数据
   * @returns 更新结果
   */
  @Patch('update/:id')
  @ApiOperation({ summary: '修改文件夹名称' })
  @ApiParam({
    name: 'id',
    description: '文件夹ID',
    example: '6856aacc90ea7201152ec98f',
  })
  async update(
    @Param('id') id: string,
    @Body() updateFolderDto: UpdateFolderDto,
  ): Promise<UpdateFolderResponseDto> {
    return this.folderService.update(id, updateFolderDto);
  }

  /**
   * 删除文件夹
   * @param id 文件夹ID
   * @returns 删除结果
   */
  @Delete('deleteFolderById/:id')
  @ApiOperation({ summary: '删除文件夹' })
  @ApiParam({
    name: 'id',
    description: '文件夹ID',
    example: '685660003a7988baf7809f44',
  })
  remove(@Param('id') id: string) {
    return this.folderService.remove(id);
  }
}
