import { Injectable } from '@nestjs/common';
import { StatsQueryService } from './stats-query.service';
import { ContractManagementService } from './contract-management.service';

@Injectable()
export class StatsService {
  constructor(
    private readonly statsQueryService: StatsQueryService,
    private readonly contractManagementService: ContractManagementService,
  ) {}

  async getAffiliatedStats(userId: string) {
    return this.statsQueryService.getAffiliatedStats(userId);
  }

  async adminGetAffiliatedStats(userId: string) {
    return this.statsQueryService.getAdminAffiliatedStats(userId);
  }

  async adminSendContractPendingToAffiliate(userId: string) {
    return this.contractManagementService.sendPendingContractsToAffiliate(
      userId,
    );
  }

  async adminMakeContract(userId: string) {
    return this.contractManagementService.createContract(userId);
  }
}
