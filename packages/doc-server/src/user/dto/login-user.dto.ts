import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, MinLength } from 'class-validator';
export class LoginUserDto {
  @ApiProperty({ description: '电子邮箱', example: 'test@test.com' })
  @IsEmail()
  email?: string;

  @ApiProperty({ description: '密码', example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;
}
