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

@Schema({ _id: false })
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
}

export const TransferSchema = SchemaFactory.createForClass(Transfer);

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

  @Prop({ type: [AffiliatedSchema], default: [] })
  affiliateds: Affiliated[];

  @Prop({ type: [TransferSchema], default: [] })
  transfers: Transfer[];
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
