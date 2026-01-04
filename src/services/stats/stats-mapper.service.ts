import { Injectable } from '@nestjs/common';
import { UserEntity } from 'src/entities/user.entity';
import {
  decrypt,
  decryptDate,
  decryptNumber,
  decryptString,
} from 'src/security/aes/encrypt.util';

@Injectable()
export class StatsMapperService {
  async mapStatsResponse(user: UserEntity, isAdmin = false) {
    const stats = user.stats;

    return {
      affiliateCode: await decryptString(user.affiliateCode),
      status: await decryptString(user.status),
      numberOfAffiliates: user.affiliateds.length,
      stats: await this.mapStats(stats, isAdmin),
      transfers: await this.mapTransfers(user.transfers, isAdmin),
      nextPayment: user.nextPayment
        ? new Date(await decrypt(user.nextPayment))
        : undefined,
      constracts: await this.mapContracts(user.contracts, isAdmin),
    };
  }

  private async mapStats(stats: any, isAdmin = false) {
    return {
      numberOfAffiliates: await decryptNumber(stats.numberOfAffiliates),
      pendingWithdrawals: await decryptNumber(stats.pendingWithdrawals),
      totalEarnings: await decryptNumber(stats.totalEarnings),
      totalEarningsLastMonth: await decryptNumber(stats.totalEarningsLastMonth),
      totalWithdrawn: await decryptNumber(stats.totalWithdrawn),
      id: isAdmin ? stats.id : undefined,
      usedTransactionIds: isAdmin
        ? JSON.parse((await decryptString(stats.usedTransactionIds)) || '[]')
        : undefined,
      totalTransactionsLastMonth: await decryptNumber(
        stats.totalTransactionsLastMonth,
      ),
      createdAt: stats.createdAt,
      updatedAt: stats.updatedAt,
    };
  }

  private async mapTransfers(transfers: any[], isAdmin = false) {
    return Promise.all(
      transfers.map(async (t) => ({
        amount: await decryptNumber(t.amount),
        status: await decryptString(t.status),
        failureReason: await decryptString(t.failureReason),
        details: await decryptString(t.details),
        internalPaymentProofUrl: await decryptString(t.internalPaymentProofUrl),
        completedDate: t.completedDate
          ? new Date(await decrypt(t.completedDate))
          : undefined,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        id: isAdmin ? t.id : undefined,
        usedTransactionIds: isAdmin
          ? JSON.parse((await decryptString(t.usedTransactionIds)) || '[]')
          : undefined,
        paymentProofUrl: isAdmin
          ? await decryptString(t.paymentProofUrl)
          : undefined,
        paymentStr: isAdmin ? await decryptString(t.paymentStr) : undefined,
      })),
    );
  }

  private async mapContracts(contracts: any[], isAdmin = false) {
    return Promise.all(
      contracts.map(async (c) => ({
        contractId: await decryptString(c.contractId),
        status: await decryptString(c.status),
        amount: await decryptNumber(c.amount),
        confirmedAt: await decryptDate(c.confirmedAt),
        plataform: await decryptString(c.plataform),
        taxAmount: await decryptNumber(c.taxAmount),
        id: isAdmin ? c.id : undefined,
        secretCode: isAdmin ? await decryptString(c.secretCode) : undefined,
        transcationsIds: isAdmin
          ? JSON.parse((await decryptString(c.transcationsIds)) || '[]')
          : undefined,
        createdAt: isAdmin ? c.createdAt : undefined,
        updatedAt: isAdmin ? c.updatedAt : undefined,
      })),
    );
  }
}
