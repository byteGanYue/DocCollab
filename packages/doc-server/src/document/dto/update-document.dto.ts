import { IsString, IsOptional, IsArray } from 'class-validator';

export class UpdateDocumentDto {
  @IsString()
  @IsOptional()
  documentName?: string; // 文档名称

  @IsString()
  @IsOptional()
  content?: string; // 文档内容

  @IsString()
  @IsOptional()
  update_username?: string; // 更新者用户名

  @IsArray()
  @IsOptional()
  editorId?: number[]; // 改为number数组，正在协同编辑人的userid数组

  @IsArray()
  @IsOptional()
  parentFolderIds?: number[]; // 改为number数组，父文件夹ID数组
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
