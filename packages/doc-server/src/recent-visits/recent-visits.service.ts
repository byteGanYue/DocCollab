import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateRecentVisitDto } from './dto/create-recent-visit.dto';
import { UpdateRecentVisitDto } from './dto/update-recent-visit.dto';
import {
  RecentVisit,
  RecentVisitDocument,
} from './schemas/recent-visit.schema';

@Injectable()
export class RecentVisitsService {
  private readonly logger = new Logger(RecentVisitsService.name);

  constructor(
    @InjectModel(RecentVisit.name)
    private recentVisitModel: Model<RecentVisitDocument>,
  ) {}

  /**
   * 创建最近访问记录
   * 如果用户已经访问过该文档，则更新访问时间
   * @param createRecentVisitDto 创建访问记录的DTO
   * @returns 创建的访问记录或更新结果
   */
  async create(createRecentVisitDto: CreateRecentVisitDto) {
    try {
      const { userId, documentId } = createRecentVisitDto;

      // 检查是否已存在该用户对该文档的访问记录
      const existingVisit = await this.recentVisitModel.findOne({
        userId,
        documentId,
      });

      if (existingVisit) {
        // 如果存在，更新访问时间
        existingVisit.visitTime = new Date();
        existingVisit.documentName = createRecentVisitDto.documentName;
        existingVisit.visitId = createRecentVisitDto.visitId;
        await existingVisit.save();

        this.logger.log(
          `Updated visit time for user ${userId} and document ${documentId}`,
        );
        return {
          code: 200,
          message: '访问记录更新成功',
          data: existingVisit,
        };
      } else {
        // 如果不存在，创建新记录
        const newVisit = await this.recentVisitModel.create({
          ...createRecentVisitDto,
          visitTime: new Date(),
        });

        this.logger.log(
          `Created new visit record for user ${userId} and document ${documentId}`,
        );
        return {
          code: 200,
          message: '访问记录创建成功',
          data: newVisit,
        };
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to create/update visit record: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }

  /**
   * 根据用户ID获取最近访问记录（分页）
   * 使用visitId字段进行匹配
   * @param userId 用户ID（用于匹配visitId字段）
   * @param page 页码（从1开始），默认第1页
   * @param pageSize 每页记录数，默认10条
   * @returns 最近访问记录列表（分页）
   */
  async findByUserId(userId: string, page: number = 1, pageSize: number = 10) {
    try {
      // 参数验证和默认值设置
      const currentPage = Math.max(1, page || 1);
      const size = Math.max(1, Math.min(100, pageSize || 10)); // 限制每页最多100条
      const skip = (currentPage - 1) * size;

      // 获取总记录数
      const total = await this.recentVisitModel.countDocuments({
        visitId: userId,
      });

      // 获取分页数据
      const visits = await this.recentVisitModel
        .find({ visitId: userId }) // 使用visitId字段进行匹配
        .sort({ visitTime: -1 }) // 按访问时间倒序排列
        .skip(skip)
        .limit(size)
        .select({
          _id: 1,
          userId: 1,
          documentId: 1,
          documentName: 1,
          visitTime: 1,
          visitId: 1,
          createdAt: 1,
          updatedAt: 1,
        });

      // 计算总页数
      const totalPages = Math.ceil(total / size);

      this.logger.log(
        `Found ${visits.length} visits for visitId ${userId} (page ${currentPage}/${totalPages})`,
      );

      return {
        code: 200,
        message: '获取最近访问记录成功',
        data: {
          list: visits,
          pagination: {
            total,
            page: currentPage,
            pageSize: size,
            totalPages,
            hasNext: currentPage < totalPages,
            hasPrev: currentPage > 1,
          },
        },
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to find visits for visitId ${userId}: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }

  /**
   * 获取所有最近访问记录
   * @returns 所有访问记录
   */
  async findAll() {
    try {
      const visits = await this.recentVisitModel
        .find({})
        .sort({ visitTime: -1 })
        .select({
          _id: 1,
          userId: 1,
          documentId: 1,
          documentName: 1,
          visitTime: 1,
          visitId: 1,
          createdAt: 1,
          updatedAt: 1,
        });

      return {
        code: 200,
        message: '获取所有访问记录成功',
        data: visits,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to find all visits: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }

  /**
   * 根据ID获取单个访问记录
   * @param id 访问记录ID
   * @returns 访问记录
   */
  async findOne(id: string) {
    try {
      const visit = await this.recentVisitModel.findById(id);
      if (!visit) {
        return {
          code: 404,
          message: '访问记录不存在',
        };
      }

      return {
        code: 200,
        message: '获取访问记录成功',
        data: visit,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to find visit ${id}: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }

  /**
   * 更新访问记录
   * @param id 访问记录ID
   * @param updateRecentVisitDto 更新数据
   * @returns 更新结果
   */
  async update(id: string, updateRecentVisitDto: UpdateRecentVisitDto) {
    try {
      const updatedVisit = await this.recentVisitModel.findByIdAndUpdate(
        id,
        { $set: updateRecentVisitDto },
        { new: true, runValidators: true },
      );

      if (!updatedVisit) {
        return {
          code: 404,
          message: '访问记录不存在',
        };
      }

      this.logger.log(`Updated visit record ${id}`);
      return {
        code: 200,
        message: '访问记录更新成功',
        data: updatedVisit,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to update visit ${id}: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }

  /**
   * 删除访问记录
   * @param id 访问记录ID
   * @returns 删除结果
   */
  async remove(id: string) {
    try {
      const deletedVisit = await this.recentVisitModel.findByIdAndDelete(id);
      if (!deletedVisit) {
        return {
          code: 404,
          message: '访问记录不存在',
        };
      }

      this.logger.log(`Deleted visit record ${id}`);
      return {
        code: 200,
        message: '访问记录删除成功',
        data: deletedVisit,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to delete visit ${id}: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }

  /**
   * 清空用户的所有访问记录
   * 使用visitId字段进行匹配
   * @param userId 用户ID（用于匹配visitId字段）
   * @returns 删除结果
   */
  async clearUserVisits(userId: string) {
    try {
      const result = await this.recentVisitModel.deleteMany({
        visitId: userId,
      });

      this.logger.log(
        `Cleared ${result.deletedCount} visits for user ${userId}`,
      );
      return {
        code: 200,
        message: `清空用户访问记录成功，共删除${result.deletedCount}条记录`,
        data: { deletedCount: result.deletedCount },
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to clear visits for user ${userId}: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }
}
