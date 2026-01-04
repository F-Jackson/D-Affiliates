import {
  Injectable,
  Logger,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  getTransactionManager,
  Transactional,
} from 'src/common/transactional.decorator';
import {
  ENUM_TRANSFER_SYNC_STATUS,
  ENUM_USER_STATUS,
  UserEntity,
} from 'src/entities/user.entity';
import { encrypt } from 'src/security/aes/encrypt.util';
import { StatsEntity } from 'src/entities/stats.entity';
import * as crypto from 'crypto';

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

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectDataSource()
    protected readonly dataSource: DataSource,
  ) {}

  @Transactional({ isolationLevel: 'READ COMMITTED' })
  async registerUser(userId: string, country: string) {
    const manager = getTransactionManager(this);
    const userRepo = manager.getRepository(UserEntity);
    const statsRepo = manager.getRepository(StatsEntity);

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

      const newStats = statsRepo.create({
        user: newUser,
      });

      newUser.stats = newStats;

      await statsRepo.save(newStats);
      const savedUser = await userRepo.save(newUser);
      this.logger.log(`New user registered (${country})`);
      return savedUser;
    } catch (error) {
      this.logger.error(`Error registering user`, error.message);
      throw error;
    }
  }

  private generateAffiliateCode() {
    return 'AFF_' + crypto.randomBytes(12).toString('hex').toUpperCase();
  }
}
