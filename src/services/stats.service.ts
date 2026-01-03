import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as crypto from 'crypto';
import { User, UserDocument } from '../entities/user.entity';

@Injectable()
export class StatsService {
  private readonly logger = new Logger(StatsService.name);

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async adminGetAffiliatedStats(userId: string) {
    if (!userId || userId.trim().length === 0) {
      throw new BadRequestException('userId is required');
    }

    try {
      const user = await this.userModel.findOne({ userId });
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

  async getAffiliatedStats(userId: string) {
    if (!userId || userId.trim().length === 0) {
      throw new BadRequestException('userId is required');
    }

    try {
      const user = await this.userModel.findOne({ userId });
      if (!user) {
        throw new NotFoundException(`User ${userId} not found`);
      }

      const stats = user.stats;

      return {
        affiliateCode: user.affiliateCode,
        status: user.status,
        stats: stats
          ? {
              totalEarnings: stats.totalEarnings,
              totalWithdrawn: stats.totalWithdrawn,
              pendingWithdrawals: stats.pendingWithdrawals,
              numberOfAffiliates: stats.numberOfAffiliates,
              totalEarningsLastMonth: stats.totalEarningsLastMonth,
            }
          : undefined,
        numberOfAffiliates: user.affiliateds.length,
        transfers: user.transfers.map((t) => ({
          amount: t.amount,
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
