import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as crypto from 'crypto';
import { User, UserDocument } from '../schemas/app.schema';

interface PaymentMethod {
  type: 'bank_transfer' | 'paypal' | 'crypto';
  details: string;
}

@Injectable()
export class AffiliatedService {
  private readonly logger = new Logger(AffiliatedService.name);

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
      user.affiliateds.push({ userId, transactions: [] });
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

      const threeMonthsAgo = new Date(Date.now() - 60 * 60 * 1000 * 24 * 30 * 3);
    const affiliatesToCalculate = user.affiliateds.filter((aff) => {
      return aff.createdAt <= threeMonthsAgo;
    });

      const transactions = await this.fetchExternalTransactions(affiliatesToCalculate.map(a => a.userId));

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

  async makeStatsPayment(userId: string): Promise<void> {
    const user = await this.userModel.findOne({ userId });
    if (!user) {
      throw new NotFoundException(`Usuário ${userId} não encontrado`);
    }

    const now = new Date();
    if (user.nextPayment && user.nextPayment > now) {
      this.logger.log(
        `Pagamento de estatísticas para ${userId} já está agendado em ${user.nextPayment}`,
      );
      return;
    }

    // Total de ganhos de todos os afiliados
    const totalEarnings = user.affiliateds.reduce((sum, aff) => {
      return sum + aff.transactions.reduce((s, t) => s + t.amount, 0);
    }, 0);

    // Total sacado e pendente
    const totalWithdrawn = user.transfers
      .filter((t) => t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    const pendingWithdrawals = user.transfers
      .filter((t) => t.status === 'pending')
      .reduce((sum, t) => sum + t.amount, 0);

    // Afiliados ativos (criados 3+ meses atrás)
    const threeMonthsAgo = new Date(Date.now() - 60 * 60 * 1000 * 24 * 30 * 3);
    const affiliatesToCalculate = user.affiliateds.filter((aff) => {
      return aff.createdAt <= threeMonthsAgo;
    });

    const numberOfAffiliates = affiliatesToCalculate.length;

    // IDs de transações já utilizadas em saques anteriores
    const usedTransactionIds = user.transfers
      .flatMap((t) => t.usedTransactionIds || [])
      .filter((id) => id);

    // Transações não utilizadas (disponíveis para saque)
    const notUsedTransactions = affiliatesToCalculate
      .flatMap((aff) => aff.transactions)
      .filter((t) => !usedTransactionIds.includes(t.id));

    // Ganhos do período (transações não utilizadas e completadas)
    const totalEarningsPeriod = notUsedTransactions
      .filter((t) => t.status === 'approved')
      .reduce((sum, t) => sum + t.amount, 0);

    // Total de transações não utilizadas
    const totalTransactionsPeriod = notUsedTransactions.length;

    if (!user.stats) {
      user.stats = {};
    }

    user.stats = {
      totalEarnings,
      totalWithdrawn,
      pendingWithdrawals,
      numberOfAffiliates,
      totalEarningsLastMonth: totalEarningsPeriod,
      totalTransactionsLastMonth: totalTransactionsPeriod,
      usedTransactionIds: [
        ...notUsedTransactions.map((t) => t.id),
      ],
    };

    await user.save();
  }

  private async fetchExternalTransactions(
    affiliateIds: string[],
  ): Promise<any[]> {
    return [];
  }

  async sendContractToAffiliates(userId: string): Promise<void> {
    if (!userId || userId.trim().length === 0) {
      throw new BadRequestException('userId é obrigatório');
    }

    const user = await this.userModel.findOne({ userId });
    if (!user) {
      throw new NotFoundException(`Usuário ${userId} não encontrado`);
    }

    for (const aff of affiliatesToNotify) {
      this.logger.log(
        `Enviando contrato para afiliado ${aff.userId} de ${userId}`,
      );
    }
  }

  async makeContract(
    userId: string,
  ): Promise<UserDocument> {
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

      const now = new Date();
    if (user.nextPayment && user.nextPayment > now) {
      this.logger.log(
        `Pagamento de estatísticas para ${userId} já está agendado em ${user.nextPayment}`,
      );
      throw new Error('');
    }


      const newContract = {
        status: 'pending',
        amount: user.stats?.totalEarningsLastMonth || 0,
        createdAt: new Date(),
      }

      user.contracts.push(newContract);

      const savedUser = await user.save();
      return savedUser;
    } catch (error) {
      this.logger.error(
        `Erro ao criar contrato para ${userId}:`,
        error.message,
      );
      throw error;
    }
  }

  /**
   * Confirma um contrato
   */
  async confirmContract(userId: string, code: string): Promise<UserDocument> {
    if (!userId || userId.trim().length === 0) {
      throw new BadRequestException('userId é obrigatório');
    }

    if (!code || code.trim().length === 0) {
      throw new BadRequestException('code é obrigatório');
    }

    try {
      const user = await this.userModel.findOne({ userId });
      if (!user) {
        throw new NotFoundException(`Usuário ${userId} não encontrado`);
      }

      if (user.transfers.length === 0) {
        throw new NotFoundException('Nenhum contrato pendente encontrado');
      }

      const pendingTransfer = user.transfers.find(
        (t) => t.status === 'pending',
      );
      if (!pendingTransfer) {
        throw new BadRequestException(
          'Nenhum contrato pendente para confirmar',
        );
      }

      // Validar código (em produção, usar verificação OTP ou similar)
      if (!this.validateConfirmationCode(code)) {
        throw new UnauthorizedException('Código de confirmação inválido');
      }

      pendingTransfer.status = 'completed';
      pendingTransfer.completedDate = new Date();

      const savedUser = await user.save();
      this.logger.log(`Contrato confirmado para ${userId}`);
      return savedUser;
    } catch (error) {
      this.logger.error(
        `Erro ao confirmar contrato para ${userId}:`,
        error.message,
      );
      throw error;
    }
  }

  private generateAffiliateCode(): string {
    return 'AFF_' + crypto.randomBytes(12).toString('hex').toUpperCase();
  }

  /**
   * Hasheia dados sensíveis
   */
  private hashSensitiveData(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Valida código de confirmação (implementar com lógica real)
   */
  private validateConfirmationCode(code: string): boolean {
    // TODO: Implementar validação OTP com serviço externo
    // Por enquanto, validar formato simples
    return code.length >= 6;
  }
}
