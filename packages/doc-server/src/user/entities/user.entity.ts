export class User {
  id: number;
  userId: number; // 自增的用户ID，从1开始
  username: string;
  email: string;
  password: string;
  folderId: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}
