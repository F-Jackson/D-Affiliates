import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { TransactionEntity } from './transaction.entity';
import { UserEntity } from './user.entity';

@Entity({ name: 'affiliates_affiliated' })
export class AffiliatedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  userId: string;

  @OneToMany(() => TransactionEntity, (transaction) => transaction.affiliated)
  transactions: TransactionEntity[];

  @ManyToOne(() => UserEntity, (user) => user.transfers, {
    onDelete: 'CASCADE',
  })
  user: UserEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
