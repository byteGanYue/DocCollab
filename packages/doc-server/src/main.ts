import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 启用全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // 自动转换类型
      whitelist: true, // 过滤掉不在 DTO 中的属性
      forbidNonWhitelisted: true, // 如果有额外属性则抛出错误
    }),
  );

  // 启用 CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 DocCollab 服务器运行在端口 ${port}`);
  console.log(`📊 数据库: MongoDB`);
}
bootstrap();
