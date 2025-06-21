import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: { createdAt: 'create_time', updatedAt: 'update_time' } })
export class DocumentEntity extends Document {
  @Prop({ type: Number, required: true })
  userId: number; // 拥有者ID，使用number类型

  @Prop({ type: Number, required: true, unique: true })
  documentId: number; // 文档ID，从1开始自增，作为文档的唯一标识

  @Prop({ type: String, required: true })
  documentName: string; // 文档名称

  @Prop({ type: String, default: '' })
  content: string; // 文档内容

  @Prop({ type: String, required: true })
  create_username: string; // 创建者用户名

  @Prop({ type: String, default: '' })
  update_username: string; // 更新者用户名

  @Prop({
    type: [{ type: Number }],
    default: [],
  })
  editorId: number[]; // 正在协同编辑人的userid数组，使用number类型

  @Prop({
    type: [{ type: Number }],
    default: [],
  })
  parentFolderIds: number[]; // 父文件夹ID数组，使用number类型 [一级父级文件夹的id，二级父级文件夹的id，三级父级文件夹的id，依次类推]

  // 自动管理字段 (由 timestamps 选项生成)
  create_time: Date;
  update_time: Date;
}

export const DocumentSchema = SchemaFactory.createForClass(DocumentEntity);

// 创建索引以提高查询性能
DocumentSchema.index({ userId: 1 });
DocumentSchema.index({ documentId: 1 });
DocumentSchema.index({ parentFolderIds: 1 });
DocumentSchema.index({ documentName: 1 });
DocumentSchema.index({ editorId: 1 });
DocumentSchema.index({ create_time: -1 }); // 按创建时间倒序
