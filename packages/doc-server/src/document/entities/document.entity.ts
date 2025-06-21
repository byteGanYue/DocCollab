import { Types } from 'mongoose';

export class Document {
  _id: Types.ObjectId;
  userId: number;
  documentId: number;
  documentName: string;
  content: string;
  create_username: string;
  update_username: string;
  editorId: number[];
  parentFolderIds: number[];
  create_time: Date;
  update_time: Date;
}
