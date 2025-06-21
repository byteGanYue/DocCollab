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
import { UpdateFolderDto } from './dto/update-folder.dto';

@Controller('v1/folder')
export class FolderController {
  constructor(private readonly folderService: FolderService) {}

  /**
   * 创建文件夹
   * @param createFolderDto 创建文件夹数据
   * @returns 创建结果
   */
  @Post()
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
  @Get()
  findAll(@Query() queryDto: QueryFolderTreeDto) {
    return this.folderService.findAll(queryDto);
  }

  /**
   * 查询文件夹树形结构
   * @param parentFolderId 父文件夹ID
   * @param userId 用户ID
   * @returns 树形结构的文件夹列表
   */
  @Get('tree')
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
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.folderService.findOne(+id);
  }

  /**
   * 更新文件夹
   * @param id 文件夹ID
   * @param updateFolderDto 更新数据
   * @returns 更新结果
   */
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFolderDto: UpdateFolderDto) {
    return this.folderService.update(+id, updateFolderDto);
  }

  /**
   * 删除文件夹
   * @param id 文件夹ID
   * @returns 删除结果
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.folderService.remove(+id);
  }

  /**
   * 创建测试数据（仅用于开发测试）
   * @returns 创建结果
   */
  @Post('test/create-sample-data')
  async createSampleData() {
    // 创建测试用户的文件夹数据
    const testFolders = [
      {
        folderName: '我的文档',
        userId: '685660003a7988baf7809f44',
        create_username: '测试用户',
        parentFolderIds: [],
      },
      {
        folderName: '工作项目',
        userId: '685660003a7988baf7809f44',
        create_username: '测试用户',
        parentFolderIds: [],
      },
    ];

    const results: CreateFolderResponseDto[] = [];
    for (const folder of testFolders) {
      try {
        const result = await this.folderService.create(folder);
        results.push(result);
      } catch (error) {
        console.error('创建测试文件夹失败:', error);
      }
    }

    return {
      success: true,
      message: '测试数据创建完成',
      data: results,
    };
  }
}
