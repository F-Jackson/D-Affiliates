import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  getTransactionManager,
  Transactional,
} from 'src/common/transactional.decorator';
import { UserEntity } from 'src/entities/user.entity';
import {
  decryptNumber,
  decryptString,
  encrypt,
} from 'src/security/aes/encrypt.util';

@Injectable()
export class StatsCalculationService {
  private readonly logger = new Logger(StatsCalculationService.name);

  constructor(
    @InjectDataSource()
    protected readonly dataSource: DataSource,
  ) {}

  @Transactional({ isolationLevel: 'READ COMMITTED' })
  async calculateAndUpdateStats(userId: string) {
    const manager = getTransactionManager(this);
    const userRepo = manager.getRepository(UserEntity);

    const user = await userRepo.findOne({
      where: { userId: await encrypt(userId, false, 'sha3') },
      relations: ['affiliateds', 'transfers', 'stats'],
    });

    if (!user) {
      throw new Error(`User not found`);
    }

    const now = new Date();
    const nextPaymentDate = user.nextPayment
      ? new Date(await decryptNumber(user.nextPayment) || 0)
      : null;

    if (nextPaymentDate && nextPaymentDate > now) {
      this.logger.log(
        `Stats payment is already scheduled for ${nextPaymentDate}`,
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

    // Calculate withdrawn and pending
    let totalWithdrawn = 0;
    let pendingWithdrawals = 0;

    for (const transfer of user.transfers) {
      const status = await decryptString(transfer.status);
      const amount = await decryptNumber(transfer.amount);

      if (status === 'completed') {
        totalWithdrawn += amount || 0;
      } else if (status === 'pending') {
        pendingWithdrawals += amount || 0;
      }
    }

    // Get active affiliates (3+ months old)
    const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const affiliatesToCalculate = user.affiliateds.filter(
      (aff) => aff.createdAt <= threeMonthsAgo,
    );

    // Get used transaction IDs from previous transfers
    const usedTransactionIds: string[] = [];
    for (const transfer of user.transfers) {
      const ids = await decryptString(transfer.usedTransactionIds);
      if (ids) {
        const parsed = JSON.parse(ids);
        usedTransactionIds.push(...parsed);
      }
    }

    // Get unused transactions
    const notUsedTransactions = affiliatesToCalculate
      .flatMap((aff) => aff.transactions || [])
      .filter((t) => !usedTransactionIds.includes(t.id));

    // Calculate period earnings
    let totalEarningsLastMonth = 0;
    for (const t of notUsedTransactions) {
      const amount = await decryptNumber(t.amount);
      totalEarningsLastMonth += amount || 0;
    }

    const totalTransactionsLastMonth = notUsedTransactions.length;

    // Update stats with encrypted values
    if (user.stats) {
      user.stats.totalEarnings = await encrypt(totalEarnings, false, 'sha3');
      user.stats.totalWithdrawn = await encrypt(totalWithdrawn, false, 'sha3');
      user.stats.pendingWithdrawals = await encrypt(
        pendingWithdrawals,
        false,
        'sha3',
      );
      user.stats.numberOfAffiliates = await encrypt(
        affiliatesToCalculate.length,
        false,
        'sha3',
      );
      user.stats.totalEarningsLastMonth = await encrypt(
        totalEarningsLastMonth,
        false,
        'sha3',
      );
      user.stats.totalTransactionsLastMonth = await encrypt(
        totalTransactionsLastMonth,
        false,
        'sha3',
      );
      user.stats.usedTransactionIds = await encrypt(
        JSON.stringify(notUsedTransactions.map((t) => t.id)),
        false,
        'sha3',
      );

      await userRepo.save(user);
      this.logger.log(`Stats updated for user ${userId}`);
    }

    return user;
  }
}
