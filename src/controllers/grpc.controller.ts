import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import type {
  RegisterUserRequest,
  SyncAffiliateRequest,
  SyncTransfersRequest,
  GetAffiliatedStatsRequest,
  MakeStatsPaymentRequest,
  MakeContractRequest,
  ConfirmContractRequest,
  UserRegistrationResponse,
  SyncAffiliateResponse,
  SyncTransfersResponse,
  AffiliatedStatsResponse,
  PaymentResponse,
  ContractResponse,
  ConfirmContractResponse,
} from '../proto/affiliates.pb';
import { AffiliatedService } from '../services/affiliated.service';

@Controller()
export class GrpcController {
  constructor(private readonly affiliatedService: AffiliatedService) {}

  @GrpcMethod('AffiliatesService', 'RegisterUser')
  async registerUser(
    request: RegisterUserRequest,
  ): Promise<UserRegistrationResponse> {
    const result = await this.affiliatedService.registerUser(
      request.userId,
      request.country,
    );
    const resultAny = result;
    return {
      affiliateCode: resultAny.affiliateCode,
    };
  }

  @GrpcMethod('AffiliatesService', 'SyncAffiliate')
  async syncAffiliate(
    request: SyncAffiliateRequest,
  ): Promise<SyncAffiliateResponse> {
    await this.affiliatedService.syncAffiliate(
      request.userId,
      request.affiliateCode,
    );
    return {
      success: true,
      message: 'Affiliate synced successfully',
    };
  }

  @GrpcMethod('AffiliatesService', 'SyncTransfers')
  async syncTransfers(
    request: SyncTransfersRequest,
  ): Promise<SyncTransfersResponse> {
    await this.affiliatedService.syncTransfers(request.userId);
    return {
      success: true,
      message: 'Transfers synced successfully',
    };
  }

  @GrpcMethod('AffiliatesService', 'GetAffiliatedStats')
  async getAffiliatedStats(
    request: GetAffiliatedStatsRequest,
  ): Promise<AffiliatedStatsResponse> {
    const stats = await this.affiliatedService.getAffiliatedStats(
      request.userId,
    );
    return {
      affiliateCode: stats.affiliateCode,
      status: stats.status,
      stats: {
        totalEarnings: stats.totalEarnings,
        totalWithdrawn: stats.totalWithdrawn,
        pendingWithdrawals: stats.pendingWithdrawals,
        numberOfAffiliates: stats.numberOfAffiliates,
        totalEarningsLastMonth: stats.totalEarningsLastMonth,
        totalEarningsLastYear: stats.totalEarningsLastYear,
      },
      numberOfAffiliates: stats.numberOfAffiliates,
      totalTransfers: stats.totalTransfers,
      nextPayment: stats.nextPayment,
      constracts: stats.constracts.map((c) => ({
        contractId: c._id.toString(),
        status: c.status,
        amount: c.amount,
        confirmedAt: c.confirmedAt,
        plataform: c.plataform,
        taxAmount: c.taxAmount,
      })),
    };
  }

  @GrpcMethod('AffiliatesService', 'MakeStatsPayment')
  async makeStatsPayment(
    request: MakeStatsPaymentRequest,
  ): Promise<PaymentResponse> {
    await this.affiliatedService.makeStatsPayment(request.userId);
    return {
      success: true,
      message: 'Payment processed successfully',
      transactionId: `txn_${Date.now()}`,
    };
  }

  @GrpcMethod('AffiliatesService', 'MakeContract')
  async makeContract(request: MakeContractRequest): Promise<ContractResponse> {
    const result = await this.affiliatedService.adminMakeContract(
      request.userId,
    );
    const resultAny = result as any;
    return {
      contractId: resultAny.contracts?.[0]?._id?.toString() || '',
      status: 'pending',
      message: 'Contract created successfully',
    };
  }

  @GrpcMethod('AffiliatesService', 'ConfirmContract')
  async confirmContract(
    request: ConfirmContractRequest,
  ): Promise<ConfirmContractResponse> {
    await this.affiliatedService.confirmContract(
      request.userId,
      request.contractId,
      request.code,
      request.paymentMethod,
    );
    return {
      success: true,
      message: 'Contract confirmed successfully',
      contractId: request.contractId,
    };
  }
}
