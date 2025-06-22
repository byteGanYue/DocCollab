import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  CreateDocumentDto,
  CreateDocumentResponseDto,
  QueryDocumentDto,
  UserDocumentQueryDto,
} from './dto/create-document.dto';
import {
  UpdateDocumentDto,
  UpdateDocumentResponseDto,
} from './dto/update-document.dto';
import { DocumentEntity } from './schemas/document.schema';
import { CounterService } from './services/counter.service';
import { RecentVisitsService } from '../recent-visits/recent-visits.service';

interface DocumentDocument {
  _id: Types.ObjectId;
  userId: number;
  documentId: number;
  documentName: string;
  content: string;
  create_username: string;
  update_username: string;
  editorId: number[];
  parentFolderIds: number[];
  create_time: Date;
  update_time: Date;
}

export interface DocumentListResponse {
  success: boolean;
  message: string;
  data: {
    documents: DocumentDocument[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);

  constructor(
    @InjectModel(DocumentEntity.name)
    private documentModel: Model<DocumentEntity>,
    private counterService: CounterService,
    private recentVisitsService: RecentVisitsService,
  ) {}

  /**
   * 创建文档
   * @param createDocumentDto 创建文档数据
   * @returns 创建结果
   */
  async create(
    createDocumentDto: CreateDocumentDto,
  ): Promise<CreateDocumentResponseDto> {
    try {
      this.logger.log('开始创建文档', createDocumentDto);

      // 验证文档名称
      if (!createDocumentDto.documentName.trim()) {
        throw new BadRequestException('文档名称不能为空');
      }

      // 获取下一个文档ID
      const documentId =
        await this.counterService.getNextSequence('documentId');

      // 验证父文件夹是否存在（如果指定了父文件夹）
      if (
        createDocumentDto.parentFolderIds &&
        createDocumentDto.parentFolderIds.length > 0
      ) {
        // 这里可以添加验证父文件夹是否存在的逻辑
        // const parentFolderId = createDocumentDto.parentFolderIds[createDocumentDto.parentFolderIds.length - 1];
        // await this.validateParentFolder(parentFolderId, createDocumentDto.userId);
      }

      // 创建新文档
      const newDocument = new this.documentModel({
        userId: createDocumentDto.userId,
        documentId,
        documentName: createDocumentDto.documentName.trim(),
        content: createDocumentDto.content || '',
        create_username: createDocumentDto.create_username,
        update_username: createDocumentDto.create_username,
        editorId: [],
        parentFolderIds: createDocumentDto.parentFolderIds || [],
      });

      const savedDocument = await newDocument.save();
      const documentDoc = savedDocument.toObject() as DocumentDocument;

      const result = {
        success: true,
        message: '文档创建成功',
        data: {
          _id: documentDoc._id.toString(),
          documentId: documentDoc.documentId,
          documentName: documentDoc.documentName,
          userId: documentDoc.userId,
          content: documentDoc.content,
          create_username: documentDoc.create_username,
          update_username: documentDoc.update_username,
          editorId: documentDoc.editorId,
          parentFolderIds: documentDoc.parentFolderIds,
          create_time: documentDoc.create_time,
          update_time: documentDoc.update_time,
        },
      };

      this.logger.log('文档创建成功', {
        documentId: documentDoc.documentId,
        documentName: documentDoc.documentName,
      });

      return result;
    } catch (error) {
      const err = error as Error;
      this.logger.error('创建文档失败', err.stack);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(`创建文档失败: ${err.message}`);
    }
  }

  /**
   * 查询文档列表
   * @param queryDto 查询参数
   * @returns 文档列表
   */
  async findAll(queryDto?: QueryDocumentDto): Promise<DocumentListResponse> {
    try {
      this.logger.log('开始查询文档列表', queryDto);

      // 验证必要参数
      if (!queryDto?.userId) {
        throw new BadRequestException('用户ID是必需的参数');
      }

      const page = queryDto?.page || 1;
      const pageSize = queryDto?.pageSize || 10;
      const skip = (page - 1) * pageSize;

      // 构建查询条件
      interface DocumentFilter {
        userId: number; // 用户ID是必需的
        parentFolderIds?: { $in: number[] };
        $or?: Array<{
          documentName?: { $regex: string; $options: string };
          content?: { $regex: string; $options: string };
        }>;
      }

      const filter: DocumentFilter = {
        userId: queryDto.userId, // 必须按用户ID过滤
      };

      if (queryDto?.parentFolderId) {
        filter.parentFolderIds = { $in: [queryDto.parentFolderId] };
      }

      if (queryDto?.search) {
        filter.$or = [
          { documentName: { $regex: queryDto.search, $options: 'i' } },
          { content: { $regex: queryDto.search, $options: 'i' } },
        ];
      }

      // 查询文档
      const [documents, total] = await Promise.all([
        this.documentModel
          .find(filter)
          .sort({ create_time: -1 })
          .skip(skip)
          .limit(pageSize)
          .lean(),
        this.documentModel.countDocuments(filter),
      ]);

      const result = {
        success: true,
        message: `成功获取用户${queryDto.userId}的文档列表`,
        data: {
          documents: documents as unknown as DocumentDocument[],
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      };

      this.logger.log('查询文档列表成功', {
        userId: queryDto.userId,
        total,
        page,
        pageSize,
      });

      return result;
    } catch (error) {
      const err = error as Error;
      this.logger.error('查询文档列表失败', err.stack);
      throw new BadRequestException(`查询文档列表失败: ${err.message}`);
    }
  }

  /**
   * 根据用户ID查询文档列表
   * @param userId 用户ID
   * @param queryDto 查询参数
   * @returns 用户的文档列表
   */
  async findAllByUserId(
    userId: number,
    queryDto?: UserDocumentQueryDto,
  ): Promise<DocumentListResponse> {
    try {
      this.logger.log('开始根据用户ID查询文档列表', { userId, ...queryDto });

      const page = queryDto?.page || 1;
      const pageSize = queryDto?.pageSize || 10;
      const skip = (page - 1) * pageSize;

      // 构建查询条件
      interface DocumentFilter {
        userId: number; // 用户ID是必需的
        parentFolderIds?: { $in: number[] };
        $or?: Array<{
          documentName?: { $regex: string; $options: string };
          content?: { $regex: string; $options: string };
        }>;
      }

      const filter: DocumentFilter = {
        userId, // 按用户ID过滤
      };

      if (queryDto?.parentFolderId) {
        filter.parentFolderIds = { $in: [queryDto.parentFolderId] };
      }

      if (queryDto?.search) {
        filter.$or = [
          { documentName: { $regex: queryDto.search, $options: 'i' } },
          { content: { $regex: queryDto.search, $options: 'i' } },
        ];
      }

      // 构建排序条件
      const sortBy = queryDto?.sortBy || 'create_time';
      const sortOrder = queryDto?.sortOrder || 'desc';
      const sortObj: { [key: string]: 1 | -1 } = {};
      sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // 查询文档
      const [documents, total] = await Promise.all([
        this.documentModel
          .find(filter)
          .sort(sortObj)
          .skip(skip)
          .limit(pageSize)
          .lean(),
        this.documentModel.countDocuments(filter),
      ]);

      const result = {
        success: true,
        message: `成功获取用户${userId}的文档列表`,
        data: {
          documents: documents as unknown as DocumentDocument[],
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      };

      this.logger.log('根据用户ID查询文档列表成功', {
        userId,
        total,
        page,
        pageSize,
      });

      return result;
    } catch (error) {
      const err = error as Error;
      this.logger.error('根据用户ID查询文档列表失败', err.stack);
      throw new BadRequestException(
        `查询用户${userId}的文档列表失败: ${err.message}`,
      );
    }
  }

  /**
   * 根据文档ID查询单个文档，并处理最近访问记录
   * @param documentId 文档ID
   * @param userId 访问用户ID
   * @returns 文档详情
   */
  async findOne(documentId: number, userId: number) {
    try {
      this.logger.log('开始查询文档详情', { documentId, userId });

      const document = await this.documentModel.findOne({ documentId }).lean();

      if (!document) {
        throw new NotFoundException('文档不存在');
      }

      // 处理最近访问记录
      try {
        await this.recentVisitsService.create({
          visitId: userId.toString(),
          userId: document.userId.toString(),
          documentId: documentId.toString(),
          documentName: document.documentName,
        });

        this.logger.log('最近访问记录处理成功', { documentId, userId });
      } catch (visitError) {
        this.logger.warn('处理最近访问记录失败', visitError);
      }

      const result = {
        success: true,
        message: '查询文档详情成功',
        data: document,
      };

      this.logger.log('查询文档详情成功', { documentId });

      return result;
    } catch (error) {
      const err = error as Error;
      this.logger.error('查询文档详情失败', err.stack);

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new BadRequestException(`查询文档详情失败: ${err.message}`);
    }
  }

  /**
   * 更新文档
   * @param documentId 文档ID
   * @param updateDocumentDto 更新数据
   * @returns 更新结果
   */
  async update(
    documentId: number,
    updateDocumentDto: UpdateDocumentDto,
  ): Promise<UpdateDocumentResponseDto> {
    try {
      this.logger.log('开始更新文档', { documentId, ...updateDocumentDto });

      const document = await this.documentModel.findOne({ documentId });
      if (!document) {
        throw new NotFoundException('文档不存在');
      }

      // 更新文档
      const updatedDocument = await this.documentModel
        .findOneAndUpdate(
          { documentId },
          {
            $set: updateDocumentDto,
          },
          { new: true },
        )
        .lean();

      if (!updatedDocument) {
        throw new NotFoundException('文档更新失败');
      }

      const result = {
        success: true,
        message: '文档更新成功',
        data: {
          _id: (updatedDocument._id as Types.ObjectId).toString(),
          documentId: updatedDocument.documentId,
          documentName: updatedDocument.documentName,
          userId: updatedDocument.userId,
          content: updatedDocument.content,
          create_username: updatedDocument.create_username,
          update_username: updatedDocument.update_username,
          editorId: updatedDocument.editorId,
          parentFolderIds: updatedDocument.parentFolderIds,
          create_time: updatedDocument.create_time,
          update_time: updatedDocument.update_time,
        },
      };

      this.logger.log('文档更新成功', { documentId });

      return result;
    } catch (error) {
      const err = error as Error;
      this.logger.error('更新文档失败', err.stack);

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new BadRequestException(`更新文档失败: ${err.message}`);
    }
  }

  /**
   * 删除文档
   * @param documentId 文档ID
   * @returns 删除结果
   */
  async remove(documentId: number) {
    try {
      this.logger.log('开始删除文档', { documentId });

      const document = await this.documentModel.findOne({ documentId });
      if (!document) {
        throw new NotFoundException('文档不存在');
      }

      await this.documentModel.findOneAndDelete({ documentId });

      const result = {
        success: true,
        message: '文档删除成功',
        data: {
          documentId,
          documentName: document.documentName,
        },
      };

      this.logger.log('文档删除成功', { documentId });

      return result;
    } catch (error) {
      const err = error as Error;
      this.logger.error('删除文档失败', err.stack);

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new BadRequestException(`删除文档失败: ${err.message}`);
    }
  }

  /**
   * 添加协同编辑者
   * @param documentId 文档ID
   * @param userId 用户ID
   * @returns 操作结果
   */
  async addEditor(documentId: number, userId: number) {
    try {
      this.logger.log('开始添加协同编辑者', { documentId, userId });

      const document = await this.documentModel.findOne({ documentId });
      if (!document) {
        throw new NotFoundException('文档不存在');
      }

      // 检查用户是否已经是编辑者
      if (document.editorId.includes(userId)) {
        return {
          success: true,
          message: '用户已经是编辑者',
          data: { documentId, userId },
        };
      }

      await this.documentModel.findOneAndUpdate(
        { documentId },
        { $push: { editorId: userId } },
      );

      const result = {
        success: true,
        message: '添加协同编辑者成功',
        data: { documentId, userId },
      };

      this.logger.log('添加协同编辑者成功', { documentId, userId });

      return result;
    } catch (error) {
      const err = error as Error;
      this.logger.error('添加协同编辑者失败', err.stack);

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new BadRequestException(`添加协同编辑者失败: ${err.message}`);
    }
  }

  /**
   * 移除协同编辑者
   * @param documentId 文档ID
   * @param userId 用户ID
   * @returns 操作结果
   */
  async removeEditor(documentId: number, userId: number) {
    try {
      this.logger.log('开始移除协同编辑者', { documentId, userId });

      const document = await this.documentModel.findOne({ documentId });
      if (!document) {
        throw new NotFoundException('文档不存在');
      }

      await this.documentModel.findOneAndUpdate(
        { documentId },
        { $pull: { editorId: userId } },
      );

      const result = {
        success: true,
        message: '移除协同编辑者成功',
        data: { documentId, userId },
      };

      this.logger.log('移除协同编辑者成功', { documentId, userId });

      return result;
    } catch (error) {
      const err = error as Error;
      this.logger.error('移除协同编辑者失败', err.stack);

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new BadRequestException(`移除协同编辑者失败: ${err.message}`);
    }
  }
}
