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
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class StatsService {
  private readonly logger = new Logger(StatsService.name);

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async adminGetAffiliatedStats(userId: string) {
    if (!userId || userId.trim().length === 0) {
      throw new BadRequestException('userId é obrigatório');
    }

    try {
      const user = await this.userModel.findOne({ userId });
      if (!user) {
        throw new NotFoundException(`Usuário ${userId} não encontrado`);
      }

      return user;
    } catch (error) {
      this.logger.error(
        `Erro ao obter estatísticas administrativas de ${userId}:`,
        error.message,
      );
      throw error;
    }
  }

  async getAffiliatedStats(userId: string) {
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
        affiliateCode: user.affiliateCode,
        status: user.status,
        stats,
        numberOfAffiliates: user.affiliateds.length,
        totalTransfers: user.transfers.length,
        nextPayment: user.nextPayment,
        constracts: user.contracts,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao obter estatísticas de ${userId}:`,
        error.message,
      );
      throw error;
    }
  }

  async sendContractPendingToAffiliate(userId: string) {
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

  async adminMakeContract(userId: string) {
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

      let cdId = crypto.randomBytes(16).toString('hex').toUpperCase();
      const tries = 500000;

      while (true) {
        const existingContract = user.contracts.find(
          (c) => c.contractId === cdId,
        );
        if (!existingContract) break;

        if (tries <= 0) {
          throw new Error('Não foi possível gerar um ID único para o contrato');
        }

        cdId = crypto.randomBytes(16).toString('hex').toUpperCase();
      }

      const newContract = {
        contractId: cdId,
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
