import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, MinLength, IsBoolean } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ description: '用户名', example: 'john_doe' })
  @IsString()
  @MinLength(2)
  username: string;

  @ApiProperty({ description: '电子邮箱', example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: '密码', example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;
}
