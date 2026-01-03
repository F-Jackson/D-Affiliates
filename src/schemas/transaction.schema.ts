import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class Transaction {
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

  @Prop({ required: true, type: String, enum: ['in', 'out'] })
  direction: 'in' | 'out';

  @Prop({ type: String })
  transactionId: string;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
