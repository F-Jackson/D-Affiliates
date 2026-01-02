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

const ALLOWED_AFFILIATE_COUNTRY = [
  // Tier 1 — Criadores profissionais / alta maturidade em afiliados
  'US', // Estados Unidos (marketing de performance avançado)
  'UK', // Reino Unido
  'CA', // Canadá
  'AU', // Austrália

  // Tier 2 — Alto volume de creators + custo mais baixo
  'BR', // Brasil (YouTube, Instagram, TikTok muito fortes)
  'MX', // México
  'AR', // Argentina
  'CO', // Colômbia

  // Europa — SEO, review sites, afiliados técnicos
  'PT', // Portugal
  'ES', // Espanha
  'PL', // Polônia
  'RO', // Romênia

  // Ásia — creators massivos, mobile-first
  'IN', // Índia
  'PH', // Filipinas
  'ID', // Indonésia
  'VN', // Vietnã

  // África — crescimento orgânico e tráfego social
  'NG', // Nigéria
  'KE', // Quênia

  // Oriente Médio — creators + tráfego pago
  'AE', // Emirados Árabes Unidos
];

type DocumentRule = {
  name: string;
  regex: RegExp;
  normalize: (value: string) => string;
};

const DOCUMENT_RULES_BY_COUNTRY: Record<string, DocumentRule> = {
  BR: {
    name: 'CPF',
    regex: /^\d{11}$/,
    normalize: (v) => v.replace(/\D/g, ''),
  },

  US: {
    name: 'SSN',
    regex: /^\d{9}$/,
    normalize: (v) => v.replace(/\D/g, ''),
  },

  CA: {
    name: 'SIN',
    regex: /^\d{9}$/,
    normalize: (v) => v.replace(/\D/g, ''),
  },

  UK: {
    name: 'NINO',
    regex: /^[A-Z]{2}\d{6}[A-Z]$/,
    normalize: (v) => v.replace(/\s+/g, '').toUpperCase(),
  },

  AU: {
    name: 'TFN',
    regex: /^\d{8,9}$/,
    normalize: (v) => v.replace(/\D/g, ''),
  },

  MX: {
    name: 'CURP',
    regex: /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/,
    normalize: (v) => v.toUpperCase(),
  },

  AR: {
    name: 'DNI',
    regex: /^\d{7,8}$/,
    normalize: (v) => v.replace(/\D/g, ''),
  },

  PT: {
    name: 'NIF',
    regex: /^\d{9}$/,
    normalize: (v) => v.replace(/\D/g, ''),
  },

  IN: {
    name: 'Aadhaar',
    regex: /^\d{12}$/,
    normalize: (v) => v.replace(/\D/g, ''),
  },

  AE: {
    name: 'Emirates ID',
    regex: /^\d{15}$/,
    normalize: (v) => v.replace(/\D/g, ''),
  },
};

@Injectable()
export class AffiliateService {
  private readonly logger = new Logger(AffiliateService.name);

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async registerUser(
    userId: string,
    country: string,
    documentId: string,
  ): Promise<UserDocument> {
    if (!userId || userId.trim().length === 0) {
      throw new BadRequestException('userId é obrigatório');
    }

    try {
      const existingUser = await this.userModel.findOne({ userId });
      if (existingUser) {
        throw new ConflictException('Usuário já está registrado');
      }

      if (!ALLOWED_AFFILIATE_COUNTRY.includes(country)) {
        throw new BadRequestException(
          `Afiliados do país ${country} não são aceitos`,
        );
      }

      if (!documentId || documentId.trim().length === 0) {
        throw new BadRequestException('documentId é obrigatório');
      }

      const docRule = DOCUMENT_RULES_BY_COUNTRY[country];
      if (!docRule) {
        throw new BadRequestException(
          `Regras de documento não definidas para o país ${country}`,
        );
      }

      const normalizedDocId = docRule.normalize(documentId);
      if (!docRule.regex.test(normalizedDocId)) {
        throw new BadRequestException(
          `documentId inválido para o país ${country} (${docRule.name})`,
        );
      }

      const documentHash = crypto
        .createHash('sha256')
        .update(normalizedDocId)
        .digest('hex');

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
