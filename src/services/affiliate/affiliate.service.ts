import { Injectable, Logger } from '@nestjs/common';
import { UserService } from './user.service';
import { AffiliateSyncService } from './affiliate-sync.service';
import { AffiliateListService } from './affiliate-list.service';

/**
 * AffiliateService - Orquestrador principal de operações de afiliados
 *
 * Coordena as operações dos serviços especializados:
 * - UserService: Gerenciamento de usuários
 * - AffiliateSyncService: Sincronização de afiliados e transferências
 * - AffiliateListService: Listagem de afiliados
 */
@Injectable()
export class AffiliateService {
  private readonly logger = new Logger(AffiliateService.name);

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
