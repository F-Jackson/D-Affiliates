import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export const ENUM_CONTRACT_STATUS = [
  'waiting-payment',
  'paid',
  'parcial-paid',
  'pending',
  'terminated',
  'suspended',
];

@Entity({ name: 'affiliates_contracts' })
export class ContractsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  contractId: string;

  @Column({ type: 'text' })
  status: string;

  @Column({ type: 'text', nullable: true })
  confirmedAt?: string;

  @Column({ type: 'text' })
  amount: string;

  @Column({ type: 'text' })
  secretCode: string;

  @Column({ type: 'text', nullable: true })
  plataform?: string;

  @Column({ type: 'text', nullable: true })
  taxAmount?: string;

  @Column({ type: 'text', nullable: true })
  transcationsIds?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
