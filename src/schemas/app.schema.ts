import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
class Transaction {
  @Prop({ required: true, type: String })
  id: string;

  @Prop({ required: true, type: Number, min: 0.01 })
  amount: number;

  @Prop({ required: true, type: Date })
  date: Date;

  @Prop({ type: String })
  paymentProofUrl?: string;

  @Prop({ required: true, type: String })
  productName: string;

  @Prop({ type: Number, min: 0, max: 1, default: 0.1 })
  commissionRate: number;

  @Prop({ type: String })
  description?: string;

  @Prop({
    type: String,
    enum: ['pending', 'approved', 'rejected', 'under_review', 'reversed'],
    default: 'pending',
  })
  status: string;

  @Prop({ type: String })
  rejectionReason?: string;

  @Prop({ type: String })
  transactionId?: string;

  @Prop({ type: Boolean, default: false })
  isVerified: boolean;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

@Schema({ timestamps: true })
class Affiliated {
  @Prop({ required: true, type: String, minlength: 1 })
  userId: string;

  @Prop({ type: [TransactionSchema], default: [] })
  transactions: Transaction[];

  @Prop({ type: Date })
  firstTransactionDate?: Date;
}

export const AffiliatedSchema = SchemaFactory.createForClass(Affiliated);

@Schema({ timestamps: true })
class Transfer {
  @Prop({ required: true, type: Number, min: 0.01 })
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

  @Prop({ type: String })
  failureReason?: string;

  @Prop({ type: Date })
  completedDate?: Date;

  @Prop({ type: String })
  details?: string;
}

export const TransferSchema = SchemaFactory.createForClass(Transfer);

@Schema({ timestamps: true })
export class Stats {
  @Prop({ type: Number, default: 0 })
  totalEarnings?: number;

  @Prop({ type: Number, default: 0 })
  totalWithdrawn?: number;

  @Prop({ type: Number, default: 0 })
  pendingWithdrawals?: number;

  @Prop({ type: Number, default: 0 })
  numberOfAffiliates?: number;

  @Prop({ type: Number })
  totalEarningsLastMonth?: number;

  @Prop({ type: Number })
  totalTransactionsLastMonth?: number;
}

export const StatsSchema = SchemaFactory.createForClass(Stats);

@Schema({ timestamps: true, collection: 'affiliates' })
export class User {
  @Prop({ required: true, unique: true, index: true, type: String })
  userId: string;

  @Prop({
    required: true,
    unique: true,
    type: String,
    match: /^[a-zA-Z0-9_-]+$/,
  })
  affiliateCode: string;

  @Prop({
    type: String,
    enum: ['active', 'suspended', 'inactive', 'banned'],
    default: 'active',
  })
  status: string;

  @Prop({ type: [AffiliatedSchema], default: [] })
  affiliateds: Affiliated[];

  @Prop({ type: [TransferSchema], default: [] })
  transfers: Transfer[];

  @Prop({ type: Date })
  lastActivityDate?: Date;

  @Prop({ type: StatsSchema })
  stats?: Stats;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.set('versionKey', 'version');
UserSchema.set('toJSON', { virtuals: true });

UserSchema.virtual('stats').get(function (this: UserDocument) {
  const totalEarnings = this.affiliateds.reduce(
    (sum, aff) => sum + aff.transactions.reduce((s, t) => s + t.amount, 0),
    0,
  );
  const totalWithdrawn = this.transfers
    .filter((t) => t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);
  const pendingWithdrawals = this.transfers
    .filter((t) => t.status === 'pending')
    .reduce((sum, t) => sum + t.amount, 0);
  const numberOfAffiliates = this.affiliateds.length;
  return {
    totalEarnings,
    totalWithdrawn,
    pendingWithdrawals,
    numberOfAffiliates,
  };
});

UserSchema.index({ affiliateCode: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ 'affiliateds.userId': 1 });
