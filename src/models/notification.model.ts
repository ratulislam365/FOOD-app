import { Schema, model, Document, Types } from 'mongoose';
import { UserRole } from './user.model';
import { OrderStatus } from './order.model';

export interface INotification extends Document {
    userId: Types.ObjectId;
    userRole: UserRole;
    orderId: Types.ObjectId;
    orderStatus: OrderStatus; // Added to prevent duplicates for same status
    title: string;
    message: string;
    isRead: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        userRole: {
            type: String,
            enum: Object.values(UserRole),
            required: true,
        },
        orderId: {
            type: Schema.Types.ObjectId,
            ref: 'Order',
            required: true,
        },
        orderStatus: {
            type: String,
            enum: Object.values(OrderStatus),
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Index for userId + createdAt as requested
notificationSchema.index({ userId: 1, createdAt: -1 });

// Prevent duplicate notifications for the same order status for a user
notificationSchema.index({ userId: 1, orderId: 1, orderStatus: 1 }, { unique: true });

export const Notification = model<INotification>('Notification', notificationSchema);
