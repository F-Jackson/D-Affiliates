import { Module, Global } from '@nestjs/common';
import Redis from 'ioredis';
import { BullModule } from '@nestjs/bull';
import { ConfModule } from './conf.module';

const parseRedisUrl = (url: string) => {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port || '6379'),
    password: parsed.password || undefined,
    username: parsed.username || undefined,
  };
};

@Global()
@Module({
  imports: [
    ConfModule,
    BullModule.forRoot({
      redis: parseRedisUrl(process.env.REDIS_URL ?? 'redis://localhost:6379'),
    }),
  ],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: () => {
        const url = process.env.REDIS_URL ?? 'redis://localhost:6379';
        return new Redis(url);
      },
    },
  ],
  exports: ['REDIS_CLIENT', BullModule],
})
export class RedisModule {}
