/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import {
  CreateFolderDto,
  QueryFolderTreeDto,
  CreateFolderResponseDto,
} from './dto/create-folder.dto';
import {
  UpdateFolderDto,
  UpdateFolderResponseDto,
} from './dto/update-folder.dto';
import { Folder } from './schemas/folder.schema';

interface FolderDocument {
  _id: Types.ObjectId;
  folderName: string;
  userId: Types.ObjectId;
  create_username: string;
  update_username: string;
  parentFolderIds: string[];
  depth: number;
  all_children_documentId?: Types.ObjectId[];
  all_children_folderId?: Types.ObjectId[];
  create_time: Date;
  update_time: Date;
}

export interface FolderTreeResponse {
  success: boolean;
  message: string;
  data: FolderTreeItem[];
}

export interface FolderTreeItem {
  folderId: string;
  folderName: string;
  userId: Types.ObjectId;
  create_username: string;
  update_username: string;
  parentFolderIds: string[];
  depth: number;
  childrenCount: {
    documents: number;
    folders: number;
  };
  children: FolderTreeItem[];
  create_time: Date;
  update_time: Date;
}

@Injectable()
export class FolderService {
  private readonly logger = new Logger(FolderService.name);

  constructor(@InjectModel(Folder.name) private folderModel: Model<Folder>) {}

  /**
   * 创建文件夹
   * @param createFolderDto 创建文件夹数据
   * @returns 创建结果
   */
  async create(
    createFolderDto: CreateFolderDto,
  ): Promise<CreateFolderResponseDto> {
    try {
      this.logger.log('开始创建文件夹', createFolderDto);

      // 验证文件夹名称
      if (!createFolderDto.folderName.trim()) {
        throw new BadRequestException('文件夹名称不能为空');
      }

      // 计算父文件夹ID数组和深度
      let parentFolderIds: string[] = [];
      let depth = 0;

      if (
        createFolderDto.parentFolderIds &&
        createFolderDto.parentFolderIds.length > 0
      ) {
        // 验证父文件夹是否存在
        const parentFolderId =
          createFolderDto.parentFolderIds[
            createFolderDto.parentFolderIds.length - 1
          ];
        const parentFolder = await this.folderModel.findById(parentFolderId);

        if (!parentFolder) {
          throw new BadRequestException('指定的父文件夹不存在');
        }

        // 验证权限：只能在自己的文件夹下创建子文件夹
        if (parentFolder.userId.toString() !== createFolderDto.userId) {
          throw new BadRequestException('没有权限在此文件夹下创建子文件夹');
        }

        // 构建完整的父文件夹路径
        parentFolderIds = [...parentFolder.parentFolderIds, parentFolderId];
        depth = parentFolder.depth + 1;
      }

      // 检查同名文件夹
      const existingFolder = await this.folderModel.findOne({
        folderName: createFolderDto.folderName,
        userId: createFolderDto.userId,
        parentFolderIds: { $eq: parentFolderIds },
      });

      if (existingFolder) {
        throw new BadRequestException('同级目录下已存在同名文件夹');
      }

      // 创建新文件夹
      const newFolder = new this.folderModel({
        userId: new Types.ObjectId(createFolderDto.userId),
        folderName: createFolderDto.folderName.trim(),
        create_username: createFolderDto.create_username,
        update_username: createFolderDto.create_username,
        parentFolderIds,
        depth,
        all_children_documentId: [],
        all_children_folderId: [],
      });

      const savedFolder = await newFolder.save();
      const folderDoc = savedFolder.toObject() as FolderDocument;

      // 更新父文件夹的子文件夹列表
      if (parentFolderIds.length > 0) {
        const parentFolderId = parentFolderIds[parentFolderIds.length - 1];
        await this.folderModel.findByIdAndUpdate(parentFolderId, {
          $push: { all_children_folderId: folderDoc._id },
          update_username: createFolderDto.create_username,
        });
      }

      const result = {
        success: true,
        message: '文件夹创建成功',
        data: {
          folderId: folderDoc._id.toString(),
          folderName: folderDoc.folderName,
          userId: folderDoc.userId.toString(),
          create_username: folderDoc.create_username,
          parentFolderIds: folderDoc.parentFolderIds,
          depth: folderDoc.depth,
          create_time: folderDoc.create_time,
          update_time: folderDoc.update_time,
        },
      };

      this.logger.log('文件夹创建成功', {
        folderId: folderDoc._id.toString(),
        folderName: folderDoc.folderName,
        depth: folderDoc.depth,
      });

      return result;
    } catch (error) {
      const err = error as Error;
      this.logger.error('创建文件夹失败', err.stack);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(`创建文件夹失败: ${err.message}`);
    }
  }

