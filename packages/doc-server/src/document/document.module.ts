import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentService } from './document.service';
import { DocumentController } from './document.controller';
import { DocumentArchiveController } from './document-archive.controller';
import { DocumentEntity, DocumentSchema } from './schemas/document.schema';
import {
  DocumentHistoryEntity,
  DocumentHistorySchema,
} from './schemas/document-history.schema';
import {
  DocumentArchive,
  DocumentArchiveSchema,
} from './schemas/document-archive.schema';
import { Counter, CounterSchema } from './schemas/counter.schema';
import { CounterService } from './services/counter.service';
import { DocumentHistoryService } from './services/document-history.service';
import { DocumentArchiveService } from './services/document-archive.service';
import { RecentVisitsModule } from '../recent-visits/recent-visits.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DocumentEntity.name, schema: DocumentSchema },
      { name: DocumentHistoryEntity.name, schema: DocumentHistorySchema },
      { name: DocumentArchive.name, schema: DocumentArchiveSchema },
      { name: Counter.name, schema: CounterSchema },
    ]),
    RecentVisitsModule,
  ],
  controllers: [DocumentController, DocumentArchiveController],
  providers: [
    DocumentService,
    CounterService,
    DocumentHistoryService,
    DocumentArchiveService,
  ],
  exports: [
    DocumentService,
    CounterService,
    DocumentHistoryService,
    DocumentArchiveService,
  ],
})
export class DocumentModule { }
