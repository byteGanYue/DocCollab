import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './schemas/user.schema'; // 引入 Mongoose 模型
import { LoginUserDto } from './dto/login-user.dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  /**
   * 注册一个新用户
   *
   * @param createUserDto 用户信息对象，包含用户名、邮箱和密码
   * @returns 创建的用户对象
   * @throws 如果创建过程中发生错误，将抛出异常
   */
  async create(createUserDto: CreateUserDto) {
    try {
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      const user = await this.userModel.create({
        username: createUserDto.username,
        email: createUserDto.email,
        password: hashedPassword,
        folderId: null, // 假设初始时没有文件夹ID
        isPublic: false, // 默认不公开
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      this.logger.log(`Created user: ${user.username}`);
      return {
        code: 200,
        message: 'User created successfully',
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to create user: ${errorMessage}`, errorStack);
      throw error;
      return {
        code: 500,
        message: 'Failed to create user',
        error: errorMessage,
      };
    }
  }

  /**
   * 登录功能
   *
   * @param loginUserDto 登录用户数据传输对象
   * @returns 登录结果，包含状态码、用户名和登录成功信息
   * @throws 如果用户不存在或密码错误，则抛出错误
   */
  async login(loginUserDto: LoginUserDto) {
    const user = await this.userModel.findOne({ email: loginUserDto.email });
    if (!user) {
      throw new Error('User not found');
    }
    const isPasswordValid = await bcrypt.compare(
      loginUserDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }
    return {
      code: 200,
      username: user.username,
      message: 'Login successful',
    };
  }

  /**
   * 修改用户公开状态
   *
   * @param id 用户ID

   * @returns 返回修改后的用户对象
   */
  async isPublic(email: string) {
    const user = await this.userModel.findOne({ email: email });

    if (!user) {
      throw new Error(`User with email ${email} not found`);
    }
    user.isPublic = !user.isPublic;

    await user.save();
    return {
      code: 200,
      message: 'User public status updated successfully',
    };
  }

  /**
   * 异步查询所有用户信息
   *
   * @returns 返回包含用户id、用户名、邮箱、创建时间和更新时间的对象数组
   */
  async findAll() {
    return this.userModel.find({}, { __v: 0 }).select({
      id: 1,
      username: 1,
      email: 1,
      createdAt: 1,
      updatedAt: 1,
    });
  }

  /**
   * 根据给定的ID查找单个用户信息
   *
   * @param id 用户ID
   * @returns 返回一个包含用户信息的Promise对象，如果未找到则返回null
   */
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
