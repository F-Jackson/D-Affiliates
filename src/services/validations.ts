// ================ BRASIL ================
export function validateCPF(cpf: string): boolean {
  if (!/^\d{11}$/.test(cpf)) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(cpf[i]) * (10 - i);
  let check1 = (sum * 10) % 11;
  if (check1 === 10) check1 = 0;
  if (check1 !== Number(cpf[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += Number(cpf[i]) * (11 - i);
  let check2 = (sum * 10) % 11;
  if (check2 === 10) check2 = 0;

  return check2 === Number(cpf[10]);
}

// ================ CANADA ================
export function validateSIN(sin: string): boolean {
  if (!/^\d{9}$/.test(sin)) return false;
  let sum = 0;
  for (let i = 0; i < sin.length; i++) {
    let digit = Number(sin[i]);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

// ================ REINO UNIDO ================
export function validateNINO(nino: string): boolean {
  if (!/^[A-CEGHJ-PR-TW-Z]{2}\d{6}[A-D]$/.test(nino)) return false;
  return true;
}

// ================ MEXICO ================
export function validateCURP(curp: string): boolean {
  if (!/^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/.test(curp)) return false;

  const year = Number(curp.substr(4, 2));
  const month = Number(curp.substr(6, 2));
  const day = Number(curp.substr(8, 2));

  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  return true;
}

// ================ INDIA ================
export function validateAadhaar(aadhaar: string): boolean {
  if (!/^\d{12}$/.test(aadhaar)) return false;

  const d = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
  ];

  const p = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
  ];

  let c = 0;
  const reversed = aadhaar.split('').reverse().map(Number);

  for (let i = 0; i < reversed.length; i++) {
    c = d[c][p[i % 8][reversed[i]]];
  }

  return c === 0;
}

// ================ ESTADOS UNIDOS ================
export function validateSSN(ssn: string): boolean {
  if (!/^\d{3}-\d{2}-\d{4}$/.test(ssn) && !/^\d{9}$/.test(ssn)) return false;

  const digits = ssn.replace(/-/g, '');

  // Área não pode ser 000, 666 ou 900-999
  const area = Number(digits.substring(0, 3));
  if (area === 0 || area === 666 || area >= 900) return false;

  // Grupo não pode ser 00
  const group = Number(digits.substring(3, 5));
  if (group === 0) return false;

  // Serial não pode ser 0000
  const serial = Number(digits.substring(5, 9));
  if (serial === 0) return false;

  return true;
}

// ================ AUSTRALIA ================
export function validateTFN(tfn: string): boolean {
  if (!/^\d{11}$/.test(tfn)) return false;

  const weights = [10, 7, 8, 4, 6, 3, 5, 2, 1, 1];
  let sum = 0;

  for (let i = 0; i < 10; i++) {
    sum += Number(tfn[i]) * weights[i];
  }

  const remainder = sum % 11;
  const checkDigit = remainder === 0 ? 0 : 11 - remainder;

  return checkDigit === Number(tfn[10]);
}

// ================ ARGENTINA ================
export function validateDNI(dni: string): boolean {
  if (!/^\d{7,8}$/.test(dni)) return false;
  return !/^0+$/.test(dni);
}

// ================ COLOMBIA ================
export function validateCC(cc: string): boolean {
  if (!/^\d{8,10}$/.test(cc)) return false;
  return !/^0+$/.test(cc);
}

// ================ PORTUGAL ================
export function validateNIF(nif: string): boolean {
  if (!/^\d{9}$/.test(nif)) return false;

  const weights = [9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;

  for (let i = 0; i < 8; i++) {
    sum += Number(nif[i]) * weights[i];
  }

  const remainder = sum % 11;
  const checkDigit = remainder < 2 ? 0 : 11 - remainder;

  return checkDigit === Number(nif[8]);
}

// ================ ESPANHA ================
export function validateNIE(nie: string): boolean {
  if (!/^[XYZ]\d{7}[A-Z]$/.test(nie)) return false;

  const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
  const code = nie.toUpperCase();
  let number =
    code[1] + code[2] + code[3] + code[4] + code[5] + code[6] + code[7];

  if (code[0] === 'X') number = '0' + number;
  if (code[0] === 'Y') number = '1' + number;
  if (code[0] === 'Z') number = '2' + number;

  const remainder = Number(number) % 23;
  return letters[remainder] === code[8];
}

// ================ POLÔNIA ================
export function validatePESEL(pesel: string): boolean {
  if (!/^\d{11}$/.test(pesel)) return false;

  const weights = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];
  let sum = 0;

  for (let i = 0; i < 10; i++) {
    sum += (Number(pesel[i]) * weights[i]) % 10;
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === Number(pesel[10]);
}

// ================ ROMÊNIA ================
export function validateCNP(cnp: string): boolean {
  if (!/^\d{13}$/.test(cnp)) return false;

  const weights = [2, 4, 8, 5, 10, 9, 7, 3, 6, 1, 2, 4, 8];
  let sum = 0;

  for (let i = 0; i < 12; i++) {
    sum += Number(cnp[i]) * weights[i];
  }

  const remainder = sum % 11;
  const checkDigit = remainder < 2 ? remainder : 11 - remainder;

  return checkDigit === Number(cnp[12]);
}

// ================ FILIPINAS ================
export function validateTIN(tin: string): boolean {
  // TIN pode ser 12 dígitos (NNNNNN-NNNNN-N) ou apenas números
  const normalized = tin.replace(/-/g, '');
  if (!/^\d{12}$/.test(normalized)) return false;

  // Validação básica: não pode ser tudo zeros
  return !/^0+$/.test(normalized);
}

// ================ INDONÉSIA ================
export function validateNIK(nik: string): boolean {
  if (!/^\d{16}$/.test(nik)) return false;

  // Validação básica de estrutura
  // 6 dígitos de local (kode provinsi + kabupaten + kecamatan)
  // 6 dígitos de data (DDMMYY)
  // 4 dígitos sequenciais

  const dateStr = nik.substring(6, 12);
  const day = Number(dateStr.substring(0, 2));
  const month = Number(dateStr.substring(2, 4));

  if (day < 1 || day > 40) return false; // Permite até 40 para mulheres (40+)
  if (month < 1 || month > 12) return false;

  return !/^0+$/.test(nik);
}

// ================ VIETNÃ ================
export function validateCCCD(cccd: string): boolean {
  // Căn Cước Công Dân (CCCD) - 12 dígitos
  if (!/^\d{12}$/.test(cccd)) return false;

  // Validação básica
  return !/^0+$/.test(cccd);
}

// ================ NIGÉRIA ================
export function validateNIN(nin: string): boolean {
  // NIN - 11 dígitos
  if (!/^\d{11}$/.test(nin)) return false;

  return !/^0+$/.test(nin);
}

// ================ QUÊNIA ================
export function validateKenyaID(id: string): boolean {
  // ID do Quênia - 8 dígitos
  if (!/^\d{8}$/.test(id)) return false;

  return !/^0+$/.test(id);
}

// ================ EMIRADOS ÁRABES UNIDOS ================
export function validateEmiratesID(id: string): boolean {
  // Emirates ID - 15 dígitos (pode ter hífen no meio)
  const normalized = id.replace(/-/g, '');
  if (!/^\d{15}$/.test(normalized)) return false;

  // Primeiros 3 dígitos = código do emirado (1-7)
  const emirate = Number(normalized.substring(0, 3));
  if (emirate < 1 || emirate > 799) return false;

  return !/^0+$/.test(normalized);
}
