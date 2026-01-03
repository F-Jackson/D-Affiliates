import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

export const ENUM_USER_STATUS = ['active', 'inactive', 'suspended', 'banned'];
export const ENUM_TRANSFER_SYNC_STATUS = ['syncing', 'completed', 'failed', 'pending'];

@Entity({ name: 'affiliates_users' })
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({type: 'text'})
  userId: string;

  @Column({type: 'text', unique: true})
  affiliateCode: string;

  @Column({ type: 'text' })
  status: string;

  @Column({type: 'text'})
  transferSyncStatus: string;

  @Column({ type: 'text' })
  nextPayment?: string;
}
