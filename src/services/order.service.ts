import { Order, OrderStatus } from '../models/order.model';
import { Types } from 'mongoose';
import AppError from '../utils/AppError';

class OrderService {
    async getProviderOrders(providerId: string, filters: any) {
        const { status, orderId, customerName, page = 1, limit = 10 } = filters;
        const query: any = { providerId: new Types.ObjectId(providerId) };

        if (status) {
            query.status = status;
        }

        if (orderId) {
            if (!Types.ObjectId.isValid(orderId)) {
                throw new AppError('Invalid Order ID format', 400, 'INVALID_ORDER_ID_ERROR');
            }
            query._id = new Types.ObjectId(orderId);
        }

        // If customerName is provided, we need to first find the users matching that name,
        // then filter orders by those customer IDs.
        // OR we can use aggregation to lookup customer and match name.
        // Aggregation is better for filtering by populated field.

        const pipeline: any[] = [
            { $match: query }, // Match basic fields first (providerId, status, orderId)
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

        // Project necessary fields
        pipeline.push({
            $project: {
                _id: 1,
                user_id: '$customerInfo._id', // Keep reference if needed, but not exposed
                customerName: '$customerInfo.fullName',
                logisticsType: 1,
                totalPrice: 1,
                status: 1,
                createdAt: 1,
            },
        });

        // Pagination
        const skip = (Number(page) - 1) * Number(limit);

        // Count total matching documents for pagination
        // We need a separate pipeline or use facet for efficiency?
        // Facet is good.

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
            orders: orders.map((order: any) => ({
                orderId: order._id, // Aggregation preserves _id
                customerName: order.customerName || 'Unknown Customer',
                logistics: order.logisticsType,
                pricing: order.totalPrice,
                status: order.status,
                createdAt: order.createdAt,
            })),
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / Number(limit)),
            },
        };
    }
}

export default new OrderService();
