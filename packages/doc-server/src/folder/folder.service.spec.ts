/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { FolderService } from './folder.service';
import { Folder } from './schemas/folder.schema';
import { Counter } from './schemas/counter.schema';
import { CounterService } from './services/counter.service';
import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';

// 定义模拟的Mongoose模型类型
interface MockFolderModel {
  findById: jest.Mock;
  findByIdAndDelete: jest.Mock;
  findByIdAndUpdate: jest.Mock;
}

// 定义模拟的CounterService类型
interface MockCounterService {
  getNextSequence: jest.Mock;
}

describe('FolderService', () => {
  let service: FolderService;
  let mockFolderModel: MockFolderModel;
  let mockCounterService: MockCounterService;

  beforeEach(async () => {
    // 创建模拟的 Mongoose 模型
    mockFolderModel = {
      findById: jest.fn(),
      findByIdAndDelete: jest.fn(),
      findByIdAndUpdate: jest.fn(),
    };

    // 创建模拟的 CounterService
    mockCounterService = {
      getNextSequence: jest.fn().mockResolvedValue(1), // 默认返回1
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FolderService,
        {
          provide: getModelToken(Folder.name),
          useValue: mockFolderModel,
        },
        {
          provide: getModelToken(Counter.name),
          useValue: {}, // Counter 模型的 mock（如果需要的话）
        },
        {
          provide: CounterService,
          useValue: mockCounterService,
        },
      ],
    }).compile();

    service = module.get<FolderService>(FolderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('递归删除功能测试', () => {
    it('应该成功删除包含子文件夹和子文档的文件夹', async () => {
      const parentFolderId = new Types.ObjectId().toString();
      const childFolderId1 = new Types.ObjectId();
      const childFolderId2 = new Types.ObjectId();
      const documentId1 = new Types.ObjectId();
      const documentId2 = new Types.ObjectId();

      // 模拟父文件夹数据
      const parentFolder = {
        _id: new Types.ObjectId(parentFolderId),
        folderName: '父文件夹',
        userId: new Types.ObjectId(),
        create_username: 'testuser',
        parentFolderIds: [],
        depth: 0,
        all_children_folderId: [childFolderId1, childFolderId2],
        all_children_documentId: [documentId1, documentId2],
        toObject: () => ({
          _id: new Types.ObjectId(parentFolderId),
          folderName: '父文件夹',
          userId: new Types.ObjectId(),
          create_username: 'testuser',
          parentFolderIds: [],
          depth: 0,
          all_children_folderId: [childFolderId1, childFolderId2],
          all_children_documentId: [documentId1, documentId2],
        }),
      };

      // 模拟子文件夹数据
      const childFolder1 = {
        _id: childFolderId1,
        folderName: '子文件夹1',
        userId: new Types.ObjectId(),
        create_username: 'testuser',
        parentFolderIds: [parentFolderId],
        depth: 1,
        all_children_folderId: [],
        all_children_documentId: [],
      };

      const childFolder2 = {
        _id: childFolderId2,
        folderName: '子文件夹2',
        userId: new Types.ObjectId(),
        create_username: 'testuser',
        parentFolderIds: [parentFolderId],
        depth: 1,
        all_children_folderId: [],
        all_children_documentId: [],
      };

      // 设置模拟返回值
      mockFolderModel.findById
        .mockReturnValueOnce(parentFolder) // 第一次调用返回父文件夹
        .mockReturnValueOnce(parentFolder) // 递归删除时再次查找父文件夹
        .mockReturnValueOnce(childFolder1) // 查找子文件夹1
        .mockReturnValueOnce(childFolder2); // 查找子文件夹2

      mockFolderModel.findByIdAndDelete.mockResolvedValue(true);

      // 执行删除操作
      const result = await service.remove(parentFolderId);

      // 验证结果
      expect(result.success).toBe(true);
      expect(result.message).toBe('文件夹及其所有子项删除成功');
      expect(result.data.folderId).toBe(parentFolderId);
      expect(result.data.folderName).toBe('父文件夹');
      expect(result.data.deletedFoldersCount).toBe(3); // 1个父文件夹 + 2个子文件夹
      expect(result.data.deletedDocumentsCount).toBe(2); // 2个文档

      // 验证调用次数
      expect(mockFolderModel.findById).toHaveBeenCalledTimes(4);
      expect(mockFolderModel.findByIdAndDelete).toHaveBeenCalledTimes(3);
    });

    it('应该在文件夹不存在时抛出异常', async () => {
      const nonExistentId = new Types.ObjectId().toString();

      mockFolderModel.findById.mockResolvedValue(null);

      await expect(service.remove(nonExistentId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.remove(nonExistentId)).rejects.toThrow(
        '文件夹不存在',
      );
    });

    it('应该在文件夹ID格式无效时抛出异常', async () => {
      const invalidId = 'invalid-id';

      await expect(service.remove(invalidId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.remove(invalidId)).rejects.toThrow(
        '无效的文件夹ID格式',
      );
    });
  });
});
