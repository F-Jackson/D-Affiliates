import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ContractsDocument = Contracts & Document;

@Schema({ timestamps: true })
export class Contracts {
  @Prop({ required: true, type: String })
  contractId: string;

  @Prop({
    type: String,
    enum: [
      'waiting-payment',
      'paid',
      'parcial-paid',
      'pending',
      'terminated',
      'suspended',
    ],
    default: 'pending',
  })
  status: 'pending' | 'confirmed' | 'suspended';

  @Prop({ type: Date })
  confirmedAt?: Date;

  @Prop({ required: true, type: Number, min: 0.01 })
  amount: number;

  @Prop({ type: String })
  secretCode: string;

  @Prop({ type: [String] })
  transcationsIds?: string[];
}

export const ContractsSchema = SchemaFactory.createForClass(Contracts);
