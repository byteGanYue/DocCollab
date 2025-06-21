import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RecentVisitDocument = RecentVisit & Document;

/**
 * 最近访问文档记录模型
 * 记录用户最近访问的文档信息
 */
@Schema({ timestamps: true }) // 自动添加 createdAt 和 updatedAt 字段
export class RecentVisit {
  @Prop({ type: Number, required: true })
  userId: number; // 用户ID，与user表的userId关联 (number类型)

  @Prop({ type: Number, required: true })
  documentId: number; // 文档ID (number类型)

  @Prop({ required: true })
  documentName: string; // 文档名称

  @Prop({ required: true, default: new Date() })
  visitTime: Date; // 最近访问时间

  @Prop({ type: Number, required: true })
  visitId: number; // 最近访问人的ID (number类型)
}

export const RecentVisitSchema = SchemaFactory.createForClass(RecentVisit);

// 创建索引，提高查询性能
RecentVisitSchema.index({ userId: 1, visitTime: -1 });
RecentVisitSchema.index({ userId: 1, documentId: 1 }, { unique: true });
