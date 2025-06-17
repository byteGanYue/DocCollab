import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User, UserSchema } from './schemas/user.schema'; // 引入 Mongoose 模型

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]), // 注册 Mongoose 模型
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [MongooseModule], // 如果其他模块需要使用 UserModel，可以导出 MongooseModule
})
export class UserModule {}
