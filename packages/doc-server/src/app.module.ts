import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { MongooseModule } from '@nestjs/mongoose';
import { FolderModule } from './folder/folder.module';
import { RecentVisitsModule } from './recent-visits/recent-visits.module';

@Module({
  imports: [
    MongooseModule.forRoot(
      'mongodb://doccollab_user:doccollab_pass_2024@121.37.219.159:27017/doccollab?authSource=doccollab',
    ),
    UserModule,
    FolderModule,
    RecentVisitsModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
