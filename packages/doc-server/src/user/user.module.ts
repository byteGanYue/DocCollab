import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User, UserSchema } from './schemas/user.schema'; // 引入 Mongoose 模型
import { Counter, CounterSchema } from './schemas/counter.schema'; // 引入计数器模型
import { CounterService } from './services/counter.service'; // 引入计数器服务

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema }, // 注册用户模型
      { name: Counter.name, schema: CounterSchema }, // 注册计数器模型
    ]),
  ],
  controllers: [UserController],
  providers: [UserService, CounterService], // 添加计数器服务
  exports: [MongooseModule, CounterService], // 导出计数器服务供其他模块使用
})
export class UserModule {}
