import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ConflictException,
  Inject,
  OnModuleInit,
} from '@nestjs/common';
import * as crypto from 'crypto';
import {
  ExternalTransfer,
  GetUserTransfersRequest,
  GetUserTransfersResponse,
} from 'src/proto/service_affiliates.proto';
import type { ClientGrpc } from '@nestjs/microservices';
import { Metadata } from '@grpc/grpc-js';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, In, LessThanOrEqual } from 'typeorm';
import {
  getTransactionManager,
  Transactional,
} from 'src/common/transactional.decorator';
import {
  ENUM_TRANSFER_SYNC_STATUS,
  ENUM_USER_STATUS,
  UserEntity,
} from 'src/entities/user.entity';
import { decrypt, encrypt } from 'src/security/aes/encrypt.util';
import { AffiliatedEntity } from 'src/entities/affiliated.entity';
import { TransferEntity } from 'src/entities/transfer.entity';
import { TransactionEntity } from 'src/entities/transaction.entity';

const ALLOWED_AFFILIATE_COUNTRY = [
  // Tier 1 — Professional creators / high maturity in affiliates
  'US', // United States (advanced performance marketing)
  'UK', // United Kingdom
  'CA', // Canada
  'AU', // Australia

  // Tier 2 — High volume of creators + lower cost
  'BR', // Brazil (YouTube, Instagram, TikTok very strong)
  'MX', // Mexico
  'AR', // Argentina
  'CO', // Colombia

  // Europe — SEO, review sites, technical affiliates
  'PT', // Portugal
  'ES', // Spain
  'PL', // Poland
  'RO', // Romania

  // Asia — massive creators, mobile-first
  'IN', // India
  'PH', // Philippines
  'ID', // Indonesia
  'VN', // Vietnam

  // Africa — organic growth and social traffic
  'NG', // Nigeria
  'KE', // Kenya

  // Middle East — creators + paid traffic
  'AE', // United Arab Emirates
];

export interface AffiliatesGrpcClient {
  GetUserTransfers(
    data: GetUserTransfersRequest,
    metadata?: Metadata,
  ): Promise<GetUserTransfersResponse>;
}

@Injectable()
export class AffiliateService implements OnModuleInit {
  private readonly logger = new Logger(AffiliateService.name);

  private affiliatesGrpcClient: AffiliatesGrpcClient;

  constructor(
    @Inject('SERVICES_AFFILIATES_PACKAGE') private readonly client: ClientGrpc,
    private readonly configService: ConfigService,
    @InjectDataSource()
    protected readonly dataSource: DataSource,
  ) {}

  onModuleInit() {
    this.affiliatesGrpcClient = this.client.getService<AffiliatesGrpcClient>(
      'ServiceAffiliatesService',
    );
  }

  private createMetadata(): Metadata {
    const apiKey =
      this.configService.get<string>('SERVICES_AFFILIATES_API_KEY') || 'X';

    const metadata = new Metadata();
    metadata.set('idempotency-key', uuidv4());
    metadata.set('x-api-key', apiKey);

    return metadata;
  }

  @Transactional({ isolationLevel: 'READ COMMITTED' })
  async registerUser(userId: string, country: string) {
    const manager = getTransactionManager(this);
    const userRepo = manager.getRepository(UserEntity);

    if (!userId || userId.trim().length === 0) {
      throw new BadRequestException('userId is required');
    }

    try {
      const existingUser = await userRepo.findOne({
        where: { userId: await encrypt(userId, false, 'sha3') },
      });
      if (existingUser) {
        throw new ConflictException('User is already registered');
      }

      if (!ALLOWED_AFFILIATE_COUNTRY.includes(country.toUpperCase())) {
        throw new BadRequestException(
          `Country ${country} is not supported for affiliates`,
        );
      }

      const affiliateCode = this.generateAffiliateCode();

      const newUser = userRepo.create({
        userId: await encrypt(userId, false, 'sha3'),
        affiliateCode: await encrypt(affiliateCode, false, 'sha3'),
        status: await encrypt(ENUM_USER_STATUS[0], false, 'sha3'),
        nextPayment: await encrypt(
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          false,
          'sha3',
        ),
        transferSyncStatus: await encrypt(
          ENUM_TRANSFER_SYNC_STATUS[0],
          false,
          'sha3',
        ),
      });

      const savedUser = await userRepo.save(newUser);
      this.logger.log(`New user registered: ${userId} (${country})`);
      return savedUser;
    } catch (error) {
      this.logger.error(`Error registering user ${userId}:`, error.message);
      throw error;
    }
  }

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
          (idx - 1) * BATCH_SIZE,
          idx * BATCH_SIZE,
        );
        let affs = await affRepo.find({
          where: {
            id: In(affsIds),
            createdAt: LessThanOrEqual(threeMonthsAgo),
          },
        });
        affs = await Promise.all(
          affs.map(async (a) => ({
            ...a,
            userId: await decrypt(a.userId, 'sha3'),
          })),
        );

        const affUserIds = await Promise.all(affs.map(async (a) => a.userId));

        const transactions = await this.fetchExternalTransactions(affUserIds);
        const newTxs: TransactionEntity[] = [];

        for (const tx of transactions) {
          try {
            const affiliated = affs.find((a) => a.userId === tx.userId);

            if (affiliated) {
              const existingTx = affiliated.transactions.find(
                async (t) => (await decrypt(t.transactionId, 'sha3')) === tx.id,
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

      user.transferSyncStatus = ENUM_TRANSFER_SYNC_STATUS[2];
      const savedUser = await userRepo.save(user);

      this.logger.log(`Transfers synced for ${userId}`);
      return savedUser;
    } catch (error) {
      this.logger.error(
        `Error syncing transfers for ${userId}:`,
        error.message,
      );

      user.transferSyncStatus = ENUM_TRANSFER_SYNC_STATUS[3];
      await userRepo.save(user);

      throw error;
    }
  }

  private async fetchExternalTransactions(
    affiliateIds: string[],
  ): Promise<ExternalTransfer[]> {
    const allTransfers: ExternalTransfer[] = [];

    for (const affiliateId of affiliateIds) {
      const response = await this.affiliatesGrpcClient.GetUserTransfers(
        {
          user_id: affiliateId,
        },
        this.createMetadata(),
      );

      allTransfers.push(
        ...response.transfers.map((tx) => ({
          ...tx,
          userId: affiliateId,
        })),
      );
    }

    return allTransfers;
  }

  private generateAffiliateCode() {
    return 'AFF_' + crypto.randomBytes(12).toString('hex').toUpperCase();
  }

  async getAffiliatesList(page: number) {
    const pageSize = 20;
    const skip = (page - 1) * pageSize;

    const users = await this.userModel
      .find({})
      .skip(skip)
      .limit(pageSize)
      .select('_id affiliateCode createdAt');

    const totalUsers = await this.userModel.countDocuments();

    return {
      affiliates: users,
      currentPage: page,
      totalPages: Math.ceil(totalUsers / pageSize),
      totalAffiliates: totalUsers,
    };
  }
}
