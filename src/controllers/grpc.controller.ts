import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import type {
  RegisterUserRequest,
  SyncAffiliateRequest,
  SyncTransfersRequest,
  GetAffiliatedStatsRequest,
  MakeStatsPaymentRequest,
  ConfirmContractRequest,
  UserRegistrationResponse,
  SyncAffiliateResponse,
  SyncTransfersResponse,
  AffiliatedStatsResponse,
  PaymentResponse,
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
    try {
      const result = await this.affiliatedService.registerUser(
        request.userId,
        request.country,
      );
      const resultAny = result;
      return {
        success: true,
        affiliateCode: resultAny.affiliateCode,
      };
    } catch (error) {
      return {
        success: false,
      };
    }
  }

  @GrpcMethod('AffiliatesService', 'SyncAffiliate')
  async syncAffiliate(
    request: SyncAffiliateRequest,
  ): Promise<SyncAffiliateResponse> {
    try {
      await this.affiliatedService.syncAffiliate(
        request.userId,
        request.affiliateCode,
      );
      return {
        success: true,
        message: 'Affiliate synced successfully',
      };
    } catch (error) {
      return {
        success: false,
      };
    }
  }

  @GrpcMethod('AffiliatesService', 'SyncTransfers')
  async syncTransfers(
    request: SyncTransfersRequest,
  ): Promise<SyncTransfersResponse> {
    try {
      await this.affiliatedService.syncTransfers(request.userId);
      return {
        success: true,
        message: 'Transfers synced successfully',
      };
    } catch (error) {
      return {
        success: false,
      };
    }
  }

  @GrpcMethod('AffiliatesService', 'GetAffiliatedStats')
  async getAffiliatedStats(
    request: GetAffiliatedStatsRequest,
  ): Promise<AffiliatedStatsResponse> {
    try {
      const stats = await this.affiliatedService.getAffiliatedStats(
        request.userId,
      );
      return {
        success: true,
        ...stats,
      };
    } catch (error) {
      return {
        success: false,
      };
    }
  }

  @GrpcMethod('AffiliatesService', 'MakeStatsPayment')
  async makeStatsPayment(
    request: MakeStatsPaymentRequest,
  ): Promise<PaymentResponse> {
    try {
      await this.affiliatedService.makeStatsPayment(request.userId);
      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
      };
    }
  }

  @GrpcMethod('AffiliatesService', 'ConfirmContract')
  async confirmContract(
    request: ConfirmContractRequest,
  ): Promise<ConfirmContractResponse> {
    try {
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
    } catch (error) {
      return {
        success: false,
      };
    }
  }
}
