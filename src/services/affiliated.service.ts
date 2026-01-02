import { Injectable } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { AffiliateService } from './affiliate.service';
import { StatsService } from './stats.service';

@Injectable()
export class AffiliatedService {
  constructor(
    private paymentService: PaymentService,
    private affiliateService: AffiliateService,
    private statsService: StatsService,
  ) {}

  async registerUser(userId: string, country: string) {
    return this.affiliateService.registerUser(userId, country);
  }

  async getAffiliatedStats(userId: string) {
    return this.statsService.getAffiliatedStats(userId);
  }

async adminGetAffiliatedStats(userId: string) {
    return this.statsService.getAffiliatedStats(userId);
  }

  async adminGetAffiliatesList(page: number) {
    return this.affiliateService.getAffiliatesList(page);
  }

  async syncAffiliate(userId: string, affiliateCode: string) {
    return this.affiliateService.syncAffiliate(userId, affiliateCode);
  }

  async syncTransfers(userId: string) {
    return this.affiliateService.syncTransfers(userId);
  }

  async makeStatsPayment(userId: string) {
    return this.paymentService.makeStatsPayment(userId);
  }

  async sendContractPendingToAffiliate(userId: string) {
    return this.statsService.sendContractPendingToAffiliate(userId);
  }

  async makeContract(userId: string) {
    return this.statsService.makeContract(userId);
  }

  async confirmContract(
    userId: string,
    contractId: string,
    code: string,
    paymentMethod: 'bank_transfer' | 'paypal' | 'crypto',
  ) {
    return this.paymentService.confirmContract(
      userId,
      code,
      paymentMethod,
      contractId,
    );
  }

  async adminChangeTransfer(
    userId: string,
    transferId: string,
    newStatus: {
      failedReason: string;
      success?: {
        paymentProofUrl: string;
        internalPaymentProofUrl?: string;
        completedDate: Date;
      };
      detail?: string;
    },
  ) {
    return this.paymentService.adminChangeTransfer(
      userId,
      transferId,
      newStatus,
    );
  }
}
