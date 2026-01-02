import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as crypto from 'crypto';
import { User, UserDocument } from '../schemas/app.schema';

@Injectable()
export class AffiliateService {
  private readonly logger = new Logger(AffiliateService.name);

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async registerUser(userId: string): Promise<UserDocument> {
    if (!userId || userId.trim().length === 0) {
      throw new BadRequestException('userId é obrigatório');
    }

    try {
      const existingUser = await this.userModel.findOne({ userId });
      if (existingUser) {
        throw new ConflictException('Usuário já está registrado');
      }

      const affiliateCode = this.generateAffiliateCode();

      const newUser = new this.userModel({
        userId,
        affiliateCode,
        status: 'active',
        affiliateds: [],
        transfers: [],
      });

      const savedUser = await newUser.save();
      this.logger.log(`Novo usuário registrado: ${userId}`);
      return savedUser;
    } catch (error) {
      this.logger.error(`Erro ao registrar usuário ${userId}:`, error.message);
      throw error;
    }
  }

  async syncAffiliate(userId: string, affiliateCode: string): Promise<void> {
    if (!userId || userId.trim().length === 0) {
      throw new BadRequestException('userId é obrigatório');
    }

    if (!affiliateCode || affiliateCode.trim().length === 0) {
      throw new BadRequestException('affiliateCode é obrigatório');
    }

    try {
      const alreadyAffiliated = await this.userModel.findOne({
        'affiliateds.userId': userId,
      });
      if (alreadyAffiliated) {
        throw new ConflictException(
          `Usuário ${userId} já é afiliado de outro código`,
        );
      }

      const user = await this.userModel.findOne({ affiliateCode });
      if (!user) {
        throw new NotFoundException(`Usuário ${userId} não encontrado`);
      }

      user.nextPayment = new Date();
      user.affiliateds.push({
        userId,
        transactions: [],
        createdAt: new Date(),
      });
      await user.save();

      this.logger.log(`Afiliado ${userId} sincronizado`);
    } catch (error) {
      this.logger.error(
        `Erro ao sincronizar afiliado ${userId}:`,
        error.message,
      );
      throw error;
    }
  }

  async syncTransfers(userId: string): Promise<UserDocument> {
    if (!userId || userId.trim().length === 0) {
      throw new BadRequestException('userId é obrigatório');
    }

    const user = await this.userModel.findOne({ userId });
    if (!user) {
      throw new NotFoundException(`Usuário ${userId} não encontrado`);
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
          (aff) => aff.userId === tx.affiliateId,
        );
        if (affiliated) {
          const existingTx = affiliated.transactions.find(
            (t) => t.id === tx.id,
          );
          if (!existingTx) {
            affiliated.transactions.push({
              id: tx.id,
              amount: tx.amount,
              productName: tx.productName,
              commissionRate: tx.commissionRate || 0,
              description: tx.description || '',
              transactionId: tx.externalTransactionId || '',
              status: tx.status || 'pending',
              isVerified: false,
              paymentProofUrl: tx.paymentProofUrl || '',
              date: tx.date ? new Date(tx.date) : new Date(),
            });
          }
        }
      });

      user.transferSyncStatus = 'completed';
      const savedUser = await user.save();

      this.logger.log(`Transferências sincronizadas para ${userId}`);
      return savedUser;
    } catch (error) {
      this.logger.error(
        `Erro ao sincronizar transferências de ${userId}:`,
        error.message,
      );

      user.transferSyncStatus = 'failed';
      await user.save();

      throw error;
    }
  }

  private async fetchExternalTransactions(
    affiliateIds: string[],
  ): Promise<any[]> {
    return [];
  }

  private generateAffiliateCode(): string {
    return 'AFF_' + crypto.randomBytes(12).toString('hex').toUpperCase();
  }
}
