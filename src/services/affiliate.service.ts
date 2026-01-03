import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ConflictException,
  Inject,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as crypto from 'crypto';
import { User, UserDocument } from '../schemas/user.schema';
import {
  ExternalTransfer,
  GetUserTransfersRequest,
  GetUserTransfersResponse,
} from 'src/proto/service_affiliates.proto';
import type { ClientGrpc } from '@nestjs/microservices';
import { Metadata } from '@grpc/grpc-js';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

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
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @Inject('SERVICES_AFFILIATES_GRPC') private readonly client: ClientGrpc,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    this.affiliatesGrpcClient = this.client.getService<AffiliatesGrpcClient>(
      'ServicesAffiliatesGrpc',
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

  async registerUser(userId: string, country: string) {
    if (!userId || userId.trim().length === 0) {
      throw new BadRequestException('userId is required');
    }

    try {
      const existingUser = await this.userModel.findOne({ userId });
      if (existingUser) {
        throw new ConflictException('User is already registered');
      }

      if (!ALLOWED_AFFILIATE_COUNTRY.includes(country.toUpperCase())) {
        throw new BadRequestException(
          `Country ${country} is not supported for affiliates`,
        );
      }

      const affiliateCode = this.generateAffiliateCode();

      const newUser = new this.userModel({
        userId,
        affiliateCode,
        status: 'active',
        affiliateds: [],
        transfers: [],
        nextPayment: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      const savedUser = await newUser.save();
      this.logger.log(`New user registered: ${userId} (${country})`);
      return savedUser;
    } catch (error) {
      this.logger.error(`Error registering user ${userId}:`, error.message);
      throw error;
    }
  }

  async syncAffiliate(userId: string, affiliateCode: string) {
    if (!userId || userId.trim().length === 0) {
      throw new BadRequestException('userId is required');
    }

    if (!affiliateCode || affiliateCode.trim().length === 0) {
      throw new BadRequestException('affiliateCode is required');
    }

    try {
      const alreadyAffiliated = await this.userModel.findOne({
        'affiliateds.userId': userId,
      });
      if (alreadyAffiliated) {
        throw new ConflictException(
          `User ${userId} is already affiliated with another code`,
        );
      }

      const user = await this.userModel.findOne({ affiliateCode });
      if (!user) {
        throw new NotFoundException(`User ${userId} not found`);
      }

      user.affiliateds.push({
        userId,
        transactions: [],
        createdAt: new Date(),
      });
      await user.save();

      this.logger.log(`Affiliate ${userId} synced`);
    } catch (error) {
      this.logger.error(`Error syncing affiliate ${userId}:`, error.message);
      throw error;
    }
  }

  async syncTransfers(userId: string) {
    if (!userId || userId.trim().length === 0) {
      throw new BadRequestException('userId is required');
    }

    const user = await this.userModel.findOne({ userId });
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    try {
      user.transferSyncStatus = 'syncing';
      await user.save();

      const threeMonthsAgo = new Date(
        Date.now() - 60 * 60 * 1000 * 24 * 30 * 3,
      );
      const affiliatesToCalculate = user.affiliateds.filter((aff) => {
        return aff.createdAt <= threeMonthsAgo;
      });

      const transactions = await this.fetchExternalTransactions(
        affiliatesToCalculate.map((a) => a.userId),
      );

      transactions.forEach((tx) => {
        const affiliated = user.affiliateds.find(
          (aff) => aff.userId === tx.userId,
        );
        if (affiliated) {
          const existingTx = affiliated.transactions.find(
            (t) => t.id === tx.id,
          );
          if (!existingTx && tx.product_name && tx.commission_rate) {
            affiliated.transactions.push({
              id: tx.id,
              amount: tx.amount,
              productName: tx.product_name,
              commissionRate: tx.commission_rate,
              transactionId: tx.id,
              date: new Date(tx.created_at * 1000),
              direction: tx.direction as 'in' | 'out',
            });
          }
        }
      });

      user.transferSyncStatus = 'completed';
      const savedUser = await user.save();

      this.logger.log(`Transfers synced for ${userId}`);
      return savedUser;
    } catch (error) {
      this.logger.error(
        `Error syncing transfers for ${userId}:`,
        error.message,
      );

      user.transferSyncStatus = 'failed';
      await user.save();

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
