import { Order, OrderStatus } from '../models/order.model';
import { Types } from 'mongoose';
import AppError from '../utils/AppError';

class CustomerOrderService {

    async getCurrentOrders(customerId: string) {
        const currentStatuses = [
            OrderStatus.PENDING,
            OrderStatus.PREPARING,
            OrderStatus.READY_FOR_PICKUP,
            OrderStatus.PICKED_UP
        ];

        const orders = await Order.find({
            customerId: new Types.ObjectId(customerId),
            status: { $in: currentStatuses }
        })
            .sort({ createdAt: -1 })
            .select('orderId status totalPrice items createdAt logisticsType paymentMethod')
            .populate('providerId', 'fullName')
            .lean();

        if (!orders || orders.length === 0) {
            throw new AppError('No current orders found', 404, 'ORDERS_NOT_FOUND');
        }

        return orders;
    }


    async getPreviousOrders(customerId: string, page: number, limit: number) {
        const previousStatuses = [
            OrderStatus.COMPLETED,
            OrderStatus.CANCELLED
        ];


        const sanitizedLimit = Math.min(limit, 10);
        const skip = (page - 1) * sanitizedLimit;

        const [orders, total] = await Promise.all([
            Order.find({
                customerId: new Types.ObjectId(customerId),
                status: { $in: previousStatuses }
            })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(sanitizedLimit)
                .select('orderId status totalPrice items createdAt logisticsType paymentMethod')
                .populate('providerId', 'fullName')
                .lean(),
            Order.countDocuments({
                customerId: new Types.ObjectId(customerId),
                status: { $in: previousStatuses }
            })
        ]);

        if (!orders || orders.length === 0) {
            throw new AppError('No previous orders found', 404, 'ORDERS_NOT_FOUND');
        }

        return {
            orders,
            total,
            page,
            limit: sanitizedLimit
        };
    }


    async cleanupOldOrders() {
        const retentionPeriod = 90;
        const cleanupDate = new Date();
        cleanupDate.setDate(cleanupDate.getDate() - retentionPeriod);

        const result = await Order.deleteMany({
            status: { $in: [OrderStatus.COMPLETED, OrderStatus.CANCELLED] },
            createdAt: { $lt: cleanupDate }
        });

        console.log(`[CLEANUP] Deleted ${result.deletedCount} old orders.`);
        return result.deletedCount;
    }
}

export default new CustomerOrderService();
