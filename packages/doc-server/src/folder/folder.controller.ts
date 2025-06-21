import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  Request,
  UseGuards,
} from '@nestjs/common';
import { FoldersService } from './folder.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { Types } from 'mongoose';
import { AuthGuard } from '../auth/auth.guard';

interface AuthenticatedRequest {
  user: {
    userId: string;
    username: string;
  };
}

@Controller('folders')
@UseGuards(AuthGuard)
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  @Post()
  async create(
    @Body() createFolderDto: CreateFolderDto,
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      const folder = await this.foldersService.create(
        createFolderDto,
        req.user.userId,
        req.user.username,
      );
      return {
        success: true,
        message: '文件夹创建成功',
        data: folder,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : '文件夹创建失败',
        data: null,
      };
    }
  }

  @Get()
  async findAll(@Request() req: AuthenticatedRequest) {
    try {
      const folders = await this.foldersService.findAllByUser(req.user.userId);
      return {
        success: true,
        message: '获取文件夹列表成功',
        data: folders,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : '获取文件夹列表失败',
        data: [],
      };
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.foldersService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateFolderDto: UpdateFolderDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.foldersService.update(id, updateFolderDto, req.user.username);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.foldersService.remove(id);
  }

  @Post(':folderId/documents/:documentId')
  addDocument(
    @Param('folderId') folderId: string,
    @Param('documentId') documentId: string,
  ) {
    return this.foldersService.addDocumentToFolder(
      folderId,
      new Types.ObjectId(documentId),
    );
  }

  @Delete(':folderId/documents/:documentId')
  removeDocument(
    @Param('folderId') folderId: string,
    @Param('documentId') documentId: string,
  ) {
    return this.foldersService.removeDocumentFromFolder(
      folderId,
      new Types.ObjectId(documentId),
    );
  }
}
