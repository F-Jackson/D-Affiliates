import { Module } from '@nestjs/common';
import { AffiliatedService } from '../services/affiliated.service';
import { ContractService } from '../services/pdf/contract.service';
import { PaymentService } from '../services/payment/payment.service';
import { StatsCalculationService } from '../services/payment/stats-calculation.service';
import { ContractConfirmationService } from '../services/payment/contract-confirmation.service';
import { TransferManagementService } from '../services/payment/transfer-management.service';
import { AffiliateService } from '../services/affiliate/affiliate.service';
import { UserService } from '../services/affiliate/user.service';
import { AffiliateSyncService } from '../services/affiliate/affiliate-sync.service';
import { TransactionSyncService } from '../services/affiliate/transaction-sync.service';
import { AffiliateListService } from '../services/affiliate/affiliate-list.service';
import { StatsService } from '../services/stats/stats.service';
import { StatsQueryService } from '../services/stats/stats-query.service';
import { StatsMapperService } from '../services/stats/stats-mapper.service';
import { ContractManagementService as StatsContractManagementService } from '../services/stats/contract-management.service';
import { PdfSecurityService } from '../services/pdf/pdf-security.service';
import { PdfSectionBuilderService } from '../services/pdf/pdf-section-builder.service';
import { PdfDocumentBuilderService } from '../services/pdf/pdf-document-builder.service';
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
    PdfSecurityService,
    PdfSectionBuilderService,
    PdfDocumentBuilderService,
    PaymentService,
    StatsCalculationService,
    ContractConfirmationService,
    TransferManagementService,
    AffiliateService,
    UserService,
    AffiliateSyncService,
    TransactionSyncService,
    AffiliateListService,
    StatsService,
    StatsQueryService,
    StatsMapperService,
    StatsContractManagementService,
    IdempotencyCheckService,
  ],
  exports: [
    AffiliatedService,
    ContractService,
    PdfSecurityService,
    PdfSectionBuilderService,
    PdfDocumentBuilderService,
    PaymentService,
    StatsCalculationService,
    ContractConfirmationService,
    TransferManagementService,
    AffiliateService,
    UserService,
    AffiliateSyncService,
    TransactionSyncService,
    AffiliateListService,
    StatsService,
    StatsQueryService,
    StatsMapperService,
    StatsContractManagementService,
    IdempotencyCheckService,
  ],
  controllers: [AdminController, AffiliatesController],
})
export class AffiliatedModule {}
