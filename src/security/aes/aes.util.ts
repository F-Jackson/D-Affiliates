import * as crypto from 'crypto';
import { blake3 } from '@noble/hashes/blake3.js';
import { sha3_256 } from '@noble/hashes/sha3.js';

const AES_PUBLIC_CLIENT_KEY = process.env.AES_PUBLIC_CLIENT_KEY || '';

class AESGCM {
  static readonly VERSION = 1;
  static readonly NONCE_SIZE = 12;
  static readonly SALT_SIZE = 32;
  static readonly TAG_SIZE = 16;
  static readonly KEY_SIZE = 32;

  private static readonly STATIC_SALT = Buffer.alloc(AESGCM.SALT_SIZE, 0x42);
  private static readonly STATIC_NONCE = Buffer.alloc(AESGCM.NONCE_SIZE, 0x24);

  private static async _derive_key(
    password: string | Buffer,
    salt: Buffer,
    hash: 'blake3' | 'sha3' = 'blake3',
  ): Promise<Buffer> {
    const passBytes: Uint8Array =
      typeof password === 'string'
        ? new TextEncoder().encode(password)
        : new Uint8Array(password);

    if (hash === 'blake3') {
      return Buffer.from(
        blake3(passBytes, { key: Buffer.from(salt), dkLen: AESGCM.KEY_SIZE }),
      );
    } else {
      const combined = new Uint8Array(salt.length + passBytes.length);
      combined.set(salt, 0);
      combined.set(passBytes, salt.length);
      return Buffer.from(sha3_256(combined));
    }
  }

  static async encrypt(
    plaintext: Buffer,
    aad?: Buffer,
    rand = false,
    hash: 'blake3' | 'sha3' = 'sha3',
    password: string = AES_PUBLIC_CLIENT_KEY,
  ): Promise<Buffer> {
    const salt = rand
      ? crypto.randomBytes(AESGCM.SALT_SIZE)
      : AESGCM.STATIC_SALT;
    const nonce = rand
      ? crypto.randomBytes(AESGCM.NONCE_SIZE)
      : AESGCM.STATIC_NONCE;
    const key = await this._derive_key(password, salt, hash);

    const cipher = crypto.createCipheriv('aes-256-gcm', key, nonce);
    if (aad) cipher.setAAD(aad);

    const ciphertext = Buffer.concat([
      cipher.update(plaintext),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    const versionByte = Buffer.alloc(1);
    versionByte.writeUInt8(AESGCM.VERSION, 0);

    const finalBuffer = Buffer.concat([
      versionByte,
      salt,
      nonce,
      tag,
      ciphertext,
    ]);
    return finalBuffer;
  }

  static async decrypt(
    encrypted: Buffer,
    aad?: Buffer,
    hash: 'blake3' | 'sha3' = 'sha3',
    password: string = AES_PUBLIC_CLIENT_KEY,
  ): Promise<Buffer> {
    // Validar tamanho mínimo
    const minSize = 1 + AESGCM.SALT_SIZE + AESGCM.NONCE_SIZE + AESGCM.TAG_SIZE;
    if (!encrypted || encrypted.length < minSize) {
      // Se o buffer é muito pequeno, pode ser dados legados ou inválidos
      // Tente descriptografar como dados legados (sem versão)
      if (encrypted && encrypted.length > 0) {
        try {
          return await this._decryptLegacy(encrypted, aad, hash, password);
        } catch (error) {
          throw new Error(
            `Invalid encrypted data: expected at least ${minSize} bytes, got ${encrypted?.length || 0}. Legacy decryption also failed: ${error}`,
          );
        }
      }
      throw new Error(
        `Invalid encrypted data: expected at least ${minSize} bytes, got ${encrypted?.length || 0}`,
      );
    }

    let offset = 0;
    const version = encrypted.readUInt8(offset);
    offset += 1;

    // Se a versão não é 1, tente descriptografar como dados legados
    if (version !== AESGCM.VERSION) {
      try {
        return await this._decryptLegacy(encrypted, aad, hash, password);
      } catch (error) {
        throw new Error(
          `Unsupported encryption version ${version}. Legacy decryption also failed: ${error}`,
        );
      }
    }

    const salt = encrypted.subarray(offset, offset + AESGCM.SALT_SIZE);
    offset += AESGCM.SALT_SIZE;

    const nonce = encrypted.subarray(offset, offset + AESGCM.NONCE_SIZE);
    offset += AESGCM.NONCE_SIZE;

    if (nonce.length !== AESGCM.NONCE_SIZE) {
      throw new Error(
        `Invalid nonce size: expected ${AESGCM.NONCE_SIZE}, got ${nonce.length}`,
      );
    }

    const tag = encrypted.subarray(offset, offset + AESGCM.TAG_SIZE);
    offset += AESGCM.TAG_SIZE;

    const ciphertext = encrypted.subarray(offset);
    const key = await this._derive_key(password, salt, hash);

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, nonce);
    if (aad) decipher.setAAD(aad);
    decipher.setAuthTag(tag);

    const plaintext = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);
    return plaintext;
  }

  private static async _decryptLegacy(
    encrypted: Buffer,
    aad?: Buffer,
    hash: 'blake3' | 'sha3' = 'sha3',
    password: string = AES_PUBLIC_CLIENT_KEY,
  ): Promise<Buffer> {
    // Dados legados usam STATIC_SALT e STATIC_NONCE sem versão
    const key = await this._derive_key(password, AESGCM.STATIC_SALT, hash);

    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      key,
      AESGCM.STATIC_NONCE,
    );
    if (aad) decipher.setAAD(aad);

    // Para dados legados, assumimos que os últimos 16 bytes são a tag
    const tagStart = Math.max(0, encrypted.length - AESGCM.TAG_SIZE);
    const tag = encrypted.subarray(tagStart);
    const ciphertext = encrypted.subarray(0, tagStart);

    decipher.setAuthTag(tag);

    try {
      const plaintext = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
      ]);
      return plaintext;
    } catch (error) {
      throw new Error(`Legacy decryption failed: ${error}`);
    }
  }
}

export default AESGCM;
