import { DataSource } from 'typeorm';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import dotenv from 'dotenv';

const _envLocal = resolve(process.cwd(), '.env');
if (existsSync(_envLocal)) {
  dotenv.config({ path: _envLocal });
} else {
  dotenv.config();
}
const _crtPath = resolve(
  process.cwd(),
  process.env.SUPABASE_SSL_CERT_PATH || '',
);
const _sslConfig = existsSync(_crtPath)
  ? { rejectUnauthorized: true, ca: readFileSync(_crtPath).toString() }
  : { rejectUnauthorized: false };

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.SUPABASE_DB_CONNECTION_STRING || '',
  entities: ['dist/entities/*.js'],
  migrations: ['dist/migrations/*.js'],
  synchronize: false,
  ssl: _sslConfig,
  logging: ['error', 'migration'],
});
if (process.env.NODE_ENV !== 'test') {
  AppDataSource.initialize()
    .then(() => console.log('DataSource initialized successfully'))
    .catch((error) =>
      console.error('DataSource initialization failed:', error),
    );
}
