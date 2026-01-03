import { DataSource } from 'typeorm';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import dotenv from 'dotenv';
import { UserEntity } from './entities/user.entity';
import { AffiliatedEntity } from './entities/affiliated.entity';
import { TransactionEntity } from './entities/transaction.entity';
import { TransferEntity } from './entities/transfer.entity';
import { StatsEntity } from './entities/stats.entity';
import { ContractsEntity } from './entities/contracts.entity';

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
  entities: [
    UserEntity,
    AffiliatedEntity,
    TransactionEntity,
    TransferEntity,
    StatsEntity,
    ContractsEntity,
  ],
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
