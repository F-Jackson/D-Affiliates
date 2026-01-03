import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from './redis.module';
import { Module } from '@nestjs/common';
import { AppDataSource } from '../data-source';

const entities = [];

@Module({
  imports: [
    TypeOrmModule.forRoot(AppDataSource.options),
    TypeOrmModule.forFeature(entities),
    RedisModule,
  ],
  exports: [TypeOrmModule, RedisModule],
})
export class DbModule {}
