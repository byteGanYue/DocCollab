import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, DeleteResult } from 'mongoose';
import { DocumentHistoryEntity } from '../schemas/document-history.schema';
import { Cron } from '@nestjs/schedule';
import * as fs from 'fs';

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
    yjsState?: number[];
  }): Promise<DocumentHistoryEntity> {
    try {
      // 校验content不能为空
      if (!documentData.content) {
        throw new Error('content字段不能为空，必须传递当前文档内容');
      }
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
        create_time: new Date(),
        update_time: new Date(),
        yjsState: documentData.yjsState,
      });

      const savedRecord = await historyRecord.save();
      this.logger.log(
        `保存历史版本成功: documentId=${documentData.documentId}, versionId=${savedRecord.versionId}`,
      );

      return savedRecord;
    } catch (error: unknown) {
      this.logger.error('保存历史版本失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      throw new Error(`保存历史版本失败: ${errorMessage}`);
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

  /**
   * 删除指定版本之后的所有版本记录
   * @param documentId 文档ID
   * @param versionId 目标版本号（该版本将保留）
   * @returns 删除结果
   */
  async deleteVersionsAfter(
    documentId: number,
    versionId: number,
  ): Promise<DeleteResult> {
    try {
      // 删除所有大于指定版本号的记录
      const result = await this.documentHistoryModel
        .deleteMany({
          documentId,
          versionId: { $gt: versionId },
        })
        .exec();

      this.logger.log(
        `删除指定版本后的历史记录成功: documentId=${documentId}, afterVersion=${versionId}, deletedCount=${result.deletedCount}`,
      );

      return result;
    } catch (error: unknown) {
      this.logger.error('删除指定版本后的历史记录失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      throw new Error(`删除指定版本后的历史记录失败: ${errorMessage}`);
    }
  }

  /**
   * 更新指定版本的时间戳为当前时间
   * @param documentId 文档ID
   * @param versionId 版本号
   * @returns 更新结果
   */
  async updateVersionTimestamp(
    documentId: number,
    versionId: number,
  ): Promise<DocumentHistoryEntity | null> {
    try {
      // 更新指定版本的update_time为当前时间
      const updatedVersion = await this.documentHistoryModel
        .findOneAndUpdate(
          { documentId, versionId },
          // 使用$currentDate更新字段为当前时间
          { $currentDate: { update_time: true } },
          { new: true }, // 返回更新后的文档
        )
        .exec();

      if (updatedVersion) {
        this.logger.log(
          `更新版本时间戳成功: documentId=${documentId}, versionId=${versionId}, newTimestamp=${updatedVersion.update_time.toISOString()}`,
        );
      } else {
        this.logger.warn(
          `未找到要更新时间戳的版本: documentId=${documentId}, versionId=${versionId}`,
        );
      }

      return updatedVersion;
    } catch (error: unknown) {
      this.logger.error('更新版本时间戳失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      throw new Error(`更新版本时间戳失败: ${errorMessage}`);
    }
  }

  /**
   * 定期归档30天前的历史快照（每天凌晨3点）
   * 每个文档单独一个归档文件
   */
  @Cron('0 3 * * *') // 每天凌晨3点
  async archiveOldSnapshots() {
    const THIRTY_DAYS_AGO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    // 查询所有30天前的历史快照
    const oldSnapshots = await this.documentHistoryModel.find({
      create_time: { $lt: THIRTY_DAYS_AGO },
    });
    if (oldSnapshots.length > 0) {
      // 按文档ID分组
      const docMap = new Map<number, DocumentHistoryEntity[]>();
      for (const snap of oldSnapshots) {
        const docId = snap.documentId;
        if (!docMap.has(docId)) docMap.set(docId, []);
        (docMap.get(docId) as DocumentHistoryEntity[]).push(snap);
      }
      // 1. 导出到本地文件（每个文档一个文件）
      const archiveDir = './archive';
      if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir);
      for (const [docId, versions] of docMap.entries()) {
        const filePath = `${archiveDir}/document-history-${docId}.json`;
        const fileData: {
          versions: DocumentHistoryEntity[];
        } = { versions };
        // 如果已存在，合并历史
        if (fs.existsSync(filePath)) {
          try {
            const old = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as {
              versions: DocumentHistoryEntity[];
            };
            if (Array.isArray(old.versions)) {
              fileData.versions = [...old.versions, ...versions];
            }
          } catch {
            /* ignore parse error */
          }
        }
        fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2));
      }
      // 2. 删除主表中的老快照
      const ids = oldSnapshots.map(({ _id }) => _id);
      await this.documentHistoryModel.deleteMany({ _id: { $in: ids } });
      this.logger.log(
        `归档并删除了${ids.length}条历史快照，涉及文档数：${docMap.size}`,
      );
    }
  }

  /**
   * 恢复归档的历史版本到数据库
   * @param documentId 文档ID
   * @returns 恢复后的历史版本列表
   */
  async restoreArchivedHistory(documentId: number) {
    const archiveDir = './archive';
    const filePath = `${archiveDir}/document-history-${documentId}.json`;
    if (!fs.existsSync(filePath)) {
      throw new Error('未找到归档文件');
    }
    // 读取归档内容
    let versions: DocumentHistoryEntity[] = [];
    try {
      const fileData: { versions: DocumentHistoryEntity[] } = JSON.parse(
        fs.readFileSync(filePath, 'utf-8'),
      );
      if (Array.isArray(fileData.versions)) {
        versions = fileData.versions;
      }
    } catch {
      throw new Error('归档文件解析失败');
    }
    if (!versions.length) {
      throw new Error('归档文件无历史版本');
    }
    // 过滤已存在的_id，避免重复插入
    const ids = versions.map((v) => v._id);
    const exists = await this.documentHistoryModel
      .find({ _id: { $in: ids } })
      .select('_id')
      .lean();
    const existIds = new Set(
      exists.map((v) =>
        typeof v._id === 'object' &&
        v._id &&
        typeof v._id.toString === 'function'
          ? v._id.toString()
          : String(v._id),
      ),
    );
    const toInsert = versions.filter((v) =>
      typeof v._id === 'object' && v._id && typeof v._id.toString === 'function'
        ? !existIds.has(v._id.toString())
        : !existIds.has(String(v._id)),
    );
    if (toInsert.length > 0) {
      await this.documentHistoryModel.insertMany(toInsert);
    }
    // 返回最新历史版本列表
    return this.getDocumentHistory(documentId, 1, 20);
  }
}
