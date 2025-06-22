import { Test, TestingModule } from '@nestjs/testing';
import { FolderController } from './folder.controller';
import { FolderService } from './folder.service';

describe('FolderController', () => {
  let controller: FolderController;

  beforeEach(async () => {
    // 创建 FolderService 的 mock
    const mockFolderService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      findByFolderId: jest.fn(),
      findFolderTree: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FolderController],
      providers: [
        {
          provide: FolderService,
          useValue: mockFolderService,
        },
      ],
    }).compile();

    controller = module.get<FolderController>(FolderController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // 测试新增的删除方法
  it('should have removeByFolderId method', () => {
    expect(typeof controller.removeByFolderId).toBe('function');
  });
});
