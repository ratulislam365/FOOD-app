import { Order, OrderStatus } from '../models/order.model';
import { Types } from 'mongoose';
import AppError from '../utils/AppError';
import notificationService from './notification.service';
import { UserRole } from '../models/user.model';

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

        // Trigger Notifications
        const { title: cTitle, message: cMessage } = notificationService.getNotificationDetails(OrderStatus.PENDING, order.orderId, UserRole.CUSTOMER);
        await notificationService.createNotification(order.customerId, UserRole.CUSTOMER, order._id as Types.ObjectId, OrderStatus.PENDING, cTitle, cMessage);

        const { title: pTitle, message: pMessage } = notificationService.getNotificationDetails(OrderStatus.PENDING, order.orderId, UserRole.PROVIDER);
        await notificationService.createNotification(order.providerId, UserRole.PROVIDER, order._id as Types.ObjectId, OrderStatus.PENDING, pTitle, pMessage);

        return order;
    }

    async updateStatus(orderId: string, providerId: string, newStatus: OrderStatus) {
        const order = await Order.findOne({ orderId: orderId, providerId: new Types.ObjectId(providerId) });
        if (!order) {
            throw new AppError('Order not found or access denied', 404, 'NOT_FOUND_ERROR');
        }

        // Strict Flow: Pending -> Preparing -> Ready For Pickup -> Picked Up -> Completed
        switch (newStatus) {
            case OrderStatus.PREPARING:
                if (order.status !== OrderStatus.PENDING) {
                    throw new AppError('Order must be Pending to move to Preparing', 400, 'INVALID_ORDER_STATUS');
                }
                break;
            case OrderStatus.READY_FOR_PICKUP:
                if (order.status !== OrderStatus.PREPARING) {
                    throw new AppError('Order must be Preparing to move to Ready for Pickup', 400, 'INVALID_ORDER_STATUS');
                }
                break;
            case OrderStatus.PICKED_UP:
                if (order.status !== OrderStatus.READY_FOR_PICKUP) {
                    throw new AppError('Order must be Ready for Pickup to move to Picked Up', 400, 'INVALID_ORDER_STATUS');
                }
                break;
            case OrderStatus.COMPLETED:
                if (order.status !== OrderStatus.PICKED_UP) {
                    throw new AppError('Order must be Picked Up to move to Completed', 400, 'INVALID_ORDER_STATUS');
                }
                break;
            default:
                throw new AppError('Invalid status update via this endpoint. Use cancel for cancellations.', 400, 'INVALID_ORDER_STATUS');
        }

        order.status = newStatus;
        await order.save();

        // Trigger Notifications
        const { title: cTitle, message: cMessage } = notificationService.getNotificationDetails(newStatus, order.orderId, UserRole.CUSTOMER);
        await notificationService.createNotification(order.customerId, UserRole.CUSTOMER, order._id as Types.ObjectId, newStatus, cTitle, cMessage);

        const { title: pTitle, message: pMessage } = notificationService.getNotificationDetails(newStatus, order.orderId, UserRole.PROVIDER);
        await notificationService.createNotification(order.providerId, UserRole.PROVIDER, order._id as Types.ObjectId, newStatus, pTitle, pMessage);

        return order;
    }

    async cancelOrder(orderId: string, userId: string, role: string) {
        const order = await Order.findOne({ orderId });
        if (!order) {
            throw new AppError('Order not found', 404, 'NOT_FOUND_ERROR');
        }

        if (role === 'CUSTOMER') {
            if (order.customerId.toString() !== userId) {
                throw new AppError('Not authorized', 403, 'ROLE_ERROR');
            }
            // Customer can cancel ONLY while Pending
            if (order.status !== OrderStatus.PENDING) {
                throw new AppError('Customer can only cancel Pending orders', 400, 'INVALID_ORDER_STATUS');
            }
        } else if (role === 'PROVIDER') {
            if (order.providerId.toString() !== userId) {
                throw new AppError('Not authorized', 403, 'ROLE_ERROR');
            }
            // Provider can cancel ONLY while Preparing
            if (order.status !== OrderStatus.PREPARING) {
                throw new AppError('Provider can only cancel Preparing orders', 400, 'INVALID_ORDER_STATUS');
            }
        } else {
            throw new AppError('Invalid role', 403, 'ROLE_ERROR');
        }

        order.status = OrderStatus.CANCELLED;
        await order.save();

        // Trigger Notifications
        const { title: cTitle, message: cMessage } = notificationService.getNotificationDetails(OrderStatus.CANCELLED, order.orderId, UserRole.CUSTOMER);
        await notificationService.createNotification(order.customerId, UserRole.CUSTOMER, order._id as Types.ObjectId, OrderStatus.CANCELLED, cTitle, cMessage);

        const { title: pTitle, message: pMessage } = notificationService.getNotificationDetails(OrderStatus.CANCELLED, order.orderId, UserRole.PROVIDER);
        await notificationService.createNotification(order.providerId, UserRole.PROVIDER, order._id as Types.ObjectId, OrderStatus.CANCELLED, pTitle, pMessage);

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
            throw new AppError('Order not found', 404, 'NOT_FOUND_ERROR');
        }

        // Authorization: Only customer or provider of this order can see details
        if (role === 'CUSTOMER' && order.customerId._id.toString() !== userId) {
            throw new AppError('Not authorized to view this order', 403, 'ROLE_ERROR');
        }
        if (role === 'PROVIDER' && order.providerId._id.toString() !== userId) {
            throw new AppError('Not authorized to view this order', 403, 'ROLE_ERROR');
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
