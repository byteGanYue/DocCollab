import {
  IsString,
  IsOptional,
  IsArray,
  IsNotEmpty,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateDocumentDto {
  @ApiProperty({
    description: '用户ID',
    example: 1,
    type: 'number',
  })
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @ApiProperty({
    description: '文档名称',
    example: '我的新文档',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  documentName: string;

  @ApiPropertyOptional({
    description: '文档内容，可选',
    example: '这是文档的初始内容',
    type: 'string',
  })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({
    description: '创建者用户名',
    example: 'user123',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  create_username: string;

  @ApiPropertyOptional({
    description:
      '父文件夹ID数组，可选。格式：[一级父级文件夹ID, 二级父级文件夹ID, ...]',
    example: [1, 2, 3],
    type: [Number],
    isArray: true,
  })
  @IsArray()
  @IsOptional()
  @Type(() => Number)
  parentFolderIds?: number[];
}

export class CreateDocumentResponseDto {
  @ApiProperty({
    description: '操作是否成功',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: '响应消息',
    example: '文档创建成功',
  })
  message: string;

  @ApiProperty({
    description: '文档数据',
    example: {
      _id: '507f1f77bcf86cd799439011',
      documentId: 1,
      documentName: '我的新文档',
      userId: 1,
      content: '这是文档的初始内容',
      create_username: 'user123',
      update_username: 'user123',
      editorId: [],
      parentFolderIds: [1, 2, 3],
      create_time: '2024-01-01T00:00:00.000Z',
      update_time: '2024-01-01T00:00:00.000Z',
    },
  })
  data: {
    _id: string;
    documentId: number;
    documentName: string;
    userId: number;
    content: string;
    create_username: string;
    update_username: string;
    editorId: number[];
    parentFolderIds: number[];
    create_time: Date;
    update_time: Date;
  };
}

export class QueryDocumentDto {
  @ApiProperty({
    description: '用户ID，必填参数',
    example: 1,
    type: 'number',
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @ApiPropertyOptional({
    description: '父文件夹ID过滤',
    example: 2,
    type: 'number',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  parentFolderId?: number;

  @ApiPropertyOptional({
    description: '搜索关键词，支持搜索文档名称和内容',
    example: '会议纪要',
    type: 'string',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: '页码，默认为1',
    example: 1,
    type: 'number',
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'page must be a number' })
  page?: number;

  @ApiPropertyOptional({
    description: '每页大小，默认为10',
    example: 10,
    type: 'number',
    minimum: 1,
    maximum: 1000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'pageSize must be a number' })
  pageSize?: number;
}

// 用于按用户ID查询文档的专用DTO
export class UserDocumentQueryDto {
  @ApiPropertyOptional({
    description: '父文件夹ID过滤',
    example: 2,
    type: 'number',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  parentFolderId?: number;

  @ApiPropertyOptional({
    description: '搜索关键词，支持搜索文档名称和内容',
    example: '项目计划',
    type: 'string',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: '页码，默认为1',
    example: 1,
    type: 'number',
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'page must be a number' })
  page?: number;

  @ApiPropertyOptional({
    description: '每页大小，默认为10',
    example: 10,
    type: 'number',
    minimum: 1,
    maximum: 1000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'pageSize must be a number' })
  pageSize?: number;

  @ApiPropertyOptional({
    description: '排序字段',
    example: 'create_time',
    enum: ['create_time', 'update_time', 'documentName'],
  })
  @IsOptional()
  @IsString()
  sortBy?: 'create_time' | 'update_time' | 'documentName';

  @ApiPropertyOptional({
    description: '排序方式，默认为desc',
    example: 'desc',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}
