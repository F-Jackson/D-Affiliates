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
  decryptNumber,
  decryptString,
  encrypt,
} from 'src/security/aes/encrypt.util';
import { DataSource } from 'typeorm';

@Injectable()
export class ContractManagementService {
  private readonly logger = new Logger(ContractManagementService.name);

  constructor(
    @InjectDataSource()
    protected readonly dataSource: DataSource,
  ) {}

  @Transactional({ isolationLevel: 'READ COMMITTED' })
  async sendPendingContractsToAffiliate(userId: string) {
    const manager = getTransactionManager(this);
    const contractsRepo = manager.getRepository(ContractsEntity);

    if (!userId || userId.trim().length === 0) {
      throw new BadRequestException('userId is required');
    }

    try {
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

      const decryptedContracts = await Promise.all(
        contracts.map(async (c) => ({
          contractId: await decryptString(c.contractId),
          status: await decryptString(c.status),
          amount: await decryptNumber(c.amount),
          plataform: await decryptString(c.plataform),
          taxAmount: await decryptNumber(c.taxAmount),
        })),
      );

      for (const contract of decryptedContracts) {
        this.logger.log(`Sending contract Amount ${contract.amount}`);
      }

      return decryptedContracts;
    } catch (error) {
      this.logger.error(`Error sending contracts`, error.message);
      throw error;
    }
  }

  @Transactional({ isolationLevel: 'READ COMMITTED' })
  async createContract(userId: string) {
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
        throw new NotFoundException(`User not found`);
      }

      // Validate user status
      const status = await decryptString(user.status);
      if (status) {
        this.validateUserStatusForContract(status);
      }

      // Get available earnings
      const earnedAmount = this.getAvailableEarnings(user.stats);

      if (earnedAmount <= 0) {
        throw new BadRequestException(
          'No earnings available to create contract',
        );
      }

      // Generate unique contract ID
      const contractId = await this.generateUniqueContractId(user.contracts);

      // Create new contract
      const newContract = {
        user,
        contractId: await encrypt(contractId, false, 'sha3'),
        status: await encrypt('pending', false, 'sha3'),
        amount: await encrypt(earnedAmount, false, 'sha3'),
        secretCode: await encrypt(
          crypto.randomBytes(4).toString('hex').toUpperCase(),
          false,
          'sha3',
        ),
        transcationsIds: user.stats.usedTransactionIds
          ? JSON.parse(
              (await decryptString(user.stats.usedTransactionIds)) || '[]',
            )
          : [],
      };

      const contractEntity = contractsRepo.create(newContract);
      await contractsRepo.save(contractEntity);

      this.logger.log(`Contract created with amount ${earnedAmount}`);

      return contractEntity;
    } catch (error) {
      this.logger.error(`Error creating contract`, error.message);
      throw error;
    }
  }

  private validateUserStatusForContract(status: string) {
    if (status === 'banned') {
      throw new UnauthorizedException('Banned user cannot make a contract');
    }

    if (status === 'suspended') {
      throw new UnauthorizedException('Suspended user cannot make a contract');
    }
  }

  private getAvailableEarnings(stats: any): number {
    return stats.totalEarningsLastMonth
      ? (stats.totalEarningsLastMonth as any) || 0
      : 0;
  }

  private async generateUniqueContractId(
    existingContracts: ContractsEntity[],
  ): Promise<string> {
    let cdId = crypto.randomBytes(16).toString('hex').toUpperCase();
    let attempts = 0;
    const maxAttempts = 500000;

    while (attempts < maxAttempts) {
      const encContractId = await encrypt(cdId, false, 'sha3');
      const exists = existingContracts.find(
        (c) => c.contractId === encContractId,
      );

      if (!exists) {
        return cdId;
      }

      cdId = crypto.randomBytes(16).toString('hex').toUpperCase();
      attempts++;
    }

    throw new Error('Could not generate unique ID for contract');
  }
}
