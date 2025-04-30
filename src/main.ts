
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication
} from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import fastifyMultipart from '@fastify/multipart';
import fastifyCors from '@fastify/cors';
import { getVietnamDateTime } from 'src/common/utils/date-utils';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );


  const configService = app.get(ConfigService);
  const port = configService.get('PORT') || 3000;

  // Enable CORS
  await app.register(fastifyCors, {
    origin: '*',
    methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Enable file uploads with @fastify/multipart
  await app.register(fastifyMultipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
      files: 10,
    },
    attachFieldsToBody: false,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // API prefix
  app.setGlobalPrefix('api');

  // Swagger setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Social Web App API')
    .setDescription('API documentation for Social Web App')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
      },
      'JWT',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: ${await app.getUrl()}`);

  const vietnamTime = getVietnamDateTime();
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`Current Vietnam time: ${vietnamTime.toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh'
  })}`);
}

bootstrap();