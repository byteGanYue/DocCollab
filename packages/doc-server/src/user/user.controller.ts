import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { UserService } from './user.service';

// 注册请求DTO
export class RegisterDto {
  username: string;
  password: string;
}

// 登录请求DTO
export class LoginDto {
  username: string;
  password: string;
}

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    const user = await this.userService.register(
      registerDto.username,
      registerDto.password,
    );
    // 返回用户信息（不包含密码）
    const { ...result } = user;
    console.log(result);
    return result;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    const user = await this.userService.login(
      loginDto.username,
      loginDto.password,
    );
    // 返回用户信息（不包含密码）
    const { ...result } = user;
    return result;
  }
}
