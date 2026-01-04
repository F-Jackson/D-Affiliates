import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async makeStatsPayment(userId: string) {
    const user = await this.userModel.findOne({ userId });
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    const now = new Date();
    if (user.nextPayment && user.nextPayment > now) {
      this.logger.log(
        `Stats payment for ${userId} is already scheduled for ${user.nextPayment}`,
      );
      return;
    }

    // Total earnings from all affiliates
    const totalEarnings = user.affiliateds.reduce((sum, aff) => {
      return sum + aff.transactions.reduce((s, t) => s + t.amount, 0);
    }, 0);

    // Total withdrawn and pending
    const totalWithdrawn = user.transfers
      .filter((t) => t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    const pendingWithdrawals = user.transfers
      .filter((t) => t.status === 'pending')
      .reduce((sum, t) => sum + t.amount, 0);

    // Active affiliates (created 3+ months ago)
    const threeMonthsAgo = new Date(Date.now() - 60 * 60 * 1000 * 24 * 30 * 3);
    const affiliatesToCalculate = user.affiliateds.filter((aff) => {
      return aff.createdAt <= threeMonthsAgo;
    });

    const numberOfAffiliates = affiliatesToCalculate.length;

    // Transaction IDs already used in previous withdrawals
    const usedTransactionIds = user.transfers
      .flatMap((t) => t.usedTransactionIds || [])
      .filter((id) => id);

    // Unused transactions (available for withdrawal)
    const notUsedTransactions = affiliatesToCalculate
      .flatMap((aff) => aff.transactions)
      .filter((t) => !usedTransactionIds.includes(t.id));

    // Period earnings (unused and completed transactions)
    const totalEarningsPeriod = notUsedTransactions.reduce(
      (sum, t) => sum + t.amount,
      0,
    );

    // Total unused transactions
    const totalTransactionsPeriod = notUsedTransactions.length;

    if (!user.stats) {
      user.stats = {};
    }

    user.stats = {
      totalEarnings,
      totalWithdrawn,
      pendingWithdrawals,
      numberOfAffiliates,
      totalEarningsLastMonth: totalEarningsPeriod,
      totalTransactionsLastMonth: totalTransactionsPeriod,
      usedTransactionIds: [...notUsedTransactions.map((t) => t.id)],
    };

    await user.save();
  }

  async confirmContract(
    userId: string,
    code: string,
    paymentStr: string,
    contractId: string,
  ) {
    if (!userId || userId.trim().length === 0) {
      throw new BadRequestException('userId is required');
    }

    if (!code || code.trim().length === 0) {
      throw new BadRequestException('code is required');
    }

    try {
      const user = await this.userModel.findOne({ userId });
      if (!user) {
        throw new NotFoundException(`User ${userId} not found`);
      }

      if (user.transfers.length === 0) {
        throw new NotFoundException('No pending contracts found');
      }

      const contract = user.contracts.find((c) => c.contractId === contractId);
      if (!contract) {
        throw new NotFoundException(
          `Contract ${contractId} not found for user ${userId}`,
        );
      }

      if (contract.status !== 'pending') {
        throw new BadRequestException(`Contract ${contractId} is not pending`);
      }

      if (contract.secretCode !== code) {
        throw new UnauthorizedException('Invalid confirmation code');
      }

      contract.status = 'confirmed';
      contract.confirmedAt = new Date();

      const newTransfer = {
        amount: contract.amount - contract.taxAmount!,
        status: 'pending' as const,
        usedTransactionIds: contract.transcationsIds,
        createdAt: new Date(),
        paymentStr,
      };

      user.transfers.push(newTransfer);

      const savedUser = await user.save();
      this.logger.log(`Contract confirmed for ${userId}`);
      return savedUser;
    } catch (error) {
      this.logger.error(
        `Error confirming contract for ${userId}:`,
        error.message,
      );
      throw error;
    }
  }

  async adminConfirmContract(
    userId: string,
    contractId: string,
    platform: string,
    taxAmount: number,
  ) {
    if (!userId || userId.trim().length === 0) {
      throw new BadRequestException('userId is required');
    }

    try {
      const user = await this.userModel.findOne({ userId });
      if (!user) {
        throw new NotFoundException(`User ${userId} not found`);
      }

      const contract = user.contracts.find((c) => c.contractId === contractId);
      if (!contract) {
        throw new NotFoundException(
          `Contract ${contractId} not found for user ${userId}`,
        );
      }

      if (contract.status !== 'pending') {
        throw new BadRequestException(`Contract ${contractId} is not pending`);
      }

      contract.plataform = platform;
      contract.taxAmount = taxAmount;

      const savedUser = await user.save();
      this.logger.log(`Contract confirmed for ${userId} by admin`);
      return savedUser;
    } catch (error) {
      this.logger.error(
        `Error confirming contract for ${userId} by admin:`,
        error.message,
      );
      throw error;
    }
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
    const user = await this.userModel.findOne({ userId });
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    const transfer = user.transfers.find(
      (t) => t._id?.toString() === transferId,
    );
    if (!transfer) {
      throw new NotFoundException(
        `Transfer ${transferId} not found for user ${userId}`,
      );
    }

    if (newStatus.success) {
      transfer.status = 'completed';
      transfer.paymentProofUrl = newStatus.success.paymentProofUrl;
      transfer.internalPaymentProofUrl =
        newStatus.success.internalPaymentProofUrl;
      transfer.completedDate = newStatus.success.completedDate;
    } else {
      transfer.status = 'failed';
      transfer.failureReason = newStatus.failedReason;
    }

    await user.save();
    this.logger.log(`Transfer ${transferId} updated for user ${userId}`);
  }
}
