import { Schema, model, Document, Types } from 'mongoose';

export enum OrderStatus {
    PENDING = 'pending',
    PREPARING = 'preparing',
    READY = 'ready',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
}

export interface IOrder extends Document {
    orderId: string;
    providerId: Types.ObjectId;
    customerId: Types.ObjectId;
    items: {
        foodId: Types.ObjectId;
        quantity: number;
        price: number;
    }[];
    totalPrice: number;
    status: OrderStatus;
    paymentMethod: string;
    logisticsType: string;
    createdAt: Date;
    updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
    {
        orderId: {
            type: String,
            required: true,
            unique: true,
        },
        providerId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        customerId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        items: [
            {
                foodId: { type: Schema.Types.ObjectId, ref: 'Food' },
                quantity: { type: Number, required: true },
                price: { type: Number, required: true },
            },
        ],
        totalPrice: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: Object.values(OrderStatus),
            default: OrderStatus.PENDING,
        },
        paymentMethod: {
            type: String,
            required: true,
        },
        logisticsType: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

orderSchema.index({ providerId: 1, status: 1, createdAt: -1 });

export const Order = model<IOrder>('Order', orderSchema);
