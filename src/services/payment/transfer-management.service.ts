import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import {
  getTransactionManager,
  Transactional,
} from 'src/common/transactional.decorator';
import { UserEntity } from 'src/entities/user.entity';
import { decryptString, encrypt } from 'src/security/aes/encrypt.util';
import { DataSource } from 'typeorm';

@Injectable()
export class TransferManagementService {
  private readonly logger = new Logger(TransferManagementService.name);

  constructor(
    @InjectDataSource()
    protected readonly dataSource: DataSource,
  ) {}

  @Transactional({ isolationLevel: 'READ COMMITTED' })
  async updateTransferStatus(
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
    const manager = getTransactionManager(this);
    const userRepo = manager.getRepository(UserEntity);

    if (!userId || userId.trim().length === 0) {
      throw new BadRequestException('userId is required');
    }

    try {
      const user = await userRepo.findOne({
        where: { userId: await encrypt(userId, false, 'sha3') },
        relations: ['transfers'],
      });

      if (!user) {
        throw new NotFoundException(`User not found`);
      }

      const transfer = user.transfers.find(
        (t) => t.id?.toString() === transferId,
      );

      if (!transfer) {
        throw new NotFoundException(
          `Transfer ${transferId} not found for user`,
        );
      }

      if (newStatus.success) {
        transfer.status = await encrypt('completed', false, 'sha3');
        transfer.paymentProofUrl = await encrypt(
          newStatus.success.paymentProofUrl,
          false,
          'sha3',
        );
        if (newStatus.success.internalPaymentProofUrl) {
          transfer.internalPaymentProofUrl = await encrypt(
            newStatus.success.internalPaymentProofUrl,
            false,
            'sha3',
          );
        }
        transfer.completedDate = await encrypt(
          newStatus.success.completedDate,
          false,
          'sha3',
        );
      } else {
        transfer.status = await encrypt('failed', false, 'sha3');
        transfer.failureReason = await encrypt(
          newStatus.failedReason || '',
          false,
          'sha3',
        );
      }

      if (newStatus.detail) {
        transfer.details = await encrypt(newStatus.detail, false, 'sha3');
      }

      await userRepo.save(user);
      this.logger.log(`Transfer ${transferId} updated for user`);
      return user;
    } catch (error) {
      this.logger.error(`Error updating transfer`, error.message);
      throw error;
    }
  }
}
