import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentService } from './document.service';
import { DocumentController } from './document.controller';
import { DocumentEntity, DocumentSchema } from './schemas/document.schema';
import {
  DocumentHistoryEntity,
  DocumentHistorySchema,
} from './schemas/document-history.schema';
import { Counter, CounterSchema } from './schemas/counter.schema';
import { CounterService } from './services/counter.service';
import { DocumentHistoryService } from './services/document-history.service';
import { RecentVisitsModule } from '../recent-visits/recent-visits.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DocumentEntity.name, schema: DocumentSchema },
      { name: DocumentHistoryEntity.name, schema: DocumentHistorySchema },
      { name: Counter.name, schema: CounterSchema },
    ]),
    RecentVisitsModule,
  ],
  controllers: [DocumentController],
  providers: [DocumentService, CounterService, DocumentHistoryService],
  exports: [DocumentService, CounterService, DocumentHistoryService],
})
export class DocumentModule {}
