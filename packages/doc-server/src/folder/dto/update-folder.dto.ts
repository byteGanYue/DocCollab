import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 更新文件夹DTO
 */
export class UpdateFolderDto {
  @ApiProperty({
    description: '文件夹名称',
    example: '新修改的文件夹名称',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  folderName: string; // 文件夹名称（必选）
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
    userId: number;
    create_username: string;
    parentFolderIds: string[];
    depth: number;
    create_time: Date;
    update_time: Date;
  };
}
