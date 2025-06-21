import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 创建最近访问记录的数据传输对象
 */
export class CreateRecentVisitDto {
  @ApiProperty({
    description: '用户ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: '文档ID',
    example: '507f1f77bcf86cd799439012',
  })
  @IsString()
  @IsNotEmpty()
  documentId: string;

  @ApiProperty({
    description: '文档名称',
    example: '我的文档',
  })
  @IsString()
  @IsNotEmpty()
  documentName: string;

  @ApiProperty({
    description: '访问者ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsNotEmpty()
  visitId: string;
}
