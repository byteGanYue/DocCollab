import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RecentVisitDocument = RecentVisit & Document;

/**
 * 最近访问文档记录模型
 * 记录用户最近访问的文档信息
 */
@Schema() // 移除 timestamps: true，不自动添加 createdAt 和 updatedAt 字段
export class RecentVisit {
  @Prop({ type: Number, required: true })
  userId: number; // 用户ID，与user表的userId关联 (number类型)

  @Prop({ type: Number, required: true })
  documentId: number; // 文档ID (number类型)

  @Prop({ required: true })
  documentName: string; // 文档名称

  @Prop({ required: true })
  documentUser: string; // 文档创建人用户名，对应document表的create_username

  @Prop({ required: true, default: () => new Date() })
  visitTime: Date; // 最近访问时间，每次操作时更新为当前时间

  @Prop({ type: Number, required: true })
  visitId: number; // 最近访问人的ID (number类型)
}

export const RecentVisitSchema = SchemaFactory.createForClass(RecentVisit);

// 创建索引，提高查询性能
RecentVisitSchema.index({ visitId: 1, visitTime: -1 }); // 按访问者ID和访问时间查询
RecentVisitSchema.index({ visitId: 1, documentId: 1 }, { unique: true }); // 访问者+文档的唯一约束

// 添加pre中间件，在每次保存前更新visitTime
RecentVisitSchema.pre('save', function (next) {
  this.visitTime = new Date();
  next();
});

// 添加pre中间件，在每次更新前设置visitTime
RecentVisitSchema.pre(['updateOne', 'findOneAndUpdate'], function (next) {
  this.set({ visitTime: new Date() });
  next();
});
