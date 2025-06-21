import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentService } from './document.service';
import { DocumentController } from './document.controller';
import { DocumentEntity, DocumentSchema } from './schemas/document.schema';
import { Counter, CounterSchema } from './schemas/counter.schema';
import { CounterService } from './services/counter.service';
import { RecentVisitsModule } from '../recent-visits/recent-visits.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DocumentEntity.name, schema: DocumentSchema },
      { name: Counter.name, schema: CounterSchema },
    ]),
    RecentVisitsModule,
  ],
  controllers: [DocumentController],
  providers: [DocumentService, CounterService],
  exports: [DocumentService, CounterService],
})
export class DocumentModule {}
