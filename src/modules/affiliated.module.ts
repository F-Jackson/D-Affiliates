import { Module } from '@nestjs/common';
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
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';

@Module({
  imports: [
    RedisModule,
    DbModule,
    ClientsModule.register([
      {
        name: 'SERVICES_AFFILIATES_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'services_affiliates',
          protoPath: join(process.cwd(), 'proto/services_affiliates.proto'),
          url: process.env.GRPC_URL_SERVICES_AFFILIATES,
        },
      },
    ]),
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
