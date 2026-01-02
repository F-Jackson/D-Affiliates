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
    version: number,
  ): Promise<{ buffer: Buffer; pdfHash: string }> {
    return new Promise((resolve, reject) => {
      try {
        const pdf = new PDFDocument({
          size: 'A4',
          margin: 50,
          bufferPages: true,
          info: {
            Title: `Affiliate Agreement Invoice - ${contract.contractId} v${version}`,
            Author: 'D-Affiliates Platform',
            Subject: 'Affiliate Agreement and Conditional Invoice',
            Producer: 'D-Affiliates Legal Engine',
            CreationDate: new Date(),
          },
        });

        const chunks: Buffer[] = [];

        pdf.on('data', (chunk: Buffer) => chunks.push(chunk));

        pdf.on('end', () => {
          const buffer = Buffer.concat(chunks);

          const pdfHash = crypto
            .createHash('sha3-256')
            .update(buffer)
            .digest('hex');
          resolve({ buffer, pdfHash });
        });

        pdf.on('error', reject);

        this.buildHeader(pdf, contract, version);
        this.buildLegalNotice(pdf);
        this.buildContractInfo(pdf, contract, version);
        this.buildAffiliateInfo(pdf, user);
        this.buildTransactions(pdf, contract, user);
        this.buildTerms(pdf);
        this.buildIntegritySection(pdf, contract, user);

        pdf.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  /* ---------------- HEADER ---------------- */

  private buildHeader(
    pdf: PDFKit.PDFDocument,
    contract: any,
    version: number,
  ): void {
    pdf
      .fontSize(18)
      .font('Helvetica-Bold')
      .text('AFFILIATE AGREEMENT & CONDITIONAL INVOICE', { align: 'center' });

    pdf.moveDown(0.3);

    pdf
      .fontSize(9)
      .font('Helvetica')
      .text(`Contract ID: ${contract.contractId} | Version: ${version}`, {
        align: 'center',
      });

    pdf
      .fontSize(8)
      .font('Helvetica-Oblique')
      .text(`Generated at: ${new Date().toISOString()} (UTC)`, {
        align: 'center',
      });

    pdf.moveDown(1);
    pdf.moveTo(50, pdf.y).lineTo(545, pdf.y).stroke();
    pdf.moveDown(1);
  }

  /* ---------------- LEGAL NOTICE ---------------- */

  private buildLegalNotice(pdf: PDFKit.PDFDocument): void {
    pdf
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('LEGAL NOTICE');

    pdf
      .fontSize(8)
      .font('Helvetica')
      .text(
        `This document constitutes an electronic commercial agreement and conditional invoice.`,
        { indent: 20 },
      );

    pdf.text(
      `Electronic acceptance of this Agreement is legally binding pursuant to the U.S. Electronic Signatures in Global and National Commerce Act (E-SIGN Act).`,
      { indent: 20 },
    );

    pdf.moveDown(1);
  }

  /* ---------------- CONTRACT INFO ---------------- */

  private buildContractInfo(
    pdf: PDFKit.PDFDocument,
    contract: any,
    version: number,
  ): void {
    pdf.fontSize(11).font('Helvetica-Bold').text('CONTRACT INFORMATION');

    const items = [
      ['Contract ID', contract.contractId],
      ['Version', version.toString()],
      ['Amount', `$${contract.amount.toFixed(2)}`],
      ['Status', contract.status.toUpperCase()],
      ['Currency', 'USD'],
      ['Contract Type', 'Affiliate Agreement'],
    ];

    items.forEach(([label, value]) => {
      pdf.fontSize(9).font('Helvetica-Bold').text(`${label}:`, { indent: 20 });
      pdf.fontSize(9).font('Helvetica').text(value, { indent: 40 });
    });

    pdf.moveDown(1);
  }

  /* ---------------- AFFILIATE INFO ---------------- */

  private buildAffiliateInfo(
    pdf: PDFKit.PDFDocument,
    user: UserDocument,
  ): void {
    pdf.fontSize(11).font('Helvetica-Bold').text('AFFILIATE INFORMATION');

    const items = [
      ['User ID', user.userId],
      ['Affiliate Code', user.affiliateCode],
      ['Account Status', user.status.toUpperCase()],
    ];

    items.forEach(([label, value]) => {
      pdf.fontSize(9).font('Helvetica-Bold').text(`${label}:`, { indent: 20 });
      pdf.fontSize(9).font('Helvetica').text(value, { indent: 40 });
    });

    pdf.moveDown(1);
  }

  /* ---------------- TRANSACTIONS ---------------- */

  private buildTransactions(
    pdf: PDFKit.PDFDocument,
    contract: any,
    user: UserDocument,
  ): void {
    if (!contract.transcationsIds?.length) return;

    pdf.fontSize(11).font('Helvetica-Bold').text('ASSOCIATED TRANSACTIONS');

    contract.transcationsIds.slice(0, 10).forEach((txId: string, i: number) => {
      const tx = user.affiliateds
        .flatMap((a) => a.transactions)
        .find((t) => t.id === txId);

      if (tx) {
        pdf
          .fontSize(9)
          .font('Helvetica')
          .text(
            `${i + 1}. $${tx.amount.toFixed(2)} | ${tx.productName}`,
            { indent: 20 },
          );
      }
    });

    pdf.moveDown(1);
  }

  /* ---------------- TERMS ---------------- */

  private buildTerms(pdf: PDFKit.PDFDocument): void {
    pdf.fontSize(11).font('Helvetica-Bold').text('TERMS AND CONDITIONS');

    const text = `
1. CONDITIONAL PAYMENT.
Payment is strictly conditioned upon valid electronic acceptance of this Agreement through the Platform.

2. ELECTRONIC ACCEPTANCE.
Electronic acceptance constitutes a legally binding agreement equivalent to a handwritten signature.

3. RECORD OF ACCEPTANCE.
The Platform records timestamp, IP address, user identifier, and document hash as conclusive evidence.

4. NO ALTERATION.
Any modification results in a new contract version requiring new acceptance.
`;

    pdf.fontSize(8).font('Helvetica').text(text, {
      indent: 20,
      width: 445,
      align: 'justify',
    });

    pdf.moveDown(1);
  }

  /* ---------------- INTEGRITY ---------------- */

  private buildIntegritySection(
    pdf: PDFKit.PDFDocument,
    contract: any,
    user: UserDocument,
  ): void {
    const integrityPayload = {
      contractId: contract.contractId,
      userId: user.userId,
      amount: contract.amount,
      status: contract.status,
      generatedAt: new Date().toISOString(),
    };

    const integrityHash = crypto
      .createHash('sha3-256')
      .update(JSON.stringify(integrityPayload))
      .digest('hex');

    pdf.moveTo(50, pdf.y).lineTo(545, pdf.y).stroke();
    pdf.moveDown(0.5);

    pdf
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('DOCUMENT INTEGRITY & ELECTRONIC RECORD', { align: 'center' });

    pdf.moveDown(0.3);

    pdf
      .fontSize(7)
      .font('Helvetica-Oblique')
      .text(`Integrity Hash (SHA3-256):\n${integrityHash}`, {
        align: 'center',
        width: 495,
      });

    pdf.moveDown(0.5);

    pdf
      .fontSize(7)
      .font('Helvetica')
      .text(
        'This document is legally effective only after electronic acceptance is recorded on the Platform.',
        { align: 'center', width: 495 },
      );
  }
}
