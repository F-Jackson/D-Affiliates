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
import {
  decryptNumber,
  decryptString,
  encrypt,
} from 'src/security/aes/encrypt.util';
import { DataSource } from 'typeorm';

@Injectable()
export class ContractConfirmationService {
  private readonly logger = new Logger(ContractConfirmationService.name);

  constructor(
    @InjectDataSource()
    protected readonly dataSource: DataSource,
  ) {}

  @Transactional({ isolationLevel: 'READ COMMITTED' })
  async confirmUserContract(
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
      const user = await userRepo.findOne({
        where: { userId: await encrypt(userId, false, 'sha3') },
        relations: ['contracts', 'transfers'],
      });

      if (!user) {
        throw new NotFoundException(`User not found`);
      }

      if (user.contracts.length === 0) {
        throw new NotFoundException('No contracts found');
      }

      const encryptedContractId = await encrypt(contractId, false, 'sha3');
      const contract = user.contracts.find(
        (c) => c.contractId === encryptedContractId,
      );

      if (!contract) {
        throw new NotFoundException(
          `Contract ${contractId} not found for user`,
        );
      }

      const contractStatus = await decryptString(contract.status);
      if (contractStatus !== 'pending') {
        throw new BadRequestException(`Contract ${contractId} is not pending`);
      }

      const secretCode = await decryptString(contract.secretCode);
      if (secretCode !== code) {
        throw new UnauthorizedException('Invalid confirmation code');
      }

      // Update contract
      contract.status = await encrypt('confirmed', false, 'sha3');
      contract.confirmedAt = await encrypt(new Date(), false, 'sha3');

      // Create transfer record
      const contractAmount = (await decryptNumber(contract.amount)) || 0;
      const contractTaxAmount = (await decryptNumber(contract.taxAmount)) || 0;
      const transferAmount = contractAmount - contractTaxAmount;

      const newTransfer = {
        amount: await encrypt(transferAmount, false, 'sha3'),
        status: await encrypt('pending', false, 'sha3'),
        usedTransactionIds: contract.transcationsIds
          ? await encrypt(contract.transcationsIds, false, 'sha3')
          : await encrypt('[]', false, 'sha3'),
        createdAt: new Date(),
        paymentStr: await encrypt(paymentStr, false, 'sha3'),
      };

      user.transfers = user.transfers || [];
      user.transfers.push(newTransfer as any);

      await userRepo.save(user);
      this.logger.log(`Contract confirmed`);
      return user;
    } catch (error) {
      this.logger.error(`Error confirming contract`, error.message);
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
      const user = await userRepo.findOne({
        where: { userId: await encrypt(userId, false, 'sha3') },
        relations: ['contracts'],
      });

      if (!user) {
        throw new NotFoundException(`User not found`);
      }

      const encryptedContractId2 = await encrypt(contractId, false, 'sha3');
      const contract = user.contracts.find(
        (c) => c.contractId === encryptedContractId2,
      );

      if (!contract) {
        throw new NotFoundException(
          `Contract ${contractId} not found for user`,
        );
      }

      const contractStatus = await decryptString(contract.status);
      if (contractStatus !== 'pending') {
        throw new BadRequestException(`Contract ${contractId} is not pending`);
      }

      // Update contract with platform and tax
      contract.plataform = await encrypt(platform, false, 'sha3');
      contract.taxAmount = await encrypt(taxAmount, false, 'sha3');

      await userRepo.save(user);
      this.logger.log(`Contract confirmed for by admin`);
      return user;
    } catch (error) {
      this.logger.error(
        `Error confirming contract for by admin`,
        error.message,
      );
      throw error;
    }
  }
}
