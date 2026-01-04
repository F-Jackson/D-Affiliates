import {
  Injectable,
  Logger,
  BadRequestException,
  ConflictException,
  NotFoundException,
  Inject,
  OnModuleInit,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, In, LessThanOrEqual } from 'typeorm';
import {
  getTransactionManager,
  Transactional,
} from 'src/common/transactional.decorator';
import {
  ENUM_TRANSFER_SYNC_STATUS,
  UserEntity,
} from 'src/entities/user.entity';
import { decryptString, encrypt } from 'src/security/aes/encrypt.util';
import { AffiliatedEntity } from 'src/entities/affiliated.entity';
import { TransactionEntity } from 'src/entities/transaction.entity';
import { TransactionSyncService } from './transaction-sync.service';

@Injectable()
export class AffiliateSyncService implements OnModuleInit {
  private readonly logger = new Logger(AffiliateSyncService.name);

  constructor(
    @InjectDataSource()
    protected readonly dataSource: DataSource,
    private readonly transactionSyncService: TransactionSyncService,
  ) {}

  onModuleInit() {}

  @Transactional({ isolationLevel: 'READ COMMITTED' })
  async syncAffiliate(userId: string, affiliateCode: string) {
    const manager = getTransactionManager(this);
    const userRepo = manager.getRepository(UserEntity);
    const affRepo = manager.getRepository(AffiliatedEntity);

    if (!userId || userId.trim().length === 0) {
      throw new BadRequestException('userId is required');
    }

    if (!affiliateCode || affiliateCode.trim().length === 0) {
      throw new BadRequestException('affiliateCode is required');
    }

    try {
      const alreadyAffiliated = await affRepo.findOne({
        where: { user: { userId: await encrypt(userId, false, 'sha3') } },
        relations: ['user'],
      });
      if (alreadyAffiliated) {
        throw new ConflictException(
          `User ${userId} is already affiliated with another code`,
        );
      }

      const user = await userRepo.findOne({
        where: { affiliateCode: await encrypt(affiliateCode, false, 'sha3') },
      });
      if (!user) {
        throw new NotFoundException(`User ${userId} not found`);
      }

      const newAff = affRepo.create({
        user,
        userId: await encrypt(userId, false, 'sha3'),
      });

      await affRepo.save(newAff);
      this.logger.log(`Affiliate ${userId} synced`);
    } catch (error) {
      this.logger.error(`Error syncing affiliate ${userId}:`, error.message);
      throw error;
    }
  }

  @Transactional({ isolationLevel: 'READ COMMITTED' })
  async syncTransfers(userId: string) {
    const manager = getTransactionManager(this);
    const userRepo = manager.getRepository(UserEntity);
    const transactionRepo = manager.getRepository(TransactionEntity);
    const affRepo = manager.getRepository(AffiliatedEntity);

    if (!userId || userId.trim().length === 0) {
      throw new BadRequestException('userId is required');
    }

    const user = await userRepo.findOne({
      where: { userId: await encrypt(userId, false, 'sha3') },
    });
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    try {
      user.transferSyncStatus = await encrypt(
        ENUM_TRANSFER_SYNC_STATUS[1],
        false,
        'sha3',
      );
      await userRepo.save(user);

      const threeMonthsAgo = new Date(
        Date.now() - 60 * 60 * 1000 * 24 * 30 * 3,
      );

      const BATCH_SIZE = 100;
      let idx = 0;

      while (true) {
        const affsIds = user.affiliateds.slice(
          idx * BATCH_SIZE,
          (idx + 1) * BATCH_SIZE,
        );

        if (affsIds.length === 0) break;

        let affs = await affRepo.find({
          where: {
            id: In(affsIds),
            createdAt: LessThanOrEqual(threeMonthsAgo),
          },
        });
        affs = await Promise.all(
          affs.map(async (a) => ({
            ...a,
            userId: (await decryptString(a.userId)) || '',
          })),
        );

        const affUserIds = await Promise.all(affs.map(async (a) => a.userId));

        const transactions =
          await this.transactionSyncService.fetchExternalTransactions(
            affUserIds,
          );
        const newTxs: TransactionEntity[] = [];

        for (const tx of transactions) {
          try {
            const affiliated = affs.find((a) => a.userId === tx.userId);

            if (affiliated) {
              const txDecryptedIds = await Promise.all(
                affiliated.transactions.map((t) =>
                  decryptString(t.transactionId),
                ),
              );
              const existingTx = affiliated.transactions.find(
                (t, i) => txDecryptedIds[i] === tx.id,
              );

              if (!existingTx && tx.product_name && tx.commission_rate) {
                const data = {
                  amount: await encrypt(tx.amount, false, 'sha3'),
                  productName: await encrypt(tx.product_name, false, 'sha3'),
                  commissionRate: await encrypt(
                    tx.commission_rate,
                    false,
                    'sha3',
                  ),
                  transactionId: await encrypt(tx.id, false, 'sha3'),
                  date: await encrypt(
                    new Date(tx.created_at * 1000),
                    false,
                    'sha3',
                  ),
                  direction: await encrypt(tx.direction, false, 'sha3'),
                };

                const newTransaction = transactionRepo.create(data);
                newTxs.push(newTransaction);
              }
            }
          } catch (e: any) {}
        }

        await transactionRepo.save(newTxs);

        if (affsIds.length >= BATCH_SIZE) break;

        idx++;
      }

      user.transferSyncStatus = await encrypt(
        ENUM_TRANSFER_SYNC_STATUS[2],
        false,
        'sha3',
      );
      const savedUser = await userRepo.save(user);

      this.logger.log(`Transfers synced for ${userId}`);
      return savedUser;
    } catch (error) {
      this.logger.error(
        `Error syncing transfers for ${userId}:`,
        error.message,
      );

      user.transferSyncStatus = await encrypt(
        ENUM_TRANSFER_SYNC_STATUS[3],
        false,
        'sha3',
      );
      await userRepo.save(user);

      throw error;
    }
  }
}
