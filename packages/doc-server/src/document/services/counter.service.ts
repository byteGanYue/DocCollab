import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Counter } from '../schemas/counter.schema';

@Injectable()
export class CounterService {
  constructor(
    @InjectModel(Counter.name) private counterModel: Model<Counter>,
  ) {}

  /**
   * 获取下一个序列号
   * @param counterName 计数器名称
   * @returns 下一个序列号
   */
  async getNextSequence(counterName: string): Promise<number> {
    const counter = await this.counterModel.findOneAndUpdate(
      { name: counterName },
      { $inc: { value: 1 } },
      {
        new: true,
        upsert: true, // 如果不存在则创建
        setDefaultsOnInsert: true,
      },
    );

    return counter.value;
  }

  /**
   * 重置计数器
   * @param counterName 计数器名称
   * @param value 重置值，默认为0
   */
  async resetCounter(counterName: string, value: number = 0): Promise<void> {
    await this.counterModel.findOneAndUpdate(
      { name: counterName },
      { value },
      { upsert: true },
    );
  }

  /**
   * 获取当前计数器值
   * @param counterName 计数器名称
   * @returns 当前计数器值
   */
  async getCurrentValue(counterName: string): Promise<number> {
    const counter = await this.counterModel.findOne({ name: counterName });
    return counter ? counter.value : 0;
  }
}
