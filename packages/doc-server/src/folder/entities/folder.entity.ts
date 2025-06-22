export class Folder {
  folderId: string;
  userId: number; // 修改为number类型，与DTO保持一致
  folderName: string;
  parentFolderId: string | null; // 父文件夹ID (null 表示根目录)
  childrenDocumentIds: string[]; // 所有子文档ID
  childrenFolderIds: string[]; // 所有子文件夹ID
  depth: number; // 文件夹层级
  createTime: Date;
  updateTime: Date;
}
