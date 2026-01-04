import { Injectable } from '@nestjs/common';
import { StatsCalculationService } from './stats-calculation.service';
import { ContractConfirmationService } from './contract-confirmation.service';
import { TransferManagementService } from './transfer-management.service';

@Injectable()
export class PaymentService {
  constructor(
    private readonly statsCalculationService: StatsCalculationService,
    private readonly contractConfirmationService: ContractConfirmationService,
    private readonly transferManagementService: TransferManagementService,
  ) {}

  async makeStatsPayment(userId: string) {
    return this.statsCalculationService.calculateAndUpdateStats(userId);
  }

  async confirmContract(
    userId: string,
    code: string,
    paymentStr: string,
    contractId: string,
  ) {
    return this.contractConfirmationService.confirmUserContract(
      userId,
      code,
      paymentStr,
      contractId,
    );
  }

  async adminConfirmContract(
    userId: string,
    contractId: string,
    platform: string,
    taxAmount: number,
  ) {
    return this.contractConfirmationService.adminConfirmContract(
      userId,
      contractId,
      platform,
      taxAmount,
    );
  }

  async adminChangeTransfer(
    userId: string,
    transferId: string,
    newStatus: {
      failedReason?: string;
      success?: {
        paymentProofUrl: string;
        internalPaymentProofUrl?: string;
        completedDate: Date;
      };
      detail?: string;
    },
  ) {
    return this.transferManagementService.updateTransferStatus(
      userId,
      transferId,
      newStatus,
    );
  }
}
