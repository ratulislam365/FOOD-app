import { Order, OrderStatus } from '../models/order.model';
import { User } from '../models/user.model';
import AppError from '../utils/AppError';
import { Types } from 'mongoose';

class ProviderService {
    async getCustomerDetails(providerId: string, customerId: string) {
        const pId = new Types.ObjectId(providerId);
        const cId = new Types.ObjectId(customerId);

        const orderExists = await Order.exists({ providerId: pId, customerId: cId });
        if (!orderExists) {
            throw new AppError(
                'You can only view details of customers who have ordered from you',
                403,
                'CUSTOMER_ACCESS_ERROR'
            );
        }

        const customer = await User.findById(cId).select('fullName email phone profilePic');
        if (!customer) {
            throw new AppError('Customer not found', 404, 'CUSTOMER_NOT_FOUND_ERROR');
        }

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

        const subTotal = itemsAggregation.reduce((sum, item) => sum + item.totalPrice, 0);
        const estimatedTax = Number((subTotal * 0.1).toFixed(2)); // 10% tax
 
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
