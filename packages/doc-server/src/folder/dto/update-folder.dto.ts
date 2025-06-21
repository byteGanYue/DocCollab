import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 更新文件夹DTO
 */
export class UpdateFolderDto {
  @ApiProperty({
    description: '文件夹名称',
    example: '新文件夹名称',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  folderName?: string; // 文件夹名称（可选）

  @ApiProperty({
    description: '更新者用户名',
    example: '张三',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  update_username?: string; // 更新者用户名（可选）
}

/**
 * 更新文件夹响应DTO
 */
export interface UpdateFolderResponseDto {
  success: boolean;
  message: string;
  data: {
    folderId: string;
    folderName: string;
    userId: string;
    create_username: string;
    update_username: string;
    parentFolderIds: string[];
    depth: number;
    create_time: Date;
    update_time: Date;
  };
}
