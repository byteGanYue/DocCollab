import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Folder } from './schemas/folder.schema';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';

@Injectable()
export class FoldersService {
  constructor(@InjectModel(Folder.name) private folderModel: Model<Folder>) {}

  // 创建文件夹
  async create(
    createFolderDto: CreateFolderDto,
    userId: string,
    username: string,
  ): Promise<Folder> {
    const parentFolder =
      createFolderDto.parentFolderId !== '0'
        ? await this.folderModel.findById(createFolderDto.parentFolderId)
        : null;

    if (createFolderDto.parentFolderId !== '0' && !parentFolder) {
      throw new NotFoundException('Parent folder not found');
    }

    const depth = parentFolder ? parentFolder.depth + 1 : 0;

    const createdFolder = new this.folderModel({
      ...createFolderDto,
      userId,
      create_username: username,
      depth,
    });

    // 如果是子文件夹，更新父文件夹的子文件夹列表
    if (parentFolder) {
      parentFolder.all_children_folderId.push(
        createdFolder._id as Types.ObjectId,
      );
      await parentFolder.save();
    }

    return createdFolder.save();
  }

  // 获取用户所有文件夹
  async findAllByUser(userId: string): Promise<Folder[]> {
    return this.folderModel.find({ userId }).exec();
  }

  // 获取文件夹详情
  async findOne(id: string): Promise<Folder> {
    const folder = await this.folderModel.findById(id).exec();
    if (!folder) {
      throw new NotFoundException('Folder not found');
    }
    return folder;
  }

  // 更新文件夹
  async update(
    id: string,
    updateFolderDto: UpdateFolderDto,
    username: string,
  ): Promise<Folder> {
    const updatedFolder = await this.folderModel.findByIdAndUpdate(
      id,
      {
        ...updateFolderDto,
        update_username: username,
        update_time: new Date(),
      },
      { new: true },
    );

    if (!updatedFolder) {
      throw new NotFoundException('Folder not found');
    }
    return updatedFolder;
  }

  // 删除文件夹（递归删除子文件夹）
  async remove(id: string): Promise<void> {
    const folder = await this.folderModel.findById(id);
    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    // 递归删除所有子文件夹
    for (const childFolderId of folder.all_children_folderId) {
      await this.remove(childFolderId.toString());
    }

    // 如果是子文件夹，从父文件夹中移除
    if (folder.parentFolderId !== '0') {
      const parentFolder = await this.folderModel.findById(
        folder.parentFolderId,
      );
      if (parentFolder) {
        parentFolder.all_children_folderId =
          parentFolder.all_children_folderId.filter(
            (id) => id.toString() !== (folder._id as Types.ObjectId).toString(),
          );
        await parentFolder.save();
      }
    }

    await this.folderModel.deleteOne({ _id: id }).exec();
  }

  // 添加文件到文件夹
  async addDocumentToFolder(
    folderId: string,
    documentId: Types.ObjectId,
  ): Promise<Folder> {
    const folder = await this.folderModel.findById(folderId);
    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    // 防止重复添加
    if (!folder.all_children_documentId.some((id) => id.equals(documentId))) {
      folder.all_children_documentId.push(documentId);
      await folder.save();
    }

    return folder;
  }

  // 从文件夹移除文件
  async removeDocumentFromFolder(
    folderId: string,
    documentId: Types.ObjectId,
  ): Promise<Folder> {
    const folder = await this.folderModel.findById(folderId);
    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    folder.all_children_documentId = folder.all_children_documentId.filter(
      (id) => !id.equals(documentId),
    );
    await folder.save();

    return folder;
  }
}
