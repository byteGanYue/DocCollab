import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateFolderDto {
  @ApiProperty({ description: '文件夹名称', example: '新建文件夹1' })
  @IsString()
  @IsNotEmpty()
  folderName: string;

  @ApiProperty({ description: '父文件夹ID', example: '0' })
  @IsString()
  @IsOptional()
  parentFolderId?: string = '0'; // 默认为根目录

  @ApiProperty({ description: '文件夹层级', example: 0 })
  @IsNumber()
  @IsOptional()
  depth?: number = 0; // 默认为0级
}
