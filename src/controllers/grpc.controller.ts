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
} from '../proto/affiliates.pb';
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
        request.userId,
        request.country,
      );
      const resultAny = result;
      return {
        success: true,
        affiliateCode: resultAny.affiliateCode,
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
      await this.affiliatedService.syncTransfers(request.userId);
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
        request.userId,
      );
      
      return {
        success: true,
        message: 'Stats retrieved successfully',
        affiliateCode: statsData.affiliateCode,
        status: statsData.status,
        numberOfAffiliates: statsData.numberOfAffiliates,
        stats: statsData.stats ? {
          totalEarnings: statsData.stats.totalEarnings ?? 0,
          totalWithdrawn: statsData.stats.totalWithdrawn ?? 0,
          pendingWithdrawals: statsData.stats.pendingWithdrawals ?? 0,
          numberOfAffiliates: statsData.stats.numberOfAffiliates ?? 0,
          totalEarningsLastMonth: statsData.stats.totalEarningsLastMonth ?? 0,
          updatedAt: this.toUnixTimestamp(statsData.stats.updatedAt),
        } : undefined,
        transfers: statsData.transfers?.map((t: any) => ({
          amount: t.amount ?? 0,
          status: (t.status as 'pending' | 'completed' | 'failed') ?? 'pending',
          failureReason: t.failureReason,
          details: t.details,
          completedDate: this.toUnixTimestamp(t.completedDate),
          internalPaymentProofUrl: t.internalPaymentProofUrl,
          paymentMethod: t.paymentMethod,
          transferId: t.transferId,
          createdAt: this.toUnixTimestamp(t.createdAt),
          paymentStr: t.paymentStr,
        })),
        nextPayment: this.toUnixTimestamp(statsData.nextPayment),
        contracts: statsData.constracts?.map((c: any) => ({
          contractId: c.contractId ?? '',
          status: (c.status as 'pending' | 'confirmed' | 'suspended') ?? 'pending',
          amount: c.amount ?? 0,
          confirmedAt: this.toUnixTimestamp(c.confirmedAt),
          platform: c.plataform,
          taxAmount: c.taxAmount,
          transactionIds: c.transcationsIds,
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
      await this.affiliatedService.makeStatsPayment(request.userId);
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
        message: error.message || 'Confirming contract failed',
      };
    }
  }
}
