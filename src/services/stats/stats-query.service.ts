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
import { encrypt } from 'src/security/aes/encrypt.util';
import { DataSource } from 'typeorm';
import { StatsMapperService } from './stats-mapper.service';

@Injectable()
export class StatsQueryService {
  private readonly logger = new Logger(StatsQueryService.name);

  constructor(
    @InjectDataSource()
    protected readonly dataSource: DataSource,
    private readonly statsMapperService: StatsMapperService,
  ) {}

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

      return await this.statsMapperService.mapStatsResponse(user, false);
    } catch (error) {
      this.logger.error(`Error getting stats`, error.message);
      throw error;
    }
  }

  @Transactional({ isolationLevel: 'READ COMMITTED' })
  async getAdminAffiliatedStats(userId: string) {
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
        throw new NotFoundException(`User not found`);
      }

      return await this.statsMapperService.mapStatsResponse(user, true);
    } catch (error) {
      this.logger.error(`Error getting admin stats`, error.message);
      throw error;
    }
  }
}
