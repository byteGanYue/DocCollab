import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CounterDocument = Counter & Document;

/**
 * 计数器Schema，用于管理自增ID
 * 支持多种类型的计数器（用户ID、文档ID等）
 */
@Schema({ timestamps: true })
export class Counter {
  @Prop({ required: true, unique: true })
  name: string; // 计数器名称，如：'userId'

  @Prop({ required: true, default: 0 })
  value: number; // 当前计数值
}

export const CounterSchema = SchemaFactory.createForClass(Counter);
