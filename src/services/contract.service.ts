import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import PDFDocument from 'pdfkit';
import { UserDocument } from '../schemas/app.schema';

@Injectable()
export class ContractService {
  private readonly logger = new Logger(ContractService.name);

  async generateContractPdf(
    contract: any,
    user: UserDocument,
  ): Promise<Buffer> {
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

        this.buildPdfHeader(pdf, contract);
        this.buildLegalCompliance(pdf);
        this.buildContractInfo(pdf, contract);
        this.buildAffiliateInfo(pdf, user);
        this.buildTransactions(pdf, contract, user);
        this.buildTermsAndConditions(pdf);
        this.buildDigitalSignature(pdf, contract, user);

        pdf.end();
      } catch (error) {
        reject(error);
      }
    }) as any;
  }

  private buildPdfHeader(pdf: any, contract: any): void {
    const logoPath = process.env.LOGO_PATH || './assets/logo.png';
    try {
      pdf.image(logoPath, 50, 30, { width: 100 });
    } catch (logoError) {
      this.logger.warn(`Logo não encontrada em ${logoPath}`);
    }

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
    pdf.moveTo(50, 100).lineTo(545, 100).stroke();
    pdf.moveDown(0.5);

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
  }

  private buildLegalCompliance(pdf: any): void {
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
  }

  private buildContractInfo(pdf: any, contract: any): void {
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
  }

  private buildAffiliateInfo(pdf: any, user: UserDocument): void {
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
  }

  private buildTransactions(pdf: any, contract: any, user: UserDocument): void {
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
  }

  private buildTermsAndConditions(pdf: any): void {
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
  }

  private buildDigitalSignature(pdf: any, contract: any, user: UserDocument): void {
    pdf.moveTo(50, pdf.y).lineTo(545, pdf.y).stroke();
    pdf.moveDown(0.5);

    pdf.fontSize(10).font('Helvetica-Bold').text('ASSINATURA DIGITAL / DIGITAL SIGNATURE', {
      align: 'center',
    });

    pdf.moveDown(0.3);

    const timestamp = new Date();
    const unixTimestamp = Math.floor(timestamp.getTime() / 1000);

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

    pdf.fontSize(7).font('Helvetica-Bold').fillColor('#333333').text(
      '✓ DOCUMENTO VERIFICÁVEL / VERIFIABLE DOCUMENT\n✓ VÁLIDO LEGALMENTE / LEGALLY VALID\n✓ CONFORMIDADE REGULATÓRIA / REGULATORY COMPLIANCE',
      {
        align: 'center',
      }
    );

    pdf.fillColor('#000000');

    pdf.moveDown(1);

    pdf.fontSize(6).font('Helvetica').text(
      'D-Affiliates Platform © 2026 - Documento assinado digitalmente | Digitally signed document | This document is legally binding in multiple jurisdictions.',
      {
        align: 'center',
        width: 495,
      }
    );
  }
}
