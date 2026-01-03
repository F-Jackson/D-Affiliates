import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { AffiliatedEntity } from './affiliated.entity';

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

  @Column({ type: 'text', unique: true })
  transactionId: string;

  @ManyToOne(() => AffiliatedEntity, (affiliated) => affiliated.transactions, {
    onDelete: 'CASCADE',
  })
  affiliated: AffiliatedEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
