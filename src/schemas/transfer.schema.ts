import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class Transfer {
  _id?: string;

  @Prop({ required: true, type: Number, min: 0.01 })
  amount: number;

  @Prop({
    required: true,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
  })
  status: 'pending' | 'completed' | 'failed';

  @Prop({ type: String })
  paymentStr?: string;

  @Prop({ type: String })
  paymentProofUrl?: string;

  @Prop({ type: String })
  internalPaymentProofUrl?: string;

  @Prop({ type: String })
  failureReason?: string;

  @Prop({ type: Date })
  completedDate?: Date;

  @Prop({ type: String })
  details?: string;

  @Prop({ type: [String] })
  usedTransactionIds?: string[];
}

export const TransferSchema = SchemaFactory.createForClass(Transfer);
