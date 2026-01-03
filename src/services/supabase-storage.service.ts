import { Injectable, Logger } from '@nestjs/common';
import {
  createClient,
  SupabaseClient,
  SupabaseClientOptions,
} from '@supabase/supabase-js';
import { SupabaseConfigProvider } from '../config/supabase.config';

export interface UploadedFile {
  path: string;
  url: string;
  size: number;
}

@Injectable()
export class SupabaseStorageService {
  private readonly logger = new Logger(SupabaseStorageService.name);
  private supabase: SupabaseClient | null = null;
  private readonly BUCKET_NAME = 'affiliates-attachments';
  private initialized = false;

  constructor() {
    this.initializeClient();
  }

  private initializeClient() {
    try {
      const config = SupabaseConfigProvider.getConfig();

      console.log(config);

      if (!SupabaseConfigProvider.validateConfig(config)) {
        throw new Error('Invalid Supabase configuration');
      }

      const options: SupabaseClientOptions<'public'> = {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        global: {
          headers: {
            'X-Custom-Header': 'email-service',
          },
        },
      };

      if (config.sslCert) {
        (options as any).global = {
          ...(options as any).global,
          tls: {
            rejectUnauthorized: true,
            ca: config.sslCert,
          },
        };
      }

      this.supabase = createClient(config.url, config.secretKey, options);
      this.initialized = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to initialize Supabase client: ${message}`);
      throw error;
    }
  }

  async uploadFile(
    filename: string,
    content: Buffer | string,
    contentType: string,
  ) {
    if (!this.supabase || !this.initialized) {
      throw new Error('Supabase client not initialized');
    }

    if (!filename || filename.trim().length === 0) {
      throw new Error('Filename is required');
    }

    if (!content) {
      throw new Error('File content is required');
    }

    if (!contentType || contentType.trim().length === 0) {
      throw new Error('Content type is required');
    }

    const buffer = Buffer.isBuffer(content)
      ? content
      : Buffer.from(content, 'utf-8');

    const sanitizedFilename = this.sanitizeFilename(filename);
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const filePath = `${timestamp}-${randomSuffix}-${sanitizedFilename}`;

    try {
      const { error: uploadError } = await this.supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, buffer, {
          contentType,
          upsert: false,
          cacheControl: '3600',
        });

      if (uploadError) {
        throw new Error(
          `Upload failed: ${uploadError.message || JSON.stringify(uploadError)}`,
        );
      }

      const {
        data: { publicUrl },
      } = this.supabase.storage.from(this.BUCKET_NAME).getPublicUrl(filePath);

      return {
        path: filePath,
        url: publicUrl,
        size: buffer.length,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `File upload error for ${sanitizedFilename}: ${message}`,
      );
      throw error;
    }
  }

  async deleteFile(filePath: string) {
    if (!this.supabase || !this.initialized) {
      throw new Error('Supabase client not initialized');
    }

    if (!filePath || filePath.trim().length === 0) {
      throw new Error('File path is required');
    }

    try {
      const { error } = await this.supabase.storage
        .from(this.BUCKET_NAME)
        .remove([filePath]);

      if (error) {
        throw new Error(`Delete failed: ${error.message}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`File deletion error for ${filePath}: ${message}`);
      throw error;
    }
  }

  async deleteMultipleFiles(filePaths: string[]) {
    if (!this.supabase || !this.initialized) {
      throw new Error('Supabase client not initialized');
    }

    if (!Array.isArray(filePaths) || filePaths.length === 0) {
      throw new Error('File paths array is required');
    }

    try {
      const validPaths = filePaths.filter(
        (p) => p && typeof p === 'string' && p.trim().length > 0,
      );

      if (validPaths.length === 0) {
        throw new Error('No valid file paths provided');
      }

      const { error } = await this.supabase.storage
        .from(this.BUCKET_NAME)
        .remove(validPaths);

      if (error) {
        throw new Error(`Batch delete failed: ${error.message}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Batch file deletion error: ${message}`);
      throw error;
    }
  }

  async getFileUrl(filePath: string) {
    if (!this.supabase || !this.initialized) {
      throw new Error('Supabase client not initialized');
    }

    if (!filePath || filePath.trim().length === 0) {
      throw new Error('File path is required');
    }

    try {
      const {
        data: { publicUrl },
      } = this.supabase.storage.from(this.BUCKET_NAME).getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to get file URL for ${filePath}: ${message}`);
      throw error;
    }
  }

  async downloadFile(filePath: string) {
    if (!this.supabase || !this.initialized) {
      throw new Error('Supabase client not initialized');
    }

    if (!filePath || filePath.trim().length === 0) {
      throw new Error('File path is required');
    }

    try {
      const { data, error } = await this.supabase.storage
        .from(this.BUCKET_NAME)
        .download(filePath);

      if (error) {
        throw new Error(`Download failed: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned from download');
      }

      return Buffer.from(await data.arrayBuffer());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to download file ${filePath}: ${message}`);
      throw error;
    }
  }

  private sanitizeFilename(filename: string) {
    return filename.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 255);
  }
}
