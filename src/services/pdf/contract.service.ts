import { Injectable } from '@nestjs/common';
import { UserEntity } from 'src/entities/user.entity';
import { PdfDocumentBuilderService } from './pdf-document-builder.service';

interface ContractData {
  contractId: string | undefined;
  status: string | undefined;
  amount: number | undefined;
  confirmedAt: Date | undefined;
  plataform: string | undefined;
  taxAmount: number | undefined;
  transcationsIds: string[] | undefined;
}

@Injectable()
export class ContractService {
  constructor(private readonly pdfDocumentBuilder: PdfDocumentBuilderService) {}

  /**
   * Gera um PDF de contrato completo com assinatura digital e hash de integridade
   */
  async generateContractPdf(
    contract: ContractData,
    user: UserEntity,
    version: number,
  ): Promise<{ buffer: Buffer; pdfHash: string; hmac: string }> {
    return this.pdfDocumentBuilder.generatePdf(contract, user, version);
  }
}
