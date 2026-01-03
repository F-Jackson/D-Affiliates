import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'affiliates_stats' })
export class StatsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: true })
  totalEarnings?: string;

  @Column({ type: 'text', nullable: true })
  totalWithdrawn?: string;

  @Column({ type: 'text', nullable: true })
  pendingWithdrawals?: string;

  @Column({ type: 'text', nullable: true })
  numberOfAffiliates?: string;

  @Column({ type: 'text', nullable: true })
  totalEarningsLastMonth?: string;

  @Column({ type: 'text', nullable: true })
  totalTransactionsLastMonth?: string;

  @Column({ type: 'text', nullable: true })
  usedTransactionIds?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