  /**
   * 查询文件夹树形结构
   * @param queryDto 查询参数
   * @returns 树形结构的文件夹列表
   */
  async findAll(queryDto?: QueryFolderTreeDto): Promise<FolderTreeResponse> {
    try {
      this.logger.log('开始查询文件夹树形结构', queryDto);

      const parentFolderId = queryDto?.parentFolderId || null;
      const userId = queryDto?.userId;
      const maxDepth = queryDto?.maxDepth;

      const result = await this.buildFolderTree(
        parentFolderId,
        userId,
        0,
        maxDepth,
      );

      this.logger.log('查询文件夹树形结构成功', {
        parentFolderId,
        userId,
        maxDepth,
        resultCount: result.data.length,
      });

      return result;
    } catch (error) {
      const err = error as Error;
      this.logger.error('查询文件夹树形结构失败', err.stack);
      throw new Error(`查询文件夹树形结构失败: ${err.message}`);
    }
  }

  /**
   * 构建文件夹树形结构（递归方法）
   * @param parentFolderId 父文件夹ID
   * @param userId 用户ID
   * @param currentDepth 当前深度
   * @param maxDepth 最大深度限制
   * @returns 树形结构的文件夹列表
   */
  private async buildFolderTree(
    parentFolderId: string | null = null,
    userId?: string,
    currentDepth: number = 0,
    maxDepth?: number,
  ): Promise<FolderTreeResponse> {
    try {
      // 如果设置了最大深度限制，且当前深度已达到限制，则停止递归
      if (maxDepth !== undefined && currentDepth >= maxDepth) {
        return {
          success: true,
          message: '已达到最大查询深度',
          data: [],
        };
      }

      const filter: FilterQuery<Folder> = {};

      // 根据父文件夹ID筛选
      if (parentFolderId) {
        filter.parentFolderIds = parentFolderId;
      } else {
        filter.parentFolderIds = { $size: 0 }; // 查询根目录文件夹
      }

      // 根据用户ID筛选
      if (userId) {
        // 将字符串用户ID转换为ObjectId进行查询
        try {
          filter.userId = new Types.ObjectId(userId);
        } catch {
          // 如果userId不是有效的ObjectId格式，则直接使用字符串查询
          filter.userId = userId;
        }
      }

      this.logger.log('查询过滤条件', filter);

      // 查询当前层级的文件夹
      const folders = await this.folderModel
        .find(filter)
        .populate('userId', 'username email')
        .sort({ folderName: 1 }) // 按文件夹名称排序
        .lean()
        .exec();

      // 递归查询每个文件夹的子文件夹
      const foldersWithChildren = await Promise.all(
        (folders as unknown as FolderDocument[]).map(
          async (folder): Promise<FolderTreeItem> => {
            const children = await this.buildFolderTree(
              folder._id.toString(),
              userId,
              currentDepth + 1,
              maxDepth,
            );

            return {
              folderId: folder._id.toString(),
              folderName: folder.folderName,
              userId: folder.userId,
              create_username: folder.create_username,
              update_username: folder.update_username,
              parentFolderIds: folder.parentFolderIds,
              depth: folder.depth,
              childrenCount: {
                documents: folder.all_children_documentId?.length || 0,
                folders: folder.all_children_folderId?.length || 0,
              },
              children: children.data,
              create_time: folder.create_time,
              update_time: folder.update_time,
            };
          },
        ),
      );

      return {
        success: true,
        message: `查询文件夹树形结构成功 (深度: ${currentDepth})`,
        data: foldersWithChildren,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error('构建文件夹树形结构失败', err.stack);
      throw new Error(`构建文件夹树形结构失败: ${err.message}`);
    }
  }

  /**
   * 根据文件夹树形结构查询（保持向后兼容）
   * @param parentFolderId 父文件夹ID
   * @param userId 用户ID
   * @returns 树形结构的文件夹列表
   */
  async findFolderTree(
    parentFolderId: string = 'null',
    userId?: string,
  ): Promise<FolderTreeResponse> {
    return await this.buildFolderTree(
      parentFolderId === 'null' ? null : parentFolderId,
      userId,
    );
  }

  /**
   * 查询单个文件夹详情
   * @param id 文件夹ID
   * @returns 文件夹详情
   */
  async findOne(id: string) {
    try {
      this.logger.log('开始查询文件夹详情', { id });

      // 验证文件夹ID格式
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('无效的文件夹ID格式');
      }

      // 查询文件夹
      const folder = await this.folderModel
        .findById(id)
        .populate('userId', 'username email')
        .lean()
        .exec();

      if (!folder) {
        throw new BadRequestException('文件夹不存在');
      }

      const folderDoc = folder as unknown as FolderDocument;

      const result = {
        success: true,
        message: '查询文件夹详情成功',
        data: {
          folderId: folderDoc._id.toString(),
          folderName: folderDoc.folderName,
          userId: folderDoc.userId.toString(),
          create_username: folderDoc.create_username,
          update_username: folderDoc.update_username,
          parentFolderIds: folderDoc.parentFolderIds,
          depth: folderDoc.depth,
          childrenCount: {
            documents: folderDoc.all_children_documentId?.length || 0,
            folders: folderDoc.all_children_folderId?.length || 0,
          },
          create_time: folderDoc.create_time,
          update_time: folderDoc.update_time,
        },
      };

      this.logger.log('查询文件夹详情成功', {
        folderId: folderDoc._id.toString(),
        folderName: folderDoc.folderName,
      });

      return result;
    } catch (error) {
      const err = error as Error;
      this.logger.error('查询文件夹详情失败', err.stack);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(`查询文件夹详情失败: ${err.message}`);
    }
  }

