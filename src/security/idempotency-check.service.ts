import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import Redis from 'ioredis';

const IDEMPOTENCY_PREFIX = 'idempotency:';

@Injectable()
export default class IdempotencyCheckService {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async setIdempotencyEvent(
    idempotencyKey: string,
    idempotencyEventId: string,
  ) {
    const key = `${IDEMPOTENCY_PREFIX}${idempotencyEventId}:${idempotencyKey}`;

    const lockSet = await this.redis.set(
      key,
      Date.now().toString(),
      'PX',
      60 * 2 * 1000,
      'NX',
    );

    return !!lockSet;
  }

  async checkIdempotencyEvent(
    idempotencyKey: string,
    idempotencyEventId: string,
  ) {
    const key = `${IDEMPOTENCY_PREFIX}${idempotencyEventId}:${idempotencyKey}`;

    const existing = await this.redis.get(key);

    if (existing) {
      throw new UnauthorizedException({
        message: 'Request already processed',
        idempotencyKey,
        cachedResponse: JSON.parse(existing),
      });
    }
  }
}
