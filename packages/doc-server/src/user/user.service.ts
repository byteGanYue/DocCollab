import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './schemas/user.schema'; // 引入 Mongoose 模型

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: CreateUserDto) {
    try {
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      const user = await this.userModel.create({
        username: createUserDto.username,
        email: createUserDto.email,
        password: hashedPassword,
      });
      this.logger.log(`Created user: ${user.username}`);
      return user;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to create user: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  async findAll() {
    return this.userModel.find({}, { __v: 0 }).select({
      id: 1,
      username: 1,
      email: 1,
      createdAt: 1,
      updatedAt: 1,
    });
  }

  async findOne(id: string) {
    return this.userModel.findOne({ _id: id }, { __v: 0 }).select({
      id: 1,
      username: 1,
      email: 1,
      createdAt: 1,
      updatedAt: 1,
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      if (updateUserDto.password) {
        updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
      }
      const updatedUser = await this.userModel
        .findByIdAndUpdate(
          id,
          { $set: updateUserDto },
          { new: true, runValidators: true }, // 返回更新后的文档
        )
        .select({
          id: 1,
          username: 1,
          email: 1,
          createdAt: 1,
          updatedAt: 1,
        });
      if (!updatedUser) {
        throw new Error(`User with id ${id} not found`);
      }
      return updatedUser;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to update user: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  async remove(id: string) {
    const deletedUser = await this.userModel.findByIdAndDelete(id);
    if (!deletedUser) {
      throw new Error(`User with id ${id} not found`);
    }
    return deletedUser;
  }
}
