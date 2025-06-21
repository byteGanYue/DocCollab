import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateFolderDto {
  @ApiProperty({ description: '文件夹名称', example: '我的文件夹' })
  @IsString()
  @IsOptional()
  folderName?: string;

  @ApiProperty({ description: '更新人', example: 'johndoe' })
  @IsString()
  @IsOptional()
  update_username?: string;
}
