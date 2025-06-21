import {
  IsString,
  IsOptional,
  IsNumber,
  IsNotEmpty,
  IsArray,
} from 'class-validator';
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
  @IsString()
  @IsNotEmpty()
  userId: string; // 拥有者ID

  @ApiProperty({ description: '创建人用户名', example: '测试2' })
  @IsString()
  @IsNotEmpty()
  create_username: string; // 创建者用户名

  @ApiProperty({
    description: '父文件夹id',
    example: ['685660003a7988baf7809f46'],
  })
  @IsArray()
  @IsOptional()
  parentFolderIds?: string[]; // 父文件夹ID数组 (可选，空数组表示根目录)

  @ApiProperty({ description: '文件夹层级', example: 0 })
  @IsNumber()
  @IsOptional()
  depth?: number; // 文件夹层级 (可选，会自动计算)
}

/**
 * 查询文件夹树形结构DTO
 */
export class QueryFolderTreeDto {
  @ApiProperty({ description: '用户id', example: '685660003a7988baf7809f44' })
  @IsString()
  @IsOptional()
  userId?: string; // 用户ID (可选，用于筛选特定用户的文件夹)

  @IsString()
  @IsOptional()
  parentFolderId?: string; // 父文件夹ID (可选，用于获取特定文件夹下的子文件夹树，默认为根目录)

  @IsNumber()
  @IsOptional()
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
    folderName: string;
    userId: string;
    create_username: string;
    parentFolderIds: string[];
    depth: number;
    create_time: Date;
    update_time: Date;
  };
}
