import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FoldersController } from './folder.controller';
import { FoldersService } from './folder.service';
import { Folder, FolderSchema } from './schemas/folder.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Folder.name, schema: FolderSchema }]),
  ],
  controllers: [FoldersController],
  providers: [FoldersService],
  exports: [FoldersService], // 导出以便其他模块使用
})
export class FoldersModule {}
