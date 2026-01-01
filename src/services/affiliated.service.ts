import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as crypto from 'crypto';
import { User, UserDocument } from '../schemas/app.schema';

interface TransactionInput {
  id: string;
  amount: number;
  productName: string;
  commissionRate?: number;
  description?: string;
  externalTransactionId?: string;
}

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
        lastActivityDate: user.lastActivityDate,
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

      user.lastActivityDate = new Date();
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

    try {
      const user = await this.userModel.findOne({ userId });
      if (!user) {
        throw new NotFoundException(`Usuário ${userId} não encontrado`);
      }

      const affiliateds = user.affiliateds.map((aff) => aff.userId);

      const transactions = await this.fetchExternalTransactions(affiliateds);

      transactions.forEach((tx) => {
        const affiliated = user.affiliateds.find((aff) => aff.userId === tx.affiliateId);
        if (affiliated) {
          const existingTx = affiliated.transactions.find((t) => t.id === tx.id);
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
              date: new Date(),
            });
          }
        }
      });

      user.lastActivityDate = new Date();
      const savedUser = await user.save();

      this.logger.log(`Transferências sincronizadas para ${userId}`);
      return savedUser;
    } catch (error) {
      this.logger.error(
        `Erro ao sincronizar transferências de ${userId}:`,
        error.message,
      );
      throw error;
    }
  }

  /**
   * Cria um contrato com método de pagamento
   */
  async makeContract(
    userId: string,
    paymentMethod: PaymentMethod,
  ): Promise<UserDocument> {
    if (!userId || userId.trim().length === 0) {
      throw new BadRequestException('userId é obrigatório');
    }

    if (!paymentMethod || !paymentMethod.type || !paymentMethod.details) {
      throw new BadRequestException(
        'paymentMethod com type e details é obrigatório',
      );
    }

    if (!['bank_transfer', 'paypal', 'crypto'].includes(paymentMethod.type)) {
      throw new BadRequestException(
        'Tipo de pagamento inválido: bank_transfer, paypal ou crypto',
      );
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

      if (!user.kycVerified) {
        throw new BadRequestException(
          'KYC deve estar verificado para fazer contrato',
        );
      }

      // Validar e hashear dados sensíveis dependendo do tipo
      let secureData: any = {};

      if (paymentMethod.type === 'bank_transfer') {
        secureData.bankAccountHash = this.hashSensitiveData(
          paymentMethod.details,
        );
      } else if (paymentMethod.type === 'crypto') {
        secureData.walletAddress = paymentMethod.details; // Em produção, validar endereço
      } else if (paymentMethod.type === 'paypal') {
        secureData.paypalEmail = this.hashSensitiveData(paymentMethod.details);
      }

      const transfer: any = {
        amount: 0, // Será preenchido quando o contrato for confirmado
        date: new Date(),
        status: 'pending',
        paymentMethod: paymentMethod.type,
        ...secureData,
      };

      user.transfers.push(transfer);
      user.lastActivityDate = new Date();

      const savedUser = await user.save();
      this.logger.log(
        `Contrato criado para ${userId} com método: ${paymentMethod.type}`,
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
      user.lastActivityDate = new Date();

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
