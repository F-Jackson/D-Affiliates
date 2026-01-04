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
import { ContractsEntity } from 'src/entities/contracts.entity';
import { UserEntity } from 'src/entities/user.entity';
import {
  decrypt,
  decryptDate,
  decryptNumber,
  decryptString,
  encrypt,
} from 'src/security/aes/encrypt.util';
import { DataSource } from 'typeorm';

@Injectable()
export class StatsService {
  private readonly logger = new Logger(StatsService.name);

  constructor(
    @InjectDataSource()
    protected readonly dataSource: DataSource,
  ) {}

  private async mapGet(user: UserEntity, isAdmin = false) {
      const stats = user.stats;


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
            confirmedAt: await decryptDate(c.confirmedAt),
            plataform: await decryptString(c.plataform),
            taxAmount: await decryptNumber(c.taxAmount),
          })),
        ),
      };

      return result;
  }

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

      return await this.mapGet(user, true);
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

      return await this.mapGet(user);
    } catch (error) {
      this.logger.error(`Error getting stats for ${userId}:`, error.message);
      throw error;
    }
  }

  @Transactional({ isolationLevel: 'READ COMMITTED' })
  async adminSendContractPendingToAffiliate(userId: string) {
    const manager = getTransactionManager(this);
    const contractsRepo = manager.getRepository(ContractsEntity);

    if (!userId || userId.trim().length === 0) {
      throw new BadRequestException('userId is required');
    }

    const contracts = await contractsRepo.find({
      where: {
        user: { userId: await encrypt(userId, false, 'sha3') },
        status: await encrypt('pending', false, 'sha3'),
      },
      relations: ['user'],
    });
    if (!contracts) {
      throw new NotFoundException(`Contracts not found`);
    }

    if (contracts.length === 0) {
      this.logger.log(`No pending contracts to send`);
      return;
    }

    const dcConstracts = await Promise.all(
      contracts.map(async (c) => ({
        contractId: await decryptString(c.contractId),
        status: await decryptString(c.status),
        amount: await decryptNumber(c.amount),
        confirmedAt: await decryptDate(c.confirmedAt),
        plataform: await decryptString(c.plataform),
        taxAmount: await decryptNumber(c.taxAmount),
      })),
    );

    for (const contract of dcConstracts) {
      this.logger.log(
        `Sending contract to ${userId}: Amount ${contract.amount}`,
      );
    }
  }

  @Transactional({ isolationLevel: 'READ COMMITTED' })
  async adminMakeContract(userId: string) {
    const manager = getTransactionManager(this);
    const userRepo = manager.getRepository(UserEntity);
    const contractsRepo = manager.getRepository(ContractsEntity);

    if (!userId || userId.trim().length === 0) {
      throw new BadRequestException('userId is required');
    }

    try {
      const user = await userRepo.findOne({
        where: { userId: await encrypt(userId, false, 'sha3') },
        relations: ['stats', 'contracts'],
      });
      if (!user) {
        throw new NotFoundException(`User ${userId} not found`);
      }

      const status = await decryptString(user.status);

      if (status === 'banned') {
        throw new UnauthorizedException('Banned user cannot make a contract');
      }

      if (status === 'suspended') {
        throw new UnauthorizedException(
          'Suspended user cannot make a contract',
        );
      }

      // Check if there are available earnings
      const earnedAmount = user.stats.totalEarningsLastMonth
        ? await decryptNumber(user.stats.totalEarningsLastMonth) || 0
        : 0;

      if (earnedAmount <= 0) {
        throw new BadRequestException(
          'No earnings available to create contract',
        );
      }

      let cdId = crypto.randomBytes(16).toString('hex').toUpperCase();
      const tries = 500000;

      while (true) {
        const encContractId = await encrypt(cdId, false, 'sha3');
        const existingContract = user.contracts.find(
          (c) => c.contractId === encContractId,
        );
        if (!existingContract) break;

        if (tries <= 0) {
          throw new Error('Could not generate unique ID for contract');
        }

        cdId = crypto.randomBytes(16).toString('hex').toUpperCase();
      }

      const newContract = {
        user,
        contractId: await encrypt(cdId, false, 'sha3'),
        status: await encrypt('pending', false, 'sha3'),
        amount: await encrypt(earnedAmount, false, 'sha3'),
        secretCode: await encrypt(crypto.randomBytes(4).toString('hex').toUpperCase(), false, 'sha3'),
        transcationsIds: user.stats.usedTransactionIds ? JSON.parse(await decryptString(user.stats.usedTransactionIds) || '[]') : [],
      };

      const contractEntity = contractsRepo.create(newContract);
      await contractsRepo.save(contractEntity);
      this.logger.log(
        `Contract created for ${userId} with amount ${earnedAmount}`,
      );
    } catch (error) {
      this.logger.error(
        `Error creating contract for ${userId}:`,
        error.message,
      );
      throw error;
    }
  }
}
