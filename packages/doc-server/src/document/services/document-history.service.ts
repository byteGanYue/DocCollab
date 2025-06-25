import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, DeleteResult } from 'mongoose';
import { DocumentHistoryEntity } from '../schemas/document-history.schema';

@Injectable()
export class DocumentHistoryService {
  private readonly logger = new Logger(DocumentHistoryService.name);

  constructor(
    @InjectModel(DocumentHistoryEntity.name)
    private documentHistoryModel: Model<DocumentHistoryEntity>,
  ) {}

  /**
   * 添加文档历史版本记录
   * @param documentData 文档数据
   * @returns 创建的历史记录
   */
  async addDocumentHistory(documentData: {
    userId: number;
    documentId: number;
    documentName: string;
    content: string;
    create_username: string;
    update_username?: string;
  }): Promise<DocumentHistoryEntity> {
    try {
      // 获取下一个版本号
      const nextVersionId = await this.getNextVersionId(
        documentData.userId,
        documentData.documentId,
      );

      // 创建历史记录
      const historyRecord = new this.documentHistoryModel({
        userId: documentData.userId,
        documentId: documentData.documentId,
        documentName: documentData.documentName,
        content: documentData.content,
        create_username: documentData.create_username,
        update_username: documentData.update_username || '',
        versionId: nextVersionId,
      });

      const savedRecord = await historyRecord.save();
      this.logger.log(
        `添加文档历史版本记录成功: userId=${documentData.userId}, documentId=${documentData.documentId}, versionId=${nextVersionId}`,
      );

      return savedRecord;
    } catch (error: unknown) {
      this.logger.error('添加文档历史版本记录失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      throw new Error(`添加文档历史版本记录失败: ${errorMessage}`);
    }
  }

  /**
   * 获取下一个版本号
   * @param userId 用户ID
   * @param documentId 文档ID
   * @returns 下一个版本号
   */
  private async getNextVersionId(
    userId: number,
    documentId: number,
  ): Promise<number> {
    try {
      // 查找该用户该文档的最新版本
      const latestVersion = await this.documentHistoryModel
        .findOne({ userId, documentId })
        .sort({ versionId: -1 })
        .select('versionId')
        .exec();

      // 如果没有历史记录，从1开始
      if (!latestVersion) {
        return 1;
      }

      // 否则在最新版本基础上加1
      return latestVersion.versionId + 1;
    } catch (error: unknown) {
      this.logger.error('获取下一个版本号失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      throw new Error(`获取下一个版本号失败: ${errorMessage}`);
    }
  }

  /**
   * 获取文档的所有历史版本
   * @param documentId 文档ID
   * @param page 页码
   * @param limit 每页数量
   * @returns 历史版本列表
   */
  async getDocumentHistory(
    documentId: number,
    page: number = 1,
    limit: number = 20,
  ) {
    try {
      const skip = (page - 1) * limit;

      // 查询历史版本列表，按版本号倒序
      const [versions, total] = await Promise.all([
        this.documentHistoryModel
          .find({ documentId })
          .sort({ versionId: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.documentHistoryModel.countDocuments({ documentId }),
      ]);

      this.logger.log(
        `获取文档历史版本成功: documentId=${documentId}, total=${total}`,
      );

      return {
        versions,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error: unknown) {
      this.logger.error('获取文档历史版本失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      throw new Error(`获取文档历史版本失败: ${errorMessage}`);
    }
  }

  /**
   * 获取特定版本的文档内容
   * @param documentId 文档ID
   * @param versionId 版本号
   * @returns 特定版本的文档内容
   */
  async getDocumentVersion(
    documentId: number,
    versionId: number,
  ): Promise<DocumentHistoryEntity | null> {
    try {
      const version = await this.documentHistoryModel
        .findOne({ documentId, versionId })
        .exec();

      if (version) {
        this.logger.log(
          `获取特定版本文档成功: documentId=${documentId}, versionId=${versionId}`,
        );
      }

      return version;
    } catch (error: unknown) {
      this.logger.error('获取特定版本文档失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      throw new Error(`获取特定版本文档失败: ${errorMessage}`);
    }
  }

  /**
   * 删除文档的所有历史版本（用于文档删除时的清理）
   * @param documentId 文档ID
   * @returns 删除结果
   */
  async deleteDocumentHistory(documentId: number): Promise<DeleteResult> {
    try {
      const result = await this.documentHistoryModel
        .deleteMany({ documentId })
        .exec();

      this.logger.log(
        `删除文档历史版本成功: documentId=${documentId}, deletedCount=${result.deletedCount}`,
      );

      return result;
    } catch (error: unknown) {
      this.logger.error('删除文档历史版本失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      throw new Error(`删除文档历史版本失败: ${errorMessage}`);
    }
  }

  /**
   * 获取文档的最新版本号
   * @param userId 用户ID
   * @param documentId 文档ID
   * @returns 最新版本号，如果没有历史记录则返回0
   */
  async getLatestVersionId(
    userId: number,
    documentId: number,
  ): Promise<number> {
    try {
      const latestVersion = await this.documentHistoryModel
        .findOne({ userId, documentId })
        .sort({ versionId: -1 })
        .select('versionId')
        .exec();

      return latestVersion ? latestVersion.versionId : 0;
    } catch (error: unknown) {
      this.logger.error('获取最新版本号失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      throw new Error(`获取最新版本号失败: ${errorMessage}`);
    }
  }
}
