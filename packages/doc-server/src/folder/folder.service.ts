/* eslint-disable @typescript-eslint/no-base-to-string */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import {
  CreateFolderDto,
  QueryFolderTreeDto,
  CreateFolderResponseDto,
  FindFolderDetailResponseDto,
  SearchFolderDto,
  SearchFolderResponseDto,
} from './dto/create-folder.dto';
import {
  UpdateFolderDto,
  UpdateFolderResponseDto,
} from './dto/update-folder.dto';
import { Folder } from './schemas/folder.schema';
import { CounterService } from './services/counter.service';

interface FolderDocument {
  _id: Types.ObjectId;
  folderId: number;
  folderName: string;
  userId: number;
  create_username: string;
  update_username: string;
  parentFolderIds: string[];
  depth: number;
  isPublic: boolean;
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
  autoFolderId: number;
  folderName: string;
  userId: number;
  create_username: string;
  update_username: string;
  parentFolderIds: string[];
  depth: number;
  isPublic: boolean;
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

  constructor(
    @InjectModel(Folder.name) private folderModel: Model<Folder>,
    private readonly counterService: CounterService,
  ) {}

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

      // 获取父文件夹路径并验证
      const parentFolderIds = createFolderDto.parentFolderIds || [];
      let depth = 0;
      // eslint-disable-next-line prefer-const
      let convertedParentFolderIds: string[] = [];

      if (parentFolderIds.length > 0) {
        // 验证父文件夹是否存在且属于同一用户
        const parentFolderId = parentFolderIds[parentFolderIds.length - 1];
        let parentFolder: FolderDocument | null = null;

        // 由于前端现在发送的是数字ID，直接作为自增ID查找
        if (typeof parentFolderId === 'number' && parentFolderId > 0) {
          parentFolder = (await this.folderModel
            .findOne({ folderId: parentFolderId })
            .lean()
            .exec()) as FolderDocument | null;
        } else {
          throw new BadRequestException(
            `无效的父文件夹ID格式: ${parentFolderId}`,
          );
        }

        if (!parentFolder) {
          throw new BadRequestException('父文件夹不存在');
        }

        // 验证父文件夹所有者与当前操作用户一致
        if (parentFolder.userId !== createFolderDto.userId) {
          throw new BadRequestException('无权限在此文件夹中创建子文件夹');
        }

        // 设置文件夹层级
        depth = parentFolder.depth + 1;

        // 层级限制检查（最多10级）
        if (depth > 10) {
          throw new BadRequestException('文件夹层级不能超过10级');
        }

        // 将所有数字ID转换为对应的MongoDB ObjectId字符串
        for (const numericId of parentFolderIds) {
          if (typeof numericId === 'number' && numericId > 0) {
            const folder = await this.folderModel
              .findOne({ folderId: numericId })
              .select('_id')
              .lean()
              .exec();
            if (folder) {
              convertedParentFolderIds.push(
                (folder._id as Types.ObjectId).toString(),
              );
            } else {
              throw new BadRequestException(`父文件夹ID ${numericId} 不存在`);
            }
          } else {
            throw new BadRequestException(`无效的父文件夹ID格式: ${numericId}`);
          }
        }
      }

      // 获取下一个自增的文件夹ID
      const folderId = await this.counterService.getNextSequence('folderId');

      // 获取用户的isPublic状态
      const userModel = this.folderModel.db.model('User');
      const userResult = await userModel
        .findOne({ userId: createFolderDto.userId })
        .lean()
        .exec();

      // 将查询结果转换为具有isPublic属性的对象
      const user = userResult as unknown as {
        userId: number;
        isPublic?: boolean;
      };
      const isPublic = user?.isPublic || false;

      // 创建新文件夹
      const newFolder = new this.folderModel({
        folderId, // 设置自增的文件夹ID
        userId: createFolderDto.userId, // 直接使用number类型的userId
        folderName: createFolderDto.folderName.trim(),
        create_username: createFolderDto.create_username,
        update_username: createFolderDto.create_username,
        parentFolderIds: convertedParentFolderIds, // 使用转换后的ObjectId字符串数组
        depth,
        isPublic:
          createFolderDto.isPublic !== undefined
            ? createFolderDto.isPublic
            : isPublic, // 使用DTO中的值或者用户的公开状态
        all_children_documentId: [],
        all_children_folderId: [],
      });

