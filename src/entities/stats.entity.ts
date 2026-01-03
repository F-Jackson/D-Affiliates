import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from 'typeorm';
import { UserEntity } from './user.entity';

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

  @OneToOne(() => UserEntity, (user) => user.stats)
  user: UserEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
