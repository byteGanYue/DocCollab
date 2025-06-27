/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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
import { DocumentHistoryService } from './services/document-history.service';
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
  isPublic: boolean;
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
    private documentHistoryService: DocumentHistoryService,
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

      // 检查同级目录下是否已存在同名文档
      const duplicateDocument = await this.documentModel.findOne({
        documentName: createDocumentDto.documentName.trim(),
        userId: createDocumentDto.userId,
        parentFolderIds: { $eq: createDocumentDto.parentFolderIds || [] },
      });

      if (duplicateDocument) {
        throw new BadRequestException('同级目录下已存在同名文档');
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
        isPublic: createDocumentDto.isPublic || false,
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
          isPublic: documentDoc.isPublic,
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
          visitId: userId,
          userId: document.userId,
          documentId: documentId,
          documentName: document.documentName,
          documentUser: document.create_username, // 文档创建人用户名
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

      // 如果要更新文档名称，检查同级目录下是否已存在同名文档
      if (updateDocumentDto.documentName) {
        const trimmedName = updateDocumentDto.documentName.trim();

        // 验证文档名称不能为空
        if (!trimmedName) {
          throw new BadRequestException('文档名称不能为空');
        }

        // 检查同级目录下是否已存在同名文档（排除当前文档）
        const duplicateDocument = await this.documentModel.findOne({
          documentId: { $ne: documentId }, // 排除当前文档
          documentName: trimmedName,
          userId: document.userId,
          parentFolderIds: {
            $eq: updateDocumentDto.parentFolderIds || document.parentFolderIds,
          },
        });

        if (duplicateDocument) {
          throw new BadRequestException('同级目录下已存在同名文档');
        }

        // 确保更新的文档名称是去空格后的
        updateDocumentDto.documentName = trimmedName;
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

      // 添加到历史版本记录表，versionId在上一版本基础上加1
      try {
        await this.documentHistoryService.addDocumentHistory({
          userId: updatedDocument.userId,
          documentId: updatedDocument.documentId,
          documentName: updatedDocument.documentName,
          content: updatedDocument.content,
          create_username: updatedDocument.create_username,
          update_username: updatedDocument.update_username,
        });
        this.logger.log('已添加文档历史版本记录', {
          documentId: updatedDocument.documentId,
        });
      } catch (historyError) {
        // 历史版本记录失败不影响文档更新成功
        this.logger.warn(
          `添加文档历史版本记录失败: ${(historyError as Error).message}`,
          { documentId: updatedDocument.documentId },
        );
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
          isPublic: updatedDocument.isPublic,
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

      throw new BadRequestException(`${err.message}`);
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

      // 删除文档
      await this.documentModel.findOneAndDelete({ documentId });

      // 删除该文档的所有访问记录
      try {
        const visitDeleteResult =
          await this.recentVisitsService.deleteByDocumentId(documentId);
        this.logger.log(
          `同步删除了 ${visitDeleteResult.data.deletedCount} 条访问记录`,
          { documentId },
        );
      } catch (visitError) {
        // 访问记录删除失败不影响文档删除的成功
        this.logger.warn(
          `删除文档 ${documentId} 的访问记录时出现错误: ${(visitError as Error).message}`,
        );
      }

      // 删除该文档的所有历史版本记录
      try {
        const historyDeleteResult =
          await this.documentHistoryService.deleteDocumentHistory(documentId);
        this.logger.log(
          `同步删除了 ${historyDeleteResult.deletedCount} 条历史版本记录`,
          { documentId },
        );
      } catch (historyError) {
        // 历史版本记录删除失败不影响文档删除的成功
        this.logger.warn(
          `删除文档 ${documentId} 的历史版本记录时出现错误: ${(historyError as Error).message}`,
        );
      }

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

  /**
   * 获取所有公开用户的文档列表
   * @returns 所有公开用户的文档列表
   */
  async findAllPublicDocuments(): Promise<{
    success: boolean;
    message: string;
    data: Array<{
      userId: number;
      username: string;
      isPublic: boolean;
      documents: DocumentDocument[];
    }>;
  }> {
    try {
      this.logger.log('开始获取所有公开用户的文档');

      // 首先获取所有设置为公开的用户
      const userModel = this.documentModel.db.model('User');
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

      // 为每个公开用户获取其文档
      const result: Array<{
        userId: number;
        username: string;
        isPublic: boolean;
        documents: DocumentDocument[];
      }> = [];

      for (const user of publicUsers) {
        try {
          // 获取用户的所有文档
          const userDocuments = await this.documentModel
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            .find({ userId: user.userId })
            .lean()
            .exec();

          result.push({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            userId: user.userId,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            username: user.username,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            isPublic: user.isPublic,
            documents: userDocuments as unknown as DocumentDocument[],
          });
        } catch (userError) {
          this.logger.warn(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            `获取用户 ${user.username} (ID: ${user.userId}) 的文档失败: ${(userError as Error).message}`,
          );
          // 继续处理其他用户，不中断整个流程
        }
      }

      return {
        success: true,
        message: `成功获取 ${result.length} 个公开用户的文档`,
        data: result,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error('获取公开用户文档失败', err.stack);
      throw new BadRequestException(`获取公开用户文档失败: ${err.message}`);
    }
  }

  /**
   * 获取指定文件夹下的公开文档
   * @param parentFolderIds 父文件夹ID数组
   * @returns 文件夹下的公开文档列表
   */
  async findPublicDocumentsByFolder(
    parentFolderIds: number[],
  ): Promise<DocumentListResponse> {
    try {
      this.logger.log('开始获取指定文件夹下的公开文档', { parentFolderIds });

      // 获取所有设置为公开的用户ID
      const userModel = this.documentModel.db.model('User');
      const publicUsers = await userModel.find({ isPublic: true }).select({
        userId: 1,
      });

      if (publicUsers.length === 0) {
        return {
          success: true,
          message: '当前没有公开的用户空间',
          data: {
            documents: [],
            total: 0,
            page: 1,
            pageSize: 10,
            totalPages: 0,
          },
        };
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
      const publicUserIds = publicUsers.map((user) => user.userId);

      // 构建查询条件：文档必须属于公开用户且在指定文件夹中
      const filter = {
        userId: { $in: publicUserIds },
        $and: [
          {
            $or: parentFolderIds.map((folderId) => ({
              parentFolderIds: { $in: [folderId] },
            })),
          },
        ],
      };

      // 查询符合条件的文档
      const [documents, total] = await Promise.all([
        this.documentModel.find(filter).sort({ create_time: -1 }).lean(),
        this.documentModel.countDocuments(filter),
      ]);

      const result = {
        success: true,
        message: `成功获取指定文件夹下的公开文档`,
        data: {
          documents: documents as unknown as DocumentDocument[],
          total,
          page: 1,
          pageSize: documents.length,
          totalPages: 1,
        },
      };

      this.logger.log('获取指定文件夹下的公开文档成功', {
        total,
        parentFolderIds,
      });

      return result;
    } catch (error) {
      const err = error as Error;
      this.logger.error('获取指定文件夹下的公开文档失败', err.stack);
      throw new BadRequestException(
        `获取指定文件夹下的公开文档失败: ${err.message}`,
      );
    }
  }

  /**
   * 搜索文档内容
   * @param searchText 搜索文本
   * @param userId 用户ID
   * @returns 搜索结果，包括用户自己的文档和其他用户公开的文档
   */
  async searchDocuments(
    searchText: string,
    userId: number,
  ): Promise<{
    success: boolean;
    message: string;
    data: Array<{
      documentId: number;
      documentName: string;
      content: string;
      matchedText: string;
      userId: number;
      create_username: string;
      update_time: Date;
      isPublic: boolean;
    }>;
  }> {
    try {
      this.logger.log('开始搜索文档内容', { searchText, userId });

      if (!searchText || !searchText.trim()) {
        return {
          success: true,
          message: '搜索文本不能为空',
          data: [],
        };
      }

      // 构建搜索条件：查找用户自己的文档以及其他用户公开的文档
      const searchCondition = {
        $and: [
          {
            $or: [
              { userId: userId }, // 用户自己的文档
              { isPublic: true }, // 其他用户公开的文档
            ],
          },
          {
            $or: [
              { documentName: { $regex: searchText, $options: 'i' } },
              // 不再直接在数据库层面匹配content字段，因为可能会匹配到JSON的键名
              // 我们将获取所有文档，然后在应用层面解析JSON并只匹配text字段的值
            ],
          },
        ],
      };

      // 查询文档，限制最多返回100条结果
      const documents = await this.documentModel
        .find(searchCondition)
        .limit(100)
        .sort({ update_time: -1 }); // 按最后修改时间降序排序

      this.logger.log(
        `搜索到 ${documents.length} 个文档名匹配的文档，准备搜索文档内容`,
      );

      // 如果文档名匹配结果少于20条，再获取更多文档进行内容搜索
      interface DocumentLike {
        toObject?: () => Record<string, unknown>;
        _id?: unknown;
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
        isPublic?: boolean;
      }

      let additionalDocuments: DocumentLike[] = [];
      if (documents.length < 20) {
        // 构建额外的搜索条件，不包含文档名匹配
        const additionalCondition = {
          $and: [
            {
              $or: [
                { userId: userId }, // 用户自己的文档
                { isPublic: true }, // 其他用户公开的文档
              ],
            },
          ],
        };

        const result = await this.documentModel
          .find(additionalCondition)
          .limit(50)
          .sort({ update_time: -1 })
          .lean();

        // 安全的类型转换
        additionalDocuments = result as unknown as DocumentLike[];

        this.logger.log(
          `获取额外 ${additionalDocuments.length} 个文档进行内容搜索`,
        );
      }

      // 合并文档列表
      const allDocuments = [...documents, ...additionalDocuments];

      // 搜索结果数组
      const searchResults: Array<{
        documentId: number;
        documentName: string;
        content: string;
        matchedText: string;
        userId: number;
        create_username: string;
        update_time: Date;
        isPublic: boolean;
      }> = [];

      // 遍历文档
      for (const doc of allDocuments) {
        // 处理文档对象，确保有正确的结构
        const typedDoc = (doc.toObject ? doc.toObject() : doc) as {
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
          isPublic: boolean;
        };

        // 先检查文档名称匹配
        if (
          typedDoc.documentName.toLowerCase().includes(searchText.toLowerCase())
        ) {
          searchResults.push({
            documentId: typedDoc.documentId,
            documentName: typedDoc.documentName,
            content: typedDoc.documentName, // 使用文档名称作为内容
            matchedText: typedDoc.documentName,
            userId: typedDoc.userId,
            create_username: typedDoc.create_username,
            update_time: typedDoc.update_time,
            isPublic: typedDoc.isPublic || false,
          });
          continue;
        }

        // 检查内容，尝试解析JSON
        try {
          // 检查是否有内容且是JSON格式
          if (
            !typedDoc.content ||
            !(
              typedDoc.content.startsWith('[') ||
              typedDoc.content.startsWith('{')
            )
          ) {
            continue; // 跳过非JSON内容
          }

          // 解析JSON内容
          const jsonContent = JSON.parse(typedDoc.content);

          // 提取所有text字段
          const allTextNodes: Array<{
            text: string;
            path: string; // 记录节点路径，用于确定上下文关系
          }> = [];

          // 递归提取所有text字段
          const extractAllTextNodes = (node: unknown, path: string = '') => {
            if (!node) return;

            if (Array.isArray(node)) {
              node.forEach((item, index) => {
                extractAllTextNodes(item, `${path}.${index}`);
              });
            } else if (typeof node === 'object' && node !== null) {
              // 提取当前节点的text字段
              const objNode = node as Record<string, unknown>;
              if (
                Object.prototype.hasOwnProperty.call(objNode, 'text') &&
                typeof objNode.text === 'string'
              ) {
                allTextNodes.push({ text: objNode.text, path });
              }

              // 递归处理子节点
              for (const key in objNode) {
                if (typeof objNode[key] === 'object' && objNode[key] !== null) {
                  extractAllTextNodes(objNode[key], `${path}.${key}`);
                }
              }
            }
          };

          // 开始提取所有text节点
          extractAllTextNodes(jsonContent);

          // 搜索匹配的text节点
          for (let i = 0; i < allTextNodes.length; i++) {
            const node = allTextNodes[i];

            // 检查是否匹配搜索文本
            if (node.text.toLowerCase().includes(searchText.toLowerCase())) {
              let contentToDisplay = node.text;

              // 如果匹配到的text小于20个字符，尝试拼接上下文
              if (node.text.length < 20) {
                // 尝试获取上一个节点的后15个字符
                if (i > 0) {
                  const prevNode = allTextNodes[i - 1];
                  if (prevNode.text.length > 15) {
                    contentToDisplay =
                      prevNode.text.slice(-15) + contentToDisplay;
                  } else {
                    contentToDisplay = prevNode.text + contentToDisplay;
                  }
                }

                // 如果内容还不够20个字符，尝试获取下一个节点的前15个字符
                if (
                  contentToDisplay.length < 20 &&
                  i < allTextNodes.length - 1
                ) {
                  const nextNode = allTextNodes[i + 1];
                  if (nextNode.text.length > 15) {
                    contentToDisplay =
                      contentToDisplay + nextNode.text.slice(0, 15);
                  } else {
                    contentToDisplay = contentToDisplay + nextNode.text;
                  }
                }
              }

              // 添加到搜索结果
              searchResults.push({
                documentId: typedDoc.documentId,
                documentName: typedDoc.documentName,
                content: contentToDisplay,
                matchedText: node.text,
                userId: typedDoc.userId,
                create_username: typedDoc.create_username,
                update_time: typedDoc.update_time,
                isPublic: typedDoc.isPublic || false,
              });

              break; // 每个文档只返回一个匹配结果
            }
          }
        } catch (err) {
          this.logger.warn(
            `解析文档JSON内容失败: documentId=${typedDoc.documentId}`,
            err,
          );
          continue;
        }
      }

      // 限制返回结果数量
      const limitedResults = searchResults.slice(0, 20);

      this.logger.log('文档内容搜索完成', {
        searchText,
        totalDocumentsProcessed: allDocuments.length,
        matchedDocuments: searchResults.length,
        returnedResults: limitedResults.length,
      });

      return {
        success: true,
        message: '搜索成功',
        data: limitedResults,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error('搜索文档失败', err.stack);
      throw new BadRequestException(`搜索文档失败: ${err.message}`);
    }
  }

  /**
   * 根据文档ID查询单个文档（不处理最近访问记录）
   * @param documentId 文档ID
   * @returns 文档实体
   */
  async findOneDocumentById(
    documentId: number,
  ): Promise<DocumentEntity | null> {
    try {
      this.logger.log('查询文档实体', { documentId });
      return await this.documentModel.findOne({ documentId }).exec();
    } catch (error) {
      const err = error as Error;
      this.logger.error('查询文档实体失败', err.stack);
      throw new BadRequestException(`查询文档实体失败: ${err.message}`);
    }
  }
}
