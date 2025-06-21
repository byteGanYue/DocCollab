import {
  IsString,
  IsOptional,
  IsArray,
  IsNotEmpty,
  IsNumber,
} from 'class-validator';

export class CreateDocumentDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number; // 改为number类型

  @IsString()
  @IsNotEmpty()
  documentName: string; // 文档名称

  @IsString()
  @IsOptional()
  content?: string; // 文档内容，可选

  @IsString()
  @IsNotEmpty()
  create_username: string; // 创建者用户名

  @IsArray()
  @IsOptional()
  parentFolderIds?: number[]; // 改为number数组，父文件夹ID数组，可选
}

export class CreateDocumentResponseDto {
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

export class QueryDocumentDto {
  @IsOptional()
  @IsNumber()
  userId?: number; // 改为number类型

  @IsOptional()
  @IsNumber()
  parentFolderId?: number; // 改为number类型

  @IsOptional()
  @IsString()
  search?: string; // 搜索关键词

  @IsOptional()
  page?: number; // 页码

  @IsOptional()
  pageSize?: number; // 每页大小
}
