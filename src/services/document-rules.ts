import {
  validateCPF,
  validateSIN,
  validateNINO,
  validateCURP,
  validateAadhaar,
  validateSSN,
  validateTFN,
  validateDNI,
  validateCC,
  validateNIF,
  validateNIE,
  validatePESEL,
  validateCNP,
  validateTIN,
  validateNIK,
  validateCCCD,
  validateNIN,
  validateKenyaID,
  validateEmiratesID,
} from './validations';

export type DocumentRule = {
  name: string;
  regex: RegExp;
  normalize: (value: string) => string;
  validate: (value: string) => boolean;
};

export const DOCUMENT_RULES_BY_COUNTRY: Record<string, DocumentRule> = {
  // ================ BRASIL ================
  BR: {
    name: 'CPF (Cadastro de Pessoa Física)',
    regex: /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/,
    normalize: (value: string) => value.replace(/\D/g, ''),
    validate: validateCPF,
  },

  // ================ CANADA ================
  CA: {
    name: 'SIN (Social Insurance Number)',
    regex: /^\d{3}-\d{3}-\d{3}$|^\d{9}$/,
    normalize: (value: string) => value.replace(/\D/g, ''),
    validate: validateSIN,
  },

  // ================ REINO UNIDO ================
  UK: {
    name: 'NINO (National Insurance Number)',
    regex: /^[A-CEGHJ-PR-TW-Z]{2}\d{6}[A-D]$/,
    normalize: (value: string) => value.toUpperCase().replace(/\s/g, ''),
    validate: validateNINO,
  },

  // ================ MEXICO ================
  MX: {
    name: 'CURP (Clave Única de Registro de Población)',
    regex: /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/,
    normalize: (value: string) => value.toUpperCase().replace(/\s/g, ''),
    validate: validateCURP,
  },

  // ================ INDIA ================
  IN: {
    name: 'Aadhaar (12-digit unique identity)',
    regex: /^\d{12}$|^\d{4}\s\d{4}\s\d{4}$/,
    normalize: (value: string) => value.replace(/\D/g, ''),
    validate: validateAadhaar,
  },

  // ================ ESTADOS UNIDOS ================
  US: {
    name: 'SSN (Social Security Number)',
    regex: /^\d{3}-\d{2}-\d{4}$|^\d{9}$/,
    normalize: (value: string) => value.replace(/\D/g, ''),
    validate: validateSSN,
  },

  // ================ AUSTRALIA ================
  AU: {
    name: 'TFN (Tax File Number)',
    regex: /^\d{11}$/,
    normalize: (value: string) => value.replace(/\D/g, ''),
    validate: validateTFN,
  },

  // ================ ARGENTINA ================
  AR: {
    name: 'DNI (Documento Nacional de Identidad)',
    regex: /^\d{7,8}$/,
    normalize: (value: string) => value.replace(/\D/g, ''),
    validate: validateDNI,
  },

  // ================ COLOMBIA ================
  CO: {
    name: 'CC (Cédula de Ciudadanía)',
    regex: /^\d{8,10}$/,
    normalize: (value: string) => value.replace(/\D/g, ''),
    validate: validateCC,
  },

  // ================ PORTUGAL ================
  PT: {
    name: 'NIF (Número de Identificação Fiscal)',
    regex: /^\d{9}$/,
    normalize: (value: string) => value.replace(/\D/g, ''),
    validate: validateNIF,
  },

  // ================ ESPANHA ================
  ES: {
    name: 'NIE (Número de Identidad Extranjero)',
    regex: /^[XYZ]\d{7}[A-Z]$|^\d{8}[A-Z]$/,
    normalize: (value: string) => value.toUpperCase().replace(/\s/g, ''),
    validate: validateNIE,
  },

  // ================ POLÔNIA ================
  PL: {
    name: 'PESEL (Powszechny Elektroniczny System Ewidencji Ludności)',
    regex: /^\d{11}$/,
    normalize: (value: string) => value.replace(/\D/g, ''),
    validate: validatePESEL,
  },

  // ================ ROMÊNIA ================
  RO: {
    name: 'CNP (Cod Numeric Personal)',
    regex: /^\d{13}$/,
    normalize: (value: string) => value.replace(/\D/g, ''),
    validate: validateCNP,
  },

  // ================ FILIPINAS ================
  PH: {
    name: 'TIN (Taxpayer Identification Number)',
    regex: /^\d{12}$|^\d{9}-\d{3}$/,
    normalize: (value: string) => value.replace(/\D/g, ''),
    validate: validateTIN,
  },

  // ================ INDONÉSIA ================
  ID: {
    name: 'NIK (Nomor Identitas Kependudukan)',
    regex: /^\d{16}$/,
    normalize: (value: string) => value.replace(/\D/g, ''),
    validate: validateNIK,
  },

  // ================ VIETNÃ ================
  VN: {
    name: 'CCCD (Căn Cước Công Dân)',
    regex: /^\d{12}$/,
    normalize: (value: string) => value.replace(/\D/g, ''),
    validate: validateCCCD,
  },

  // ================ NIGÉRIA ================
  NG: {
    name: 'NIN (National Identification Number)',
    regex: /^\d{11}$/,
    normalize: (value: string) => value.replace(/\D/g, ''),
    validate: validateNIN,
  },

  // ================ QUÊNIA ================
  KE: {
    name: 'National ID Number',
    regex: /^\d{8}$/,
    normalize: (value: string) => value.replace(/\D/g, ''),
    validate: validateKenyaID,
  },

  // ================ EMIRADOS ÁRABES UNIDOS ================
  AE: {
    name: 'Emirates ID',
    regex: /^\d{15}$|^\d{3}-\d{4}-\d{4}-\d{4}$/,
    normalize: (value: string) => value.replace(/\D/g, ''),
    validate: validateEmiratesID,
  },
};
