import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from './redis.module';
import { Module } from '@nestjs/common';
import { AppDataSource } from '../data-source';
import { AffiliatedEntity } from 'src/entities/affiliated.entity';
import { ContractsEntity } from 'src/entities/contracts.entity';
import { StatsEntity } from 'src/entities/stats.entity';
import { TransactionEntity } from 'src/entities/transaction.entity';
import { TransferEntity } from 'src/entities/transfer.entity';
import { UserEntity } from 'src/entities/user.entity';

const entities = [
  UserEntity,
  AffiliatedEntity,
  TransactionEntity,
  TransferEntity,
  StatsEntity,
  ContractsEntity,
];

@Module({
  imports: [
    TypeOrmModule.forRoot(AppDataSource.options),
    TypeOrmModule.forFeature(entities),
    RedisModule,
  ],
  exports: [TypeOrmModule, RedisModule],
})
export class DbModule {}
