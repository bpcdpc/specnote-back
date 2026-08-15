import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(compression());
  // whitelist는 dto에 없는 필드 자동 제거 만약 dto에 isAdmin이 없는데 클라이언트에서 isAdmin 보내면 자동 무시
  // transform: ?page=2 2문자열인데 숫자 2로 자동변환. service에서 number로 형변환
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  app.setGlobalPrefix('api');

  //Swagger
  const config = new DocumentBuilder()
    .setTitle('specnote-back')
    .setDescription('specnote-back API description')
    .setVersion('1.0')
    .addBearerAuth() //보호 라우트용 테스트 코튼 입력
    .build();

  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));

  const allowedOrigins = ['http://localhost:5173'];
  if (process.env.FRONTEND_ORIGIN) {
    allowedOrigins.push(process.env.FRONTEND_ORIGIN);
  }

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
  console.log(`specnote-back -- localhost:${process.env.PORT} 기동 ... `);
}
bootstrap();
