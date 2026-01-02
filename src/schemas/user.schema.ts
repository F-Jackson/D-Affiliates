import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Affiliated, AffiliatedSchema } from './affiliated.schema';
import { Transfer, TransferSchema } from './transfer.schema';
import { Contracts, ContractsSchema } from './contracts.schema';
import { Stats, StatsSchema } from './stats.schema';

export type UserDocument = User & Document;

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

  @Prop({ type: [ContractsSchema], default: [] })
  contracts: Contracts[];

  @Prop({
    type: String,
    enum: ['syncing', 'completed', 'failed', 'pending'],
    default: 'pending',
  })
  transferSyncStatus: 'syncing' | 'completed' | 'failed' | 'pending';

  @Prop({ type: Date })
  nextPayment?: Date;

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
