import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: { createdAt: 'create_time', updatedAt: 'update_time' } })
export class Folder extends Document {
  @Prop({ type: Number, required: true })
  userId: number; // 用户ID，与用户模块的自增userId保持一致

  @Prop({ type: String, required: true })
  folderName: string; // 文件夹名称

  @Prop({ type: String, required: true })
  create_username: string; // 创建者用户名

  @Prop({ type: String, default: '' })
  update_username: string; // 更新者用户名

  @Prop({
    type: [{ type: String }],
    default: [],
  })
  parentFolderIds: string[]; // 父文件夹ID数组 [一级父级文件夹的id，二级父级文件夹的id，三级父级文件夹的id]

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'Document' }],
    default: [],
  })
  all_children_documentId: Types.ObjectId[]; // 所有子文档ID

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'Folder' }],
    default: [],
  })
  all_children_folderId: Types.ObjectId[]; // 所有子文件夹ID

  @Prop({ type: Number, required: true, default: 0 })
  depth: number; // 文件夹层级 (根文件夹为0，下一级文件夹为1，以此类推)

  // 自动管理字段 (由 timestamps 选项生成)
  create_time: Date;
  update_time: Date;
}

export const FolderSchema = SchemaFactory.createForClass(Folder);

// 创建索引以提高查询性能
FolderSchema.index({ userId: 1, depth: 1 });
FolderSchema.index({ parentFolderIds: 1 });
FolderSchema.index({ folderName: 1, userId: 1, parentFolderIds: 1 });
