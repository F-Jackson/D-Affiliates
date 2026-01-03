import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export const ENUM_TRANSACTION_DIRECTION = ['in', 'out'];

@Entity({ name: 'affiliates_transactions' })
export class TransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  amount: string;

  @Column({ type: 'text' })
  date: string;

  @Column({ type: 'text', nullable: true })
  paymentProofUrl?: string;

  @Column({ type: 'text' })
  productName: string;

  @Column({ type: 'text' })
  commissionRate: string;

  @Column({ type: 'text' })
  direction: string;

  @Column({ type: 'text' })
  transactionId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
