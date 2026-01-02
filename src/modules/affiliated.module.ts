import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../schemas/app.schema';
import { AffiliatedService } from '../services/affiliated.service';
import { ContractService } from '../services/contract.service';
import { PaymentService } from '../services/payment.service';
import { AffiliateService } from '../services/affiliate.service';
import { StatsService } from '../services/stats.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
  providers: [
    AffiliatedService,
    ContractService,
    PaymentService,
    AffiliateService,
    StatsService,
  ],
  exports: [
    AffiliatedService,
    ContractService,
    PaymentService,
    AffiliateService,
    StatsService,
  ],
})
export class AffiliatedModule {}
