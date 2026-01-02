import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { ContractService } from './contract.service';
import { PaymentService } from './payment.service';
import { AffiliateService } from './affiliate.service';
import { StatsService } from './stats.service';

interface PaymentMethod {
  type: 'bank_transfer' | 'paypal' | 'crypto';
  details: string;
}

@Injectable()
export class AffiliatedService {
  private readonly logger = new Logger(AffiliatedService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private contractService: ContractService,
    private paymentService: PaymentService,
    private affiliateService: AffiliateService,
    private statsService: StatsService,
  ) {}

  async registerUser(userId: string): Promise<UserDocument> {
    return this.affiliateService.registerUser(userId);
  }

  async getAffiliatedStats(userId: string): Promise<any> {
    return this.statsService.getAffiliatedStats(userId);
  }

  async syncAffiliate(userId: string, affiliateCode: string): Promise<void> {
    return this.affiliateService.syncAffiliate(userId, affiliateCode);
  }

  async syncTransfers(userId: string): Promise<UserDocument> {
    return this.affiliateService.syncTransfers(userId);
  }

  async makeStatsPayment(userId: string): Promise<void> {
    return this.paymentService.makeStatsPayment(userId);
  }

  async sendContractPendingToAffiliate(userId: string): Promise<void> {
    return this.statsService.sendContractPendingToAffiliate(userId);
  }

  async makeSignedPdfContract(userId: string): Promise<void> {
    if (!userId || userId.trim().length === 0) {
      throw new Error('userId é obrigatório');
    }

    try {
      const user = await this.userModel.findOne({ userId });
      if (!user) {
        throw new NotFoundException(`Usuário ${userId} não encontrado`);
      }

      const pendingContracts = user.contracts.filter(
        (c) => c.status === 'pending',
      );
      if (pendingContracts.length === 0) {
        throw new NotFoundException('Nenhum contrato pendente para assinar');
      }

      // Processar cada contrato pendente
      for (const contract of pendingContracts) {
        try {
          // Gerar PDF do contrato
          const pdfBuffer = await this.contractService.generateContractPdf(
            contract,
            user,
          );

          // Marcar contrato como assinado
          contract.status = 'signed';
          contract.signedAt = new Date();
          contract.pdfBuffer = pdfBuffer;

          this.logger.log(
            `Contrato ${contract.contractId} assinado digitalmente para ${userId}`,
          );
        } catch (contractError) {
          this.logger.error(
            `Erro ao processar contrato ${contract.contractId}:`,
            contractError.message,
          );
          throw contractError;
        }
      }

      // Salvar usuário com contratos assinados
      await user.save();
      this.logger.log(
        `${pendingContracts.length} contrato(s) assinado(s) para ${userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Erro ao assinar contrato em PDF para ${userId}:`,
        error.message,
      );
      throw error;
    }
  }

  async makeContract(userId: string): Promise<UserDocument> {
    return this.statsService.makeContract(userId);
  }

  async confirmContract(userId: string, code: string): Promise<UserDocument> {
    return this.paymentService.confirmContract(userId, code);
  }}