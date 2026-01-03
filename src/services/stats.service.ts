import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import * as crypto from 'crypto';
import {
  getTransactionManager,
  Transactional,
} from 'src/common/transactional.decorator';
import { UserEntity } from 'src/entities/user.entity';
import { decrypt, encrypt } from 'src/security/aes/encrypt.util';
import { DataSource } from 'typeorm';

@Injectable()
export class StatsService {
  private readonly logger = new Logger(StatsService.name);

  constructor(
    @InjectDataSource()
    protected readonly dataSource: DataSource,
  ) {}

  @Transactional({ isolationLevel: 'READ COMMITTED' })
  async adminGetAffiliatedStats(userId: string) {
    const manager = getTransactionManager(this);
    const userRepo = manager.getRepository(UserEntity);

    if (!userId || userId.trim().length === 0) {
      throw new BadRequestException('userId is required');
    }

    try {
      const user = await userRepo.findOne({
        where: { userId: await encrypt(userId, false, 'sha3') },
      });
      if (!user) {
        throw new NotFoundException(`User ${userId} not found`);
      }

      return user;
    } catch (error) {
      this.logger.error(
        `Error getting admin stats for ${userId}:`,
        error.message,
      );
      throw error;
    }
  }

  @Transactional({ isolationLevel: 'READ COMMITTED' })
  async getAffiliatedStats(userId: string) {
    const manager = getTransactionManager(this);
    const userRepo = manager.getRepository(UserEntity);

    if (!userId || userId.trim().length === 0) {
      throw new BadRequestException('userId is required');
    }

    try {
      const user = await userRepo.findOne({
        where: { userId: await encrypt(userId, false, 'sha3') },
        relations: ['stats', 'transfers', 'constracts'],
      });
      if (!user) {
        throw new NotFoundException(`User ${userId} not found`);
      }

      const stats = user.stats;
      const ALGO = 'sha3';

      const decryptString = async (value?: string) =>
        value ? await decrypt(value, ALGO) : undefined;

      const decryptNumber = async (value?: string) =>
        value ? Number(await decrypt(value, ALGO)) : undefined;

      const result = {
        affiliateCode: await decryptString(user.affiliateCode),

        status: await decryptString(user.status),

        numberOfAffiliates: user.affiliateds.length,

        stats: {
          ...stats,
          numberOfAffiliates: await decryptNumber(stats.numberOfAffiliates),
          pendingWithdrawals: await decryptNumber(stats.pendingWithdrawals),
          totalEarnings: await decryptNumber(stats.totalEarnings),
          totalEarningsLastMonth: await decryptNumber(
            stats.totalEarningsLastMonth,
          ),
          totalWithdrawn: await decryptNumber(stats.totalWithdrawn),
        },

        transfers: await Promise.all(
          user.transfers.map(async (t) => ({
            ...t,
            amount: await decryptNumber(t.amount),
            status: await decryptString(t.status),
            failureReason: await decryptString(t.failureReason),
            details: await decryptString(t.details),
            internalPaymentProofUrl: await decryptString(
              t.internalPaymentProofUrl,
            ),
            completedDate: t.completedDate
              ? new Date(await decrypt(t.completedDate))
              : undefined,
          })),
        ),

        nextPayment: user.nextPayment
          ? new Date(await decrypt(user.nextPayment))
          : undefined,

        constracts: await Promise.all(
          user.contracts.map(async (c) => ({
            contractId: await decryptString(c.contractId),
            status: await decryptString(c.status),
            amount: await decryptNumber(c.amount),
            confirmedAt: c.confirmedAt,
            plataform: await decryptString(c.plataform),
            taxAmount: await decryptNumber(c.taxAmount),
          })),
        ),
      };

      return result;
    } catch (error) {
      this.logger.error(`Error getting stats for ${userId}:`, error.message);
      throw error;
    }
  }

  async adminSendContractPendingToAffiliate(userId: string) {
    if (!userId || userId.trim().length === 0) {
      throw new BadRequestException('userId is required');
    }

    const user = await this.userModel.findOne({ userId });
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    const pendingContracts = user.contracts.filter(
      (c) => c.status === 'pending',
    );
    if (pendingContracts.length === 0) {
      this.logger.log(`No pending contracts to send for ${userId}`);
      return;
    }

    for (const contract of pendingContracts) {
      this.logger.log(
        `Sending contract to ${userId}: Amount ${contract.amount}`,
      );
    }
  }

  async adminMakeContract(userId: string) {
    if (!userId || userId.trim().length === 0) {
      throw new BadRequestException('userId is required');
    }

    try {
      const user = await this.userModel.findOne({ userId });
      if (!user) {
        throw new NotFoundException(`User ${userId} not found`);
      }

      if (user.status === 'banned') {
        throw new UnauthorizedException('Banned user cannot make a contract');
      }

      if (user.status === 'suspended') {
        throw new UnauthorizedException(
          'Suspended user cannot make a contract',
        );
      }

      // Check if there are available earnings
      const earnedAmount = user.stats?.totalEarningsLastMonth || 0;
      if (earnedAmount <= 0) {
        throw new BadRequestException(
          'No earnings available to create contract',
        );
      }

      let cdId = crypto.randomBytes(16).toString('hex').toUpperCase();
      const tries = 500000;

      while (true) {
        const existingContract = user.contracts.find(
          (c) => c.contractId === cdId,
        );
        if (!existingContract) break;

        if (tries <= 0) {
          throw new Error('Could not generate unique ID for contract');
        }

        cdId = crypto.randomBytes(16).toString('hex').toUpperCase();
      }

      const newContract = {
        contractId: cdId,
        status: 'pending' as const,
        amount: earnedAmount,
        secretCode: crypto.randomBytes(4).toString('hex').toUpperCase(),
        transcationsIds: user.stats?.usedTransactionIds || [],
      };

      user.contracts.push(newContract);

      const savedUser = await user.save();
      this.logger.log(
        `Contract created for ${userId} with amount ${earnedAmount}`,
      );
      return savedUser;
    } catch (error) {
      this.logger.error(
        `Error creating contract for ${userId}:`,
        error.message,
      );
      throw error;
    }
  }
}
