import { Order, OrderStatus } from '../models/order.model';
import { Types } from 'mongoose';

class OrderService {
    async getProviderOrders(providerId: string, status?: OrderStatus, page: number = 1, limit: number = 10) {
        const query: any = { providerId: new Types.ObjectId(providerId) };

        if (status) {
            query.status = status;
        }

        const skip = (page - 1) * limit;

        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('customerId', 'fullName email') // Populate basic customer info
            .lean();

        const total = await Order.countDocuments(query);

        return {
            orders: orders.map(order => ({
                orderId: order._id,
                customer: (order.customerId as any)?.fullName || 'Unknown Customer',
                logistics: order.logisticsType,
                pricing: order.totalPrice,
                status: order.status,
                createdAt: order.createdAt,
            })),
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        };
    }
}

export default new OrderService();
