import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true, collection: 'affiliates' })
export class UserSchema {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ type: String, required: true })
  affiliateCode: string;

  affiliateds: {
    userId: string;
    transactions: {
      amount: number;
      id: string;
      date: Date;
    }[];
  }[];

  transfers: {
    amount: number;
    date: Date;
    status: 'pending' | 'completed' | 'failed';
    pdfUrl?: string;
  }[];

  @Prop({ required: true, default: Date.now })
  createdAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
NotificationSchema.index({ userId: 1, status: 1, createdAt: -1 });
