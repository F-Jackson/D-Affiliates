import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { readFileSync } from 'fs';
import { SignPdf } from 'node-signpdf';
import { P12Signer } from '@signpdf/signer-p12';

@Injectable()
export class PdfSecurityService {
  /**
   * Gera HMAC SHA256 para o PDF
   */
  generateHmac(pdfBuffer: Buffer): string {
    return crypto
      .createHmac('sha256', process.env.PDF_HMAC_SECRET!)
      .update(pdfBuffer)
      .digest('hex');
  }

  /**
   * Assina digitalmente o PDF usando certificado P12
   */
  signPdf(unsignedBuffer: Buffer): Buffer {
    const p12Buffer = readFileSync(process.env.PDF_CERT_PATH!);

    const signer = new P12Signer(p12Buffer, {
      passphrase: process.env.PDF_CERT_PASSPHRASE!,
    });

    const signPdf = new SignPdf();
    return signPdf.sign(unsignedBuffer, signer);
  }

  /**
   * Gera hash SHA3-256 para verificação de integridade
   */
  generateIntegrityHash(data: any): string {
    return crypto
      .createHash('sha3-256')
      .update(JSON.stringify(data))
      .digest('hex');
  }

  /**
   * Gera hash SHA3-256 para o PDF completo
   */
  generatePdfHash(signedPdf: Buffer): string {
    return crypto.createHash('sha3-256').update(signedPdf).digest('hex');
  }

  /**
   * Gera senha aleatória para propósitos de segurança
   */
  generateRandomPassword(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
