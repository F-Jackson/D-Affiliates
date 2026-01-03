import { Module, Global } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfModule } from './conf.module';

@Global()
@Module({
  imports: [ConfModule],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: () => {
        const url = process.env.REDIS_URL ?? 'redis://localhost:6379';
        return new Redis(url);
      },
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}
