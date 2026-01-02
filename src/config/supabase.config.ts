import * as fs from 'fs';

export interface SupabaseConfig {
  url: string;
  apiKey: string;
  secretKey: string;
  dbPassword: string;
  sslCertPath?: string;
  sslCert?: string;
}

export class SupabaseConfigProvider {
  static getConfig(): SupabaseConfig {
    const url = process.env.SUPABASE_URL;
    const apiKey = process.env.SUPABASE_API_KEY;
    const secretKey = process.env.SUPABASE_SECRET_KEY;
    const dbPassword = process.env.SUPABASE_DB_PASSWORD;
    const sslCertPath = process.env.SUPABASE_SSL_CERT_PATH;

    if (!url || !apiKey || !secretKey || !dbPassword) {
      throw new Error(
        'Missing required Supabase environment variables: SUPABASE_URL, SUPABASE_API_KEY, SUPABASE_SECRET_KEY, SUPABASE_DB_PASSWORD',
      );
    }

    let sslCert: string | undefined;

    if (sslCertPath) {
      try {
        sslCert = fs.readFileSync(sslCertPath, 'utf-8');
      } catch (error) {
        throw new Error(
          `Failed to read SSL certificate from ${sslCertPath}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }

    return {
      url,
      apiKey,
      secretKey,
      dbPassword,
      sslCertPath,
      sslCert,
    };
  }

  static validateConfig(config: SupabaseConfig): boolean {
    return (
      !!config.url &&
      !!config.apiKey &&
      !!config.secretKey &&
      !!config.dbPassword &&
      config.url.startsWith('https://') &&
      config.apiKey.length > 0 &&
      config.secretKey.length > 0
    );
  }
}
