import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as crypto from 'crypto';
import { User, UserDocument } from '../schemas/app.schema';

@Injectable()
export class StatsService {
  private readonly logger = new Logger(StatsService.name);

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async getAffiliatedStats(userId: string): Promise<any> {
    if (!userId || userId.trim().length === 0) {
      throw new BadRequestException('userId é obrigatório');
    }

    try {
      const user = await this.userModel.findOne({ userId });
      if (!user) {
        throw new NotFoundException(`Usuário ${userId} não encontrado`);
      }

      const stats = user.stats;

      return {
        userId,
        affiliateCode: user.affiliateCode,
        status: user.status,
        stats,
        numberOfAffiliates: user.affiliateds.length,
        totalTransfers: user.transfers.length,
        nextPayment: user.nextPayment,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao obter estatísticas de ${userId}:`,
        error.message,
      );
      throw error;
    }
  }

  async sendContractPendingToAffiliate(userId: string): Promise<void> {
    if (!userId || userId.trim().length === 0) {
      throw new BadRequestException('userId é obrigatório');
    }

    const user = await this.userModel.findOne({ userId });
    if (!user) {
      throw new NotFoundException(`Usuário ${userId} não encontrado`);
    }

    const pendingContracts = user.contracts.filter(
      (c) => c.status === 'pending',
    );
    if (pendingContracts.length === 0) {
      this.logger.log(`Nenhum contrato pendente para enviar para ${userId}`);
      return;
    }

    for (const contract of pendingContracts) {
      this.logger.log(
        `Enviando contrato para ${userId}: Valor ${contract.amount}`,
      );
    }
  }

  async makeContract(userId: string): Promise<UserDocument> {
    if (!userId || userId.trim().length === 0) {
      throw new BadRequestException('userId é obrigatório');
    }

    try {
      const user = await this.userModel.findOne({ userId });
      if (!user) {
        throw new NotFoundException(`Usuário ${userId} não encontrado`);
      }

      if (user.status === 'banned') {
        throw new UnauthorizedException(
          'Usuário banido não pode fazer contrato',
        );
      }

      if (user.status === 'suspended') {
        throw new UnauthorizedException(
          'Usuário suspenso não pode fazer contrato',
        );
      }

      // Verificar se há ganhos disponíveis
      const earnedAmount = user.stats?.totalEarningsLastMonth || 0;
      if (earnedAmount <= 0) {
        throw new BadRequestException(
          'Nenhum ganho disponível para criar contrato',
        );
      }

      const newContract = {
        contractId: crypto.randomBytes(8).toString('hex').toUpperCase(),
        status: 'pending' as const,
        amount: earnedAmount,
        secretCode: crypto.randomBytes(4).toString('hex').toUpperCase(),
        transcationsIds: user.stats?.usedTransactionIds || [],
        facialRecognitionCompleted: false,
      };

      user.contracts.push(newContract);

      const savedUser = await user.save();
      this.logger.log(
        `Contrato criado para ${userId} com valor de R$ ${earnedAmount}`,
      );
      return savedUser;
    } catch (error) {
      this.logger.error(
        `Erro ao criar contrato para ${userId}:`,
        error.message,
      );
      throw error;
    }
  }
}
