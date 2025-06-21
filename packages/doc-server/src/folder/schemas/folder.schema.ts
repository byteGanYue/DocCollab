import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: { createdAt: 'create_time', updatedAt: 'update_time' } })
export class Folder extends Document {
  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  userId: Types.ObjectId; // 拥有者ID

  @Prop({ type: String, required: true })
  folderName: string;

  @Prop({ type: String, required: true })
  create_username: string; // 创建者用户名

  @Prop({ type: String, default: '' })
  update_username: string; // 更新者用户名

  @Prop({ type: String, default: 'null' })
  parentFolderId: string; // 父文件夹ID (null 表示根目录)

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
  depth: number; // 文件夹层级

  // 自动管理字段 (由 timestamps 选项生成)
  create_time: Date;
  update_time: Date;
}

export const FolderSchema = SchemaFactory.createForClass(Folder);
