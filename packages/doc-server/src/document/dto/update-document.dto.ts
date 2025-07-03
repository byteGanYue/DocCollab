import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateDocumentDto {
  @ApiPropertyOptional({
    description: '文档名称',
    example: '更新后的文档名称',
    type: 'string',
  })
  @IsString()
  @IsOptional()
  documentName?: string;

  @ApiPropertyOptional({
    description: '文档内容',
    example: '更新后的文档内容...',
    type: 'string',
  })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({
    description: '更新者用户名',
    example: 'user456',
    type: 'string',
  })
  @IsString()
  @IsOptional()
  update_username?: string;

  @ApiPropertyOptional({
    description: '正在协同编辑人的用户ID数组',
    example: [1, 2, 3],
    type: [Number],
    isArray: true,
  })
  @IsArray()
  @IsOptional()
  editorId?: number[];

  @ApiPropertyOptional({
    description: '父文件夹ID数组',
    example: [1, 2, 3],
    type: [Number],
    isArray: true,
  })
  @IsArray()
  @IsOptional()
  parentFolderIds?: number[];

  @ApiPropertyOptional({
    description: 'Yjs文档状态数据',
    example: [1, 2, 3, 4, 5],
    type: [Number],
    isArray: true,
  })
  @IsArray()
  @IsOptional()
  yjsState?: number[];
}

export class UpdateDocumentResponseDto {
  success: boolean;
  message: string;
  data: {
    _id: string;
    documentId: number;
    documentName: string;
    userId: number; // 改为number类型
    content: string;
    create_username: string;
    update_username: string;
    editorId: number[]; // 改为number数组
    parentFolderIds: number[]; // 改为number数组
    create_time: Date;
    update_time: Date;
  };
}
