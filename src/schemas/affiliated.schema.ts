import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { TransactionSchema } from './transaction.schema';
import { Transaction } from './transaction.schema';

@Schema({ timestamps: true })
export class Affiliated {
  @Prop({ required: true, type: String, minlength: 1 })
  userId: string;

  @Prop({ type: [TransactionSchema], default: [] })
  transactions: Transaction[];

  @Prop({ type: Date })
  createdAt: Date;
}

export const AffiliatedSchema = SchemaFactory.createForClass(Affiliated);
