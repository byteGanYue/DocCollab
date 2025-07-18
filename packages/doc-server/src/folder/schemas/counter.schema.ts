import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CounterDocument = Counter & Document;

/**
 * 计数器Schema，用于管理文件夹ID的自增
 * 支持多种类型的计数器（文件夹ID、文档ID等）
 */
@Schema({ timestamps: true })
export class Counter {
  @Prop({ required: true, unique: true })
  name: string; // 计数器名称，如：'folderId'

  @Prop({ required: true, default: 0 })
  value: number; // 当前计数值
}

export const CounterSchema = SchemaFactory.createForClass(Counter);
