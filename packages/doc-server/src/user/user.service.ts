import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './schemas/user.schema'; // 引入 Mongoose 模型
import { LoginUserDto } from './dto/login-user.dto';
import { CounterService } from './services/counter.service'; // 引入计数器服务

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly counterService: CounterService, // 注入计数器服务
  ) {}

  /**
   * 注册一个新用户
   *
   * @param createUserDto 用户信息对象，包含用户名、邮箱和密码
   * @returns 创建的用户对象
   * @throws 如果创建过程中发生错误，将抛出异常
   */
  async create(createUserDto: CreateUserDto) {
    try {
      // 获取下一个用户ID
      const userId = await this.counterService.getNextSequence('userId');

      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      const user = await this.userModel.create({
        userId, // 设置自增的用户ID
        username: createUserDto.username,
        email: createUserDto.email,
        password: hashedPassword,
        folderId: null, // 假设初始时没有文件夹ID
        isPublic: false, // 默认不公开
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      this.logger.log(`Created user: ${user.username} with userId: ${userId}`);
      return {
        code: 200,
        message: 'User created successfully',
        data: {
          userId: user.userId,
          username: user.username,
          email: user.email,
        },
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
      message: 'Login successful',
      data: {
        userId: user.userId, // 返回自增的用户ID
        username: user.username,
        email: user.email,
      },
    };
  }

  /**
   * 修改用户公开状态，同时更新该用户所有文档和文件夹的公开状态
   *
   * @param email 用户邮箱
   * @param isPublic 是否公开(true:公开,false:私有)
   * @returns 返回修改后的用户对象和更新统计信息
   */
  async isPublic(email: string, isPublic: boolean) {
    try {
      const user = await this.userModel.findOne({ email: email });

      if (!user) {
        throw new Error(`User with email ${email} not found`);
      }

      // 设置isPublic状态
      user.isPublic = isPublic;
      await user.save();

      this.logger.log(
        `用户 ${user.username} (ID: ${user.userId}) 的公开状态已设置为: ${isPublic}`,
      );

      // 同步更新该用户的所有文档的isPublic字段
      const documentModel = this.userModel.db.model('DocumentEntity');
      const docUpdateResult = await documentModel.updateMany(
        { userId: user.userId },
        { $set: { isPublic } },
      );

      this.logger.log(
        `已更新 ${docUpdateResult.modifiedCount} 个文档的公开状态`,
      );

      // 同步更新该用户的所有文件夹的isPublic字段
      const folderModel = this.userModel.db.model('Folder');
      const folderUpdateResult = await folderModel.updateMany(
        { userId: user.userId },
        { $set: { isPublic } },
      );

      this.logger.log(
        `已更新 ${folderUpdateResult.modifiedCount} 个文件夹的公开状态`,
      );

      return {
        code: 200,
        message: 'User public status updated successfully',
        success: true,
        data: {
          userId: user.userId,
          isPublic: user.isPublic,
          username: user.username,
          email: user.email,
          updatedDocuments: docUpdateResult.modifiedCount,
          updatedFolders: folderUpdateResult.modifiedCount,
        },
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`更新用户公开状态失败: ${err.message}`, err.stack);
      throw new Error(`Failed to update user public status: ${err.message}`);
    }
  }

  /**
   * 异步查询所有用户信息
   *
   * @returns 返回包含用户id、用户名、邮箱、创建时间和更新时间的对象数组
   */
  async findAll() {
    return this.userModel.find({}, { __v: 0 }).select({
      userId: 1, // 使用自增的用户ID
      username: 1,
      email: 1,
      isPublic: 1,
      createdAt: 1,
      updatedAt: 1,
    });
  }

  /**
   * 根据给定的用户ID查找单个用户信息
   *
   * @param userId 自增的用户ID
   * @returns 返回一个包含用户信息的Promise对象，如果未找到则返回null
   */
  async findOne(userId: number) {
    const user = await this.userModel.findOne({ userId }, { __v: 0 }).select({
      userId: 1,
      username: 1,
      email: 1,
      isPublic: 1,
      folderId: 1,
      createdAt: 1,
      updatedAt: 1,
    });

    if (!user) {
      throw new Error(`User with userId ${userId} not found`);
    }

    return {
      code: 200,
      message: 'User information retrieved successfully',
      success: true,
      data: user,
    };
  }

  /**
   * 根据MongoDB的_id查找用户信息（保留原方法以兼容现有代码）
   *
   * @param id MongoDB的_id
   * @returns 返回一个包含用户信息的Promise对象，如果未找到则返回null
   */
  async findOneById(id: string) {
    return this.userModel.findOne({ _id: id }, { __v: 0 }).select({
      userId: 1,
      username: 1,
      email: 1,
      isPublic: 1,
      folderId: 1,
      createdAt: 1,
      updatedAt: 1,
    });
  }

  async update(userId: number, updateUserDto: UpdateUserDto) {
    try {
      if (updateUserDto.password) {
        updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
      }
      const updatedUser = await this.userModel
        .findOneAndUpdate(
          { userId }, // 使用自增的用户ID查找
          { $set: updateUserDto },
          { new: true, runValidators: true }, // 返回更新后的文档
        )
        .select({
          userId: 1,
          username: 1,
          email: 1,
          isPublic: 1,
          folderId: 1,
          createdAt: 1,
          updatedAt: 1,
        });
      if (!updatedUser) {
        throw new Error(`User with userId ${userId} not found`);
      }
      return {
        code: 200,
        message: 'User updated successfully',
        data: updatedUser,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to update user: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  async remove(userId: number) {
    const deletedUser = await this.userModel.findOneAndDelete({ userId });
    if (!deletedUser) {
      throw new Error(`User with userId ${userId} not found`);
    }
    return {
      code: 200,
      message: 'User deleted successfully',
      data: {
        userId: deletedUser.userId,
        username: deletedUser.username,
      },
    };
  }

  /**
   * 根据用户ID获取用户统计信息
   *
   * @returns 用户总数和最新的用户ID
   */
  async getUserStats() {
    const totalUsers = await this.userModel.countDocuments();
    const currentUserId = await this.counterService.getCurrentValue('userId');

    return {
      code: 200,
      data: {
        totalUsers,
        currentUserId,
      },
    };
  }
}
