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
import PDFDocument from 'pdfkit';
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
      user.affiliateds.push({ userId, transactions: [], createdAt: new Date() });
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

  async sendContractPendingToAffiliate(userId: string): Promise<void> {
    if (!userId || userId.trim().length === 0) {
      throw new BadRequestException('userId é obrigatório');
    }

    const user = await this.userModel.findOne({ userId });
    if (!user) {
      throw new NotFoundException(`Usuário ${userId} não encontrado`);
    }

    const pendingContracts = user.contracts.filter((c => c.status === 'pending'));
    if (pendingContracts.length === 0) {
      this.logger.log(`Nenhum contrato pendente para enviar para ${userId}`);
      return;
    }

    for (const contract of pendingContracts) {
      this.logger.log(`Enviando contrato para ${userId}: Valor ${contract.amount}`);
    }
  }

  async makeSignedPdfContract(userId: string): Promise<void> {
    if (!userId || userId.trim().length === 0) {
      throw new BadRequestException('userId é obrigatório');
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
          const pdfBuffer = await this.generateContractPdf(contract, user);

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
      this.logger.log(`${pendingContracts.length} contrato(s) assinado(s) para ${userId}`);
    } catch (error) {
      this.logger.error(
        `Erro ao assinar contrato em PDF para ${userId}:`,
        error.message,
      );
      throw error;
    }
  }

  private generateContractPdf(
    contract: any,
    user: UserDocument,
  ): Buffer {
    return new Promise<Buffer>((resolve, reject) => {
      try {
        const pdf = new PDFDocument({
          size: 'A4',
          margin: 50,
          bufferPages: true,
          info: {
            Title: `Contrato de Afiliação - ${contract.contractId}`,
            Author: 'D-Affiliates Platform',
            Subject: 'Acordo de Afiliação Digital',
            Keywords: 'afiliação, contrato, digital',
            Producer: 'D-Affiliates Security Engine',
            CreationDate: new Date(),
          },
        });
        
        const chunks: Buffer[] = [];

        pdf.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });

        pdf.on('end', () => {
          resolve(Buffer.concat(chunks));
        });

        pdf.on('error', (err) => {
          reject(err);
        });

        // ===== CABEÇALHO COM LOGO =====
        const logoPath = process.env.LOGO_PATH || './assets/logo.png';
        try {
          pdf.image(logoPath, 50, 30, { width: 100 });
        } catch (logoError) {
          this.logger.warn(`Logo não encontrada em ${logoPath}`);
        }

        // Selador de segurança
        pdf
          .fontSize(9)
          .font('Helvetica-Bold')
          .fillColor('#FF0000')
          .text('🔒 DIGITALLY SIGNED - ASSINADO DIGITALMENTE 🔒', {
            align: 'right',
            width: 150,
          })
          .fillColor('#000000');

        pdf.moveDown(1);

        // Linha divisória
        pdf.moveTo(50, 100).lineTo(545, 100).stroke();
        pdf.moveDown(0.5);

        // ===== TÍTULO PRINCIPAL =====
        pdf.fontSize(20).font('Helvetica-Bold').text('CONTRATO DE AFILIAÇÃO', {
          align: 'center',
        });

        pdf.fontSize(11).font('Helvetica').text('AFFILIATE AGREEMENT', {
          align: 'center',
        });

        pdf.moveDown(0.3);
        pdf
          .fontSize(9)
          .font('Helvetica-Oblique')
          .text(`Código/Code: ${contract.contractId}`, {
            align: 'center',
          });

        // Timestamp e compliance
        const timestamp = new Date();
        const unixTimestamp = Math.floor(timestamp.getTime() / 1000);
        
        pdf.moveDown(0.5);
        pdf
          .fontSize(8)
          .font('Helvetica')
          .text(`Generated: ${timestamp.toISOString()} | Unix: ${unixTimestamp}`, {
            align: 'center',
          });

        pdf.moveDown(1);

        // ===== SEÇÃO DE CONFORMIDADE LEGAL =====
        pdf.fontSize(10).font('Helvetica-Bold').text('LEGAL COMPLIANCE');
        pdf.fontSize(8).font('Helvetica').text(
          'Este contrato é válido em: UE/EU, EUA/USA, Reino Unido/UK, Canadá/Canada e demais jurisdições.',
          { indent: 20 }
        );
        pdf.text(
          'This contract is valid in: EU, USA, UK, Canada and other jurisdictions.',
          { indent: 20 }
        );
        pdf.moveDown(0.5);

        // ===== INFORMAÇÕES DO CONTRATO =====
        pdf.fontSize(12).font('Helvetica-Bold').text('INFORMAÇÕES DO CONTRATO / CONTRACT INFORMATION');
        pdf.moveDown(0.3);

        const contractInfo = [
          { pt: 'ID do Contrato', en: 'Contract ID', value: contract.contractId },
          { pt: 'Valor', en: 'Amount', value: `R$ ${contract.amount.toFixed(2)}` },
          { pt: 'Status', en: 'Status', value: contract.status.toUpperCase() },
          { pt: 'Código de Confirmação', en: 'Confirmation Code', value: contract.secretCode },
          { pt: 'Tipo de Contrato', en: 'Contract Type', value: 'AFFILIATE AGREEMENT' },
          { pt: 'Data de Criação', en: 'Creation Date', value: new Date().toLocaleDateString('pt-BR') },
        ];

        contractInfo.forEach((item) => {
          pdf.fontSize(9).font('Helvetica-Bold').text(`${item.pt} / ${item.en}:`, {
            indent: 20,
          });
          pdf.fontSize(9).font('Helvetica').text(item.value, { indent: 40 });
        });

        pdf.moveDown(1);

        // ===== INFORMAÇÕES DO AFILIADO =====
        pdf.fontSize(12).font('Helvetica-Bold').text('INFORMAÇÕES DO AFILIADO / AFFILIATE INFORMATION');
        pdf.moveDown(0.3);

        const affiliateInfo = [
          { pt: 'ID do Usuário', en: 'User ID', value: user.userId },
          { pt: 'Código de Afiliado', en: 'Affiliate Code', value: user.affiliateCode },
          { pt: 'Status da Conta', en: 'Account Status', value: user.status.toUpperCase() },
        ];

        affiliateInfo.forEach((item) => {
          pdf.fontSize(9).font('Helvetica-Bold').text(`${item.pt} / ${item.en}:`, {
            indent: 20,
          });
          pdf.fontSize(9).font('Helvetica').text(item.value, { indent: 40 });
        });

        pdf.moveDown(1);

        // ===== TRANSAÇÕES ASSOCIADAS =====
        if (contract.transcationsIds && contract.transcationsIds.length > 0) {
          pdf.fontSize(12).font('Helvetica-Bold').text('TRANSAÇÕES ASSOCIADAS / ASSOCIATED TRANSACTIONS');
          pdf.moveDown(0.3);

          contract.transcationsIds.slice(0, 10).forEach((txId: string, index: number) => {
            const tx = user.affiliateds
              .flatMap((aff) => aff.transactions)
              .find((t) => t.id === txId);
            if (tx) {
              pdf.fontSize(9).font('Helvetica').text(
                `${index + 1}. ${tx.id} | R$ ${tx.amount.toFixed(2)} | ${tx.productName}`,
                { indent: 20 }
              );
            }
          });

          if (contract.transcationsIds.length > 10) {
            pdf.fontSize(8).font('Helvetica-Oblique').text(
              `... e mais ${contract.transcationsIds.length - 10} transações`,
              { indent: 20 }
            );
          }
        }

        pdf.moveDown(1.5);

        // ===== TERMOS E CONDIÇÕES (MULTILÍNGUES) =====
        pdf.fontSize(11).font('Helvetica-Bold').text('TERMOS E CONDIÇÕES / TERMS AND CONDITIONS');
        pdf.moveDown(0.3);

        const termsText = `1. DEFINIÇÕES / DEFINITIONS: Este contrato estabelece uma relação de afiliação entre as partes, onde o Afiliado (Affiliate) promove produtos/serviços da Plataforma (Platform).

2. PAGAMENTO / PAYMENT: Os pagamentos serão processados conforme cronograma estabelecido, sujeito à verificação completa das transações e conformidade regulatória.

3. CONFORMIDADE / COMPLIANCE: O Afiliado concorda em cumprir com todas as leis e regulamentações aplicáveis nas jurisdições relevantes, incluindo GDPR (EU), CCPA (USA), DPA (UK).

4. SEGURANÇA / SECURITY: Este documento foi assinado digitalmente e pode ser verificado através do hash SHA3-256 fornecido abaixo.

5. RESPONSABILIDADES / RESPONSIBILITIES: Ambas as partes concordam com os termos e responsabilidades descritos neste contrato legal e vinculante.

6. DISPUTAS / DISPUTES: Qualquer disputa será resolvida conforme lei aplicável à jurisdição relevante.`;

        pdf
          .fontSize(8)
          .font('Helvetica')
          .text(termsText, {
            width: 445,
            indent: 20,
            align: 'justify',
          });

        pdf.moveDown(1.5);

        // ===== ASSINATURA DIGITAL =====
        pdf.moveTo(50, pdf.y).lineTo(545, pdf.y).stroke();
        pdf.moveDown(0.5);

        pdf.fontSize(10).font('Helvetica-Bold').text('ASSINATURA DIGITAL / DIGITAL SIGNATURE', {
          align: 'center',
        });

        pdf.moveDown(0.3);

        // Gerar hash único e seguro
        const contractDataForHash = {
          contractId: contract.contractId,
          userId: user.userId,
          amount: contract.amount,
          timestamp: timestamp.toISOString(),
          status: contract.status,
        };

        const contractHash = crypto
          .createHash('sha3-256')
          .update(JSON.stringify(contractDataForHash))
          .digest('hex');

        // Signature hash (baseado no contrato)
        const signatureHash = crypto
          .createHash('sha512')
          .update(contractHash + user.userId + contract.contractId)
          .digest('hex')
          .substring(0, 32);

        pdf
          .fontSize(8)
          .font('Helvetica')
          .text(`Timestamp: ${timestamp.toLocaleString('pt-BR')}`, {
            align: 'center',
          });

        pdf.text(`Unix Timestamp: ${unixTimestamp}`, { align: 'center' });

        pdf.moveDown(0.2);

        pdf.fontSize(7).font('Helvetica-Oblique').text(
          `SHA3-256 Contract Hash:\n${contractHash}`,
          {
            align: 'center',
            width: 495,
          }
        );

        pdf.fontSize(7).font('Helvetica-Oblique').text(
          `Digital Signature: ${signatureHash}`,
          {
            align: 'center',
          }
        );

        pdf.moveDown(0.5);

        // Aviso final
        pdf.fontSize(7).font('Helvetica-Bold').fillColor('#333333').text(
          '✓ DOCUMENTO VERIFICÁVEL / VERIFIABLE DOCUMENT\n✓ VÁLIDO LEGALMENTE / LEGALLY VALID\n✓ CONFORMIDADE REGULATÓRIA / REGULATORY COMPLIANCE',
          {
            align: 'center',
          }
        );

        pdf.fillColor('#000000');

        pdf.moveDown(1);

        // Footer
        pdf.fontSize(6).font('Helvetica').text(
          'D-Affiliates Platform © 2026 - Documento assinado digitalmente | Digitally signed document | This document is legally binding in multiple jurisdictions.',
          {
            align: 'center',
            width: 495,
          }
        );

        pdf.end();
      } catch (error) {
        reject(error);
      }
    }) as any;
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
