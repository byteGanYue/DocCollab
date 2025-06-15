import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { User } from './user.schema';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * 用户注册
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true }))
  async register(@Body() createUserDto: CreateUserDto): Promise<{
    success: boolean;
    message: string;
    data: User;
  }> {
    const user = await this.userService.register(createUserDto);
    return {
      success: true,
      message: '用户注册成功',
      data: user,
    };
  }

  /**
   * 用户登录
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async login(@Body() loginUserDto: LoginUserDto): Promise<{
    success: boolean;
    message: string;
    data: User;
  }> {
    const user = await this.userService.login(loginUserDto);
    return {
      success: true,
      message: '登录成功',
      data: user,
    };
  }

  /**
   * 获取用户列表（分页）
   */
  @Get()
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      users: User[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const { users, total } = await this.userService.findAll(pageNum, limitNum);

    return {
      success: true,
      message: '获取用户列表成功',
      data: {
        users,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  /**
   * 根据ID获取用户
   */
  @Get(':id')
  async findById(@Param('id') id: string): Promise<{
    success: boolean;
    message: string;
    data: User;
  }> {
    const user = await this.userService.findById(id);
    return {
      success: true,
      message: '获取用户信息成功',
      data: user,
    };
  }

  /**
   * 更新用户信息
   */
  @Put(':id')
  @UsePipes(
    new ValidationPipe({ transform: true, skipMissingProperties: true }),
  )
  async updateUser(
    @Param('id') id: string,
    @Body() updateData: Partial<CreateUserDto>,
  ): Promise<{
    success: boolean;
    message: string;
    data: User;
  }> {
    const user = await this.userService.updateUser(id, updateData);
    return {
      success: true,
      message: '用户信息更新成功',
      data: user,
    };
  }

  /**
   * 删除用户
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id') id: string): Promise<void> {
    await this.userService.deleteUser(id);
  }

  /**
   * 根据用户名查找用户
   */
  @Get('username/:username')
  async findByUsername(@Param('username') username: string): Promise<{
    success: boolean;
    message: string;
    data: User | null;
  }> {
    const user = await this.userService.findByUsername(username);
    return {
      success: true,
      message: user ? '用户找到' : '用户不存在',
      data: user,
    };
  }
}
