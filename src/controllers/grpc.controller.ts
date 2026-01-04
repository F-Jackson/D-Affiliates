import { Controller } from '@nestjs/common';
import { Ctx, GrpcMethod } from '@nestjs/microservices';
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
} from '../proto';
import { AffiliatedService } from '../services/affiliated.service';
import { ConfigService } from '@nestjs/config';
import { Metadata } from '@grpc/grpc-js';
import IdempotencyCheckService from 'src/security/idempotency-check.service';

@Controller()
export class AffiliatesController {
  constructor(
    private readonly affiliatedService: AffiliatedService,
    private readonly idempotencyCheckService: IdempotencyCheckService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Converte Date para unix timestamp em milissegundos
   */
  private toUnixTimestamp(date: any): number | undefined {
    if (!date) return undefined;
    if (date instanceof Date) {
      return date.getTime();
    }
    return typeof date === 'number' ? date : undefined;
  }

  private validateApiKey(context: { metadata: Metadata }): void {
    const apiKey = context.metadata.get('x-api-key')?.[0]?.toString();
    const expectedApiKey = this.configService.get<string>('AFFILIATES_API_KEY');

    if (!apiKey) {
      throw new Error('API-Key is required');
    }

    if (apiKey !== expectedApiKey) {
      throw new Error('Invalid API-Key');
    }
  }

  private async handleIdempotency(
    operationName: string,
    idempotencyKey: string,
  ) {
    await this.idempotencyCheckService.checkIdempotencyEvent(
      operationName,
      idempotencyKey,
    );
    await this.idempotencyCheckService.setIdempotencyEvent(
      operationName,
      idempotencyKey,
    );
  }

  private getIdempotencyKey(context: { metadata: Metadata }): string {
    const idempotencyKey = context.metadata
      .get('idempotency-key')?.[0]
      ?.toString();

    if (!idempotencyKey) {
      throw new Error('Idempotency-Key is required');
    }

    return idempotencyKey;
  }

  @GrpcMethod('AffiliatesService', 'RegisterUser')
  async registerUser(
    request: RegisterUserRequest,
    @Ctx() context: { metadata: Metadata },
  ): Promise<UserRegistrationResponse> {
    this.validateApiKey(context);
    const idempotencyKey = this.getIdempotencyKey(context);
    try {
      await this.handleIdempotency('getSub', idempotencyKey);
    } catch (e: any) {
      return { success: true, message: 'Request already processed' };
    }

    try {
      const result = await this.affiliatedService.registerUser(
        request.user_id || '',
        request.country || '',
      );
      const resultAny = result;
      return {
        success: true,
        affiliate_code: resultAny.affiliateCode,
        message: 'User registered successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Registration failed',
      };
    }
  }

  @GrpcMethod('AffiliatesService', 'SyncAffiliate')
  async syncAffiliate(
    request: SyncAffiliateRequest,
    @Ctx() context: { metadata: Metadata },
  ): Promise<SyncAffiliateResponse> {
    this.validateApiKey(context);
    const idempotencyKey = this.getIdempotencyKey(context);
    try {
      await this.handleIdempotency('getSub', idempotencyKey);
    } catch (e: any) {
      return { success: true, message: 'Request already processed' };
    }

    try {
      await this.affiliatedService.syncAffiliate(
        request.user_id || '',
        request.affiliate_code || '',
      );
      return {
        success: true,
        message: 'Affiliate synced successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Syncing affiliate failed',
      };
    }
  }

  @GrpcMethod('AffiliatesService', 'SyncTransfers')
  async syncTransfers(
    request: SyncTransfersRequest,
    @Ctx() context: { metadata: Metadata },
  ): Promise<SyncTransfersResponse> {
    this.validateApiKey(context);
    const idempotencyKey = this.getIdempotencyKey(context);
    try {
      await this.handleIdempotency('getSub', idempotencyKey);
    } catch (e: any) {
      return { success: true, message: 'Request already processed' };
    }

    try {
      await this.affiliatedService.syncTransfers(request.user_id || '');
      return {
        success: true,
        message: 'Transfers synced successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Syncing transfers failed',
      };
    }
  }

  @GrpcMethod('AffiliatesService', 'GetAffiliatedStats')
  async getAffiliatedStats(
    request: GetAffiliatedStatsRequest,
    @Ctx() context: { metadata: Metadata },
  ): Promise<AffiliatedStatsResponse> {
    this.validateApiKey(context);
    const idempotencyKey = this.getIdempotencyKey(context);
    try {
      await this.handleIdempotency('getSub', idempotencyKey);
    } catch (e: any) {
      return { success: true, message: 'Request already processed' };
    }

    try {
      const statsData = await this.affiliatedService.getAffiliatedStats(
        request.user_id || '',
      );
      
      return {
        success: true,
        message: 'Stats retrieved successfully',
        affiliate_code: statsData.affiliateCode,
        status: statsData.status,
        number_of_affiliates: statsData.numberOfAffiliates,
        stats: statsData.stats ? {
          total_earnings: statsData.stats.totalEarnings ?? 0,
          total_withdrawn: statsData.stats.totalWithdrawn ?? 0,
          pending_withdrawals: statsData.stats.pendingWithdrawals ?? 0,
          number_of_affiliates: statsData.stats.numberOfAffiliates ?? 0,
          total_earnings_last_month: statsData.stats.totalEarningsLastMonth ?? 0,
          updated_at: this.toUnixTimestamp(statsData.stats.updatedAt),
        } : undefined,
        transfers: statsData.transfers?.map((t: any) => ({
          amount: t.amount ?? 0,
          status: (t.status as 'pending' | 'completed' | 'failed') ?? 'pending',
          failure_reason: t.failureReason,
          details: t.details,
          completed_date: this.toUnixTimestamp(t.completedDate),
          internal_payment_proof_url: t.internalPaymentProofUrl,
          payment_method: t.paymentMethod,
          transfer_id: t.transferId,
          created_at: this.toUnixTimestamp(t.createdAt),
          payment_str: t.paymentStr,
        })),
        next_payment: this.toUnixTimestamp(statsData.nextPayment),
        contracts: statsData.constracts?.map((c: any) => ({
          contract_id: c.contractId ?? '',
          status: (c.status as 'pending' | 'confirmed' | 'suspended') ?? 'pending',
          amount: c.amount ?? 0,
          confirmed_at: this.toUnixTimestamp(c.confirmedAt),
          platform: c.plataform,
          tax_amount: c.taxAmount,
          transaction_ids: c.transcationsIds,
        })),
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Getting stats failed',
      };
    }
  }

  @GrpcMethod('AffiliatesService', 'MakeStatsPayment')
  async makeStatsPayment(
    request: MakeStatsPaymentRequest,
    @Ctx() context: { metadata: Metadata },
  ): Promise<PaymentResponse> {
    this.validateApiKey(context);
    const idempotencyKey = this.getIdempotencyKey(context);
    try {
      await this.handleIdempotency('getSub', idempotencyKey);
    } catch (e: any) {
      return { success: true, message: 'Request already processed' };
    }

    try {
      await this.affiliatedService.makeStatsPayment(request.user_id || '');
      return {
        success: true,
        message: 'Stats payment made successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Making stats payment failed',
      };
    }
  }

  @GrpcMethod('AffiliatesService', 'ConfirmContract')
  async confirmContract(
    request: ConfirmContractRequest,
    @Ctx() context: { metadata: Metadata },
  ): Promise<ConfirmContractResponse> {
    this.validateApiKey(context);
    const idempotencyKey = this.getIdempotencyKey(context);
    try {
      await this.handleIdempotency('getSub', idempotencyKey);
    } catch (e: any) {
      return { success: true, message: 'Request already processed' };
    }

    try {
      await this.affiliatedService.confirmContract(
        request.user_id || '',
        request.contract_id || '',
        request.code || '',
        request.payment_method || '',
      );
      return {
        success: true,
        message: 'Contract confirmed successfully',
        contract_id: request.contract_id,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Confirming contract failed',
      };
    }
  }
}
