import { Buffer } from 'buffer';
import AESGCM from './aes.util';

export async function encrypt(
  data: number | string | Date,
  rand = false,
  hash: 'blake3' | 'sha3' = 'sha3',
  password?: string,
): Promise<string> {
  const buffer = Buffer.from(String(data), 'utf-8');
  const encrypted = await AESGCM.encrypt(
    buffer,
    undefined,
    rand,
    hash,
    password,
  );
  return encrypted.toString('base64');
}

export async function decrypt(
  data: string,
  hash: 'blake3' | 'sha3' = 'sha3',
  password?: string,
): Promise<string> {
  // Validar que data é uma string não-vazia
  if (!data || typeof data !== 'string') {
    throw new Error(
      `Invalid encrypted data: expected non-empty string, got ${typeof data}`,
    );
  }

  try {
    const buffer = Buffer.from(data, 'base64');
    const decrypted = await AESGCM.decrypt(buffer, undefined, hash, password);
    return decrypted.toString('utf-8');
  } catch (error) {
    console.error(
      'Decrypt error for data:',
      data.substring(0, 50),
      'Error:',
      error,
    );
    throw error;
  }
}
