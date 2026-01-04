import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  getTransactionManager,
  Transactional,
} from 'src/common/transactional.decorator';
import { UserEntity } from 'src/entities/user.entity';
import { decryptString } from 'src/security/aes/encrypt.util';

@Injectable()
export class AffiliateListService {
  constructor(
    @InjectDataSource()
    protected readonly dataSource: DataSource,
  ) {}

  @Transactional({ isolationLevel: 'READ COMMITTED' })
  async getAffiliatesList(page: number) {
    const pageSize = 20;
    const skip = (page - 1) * pageSize;

    const manager = getTransactionManager(this);
    const userRepo = manager.getRepository(UserEntity);

    const [users, totalUsers] = await userRepo.findAndCount({
      skip,
      take: pageSize,
    });

    const affiliates = await Promise.all(
      users.map(async (user) => ({
        id: user.id,
        affiliateCode: await decryptString(user.affiliateCode),
        createdAt: user.createdAt,
      })),
    );

    return {
      affiliates,
      currentPage: page,
      totalPages: Math.ceil(totalUsers / pageSize),
      totalAffiliates: totalUsers,
    };
  }
}
