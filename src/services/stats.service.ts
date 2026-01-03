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

      const result = {
        affiliateCode: await decrypt(user.affiliateCode, 'sha3'),
        stats: {
          ...stats,
          numberOfAffiliates: stats.numberOfAffiliates
            ? Number(await decrypt(stats.numberOfAffiliates, 'sha3'))
            : undefined,
          pendingWithdrawals: stats.pendingWithdrawals
            ? Number(await decrypt(stats.pendingWithdrawals, 'sha3'))
            : undefined,
          totalEarnings: stats.totalEarnings
            ? Number(await decrypt(stats.totalEarnings, 'sha3'))
            : undefined,
          totalEarningsLastMonth: stats.totalEarningsLastMonth
            ? Number(await decrypt(stats.totalEarningsLastMonth, 'sha3'))
            : undefined,
          totalWithdrawn: stats.totalWithdrawn
            ? Number(await decrypt(stats.totalWithdrawn, 'sha3'))
            : undefined,
          usedTransactionIds: stats.usedTransactionIds
            ? Number(await decrypt(stats.usedTransactionIds, 'sha3'))
            : undefined,
        },
        status: await decrypt(user.status),
        numberOfAffiliates: user.affiliateds.length,
        transfers: user.transfers.map((t) => ({
          amount: Number(await decrypt(t.amount, 'sha3')),
          status: t.status,
          failureReason: t.failureReason,
          details: t.details,
          completedDate: t.completedDate,
        })),
        nextPayment: user.nextPayment,
        constracts: user.contracts.map((c) => ({
          contractId: c.contractId,
          status: c.status,
          amount: c.amount,
          confirmedAt: c.confirmedAt,
          plataform: c.plataform,
          taxAmount: c.taxAmount,
        })),
      };
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
