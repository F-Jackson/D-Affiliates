import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import {
  getTransactionManager,
  Transactional,
} from 'src/common/transactional.decorator';
import { UserEntity } from 'src/entities/user.entity';
import { decryptDate, decryptNumber, encrypt } from 'src/security/aes/encrypt.util';
import { DataSource } from 'typeorm';
import { StatsMapperService } from './stats/stats-mapper.service';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @InjectDataSource()
    protected readonly dataSource: DataSource,
    private readonly mapperService: StatsMapperService,
  ) {}

  @Transactional({ isolationLevel: 'READ COMMITTED' })
  async makeStatsPayment(userId: string) {
    const manager = getTransactionManager(this);
    const userRepo = manager.getRepository(UserEntity);

    const user = await userRepo.findOne({
      where: { userId: await encrypt(userId, false, 'sha3') },
      relations: ['affiliateds', 'transfers', 'stats'],
    });
    if (!user) {
      throw new NotFoundException(`User not found`);
    }

    const now = new Date();
    const nextPaymentDate = await decryptDate(user.nextPayment);
    if (nextPaymentDate && nextPaymentDate > now) {
      this.logger.log(
        `Stats payment is already scheduled for ${user.nextPayment}`,
      );
      return;
    }

    let totalEarnings = 0;
    for (const aff of user.affiliateds) {
      if (aff.transactions) {
        for (const t of aff.transactions) {
          const decryptedAmount = await decryptNumber(t.amount);
          totalEarnings += decryptedAmount || 0;
        }
      }
    }

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

  @Transactional({ isolationLevel: 'READ COMMITTED' })
  async confirmContract(
    userId: string,
    code: string,
    paymentStr: string,
    contractId: string,
  ) {
    const manager = getTransactionManager(this);
    const userRepo = manager.getRepository(UserEntity);

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

  @Transactional({ isolationLevel: 'READ COMMITTED' })
  async adminConfirmContract(
    userId: string,
    contractId: string,
    platform: string,
    taxAmount: number,
  ) {
    const manager = getTransactionManager(this);
    const userRepo = manager.getRepository(UserEntity);

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

  @Transactional({ isolationLevel: 'READ COMMITTED' })
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
    const manager = getTransactionManager(this);
    const userRepo = manager.getRepository(UserEntity);

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
