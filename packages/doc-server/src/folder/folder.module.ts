import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FolderService } from './folder.service';
import { FolderController } from './folder.controller';
import { Folder, FolderSchema } from './schemas/folder.schema';
import { Counter, CounterSchema } from './schemas/counter.schema';
import { CounterService } from './services/counter.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Folder.name, schema: FolderSchema },
      { name: Counter.name, schema: CounterSchema },
    ]),
  ],
  controllers: [FolderController],
  providers: [FolderService, CounterService],
  exports: [FolderService, CounterService],
})
export class FolderModule {}
