import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * 用户注册
   * @param username - 用户名
   * @param password - 密码
   * @returns Promise<User> - 返回创建的用户对象
   * @throws ConflictException - 当用户名已存在时抛出
   */
  async register(username: string, password: string): Promise<User> {
    // 检查用户名是否已存在
    const existingUser = await this.userRepository.findOne({
      where: { username },
    });
    if (existingUser) {
      throw new ConflictException('用户名已存在');
    }

    // 对密码进行加密
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    // 创建新用户
    const user = this.userRepository.create({
      username,
      password: hashedPassword,
    });

    // 保存用户信息
    return this.userRepository.save(user);
  }

  // 用户登录
  async login(username: string, password: string): Promise<User> {
    // 查找用户
    const user = await this.userRepository.findOne({ where: { username } });
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    return user;
  }
}
