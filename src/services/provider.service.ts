import { Order, OrderStatus } from '../models/order.model';
import { User } from '../models/user.model';
import AppError from '../utils/AppError';
import { Types } from 'mongoose';

class ProviderService {
    async getCustomerDetails(providerId: string, customerId: string) {
        const pId = new Types.ObjectId(providerId);
        const cId = new Types.ObjectId(customerId);

        // 1. Verify Provider-Customer Relationship (Must have at least one order)
        const orderExists = await Order.exists({ providerId: pId, customerId: cId });
        if (!orderExists) {
            throw new AppError(
                'You can only view details of customers who have ordered from you',
                403,
                'CUSTOMER_ACCESS_ERROR'
            );
        }

        // 2. Fetch Customer Info
        const customer = await User.findById(cId).select('fullName email phone profilePic');
        if (!customer) {
            throw new AppError('Customer not found', 404, 'CUSTOMER_NOT_FOUND_ERROR');
        }

        // 3. Aggregate Product Details
        const itemsAggregation = await Order.aggregate([
            { $match: { providerId: pId, customerId: cId } },
            { $unwind: '$items' },
            {
                $lookup: {
                    from: 'foods',
                    localField: 'items.foodId',
                    foreignField: '_id',
                    as: 'foodDetails',
                },
            },
            { $unwind: '$foodDetails' },
            {
                $group: {
                    _id: '$items.foodId',
                    foodName: { $first: '$foodDetails.title' },
                    image: { $first: '$foodDetails.image' },
                    quantity: { $sum: '$items.quantity' },
                    totalPrice: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
                },
            },
            {
                $project: {
                    _id: 0,
                    image: 1,
                    foodName: 1,
                    quantity: 1,
                    totalPrice: 1,
                },
            },
        ]);

        // Calculate Totals
        const subTotal = itemsAggregation.reduce((sum, item) => sum + item.totalPrice, 0);
        const estimatedTax = Number((subTotal * 0.1).toFixed(2)); // 10% tax
        // Service fee logic: Sum of service fees from all orders? 
        // Or re-calculated? The prompt says "Prices must be derived from stored order data".
        // Usually, service fee is per order. Let's sum service fees from all orders.
        // Wait, Order model doesn't store separate service fee per order explicitly in the schema I saw?
        // Let's check Order model. It has `totalPrice`.
        // The prompt asks to calculate `serviceFee`. It's likely the sum of service fees embedded in orders or a fixed calculation.
        // The Service Fee is typically part of the food item price in the schema (Food.serviceFee). 
        // But here we are aggregating "Prices".
        // Let's assume for this "Provider Dashboard" view, we sum up the service fees implied by the food items?
        // Actually, the Food model has `serviceFee`. So we can aggregate that too.

        // Let's refine aggregation to calculate total service fees from Food data
        const serviceFeeAggregation = await Order.aggregate([
            { $match: { providerId: pId, customerId: cId } },
            { $unwind: '$items' },
            {
                $lookup: {
                    from: 'foods',
                    localField: 'items.foodId',
                    foreignField: '_id',
                    as: 'foodDetails',
                },
            },
            { $unwind: '$foodDetails' },
            {
                $group: {
                    _id: null,
                    totalServiceFee: { $sum: { $multiply: ['$items.quantity', '$foodDetails.serviceFee'] } }
                }
            }
        ]);

        const totalServiceFee = serviceFeeAggregation[0]?.totalServiceFee || 0;
        const grandTotal = subTotal + estimatedTax + totalServiceFee;

        // 4. Determine Order Status (Workflow)
        const orders = await Order.find({ providerId: pId, customerId: cId })
            .sort({ createdAt: -1 })
            .select('status')
            .limit(2);

        const currentStatus = orders[0]?.status || 'Unknown';
        const previousStatus = orders[1]?.status || 'None';

        let nextStatus = 'None';
        switch (currentStatus) {
            case OrderStatus.PENDING:
                nextStatus = OrderStatus.PREPARING;
                break;
            case OrderStatus.PREPARING:
                nextStatus = OrderStatus.READY_FOR_PICKUP;
                break;
            case OrderStatus.READY_FOR_PICKUP:
                nextStatus = OrderStatus.PICKED_UP;
                break;
            default:
                nextStatus = 'None';
        }

        return {
            productsDetail: {
                items: itemsAggregation,
                subTotal: Number(subTotal.toFixed(2)),
                estimatedTax,
                serviceFee: Number(totalServiceFee.toFixed(2)),
                grandTotal: Number(grandTotal.toFixed(2)),
            },
            orderStatus: {
                previousStatus,
                currentStatus,
                nextStatus,
            },
            customerInfo: {
                profilePic: customer.profilePic,
                customerName: customer.fullName,
                email: customer.email,
                phone: customer.phone,
            },
        };
    }
}

export default new ProviderService();
