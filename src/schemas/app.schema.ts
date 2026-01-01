import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type NotificationDocument = Notification & Document;

export enum NotificationType {
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
  CUSTOM = "custom",
}

export enum NotificationStatus {
  UNREAD = "unread",
  READ = "read",
  ARCHIVED = "archived",
}

export enum NotificationPriority {
  LOW = "low",
  NORMAL = "normal",
  HIGH = "high",
}

@Schema({ timestamps: true, collection: "notifications" })
export class Notification {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: true })
  message: string;

  @Prop({ type: String })
  href?: string;

  @Prop({ type: String, required: true })
  by: string;

  @Prop({ enum: NotificationType, default: NotificationType.INFO })
  type: NotificationType;

  @Prop({
    enum: NotificationStatus,
    default: NotificationStatus.UNREAD,
    index: true,
  })
  status: NotificationStatus;

  @Prop({ enum: NotificationPriority, default: NotificationPriority.NORMAL })
  priority: NotificationPriority;

  @Prop({ type: String })
  metadata?: string;

  @Prop({ type: Date })
  expiresAt?: Date;

  @Prop({ required: true, default: Date.now })
  createdAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
NotificationSchema.index({ userId: 1, status: 1, createdAt: -1 });