import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

// Subdocumento de transação
@Schema({ timestamps: true })
class Transaction {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ required: true, type: Date })
  date: Date;

  @Prop({ type: String })
  paymentProofUrl?: string;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

// Subdocumento de afiliado
@Schema({ timestamps: true })
class Affiliated {
  @Prop({ required: true })
  userId: string;

  @Prop({ type: [TransactionSchema], default: [] })
  transactions: Transaction[];

  @Prop({ type: Date })
  firstTransactionDate?: Date;
}

export const AffiliatedSchema = SchemaFactory.createForClass(Affiliated);

// Subdocumento de transferência
@Schema({ _id: false })
class Transfer {
  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ required: true, type: Date })
  date: Date;

  @Prop({ required: true, enum: ['pending', 'completed', 'failed'] })
  status: 'pending' | 'completed' | 'failed';

  @Prop({ type: String })
  pdfUrl?: string;

  @Prop({ enum: ['bank_transfer', 'paypal', 'crypto'] })
  paymentMethod?: 'bank_transfer' | 'paypal' | 'crypto';

  @Prop({ type: String })
  paymentProofUrl?: string;
}

export const TransferSchema = SchemaFactory.createForClass(Transfer);

// Schema principal
@Schema({ timestamps: true, collection: 'affiliates' })
export class User {
  @Prop({ required: true, unique: true, index: true })
  userId: string;

  @Prop({ required: true, unique: true })
  affiliateCode: string;

  @Prop({ type: [AffiliatedSchema], default: [] })
  affiliateds: Affiliated[];

  @Prop({ type: [TransferSchema], default: [] })
  transfers: Transfer[];

  stats: {
    totalEarnings: number;
    totalWithdrawn: number;
    pendingWithdrawals: number;
    numberOfAffiliates: number;
  };

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Índice composto opcional para consultas rápidas por afiliado e transações
UserSchema.index({ 'affiliateds.userId': 1 });
