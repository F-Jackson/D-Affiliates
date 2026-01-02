import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../schemas/user.schema';
import { AffiliatedService } from '../services/affiliated.service';
import { ContractService } from '../services/contract.service';
import { PaymentService } from '../services/payment.service';
import { AffiliateService } from '../services/affiliate.service';
import { StatsService } from '../services/stats.service';
import { AdminController } from '../controllers/admin.controller';
import { AffiliatesController } from 'src/controllers/grpc.controller';
import { DbModule } from './db.module';
import { RedisModule } from './redis.module';
import IdempotencyCheckService from 'src/security/idempotency-check.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    RedisModule,
    DbModule,
  ],
  providers: [
    AffiliatedService,
    ContractService,
    PaymentService,
    AffiliateService,
    StatsService,
    IdempotencyCheckService,
  ],
  exports: [
    AffiliatedService,
    ContractService,
    PaymentService,
    AffiliateService,
    StatsService,
    IdempotencyCheckService,
  ],
  controllers: [AdminController, AffiliatesController],
})
export class AffiliatedModule {}
