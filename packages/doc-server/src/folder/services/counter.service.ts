import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Counter, CounterDocument } from '../schemas/counter.schema';

/**
 * 文件夹计数器服务
 * 用于管理文件夹ID的自增生成
 */
@Injectable()
export class CounterService {
  constructor(
    @InjectModel(Counter.name) private counterModel: Model<CounterDocument>,
  ) {}

  /**
   * 获取下一个自增的文件夹ID
   * @param counterName 计数器名称
   * @returns 下一个自增的文件夹ID
   */
  async getNextSequence(counterName: string): Promise<number> {
    const result = await this.counterModel.findOneAndUpdate(
      { name: counterName },
      { $inc: { value: 1 } },
      { new: true, upsert: true },
    );

    // 如果是第一次创建，从1开始
    if (result.value === 1) {
      return 1;
    }

    return result.value;
  }

  /**
   * 重置计数器
   * @param counterName 计数器名称
   * @param value 重置的值，默认为0
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
