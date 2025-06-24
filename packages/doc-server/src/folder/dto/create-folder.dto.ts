import {
  IsString,
  IsOptional,
  IsNumber,
  IsNotEmpty,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 创建文件夹DTO
 */
export class CreateFolderDto {
  @ApiProperty({ description: '文件夹名称', example: '文件夹名称' })
  @IsString()
  @IsNotEmpty()
  folderName: string; // 文件夹名称

  @ApiProperty({ description: '创建人id', example: '685660003a7988baf7809f44' })
  @IsNumber()
  @IsNotEmpty()
  userId: number; // 拥有者ID

  @ApiProperty({ description: '创建人用户名', example: '测试2' })
  @IsString()
  @IsNotEmpty()
  create_username: string; // 创建者用户名

  @ApiProperty({
    description: '父文件夹id（支持自增ID数字或ObjectId字符串）',
    example: [18],
    type: [Number],
  })
  @IsArray()
  @IsOptional()
  @Type(() => Number)
  parentFolderIds?: number[]; // 父文件夹ID数组 (可选，空数组表示根目录，支持自增ID)

  @ApiProperty({ description: '文件夹层级', example: 0 })
  @IsNumber()
  @IsOptional()
  depth?: number; // 文件夹层级 (可选，会自动计算)
}

/**
 * 查询文件夹树形结构DTO
 */
export class QueryFolderTreeDto {
  @ApiProperty({ description: '用户id', example: '1' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  userId?: number; // 用户ID (可选，用于筛选特定用户的文件夹)

  @IsString()
  @IsOptional()
  parentFolderId?: string; // 父文件夹ID (可选，用于获取特定文件夹下的子文件夹树，默认为根目录)

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  maxDepth?: number; // 最大查询深度 (可选，用于控制递归深度，避免性能问题)
}

/**
 * 创建文件夹响应DTO
 */
export interface CreateFolderResponseDto {
  success: boolean;
  message: string;
  data: {
    folderId: string;
    autoFolderId: number; // 自增的文件夹ID，从1开始
    folderName: string;
    userId: number;
    create_username: string;
    parentFolderIds: string[];
    depth: number;
    create_time: Date;
    update_time: Date;
  };
}

/**
 * 查询文件夹详情响应DTO
 */
export interface FindFolderDetailResponseDto {
  success: boolean;
  message: string;
  data: {
    folderId: string;
    autoFolderId: number; // 自增的文件夹ID，从1开始
    folderName: string;
    userId: number; // 使用number类型，与用户模块保持一致
    create_username: string;
    update_username: string;
    parentFolderIds: string[];
    depth: number;
    childrenCount: {
      documents: number;
      folders: number;
    };
    create_time: Date;
    update_time: Date;
  };
}

/**
 * 搜索文件夹DTO
 */
export class SearchFolderDto {
  @ApiProperty({
    description: '搜索关键词（文件夹名称）',
    example: '我的文档',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  keyword: string; // 搜索关键词

  @ApiProperty({
    description: '用户ID（可选，用于筛选特定用户的文件夹）',
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  userId?: number; // 用户ID (可选)

  @ApiProperty({
    description: '页码（从1开始）',
    example: 1,
    required: false,
    default: 1,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number; // 页码

  @ApiProperty({
    description: '每页数量',
    example: 10,
    required: false,
    default: 10,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number; // 每页数量
}

/**
 * 搜索文件夹响应DTO
 */
export interface SearchFolderResponseDto {
  success: boolean;
  message: string;
  data: {
    folders: Array<{
      folderId: string;
      autoFolderId: number; // 自增的文件夹ID
      folderName: string;
      userId: number;
      create_username: string;
      update_username: string;
      parentFolderIds: string[];
      depth: number;
      parentFolderNames: string[]; // 父文件夹名称路径，用于显示完整路径
      create_time: Date;
      update_time: Date;
    }>;
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      pageSize: number;
    };
  };
}
