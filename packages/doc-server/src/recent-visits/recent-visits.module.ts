import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RecentVisitsService } from './recent-visits.service';
import { RecentVisitsController } from './recent-visits.controller';
import { RecentVisit, RecentVisitSchema } from './schemas/recent-visit.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RecentVisit.name, schema: RecentVisitSchema },
    ]),
  ],
  controllers: [RecentVisitsController],
  providers: [RecentVisitsService],
  exports: [RecentVisitsService], // 导出服务，供其他模块使用
})
export class RecentVisitsModule {}
