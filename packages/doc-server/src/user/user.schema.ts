import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// 用户文档类型
export type UserDocument = User & Document;

@Schema({
  timestamps: true, // 自动添加 createdAt 和 updatedAt 字段
  collection: 'users', // 指定集合名称
})
export class User {
  @Prop({
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50,
  })
  username: string;

  @Prop({
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // 邮箱格式验证
  })
  email: string;

  @Prop({
    required: true,
    minlength: 6,
  })
  password: string;

  @Prop({
    default: true,
  })
  isActive: boolean;

  @Prop({
    default: null,
  })
  avatarUrl?: string;

  @Prop({
    default: Date.now,
  })
  lastLoginAt?: Date;
}

// 创建 Schema
export const UserSchema = SchemaFactory.createForClass(User);

// 添加虚拟字段 id（将 _id 转换为 id）
UserSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// 确保虚拟字段被序列化
UserSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret._id;
    delete ret.__v;
    delete ret.password; // 序列化时移除密码字段
    return ret;
  },
});

// 添加索引
UserSchema.index({ username: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ createdAt: -1 });