      const savedFolder = await newFolder.save();
      const folderDoc = savedFolder.toObject() as unknown as FolderDocument;

      // 更新父文件夹的子文件夹列表
      if (convertedParentFolderIds.length > 0) {
        const parentFolderId =
          convertedParentFolderIds[convertedParentFolderIds.length - 1];
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
          autoFolderId: folderDoc.folderId, // 返回自增的文件夹ID
          folderName: folderDoc.folderName,
          userId: createFolderDto.userId, // 直接使用原始的number类型userId
          create_username: folderDoc.create_username,
          parentFolderIds: folderDoc.parentFolderIds,
          depth: folderDoc.depth,
          isPublic: folderDoc.isPublic,
          create_time: folderDoc.create_time,
          update_time: folderDoc.update_time,
        },
      };

      this.logger.log('文件夹创建成功', {
        folderId: folderDoc._id.toString(),
        autoFolderId: folderDoc.folderId, // 记录自增的文件夹ID
        folderName: folderDoc.folderName,
        depth: folderDoc.depth,
        isPublic: folderDoc.isPublic,
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
   * 查询文件夹列表（支持分页和条件筛选）
   * @param queryDto 查询参数
   * @returns 文件夹列表
   */
  async findAll(queryDto?: QueryFolderTreeDto): Promise<FolderTreeResponse> {
    try {
      this.logger.log('开始查询文件夹列表', queryDto);

      return await this.buildFolderTree(
        queryDto?.parentFolderId || null,
        queryDto?.userId?.toString(), // 将number转换为string
        0,
        queryDto?.maxDepth,
      );
    } catch (error) {
      const err = error as Error;
      this.logger.error('查询文件夹列表失败', err.stack);
      throw new BadRequestException(`查询文件夹列表失败: ${err.message}`);
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
        // 直接使用number类型的userId进行查询
        filter.userId = parseInt(userId);
      }

      this.logger.log('查询过滤条件', filter);

      // 查询当前层级的文件夹
      const folders = await this.folderModel
        .find(filter)
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
              autoFolderId: folder.folderId,
              folderName: folder.folderName,
              userId: folder.userId,
              create_username: folder.create_username,
              update_username: folder.update_username,
              parentFolderIds: folder.parentFolderIds,
              depth: folder.depth,
              isPublic: folder.isPublic || false,
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
    userId?: number,
  ): Promise<FolderTreeResponse> {
    return await this.buildFolderTree(
      parentFolderId === 'null' ? null : parentFolderId,
      userId?.toString(), // 将number转换为string传递给buildFolderTree
    );
  }

  /**
   * 根据自增folderId查询文件夹详情
   * @param folderId 自增的文件夹ID
   * @returns 文件夹详情
   */
  async findByFolderId(folderId: number): Promise<FindFolderDetailResponseDto> {
    try {
      this.logger.log('根据folderId查询文件夹详情', { folderId });

      // 查询文件夹
      const folder = await this.folderModel.findOne({ folderId }).lean().exec();

      if (!folder) {
        throw new BadRequestException('文件夹不存在');
      }

      const folderDoc = folder as unknown as FolderDocument;

      const result = {
        success: true,
        message: '查询文件夹详情成功',
        data: {
          folderId: folderDoc._id.toString(),
          autoFolderId: folderDoc.folderId, // 返回自增的文件夹ID
          folderName: folderDoc.folderName,
          userId: folderDoc.userId, // 直接使用number类型的userId
          create_username: folderDoc.create_username,
          update_username: folderDoc.update_username,
          parentFolderIds: folderDoc.parentFolderIds,
          depth: folderDoc.depth,
          isPublic: folderDoc.isPublic || false, // 添加isPublic字段
          childrenCount: {
            documents: folderDoc.all_children_documentId?.length || 0,
            folders: folderDoc.all_children_folderId?.length || 0,
          },
          create_time: folderDoc.create_time,
          update_time: folderDoc.update_time,
        },
      };

      this.logger.log('根据folderId查询文件夹详情成功', {
        folderId: folderDoc.folderId,
        folderName: folderDoc.folderName,
      });

      return result;
    } catch (error) {
      const err = error as Error;
      this.logger.error('根据folderId查询文件夹详情失败', err.stack);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(`查询文件夹详情失败: ${err.message}`);
    }
  }

  /**
   * 查询单个文件夹详情
   * @param id 文件夹ID
   * @returns 文件夹详情
   */
  async findOne(id: string): Promise<FindFolderDetailResponseDto> {
    try {
      this.logger.log('开始查询文件夹详情', { id });

      // 验证文件夹ID格式
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('无效的文件夹ID格式');
      }

      // 查询文件夹
      const folder = await this.folderModel.findById(id).lean().exec();

      if (!folder) {
        throw new BadRequestException('文件夹不存在');
      }

      const folderDoc = folder as unknown as FolderDocument;

      const result = {
        success: true,
        message: '查询文件夹详情成功',
        data: {
          folderId: folderDoc._id.toString(),
          autoFolderId: folderDoc.folderId, // 返回自增的文件夹ID
          folderName: folderDoc.folderName,
          userId: folderDoc.userId, // 直接使用number类型的userId
          create_username: folderDoc.create_username,
          update_username: folderDoc.update_username,
          parentFolderIds: folderDoc.parentFolderIds,
          depth: folderDoc.depth,
          isPublic: folderDoc.isPublic || false, // 添加isPublic字段
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

      const folderDoc = updatedFolder.toObject() as unknown as FolderDocument;

      const result: UpdateFolderResponseDto = {
        success: true,
        message: '文件夹更新成功',
        data: {
          folderId: folderDoc._id.toString(),
          autoFolderId: folderDoc.folderId, // 返回自增的文件夹ID
          folderName: folderDoc.folderName,
          userId: folderDoc.userId, // 直接使用number类型的userId
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
   * 根据自增folderId更新文件夹
   * @param folderId 自增的文件夹ID
   * @param updateFolderDto 更新数据
   * @returns 更新结果
   */
  async updateByFolderId(
    folderId: number,
    updateFolderDto: UpdateFolderDto,
  ): Promise<UpdateFolderResponseDto> {
    try {
      this.logger.log('开始根据自增folderId更新文件夹', {
        folderId,
        updateData: updateFolderDto,
      });

      // 验证folderId是否为有效数字
      if (!folderId || folderId <= 0) {
        throw new BadRequestException('无效的文件夹ID');
      }

      // 根据自增folderId查找要更新的文件夹
      const existingFolder = await this.folderModel.findOne({ folderId });
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
        folderId: { $ne: folderId }, // 排除当前文件夹
        folderName: trimmedName,
        userId: existingFolder.userId,
        parentFolderIds: { $eq: existingFolder.parentFolderIds },
      });

      if (duplicateFolder) {
        throw new BadRequestException('同级目录下已存在同名文件夹');
      }

      // 执行更新操作
      const updatedFolder = await this.folderModel.findOneAndUpdate(
        { folderId },
        {
          folderName: trimmedName,
          update_username: existingFolder.create_username,
        },
        {
          new: true, // 返回更新后的文档
          runValidators: true, // 运行模式验证器
        },
      );

      if (!updatedFolder) {
        throw new BadRequestException('文件夹更新失败');
      }

      const folderDoc = updatedFolder.toObject() as unknown as FolderDocument;

      const result: UpdateFolderResponseDto = {
        success: true,
        message: '文件夹更新成功',
        data: {
          folderId: folderDoc._id.toString(),
          autoFolderId: folderDoc.folderId, // 返回自增的文件夹ID
          folderName: folderDoc.folderName,
          userId: folderDoc.userId, // 直接使用number类型的userId
          create_username: folderDoc.create_username,
          parentFolderIds: folderDoc.parentFolderIds,
          depth: folderDoc.depth,
          create_time: folderDoc.create_time,
          update_time: folderDoc.update_time,
        },
      };

      this.logger.log('根据自增folderId更新文件夹成功', {
        folderId: folderDoc.folderId,
        folderName: folderDoc.folderName,
      });

      return result;
    } catch (error) {
      const err = error as Error;
      this.logger.error('根据自增folderId更新文件夹失败', err.stack);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(`更新文件夹失败: ${err.message}`);
    }
  }

  /**
   * 删除文件夹（递归删除所有子文件夹和子文档）
   * @param id 文件夹ID
   * @returns 删除结果
   */
  async remove(id: string) {
    try {
      this.logger.log('开始递归删除文件夹', { id });

      // 验证文件夹ID格式
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('无效的文件夹ID格式');
      }

      // 查找要删除的文件夹
      const existingFolder = await this.folderModel.findById(id);
      if (!existingFolder) {
        throw new BadRequestException('文件夹不存在');
      }

      // 执行递归删除
      const deletionResult = await this.recursiveDelete(id);

      // 从父文件夹中移除对该文件夹的引用
      await this.removeFromParentFolder(
        existingFolder.toObject() as unknown as FolderDocument,
      );

      const result = {
        success: true,
        message: '文件夹及其所有子项删除成功',
        data: {
          folderId: id,
          folderName: existingFolder.folderName,
          deletedFoldersCount: deletionResult.foldersDeleted,
          deletedDocumentsCount: deletionResult.documentsDeleted,
        },
      };

      this.logger.log('文件夹递归删除成功', {
        folderId: id,
        folderName: existingFolder.folderName,
        foldersDeleted: deletionResult.foldersDeleted,
        documentsDeleted: deletionResult.documentsDeleted,
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

  /**
   * 根据自增folderId删除文件夹（递归删除所有子文件夹和子文档）
   * @param folderId 自增的文件夹ID
   * @returns 删除结果
   */
  async removeByFolderId(folderId: number) {
    try {
      this.logger.log('开始根据自增folderId递归删除文件夹', { folderId });

      // 查找要删除的文件夹
      const existingFolder = await this.folderModel.findOne({ folderId });
      if (!existingFolder) {
        throw new BadRequestException('文件夹不存在');
      }

      // 执行递归删除（使用自增folderId）
      const deletionResult = await this.recursiveDeleteByFolderId(folderId);

      // 从父文件夹中移除对该文件夹的引用
      await this.removeFromParentFolderByFolderId(
        existingFolder.toObject() as unknown as FolderDocument,
      );

      const result = {
        success: true,
        message: '文件夹及其所有子项删除成功',
        data: {
          folderId: existingFolder.folderId,
          folderName: existingFolder.folderName,
          deletedFoldersCount: deletionResult.foldersDeleted,
          deletedDocumentsCount: deletionResult.documentsDeleted,
        },
      };

      this.logger.log('文件夹递归删除成功', {
        folderId: existingFolder.folderId,
        folderName: existingFolder.folderName,
        foldersDeleted: deletionResult.foldersDeleted,
        documentsDeleted: deletionResult.documentsDeleted,
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

  /**
   * 递归删除文件夹及其所有子项
   * @param folderId 文件夹ID
   * @returns 删除统计信息
   */
  private async recursiveDelete(folderId: string): Promise<{
    foldersDeleted: number;
    documentsDeleted: number;
  }> {
    let foldersDeleted = 0;
    let documentsDeleted = 0;

    try {
      // 查找当前文件夹
      const currentFolder = await this.folderModel.findById(folderId);
      if (!currentFolder) {
        this.logger.warn(`文件夹不存在: ${folderId}`);
        return { foldersDeleted, documentsDeleted };
      }

      this.logger.log('开始递归删除文件夹内容', {
        folderId,
        folderName: currentFolder.folderName,
        childFolders: currentFolder.all_children_folderId?.length || 0,
        childDocuments: currentFolder.all_children_documentId?.length || 0,
      });

      // 1. 递归删除所有子文件夹
      if (
        currentFolder.all_children_folderId &&
        currentFolder.all_children_folderId.length > 0
      ) {
        for (const childFolderId of currentFolder.all_children_folderId) {
          try {
            const childResult = await this.recursiveDelete(
              childFolderId.toString(),
            );
            foldersDeleted += childResult.foldersDeleted;
            documentsDeleted += childResult.documentsDeleted;
          } catch (error) {
            this.logger.error(
              `删除子文件夹失败: ${childFolderId.toString()}`,
              error,
            );
            // 继续删除其他子文件夹，不中断整个删除过程
          }
        }
      }

      // 2. 删除所有子文档
      if (
        currentFolder.all_children_documentId &&
        currentFolder.all_children_documentId.length > 0
      ) {
        try {
          // 批量删除子文档的相关记录（如最近访问记录等）
          this.deleteDocumentReferences(currentFolder.all_children_documentId);
          documentsDeleted += currentFolder.all_children_documentId.length;

          this.logger.log(
            `已删除 ${currentFolder.all_children_documentId.length} 个子文档的相关记录`,
          );
        } catch (error) {
          this.logger.error('删除子文档记录失败', error);
        }
      }

      // 3. 删除当前文件夹
      await this.folderModel.findByIdAndDelete(folderId);
      foldersDeleted += 1;

      this.logger.log('文件夹删除完成', {
        folderId,
        folderName: currentFolder.folderName,
      });

      return { foldersDeleted, documentsDeleted };
    } catch (error) {
      this.logger.error(`递归删除文件夹失败: ${folderId}`, error);
      throw error;
    }
  }

  /**
   * 根据自增folderId递归删除文件夹及其所有子项
   * @param autoFolderId 自增的文件夹ID
   * @returns 删除统计信息
   */
  private async recursiveDeleteByFolderId(autoFolderId: number): Promise<{
    foldersDeleted: number;
    documentsDeleted: number;
  }> {
    let foldersDeleted = 0;
    let documentsDeleted = 0;

    try {
      // 查找当前文件夹
      const currentFolder = await this.folderModel.findOne({
        folderId: autoFolderId,
      });
      if (!currentFolder) {
        this.logger.warn(`文件夹不存在: ${autoFolderId}`);
        return { foldersDeleted, documentsDeleted };
      }

      this.logger.log('开始递归删除文件夹内容（使用自增ID）', {
        autoFolderId,
        folderName: currentFolder.folderName,
        childFolders: currentFolder.all_children_folderId?.length || 0,
        childDocuments: currentFolder.all_children_documentId?.length || 0,
      });

      // 1. 递归删除所有子文件夹
      if (
        currentFolder.all_children_folderId &&
        currentFolder.all_children_folderId.length > 0
      ) {
        // 获取所有子文件夹的自增ID
        const childFolders = await this.folderModel
          .find({ _id: { $in: currentFolder.all_children_folderId } })
          .select('folderId folderName')
          .lean();

        for (const childFolder of childFolders) {
          try {
            const childResult = await this.recursiveDeleteByFolderId(
              childFolder.folderId,
            );
            foldersDeleted += childResult.foldersDeleted;
            documentsDeleted += childResult.documentsDeleted;
          } catch (error) {
            this.logger.error(
              `删除子文件夹失败: ${childFolder.folderId}`,
              error,
            );
            // 继续删除其他子文件夹，不中断整个删除过程
          }
        }
      }

      // 2. 删除所有子文档
      if (
        currentFolder.all_children_documentId &&
        currentFolder.all_children_documentId.length > 0
      ) {
        try {
          // 批量删除子文档的相关记录（如最近访问记录等）
          this.deleteDocumentReferences(currentFolder.all_children_documentId);
          documentsDeleted += currentFolder.all_children_documentId.length;

          this.logger.log(
            `已删除 ${currentFolder.all_children_documentId.length} 个子文档的相关记录`,
          );
        } catch (error) {
          this.logger.error('删除子文档记录失败', error);
        }
      }

      // 3. 删除当前文件夹
      await this.folderModel.findOneAndDelete({ folderId: autoFolderId });
      foldersDeleted += 1;

      this.logger.log('文件夹删除完成（使用自增ID）', {
        autoFolderId,
        folderName: currentFolder.folderName,
      });

      return { foldersDeleted, documentsDeleted };
    } catch (error) {
      this.logger.error(`递归删除文件夹失败: ${autoFolderId}`, error);
      throw error;
    }
  }

  /**
   * 从父文件夹中移除对指定文件夹的引用
   * @param folder 要移除的文件夹
   */
  private async removeFromParentFolder(folder: FolderDocument): Promise<void> {
    try {
      if (folder.parentFolderIds && folder.parentFolderIds.length > 0) {
        // 获取直接父级文件夹ID
        const parentFolderId =
          folder.parentFolderIds[folder.parentFolderIds.length - 1];

        // 从父文件夹的子文件夹列表中移除当前文件夹
        await this.folderModel.findByIdAndUpdate(
          parentFolderId,
          {
            $pull: { all_children_folderId: folder._id },
            update_username: folder.create_username, // 使用文件夹创建者作为更新者
          },
          { new: true },
        );

        this.logger.log(`已从父文件夹移除引用`, {
          parentFolderId,
          removedFolderId: folder._id.toString(),
        });
      }
    } catch (error) {
      this.logger.error('从父文件夹移除引用失败', error);
      // 不抛出错误，因为这不应该阻止删除操作
    }
  }

  /**
   * 根据自增folderId从父文件夹中移除对指定文件夹的引用
   * @param folder 要移除的文件夹
   */
  private async removeFromParentFolderByFolderId(
    folder: FolderDocument,
  ): Promise<void> {
    try {
      if (folder.parentFolderIds && folder.parentFolderIds.length > 0) {
        // 获取直接父级文件夹ID（使用MongoDB ObjectId）
        const parentFolderId =
          folder.parentFolderIds[folder.parentFolderIds.length - 1];

        // 从父文件夹的子文件夹列表中移除当前文件夹
        await this.folderModel.findByIdAndUpdate(
          parentFolderId,
          {
            $pull: { all_children_folderId: folder._id },
            update_username: folder.create_username, // 使用文件夹创建者作为更新者
          },
          { new: true },
        );

        this.logger.log(`已从父文件夹移除引用（使用自增ID方式）`, {
          parentFolderId,
          removedFolderId: folder._id.toString(),
          removedAutoFolderId: folder.folderId,
        });
      }
    } catch (error) {
      this.logger.error('从父文件夹移除引用失败（使用自增ID方式）', error);
      // 不抛出错误，因为这不应该阻止删除操作
    }
  }

  /**
   * 删除文档相关的引用记录
   * @param documentIds 文档ID数组
   */
  private deleteDocumentReferences(documentIds: Types.ObjectId[]): void {
    try {
      // 由于目前还没有独立的文档模型，这里主要删除相关的引用记录
      // 例如最近访问记录等

      // TODO: 当有独立的文档模型时，需要在这里调用文档删除服务
      // await this.documentService.deleteDocuments(documentIds);

      // 目前仅记录日志，表示这些文档已被标记为删除
      this.logger.log('文档引用记录已处理', {
        documentCount: documentIds.length,
        documentIds: documentIds.map((id) => id.toString()),
      });

      // 如果有最近访问记录服务，可以在这里清理相关记录
      // await this.recentVisitsService.deleteByDocumentIds(documentIds);
    } catch (error) {
      this.logger.error('删除文档引用记录失败', error);
      throw error;
    }
  }

  /**
   * 获取所有公开用户的文件夹树形结构
   * @returns 所有公开用户的文件夹结构
   */
  async findAllPublicFolders(): Promise<{
    success: boolean;
    message: string;
    data: Array<{
      userId: number;
      username: string;
      isPublic: boolean;
      folders: FolderTreeItem[];
    }>;
  }> {
    try {
      this.logger.log('开始获取所有公开用户的文件夹');

      // 首先获取所有设置为公开的用户
      const userModel = this.folderModel.db.model('User');
      const publicUsers = await userModel.find({ isPublic: true }).select({
        userId: 1,
        username: 1,
        isPublic: 1,
      });

      if (publicUsers.length === 0) {
        return {
          success: true,
          message: '当前没有公开的用户空间',
          data: [],
        };
      }

      // 为每个公开用户获取其文件夹树
      const result: Array<{
        userId: number;
        username: string;
        isPublic: boolean;
        folders: FolderTreeItem[];
      }> = [];

      for (const user of publicUsers) {
        try {
          // 获取用户的根文件夹（depth为0的文件夹）
          const rootFolders = await this.folderModel
            .find({
              userId: user.userId,
              depth: 0,
            })
            .lean()
            .exec();

          // 构建该用户的文件夹树
          const userFolderTree: FolderTreeItem[] = [];

          for (const rootFolder of rootFolders) {
            const folderTree = await this.buildUserFolderTree(
              (rootFolder._id as Types.ObjectId).toString(),
              // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
              user.userId,
              0,
            );
            if (folderTree) {
              userFolderTree.push(folderTree);
            }
          }

          result.push({
            userId: user.userId,

            username: user.username,
            isPublic: user.isPublic,
            folders: userFolderTree,
          });
        } catch (userError) {
          this.logger.warn(
            `获取用户 ${user.username} (ID: ${user.userId}) 的文件夹失败: ${userError.message}`,
          );
          // 继续处理其他用户，不中断整个流程
        }
      }

      return {
        success: true,
        message: `成功获取 ${result.length} 个公开用户的文件夹结构`,
        data: result,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error('获取公开用户文件夹失败', err.stack);
      throw new BadRequestException(`获取公开用户文件夹失败: ${err.message}`);
    }
  }

  /**
   * 构建单个用户的文件夹树（私有方法）
   * @param folderId 文件夹ID
   * @param userId 用户ID
   * @param currentDepth 当前深度
   * @returns 文件夹树节点
   */
  private async buildUserFolderTree(
    folderId: string,
    userId: number,
    currentDepth: number,
  ): Promise<FolderTreeItem | null> {
    try {
      // 获取当前文件夹信息
      const folder = await this.folderModel.findById(folderId).lean().exec();

      if (!folder || folder.userId !== userId) {
        return null;
      }

      // 获取子文件夹
      const childFolders = await this.folderModel
        .find({
          userId: userId,
          parentFolderIds: { $in: [folderId] },
        })
        .lean()
        .exec();

      // 递归构建子文件夹树
      const children: FolderTreeItem[] = [];
      for (const childFolder of childFolders) {
        const childTree = await this.buildUserFolderTree(
          childFolder._id.toString(),
          userId,
          currentDepth + 1,
        );
        if (childTree) {
          children.push(childTree);
        }
      }

      // 获取当前文件夹下的文档数量
      const documentModel = this.folderModel.db.model('DocumentEntity');
      const documentsCount = await documentModel.countDocuments({
        userId: userId,
        parentFolderIds: { $in: [folder.folderId] },
      });

      return {
        folderId: folder._id.toString(),
        autoFolderId: folder.folderId,
        folderName: folder.folderName,
        userId: folder.userId,
        create_username: folder.create_username,
        update_username: folder.update_username,
        parentFolderIds: folder.parentFolderIds,
        depth: folder.depth,
        isPublic: folder.isPublic || false,
        childrenCount: {
          documents: documentsCount,
          folders: children.length,
        },
        children: children,
        create_time: folder.create_time,
        update_time: folder.update_time,
      };
    } catch (error) {
      this.logger.error(
        `构建用户 ${userId} 文件夹树失败 (folderId: ${folderId}): ${error.message}`,
      );
      return null;
    }
  }

  /**
   * 按文件夹名称模糊搜索文件夹
   * @param searchDto 搜索参数
   * @returns 搜索结果，包括用户自己的文件夹和其他用户公开的文件夹
   */
  async searchFolders(
    searchDto: SearchFolderDto,
  ): Promise<SearchFolderResponseDto> {
    try {
      this.logger.log('开始搜索文件夹', searchDto);

      const { keyword, userId, page = 1, limit = 10 } = searchDto;

      // 构建查询条件
      let query: FilterQuery<Folder> = {
        folderName: { $regex: keyword, $options: 'i' }, // 模糊搜索，不区分大小写
      };

      // 如果指定了用户ID，添加条件以搜索用户自己的文件夹和其他用户的公开文件夹
      if (userId) {
        query = {
          folderName: { $regex: keyword, $options: 'i' },
          $or: [
            { userId: userId }, // 用户自己的文件夹
            { isPublic: true }, // 其他用户公开的文件夹
          ],
        };
      }

      this.logger.log('文件夹搜索查询条件', { query });

      // 计算跳过的记录数
      const skip = (page - 1) * limit;

      // 执行搜索查询
      const [folders, totalCount] = await Promise.all([
        this.folderModel
          .find(query)
          .sort({ update_time: -1 }) // 按更新时间倒序排列
          .skip(skip)
          .limit(limit)
          .lean()
          .exec(),
        this.folderModel.countDocuments(query).exec(),
      ]);

      this.logger.log(`搜索到 ${folders.length} 个相关文件夹`);

      // 获取父文件夹名称路径
      const foldersWithPath = await Promise.all(
        folders.map(async (folder) => {
          const parentFolderNames = await this.getParentFolderNames(
            folder.parentFolderIds,
          );

          return {
            folderId: folder._id.toString(),
            autoFolderId: folder.folderId,
            folderName: folder.folderName,
            userId: folder.userId,
            create_username: folder.create_username,
            update_username: folder.update_username,
            parentFolderIds: folder.parentFolderIds,
            depth: folder.depth,
            isPublic: folder.isPublic || false, // 确保isPublic字段有值
            parentFolderNames, // 父文件夹名称路径
            create_time: folder.create_time,
            update_time: folder.update_time,
          };
        }),
      );

      // 计算分页信息
      const totalPages = Math.ceil(totalCount / limit);

      const result: SearchFolderResponseDto = {
        success: true,
        message: `搜索完成，找到 ${totalCount} 个匹配的文件夹`,
        data: {
          folders: foldersWithPath,
          pagination: {
            currentPage: page,
            totalPages,
            totalCount,
            pageSize: limit,
          },
        },
      };

      this.logger.log('文件夹搜索完成', {
        keyword,
        userId,
        totalCount,
        currentPage: page,
      });

      return result;
    } catch (error) {
      const err = error as Error;
      this.logger.error('搜索文件夹失败', err.stack);

      return {
        success: false,
        message: `搜索文件夹失败: ${err.message}`,
        data: {
          folders: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalCount: 0,
            pageSize: 10,
          },
        },
      };
    }
  }

  /**
   * 获取父文件夹名称路径
   * @param parentFolderIds 父文件夹ID数组
   * @returns 父文件夹名称数组
   */
  private async getParentFolderNames(
    parentFolderIds: string[],
  ): Promise<string[]> {
    try {
      if (!parentFolderIds || parentFolderIds.length === 0) {
        return [];
      }

      // 将字符串ID转换为ObjectId
      const objectIds = parentFolderIds.map((id) => new Types.ObjectId(id));

      // 按照原始顺序查询文件夹名称
      const folders = await this.folderModel
        .find({ _id: { $in: objectIds } })
        .select('_id folderName')
        .lean()
        .exec();

      // 创建ID到名称的映射
      const folderMap = new Map(
        folders.map((folder) => [folder._id.toString(), folder.folderName]),
      );

      // 按照原始顺序返回文件夹名称
      return parentFolderIds.map((id) => folderMap.get(id) || '未知文件夹');
    } catch (error) {
      this.logger.warn('获取父文件夹名称失败', error);
      return parentFolderIds.map(() => '未知文件夹');
    }
  }
}
