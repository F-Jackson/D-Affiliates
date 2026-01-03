import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

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

  @Prop({ type: [String] })
  usedTransactionIds?: string[];
}

export const StatsSchema = SchemaFactory.createForClass(Stats);
