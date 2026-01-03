import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { StatsEntity } from './stats.entity';
import { TransferEntity } from './transfer.entity';
import { ContractsEntity } from './contracts.entity';
import { AffiliatedEntity } from './affiliated.entity';

export const ENUM_USER_STATUS = ['active', 'inactive', 'suspended', 'banned'];
export const ENUM_TRANSFER_SYNC_STATUS = [
  'pending',
  'syncing',
  'completed',
  'failed',
];

@Entity({ name: 'affiliates_users' })
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  userId: string;

  @Column({ type: 'text', unique: true })
  affiliateCode: string;

  @Column({ type: 'text' })
  status: string;

  @Column({ type: 'text' })
  transferSyncStatus: string;

  @Column({ type: 'text' })
  nextPayment?: string;

  @OneToOne(() => StatsEntity, (stats) => stats.user, {
    cascade: true,
    eager: true,
  })
  @JoinColumn()
  stats: StatsEntity;

  @OneToMany(() => TransferEntity, (transfer) => transfer.user)
  transfers: TransferEntity[];

  @OneToMany(() => ContractsEntity, (contract) => contract.user)
  contracts: ContractsEntity[];

  @OneToMany(() => AffiliatedEntity, (affiliated) => affiliated.user)
  affiliateds: AffiliatedEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
