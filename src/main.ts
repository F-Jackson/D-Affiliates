import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './modules/app.module';
import { Reflector } from '@nestjs/core';
import helmet from 'helmet';
import hpp from 'hpp';
import xss from 'xss';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });
  const config = app.get(ConfigService);

  const grpcUrl = process.env.GRPC_URL ?? 'localhost:5000';
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      url: grpcUrl,
      package: 'affiliates',
      protoPath: join(process.cwd(), 'proto/affiliates.proto'),
    },
  });

  (app as any).set('trust proxy', 1);
  app.use(hpp());

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      referrerPolicy: { policy: 'no-referrer' },
    }),
  );

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      forbidUnknownValues: true,
    }),
  );

  app.use((req: Request, _res: Response, next: NextFunction) => {
    const sanitize = (obj?: Record<string, any>) => {
      if (!obj) return;
      for (const key of Object.keys(obj)) {
        if (typeof obj[key] === 'string') {
          xss(obj[key]);
        }
      }
    };

    sanitize(req.body);
    sanitize(req.query);
    sanitize(req.params);

    next();
  });

  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
