export class Folder {
  folderId: string;
  userId: string; // 拥有者ID
  folderName: string;
  parentFolderId: string | null; // 父文件夹ID (null 表示根目录)
  childrenDocumentIds: string[]; // 所有子文档ID
  childrenFolderIds: string[]; // 所有子文件夹ID
  depth: number; // 文件夹层级
  createTime: Date;
  updateTime: Date;
}
