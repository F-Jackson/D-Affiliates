import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { UserEntity } from 'src/entities/user.entity';
import { PdfSecurityService } from './pdf-security.service';
import { PdfSectionBuilderService } from './pdf-section-builder.service';

interface ContractData {
  contractId: string | undefined;
  status: string | undefined;
  amount: number | undefined;
  confirmedAt: Date | undefined;
  plataform: string | undefined;
  taxAmount: number | undefined;
  transcationsIds: string[] | undefined;
}

interface GeneratedPdf {
  buffer: Buffer;
  pdfHash: string;
  hmac: string;
}

@Injectable()
export class PdfDocumentBuilderService {
  constructor(
    private readonly pdfSecurityService: PdfSecurityService,
    private readonly pdfSectionBuilderService: PdfSectionBuilderService,
  ) {}

  /**
   * Gera um PDF completo com todas as seções e assinatura digital
   */
  async generatePdf(
    contract: ContractData,
    user: UserEntity,
    version: number,
  ): Promise<GeneratedPdf> {
    return new Promise(async (resolve, reject) => {
      try {
        const pdf = this.createPdfDocument();
        const chunks: Buffer[] = [];

        pdf.on('data', (chunk: Buffer) => chunks.push(chunk));

        pdf.on('end', () => {
          try {
            const unsignedBuffer = Buffer.concat(chunks);

            // Gerar HMAC do PDF não assinado
            const hmac = this.pdfSecurityService.generateHmac(unsignedBuffer);

            // Assinar digitalmente o PDF
            const signedPdf = this.pdfSecurityService.signPdf(unsignedBuffer);

            // Gerar hash de integridade
            const pdfHash = this.pdfSecurityService.generatePdfHash(signedPdf);

            resolve({
              buffer: signedPdf,
              pdfHash,
              hmac,
            });
          } catch (error) {
            reject(error);
          }
        });

        pdf.on('error', reject);

        // Construir todas as seções do PDF
        this.buildPdfContent(pdf, contract, user, version);

        // Finalizar o PDF
        pdf.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Cria um novo documento PDF com as configurações de segurança apropriadas
   */
  private createPdfDocument(): PDFKit.PDFDocument {
    const ownerPassword = this.pdfSecurityService.generateRandomPassword();

    return new PDFDocument({
      size: 'A4',
      margin: 50,
      bufferPages: true,
      userPassword: '',
      ownerPassword: ownerPassword,
      permissions: {
        printing: 'highResolution',
        modifying: false,
        copying: false,
        annotating: false,
        fillingForms: false,
        contentAccessibility: false,
        documentAssembly: false,
      },
      info: {
        Title: `Affiliate Overview - Contract Document`,
        Author: 'D-Affiliates Platform',
        Producer: 'D-Affiliates Secure Engine',
        CreationDate: new Date(),
      },
    });
  }

  /**
   * Constrói todo o conteúdo do PDF chamando os métodos apropriados
   */
  private async buildPdfContent(
    pdf: PDFKit.PDFDocument,
    contract: ContractData,
    user: UserEntity,
    version: number,
  ): Promise<void> {
    // Construir seções
    this.pdfSectionBuilderService.buildHeader(pdf, contract, version);
    this.pdfSectionBuilderService.buildNotice(pdf);
    this.pdfSectionBuilderService.buildOverviewInfo(pdf, contract, version);
    this.pdfSectionBuilderService.buildAffiliateInfo(pdf, user);
    await this.pdfSectionBuilderService.buildTransactions(pdf, contract, user);
    this.pdfSectionBuilderService.buildObservations(pdf);
    this.pdfSectionBuilderService.buildInvisibleWatermark(pdf, contract, user);

    // Gerar e adicionar o hash de integridade
    const integrityHash = this.generateIntegrityHash(contract, user);
    this.pdfSectionBuilderService.buildIntegritySection(pdf, integrityHash);
  }

  /**
   * Gera o hash de integridade baseado nos dados do contrato
   */
  private generateIntegrityHash(
    contract: ContractData,
    user: UserEntity,
  ): string {
    const payload = {
      referenceId: contract.contractId,
      userId: user.userId,
      amount: contract.amount,
      status: contract.status,
      generatedAt: new Date().toISOString(),
    };

    return this.pdfSecurityService.generateIntegrityHash(payload);
  }
}
