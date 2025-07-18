import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true }) // 自动添加 createdAt 和 updatedAt 字段
export class User {
  @Prop({ required: true, unique: true })
  userId: number; // 自增的用户ID，从1开始

  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: null })
  folderId: string; // 文件夹ID，假设是字符串类型

  @Prop({ default: false })
  isPublic: boolean; // 是否公开文件夹信息
}

export const UserSchema = SchemaFactory.createForClass(User);
