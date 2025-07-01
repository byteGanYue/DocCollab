import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { MongooseModule } from '@nestjs/mongoose';
import { FolderModule } from './folder/folder.module';
import { RecentVisitsModule } from './recent-visits/recent-visits.module';
import { DocumentModule } from './document/document.module';

@Module({
  imports: [
    MongooseModule.forRoot(
      // 'mongodb://admin:admin123@47.113.224.195:30123/admin',
      // 'mongodb://doccollab_user:doccollab_pass_2024@121.37.219.159:27017/doccollab?authSource=doccollab',
      'mongodb://localhost:27017/doccollab',
    ),
    UserModule,
    FolderModule,
    RecentVisitsModule,
    DocumentModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
