import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: { createdAt: 'create_time', updatedAt: 'update_time' } })
export class DocumentHistoryEntity extends Document {
  @Prop({ type: Number, required: true })
  userId: number; // 拥有者的userId

  @Prop({ type: Number, required: true })
  documentId: number; // 文档ID (外键，引用documents表)

  @Prop({ type: String, required: true })
  documentName: string; // 文档名称

  @Prop({ type: String, default: '' })
  content: string; // 内容

  @Prop({ type: String, required: true })
  create_username: string; // 创建者用户名

  @Prop({ type: String, default: '' })
  update_username: string; // 更新者用户名

  @Prop({ type: Number, required: true })
  versionId: number; // 版本号，根据相同userId和documentId从1开始依次递增

  @Prop({ type: [Number], default: [] })
  yjsState: number[];

  // 自动管理字段 (由 timestamps 选项生成)
  create_time: Date;
  update_time: Date;
}

export const DocumentHistorySchema = SchemaFactory.createForClass(
  DocumentHistoryEntity,
);

// 创建索引以提高查询性能
DocumentHistorySchema.index({ userId: 1 });
DocumentHistorySchema.index({ documentId: 1 });
DocumentHistorySchema.index({ userId: 1, documentId: 1 }); // 复合索引，用于版本号计算
DocumentHistorySchema.index({ versionId: 1 });
DocumentHistorySchema.index({ create_time: -1 }); // 按创建时间倒序
DocumentHistorySchema.index({ userId: 1, documentId: 1, versionId: -1 }); // 复合索引，用于获取最新版本
