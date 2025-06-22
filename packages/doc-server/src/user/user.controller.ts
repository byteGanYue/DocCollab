import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('用户管理')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/register')
  @ApiOperation({ summary: '注册新用户' })
  @ApiResponse({ status: 200, description: '用户注册成功' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Post('/login')
  @ApiOperation({ summary: '用户登陆' })
  @ApiResponse({ status: 200, description: '用户登陆成功' })
  login(@Body() loginUserDto: LoginUserDto) {
    return this.userService.login(loginUserDto);
  }

  @Patch('/isPublic/:email')
  @ApiOperation({ summary: '修改用户公开状态' })
  @ApiResponse({ status: 200, description: '用户公开状态修改成功' })
  @ApiParam({ name: 'email', description: '用户邮箱' })
  isPublic(@Param('email') email: string) {
    return this.userService.isPublic(email);
  }

  @Get('/stats')
  @ApiOperation({ summary: '获取用户统计信息' })
  @ApiResponse({ status: 200, description: '返回用户统计信息' })
  getUserStats() {
    return this.userService.getUserStats();
  }

  @Get()
  @ApiOperation({ summary: '获取所有用户' })
  @ApiResponse({ status: 200, description: '返回所有用户列表' })
  findAll() {
    return this.userService.findAll();
  }

  @Get('/getUserInfoByUserId/:userId')
  @ApiOperation({ summary: '根据用户ID获取指定用户' })
  @ApiResponse({ status: 200, description: '返回指定用户信息' })
  @ApiParam({ name: 'userId', description: '自增的用户ID', type: 'number' })
  findOne(@Param('userId', ParseIntPipe) userId: number) {
    return this.userService.findOne(userId);
  }

  @Get('/mongoId/:id')
  @ApiOperation({ summary: '根据MongoDB ID获取指定用户（兼容旧接口）' })
  @ApiResponse({ status: 200, description: '返回指定用户信息' })
  @ApiParam({ name: 'id', description: 'MongoDB的_id' })
  findOneById(@Param('id') id: string) {
    return this.userService.findOneById(id);
  }

  @Patch('/userId/:userId')
  @ApiOperation({ summary: '根据用户ID更新用户信息' })
  @ApiResponse({ status: 200, description: '用户信息更新成功' })
  @ApiParam({ name: 'userId', description: '自增的用户ID', type: 'number' })
  update(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(userId, updateUserDto);
  }

  @Delete('/userId/:userId')
  @ApiOperation({ summary: '根据用户ID删除用户' })
  @ApiResponse({ status: 200, description: '用户删除成功' })
  @ApiParam({ name: 'userId', description: '自增的用户ID', type: 'number' })
  remove(@Param('userId', ParseIntPipe) userId: number) {
    return this.userService.remove(userId);
  }
}
