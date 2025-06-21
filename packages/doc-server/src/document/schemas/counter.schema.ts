import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Counter extends Document {
  @Prop({ type: String, required: true, unique: true })
  name: string; // 计数器名称，如 'documentId'

  @Prop({ type: Number, required: true, default: 0 })
  value: number; // 当前计数值
}

export const CounterSchema = SchemaFactory.createForClass(Counter);
