import { Injectable } from '@nestjs/common';
import { UserService } from './user.service';
import { AffiliateSyncService } from './affiliate-sync.service';
import { AffiliateListService } from './affiliate-list.service';

@Injectable()
export class AffiliateService {
  constructor(
    private readonly userService: UserService,
    private readonly affiliateSyncService: AffiliateSyncService,
    private readonly affiliateListService: AffiliateListService,
  ) {}

  async registerUser(userId: string, country: string) {
    return this.userService.registerUser(userId, country);
  }

  async syncAffiliate(userId: string, affiliateCode: string) {
    return this.affiliateSyncService.syncAffiliate(userId, affiliateCode);
  }

  async syncTransfers(userId: string) {
    return this.affiliateSyncService.syncTransfers(userId);
  }

  async getAffiliatesList(page: number) {
    return this.affiliateListService.getAffiliatesList(page);
  }
}
