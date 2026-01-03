import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export const ENUM_TRANSFER_STATUS = ['pending', 'completed', 'failed'];

@Entity({ name: 'affiliates_transfers' })
export class TransferEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  amount: string;

  @Column({ type: 'text' })
  status: string;

  @Column({ type: 'text', nullable: true })
  paymentStr?: string;

  @Column({ type: 'text', nullable: true })
  paymentProofUrl?: string;

  @Column({ type: 'text', nullable: true })
  internalPaymentProofUrl?: string;

  @Column({ type: 'text', nullable: true })
  failureReason?: string;

  @Column({ type: 'text', nullable: true })
  completedDate?: string;

  @Column({ type: 'text', nullable: true })
  details?: string;

  @Column({ type: 'text', nullable: true })
  usedTransactionIds?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
