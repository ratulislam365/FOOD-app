import { Order, OrderStatus } from '../models/order.model';
import { Types } from 'mongoose';
import AppError from '../utils/AppError';

class OrderService {
    async createOrder(customerId: string, orderData: {
        providerId: string;
        items: { foodId: string; quantity: number; price: number }[];
        totalPrice: number;
        paymentMethod: string;
        logisticsType: string;
    }) {
        // Basic validation could be expanded here

        const order = await Order.create({
            ...orderData,
            customerId: new Types.ObjectId(customerId),
            providerId: new Types.ObjectId(orderData.providerId),
            status: OrderStatus.PENDING,
            orderId: `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`, // Generate human-readable ID
            items: orderData.items.map(item => ({
                ...item,
                foodId: new Types.ObjectId(item.foodId)
            }))
        });

        return order;
    }

    async updateStatus(orderId: string, providerId: string, newStatus: OrderStatus) {
        const order = await Order.findOne({ orderId: orderId, providerId: new Types.ObjectId(providerId) });
        if (!order) {
            throw new AppError('Order not found or access denied', 404, 'ORDER_NOT_FOUND');
        }

        // Strict Flow: Pending -> Preparing -> Ready -> Completed
        switch (newStatus) {
            case OrderStatus.PREPARING:
                if (order.status !== OrderStatus.PENDING) {
                    throw new AppError('Order must be Pending to move to Preparing', 400, 'INVALID_TRANSITION');
                }
                break;
            case OrderStatus.READY:
                if (order.status !== OrderStatus.PREPARING) {
                    throw new AppError('Order must be Preparing to move to Ready', 400, 'INVALID_TRANSITION');
                }
                break;
            case OrderStatus.COMPLETED:
                if (order.status !== OrderStatus.READY) {
                    throw new AppError('Order must be Ready to move to Completed', 400, 'INVALID_TRANSITION');
                }
                break;
            default:
                throw new AppError('Invalid status update via this endpoint. Use cancel for cancellations.', 400, 'INVALID_STATUS_UPDATE');
        }

        order.status = newStatus;
        await order.save();
        return order;
    }

    async cancelOrder(orderId: string, userId: string, role: string) {
        const order = await Order.findOne({ orderId });
        if (!order) {
            throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
        }

        if (role === 'CUSTOMER') {
            if (order.customerId.toString() !== userId) {
                throw new AppError('Not authorized', 403, 'FORBIDDEN');
            }
            // Customer can cancel ONLY while Pending
            if (order.status !== OrderStatus.PENDING) {
                throw new AppError('Customer can only cancel Pending orders', 400, 'INVALID_CANCELLATION');
            }
        } else if (role === 'PROVIDER') {
            if (order.providerId.toString() !== userId) {
                throw new AppError('Not authorized', 403, 'FORBIDDEN');
            }
            // Provider can cancel ONLY while Preparing
            if (order.status !== OrderStatus.PREPARING) {
                throw new AppError('Provider can only cancel Preparing orders', 400, 'INVALID_CANCELLATION');
            }
        } else {
            throw new AppError('Invalid role', 403, 'FORBIDDEN');
        }

        order.status = OrderStatus.CANCELLED;
        await order.save();
        return order;
    }

    async getOrderById(orderId: string, userId: string, role: string) {
        const order = await Order.findOne({
            $or: [
                { orderId: orderId },
                { _id: Types.ObjectId.isValid(orderId) ? new Types.ObjectId(orderId) : undefined }
            ].filter(q => q._id !== undefined || q.orderId)
        }).populate('customerId', 'fullName email phoneNumber')
            .populate('providerId', 'fullName email')
            .populate('items.foodId', 'name image');

        if (!order) {
            throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
        }

        // Authorization: Only customer or provider of this order can see details
        if (role === 'CUSTOMER' && order.customerId._id.toString() !== userId) {
            throw new AppError('Not authorized to view this order', 403, 'FORBIDDEN');
        }
        if (role === 'PROVIDER' && order.providerId._id.toString() !== userId) {
            throw new AppError('Not authorized to view this order', 403, 'FORBIDDEN');
        }

        return order;
    }

    async getOrders(filters: any) {
        const { status, orderId, customerName, providerId, customerId, page = 1, limit = 10 } = filters;
        const query: any = {};

        if (providerId) query.providerId = new Types.ObjectId(providerId);
        if (customerId) query.customerId = new Types.ObjectId(customerId);
        if (status) query.status = status;
        if (orderId) query.orderId = orderId;

        const pipeline: any[] = [
            { $match: query },
            { $sort: { createdAt: -1 } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'customerId',
                    foreignField: '_id',
                    as: 'customerInfo',
                },
            },
            { $unwind: '$customerInfo' },
        ];

        if (customerName) {
            const escapedName = customerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            pipeline.push({
                $match: {
                    'customerInfo.fullName': { $regex: new RegExp(escapedName, 'i') },
                },
            });
        }

        pipeline.push({
            $project: {
                _id: 1,
                orderId: 1,
                customerName: '$customerInfo.fullName',
                logisticsType: 1,
                totalPrice: 1,
                status: 1,
                createdAt: 1,
            },
        });

        const skip = (Number(page) - 1) * Number(limit);
        const facetPipeline = [
            ...pipeline,
            {
                $facet: {
                    metadata: [{ $count: 'total' }],
                    data: [{ $skip: skip }, { $limit: Number(limit) }],
                },
            },
        ];

        const result = await Order.aggregate(facetPipeline);
        const total = result[0].metadata[0]?.total || 0;
        const orders = result[0].data;

        return {
            orders,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / Number(limit)),
            },
        };
    }

    async getProviderOrders(providerId: string, filters: any) {
        return this.getOrders({ ...filters, providerId });
    }
}

export default new OrderService();