  /**
   * 更新文件夹
   * @param id 文件夹ID
   * @param updateFolderDto 更新数据
   * @returns 更新结果
   */
  async update(
    id: string,
    updateFolderDto: UpdateFolderDto,
  ): Promise<UpdateFolderResponseDto> {
    try {
      this.logger.log('开始更新文件夹', { id, updateData: updateFolderDto });

      // 验证文件夹ID格式
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('无效的文件夹ID格式');
      }

      // 查找要更新的文件夹
      const existingFolder = await this.folderModel.findById(id);
      if (!existingFolder) {
        throw new BadRequestException('文件夹不存在');
      }

      // 准备更新数据
      const trimmedName = updateFolderDto.folderName.trim();

      // 验证文件夹名称不能为空
      if (!trimmedName) {
        throw new BadRequestException('文件夹名称不能为空');
      }

      // 检查同级目录下是否已存在同名文件夹（排除当前文件夹）
      const duplicateFolder = await this.folderModel.findOne({
        _id: { $ne: id }, // 排除当前文件夹
        folderName: trimmedName,
        userId: existingFolder.userId,
        parentFolderIds: { $eq: existingFolder.parentFolderIds },
      });

      if (duplicateFolder) {
        throw new BadRequestException('同级目录下已存在同名文件夹');
      }

      // 执行更新操作
      const updatedFolder = await this.folderModel.findByIdAndUpdate(
        id,
        { folderName: trimmedName },
        {
          new: true, // 返回更新后的文档
          runValidators: true, // 运行模式验证器
        },
      );

      if (!updatedFolder) {
        throw new BadRequestException('文件夹更新失败');
      }

      const folderDoc = updatedFolder.toObject() as FolderDocument;

      const result: UpdateFolderResponseDto = {
        success: true,
        message: '文件夹更新成功',
        data: {
          folderId: folderDoc._id.toString(),
          folderName: folderDoc.folderName,
          userId: folderDoc.userId.toString(),
          create_username: folderDoc.create_username,
          parentFolderIds: folderDoc.parentFolderIds,
          depth: folderDoc.depth,
          create_time: folderDoc.create_time,
          update_time: folderDoc.update_time,
        },
      };

      this.logger.log('文件夹更新成功', {
        folderId: folderDoc._id.toString(),
        folderName: folderDoc.folderName,
      });

      return result;
    } catch (error) {
      const err = error as Error;
      this.logger.error('更新文件夹失败', err.stack);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(`更新文件夹失败: ${err.message}`);
    }
  }

  /**
   * 删除文件夹
   * @param id 文件夹ID
   * @returns 删除结果
   */
  async remove(id: string) {
    try {
      this.logger.log('开始删除文件夹', { id });

      // 验证文件夹ID格式
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('无效的文件夹ID格式');
      }

      // 查找要删除的文件夹
      const existingFolder = await this.folderModel.findById(id);
      if (!existingFolder) {
        throw new BadRequestException('文件夹不存在');
      }

      // 检查文件夹是否有子文件夹或文档
      if (
        (existingFolder.all_children_folderId &&
          existingFolder.all_children_folderId.length > 0) ||
        (existingFolder.all_children_documentId &&
          existingFolder.all_children_documentId.length > 0)
      ) {
        throw new BadRequestException('文件夹不为空，请先删除子文件夹和文档');
      }

      // 删除文件夹
      const deletedFolder = await this.folderModel.findByIdAndDelete(id);

      if (!deletedFolder) {
        throw new BadRequestException('文件夹删除失败');
      }

      const folderDoc = deletedFolder.toObject() as FolderDocument;

      const result = {
        success: true,
        message: '文件夹删除成功',
        data: {
          folderId: folderDoc._id.toString(),
          folderName: folderDoc.folderName,
        },
      };

      this.logger.log('文件夹删除成功', {
        folderId: folderDoc._id.toString(),
        folderName: folderDoc.folderName,
      });

      return result;
    } catch (error) {
      const err = error as Error;
      this.logger.error('删除文件夹失败', err.stack);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(`删除文件夹失败: ${err.message}`);
    }
  }
}
