import { IsString, IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 创建最近访问记录的数据传输对象
 */
export class CreateRecentVisitDto {
  @ApiProperty({
    description: '用户ID',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @ApiProperty({
    description: '文档ID',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  documentId: number;

  @ApiProperty({
    description: '文档名称',
    example: '我的文档',
  })
  @IsString()
  @IsNotEmpty()
  documentName: string;

  @ApiProperty({
    description: '访问者ID',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  visitId: number;
}
