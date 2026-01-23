import { Order, OrderStatus } from '../models/order.model';
import { Food } from '../models/food.model';
import { Review } from '../models/review.model';
import { Types } from 'mongoose';

class DashboardService {

    async getDashboardOverview(providerId: string) {
        const pId = new Types.ObjectId(providerId);

        const [revenueData, totalOrders, totalProducts, ratingData] = await Promise.all([

            Order.aggregate([
                { $match: { providerId: pId, status: OrderStatus.COMPLETED } },
                { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' } } },
            ]),

            Order.countDocuments({ providerId: pId }),

            Food.countDocuments({ providerId: pId, foodStatus: true }),

            Review.aggregate([
                { $match: { providerId: pId } },
                { $group: { _id: null, avgRating: { $avg: '$rating' } } },
            ]),
        ]);

        return {
            totalRevenue: revenueData[0]?.totalRevenue || 0,
            totalOrders,
            totalProducts,
            avgRating: ratingData[0]?.avgRating ? parseFloat(ratingData[0].avgRating.toFixed(1)) : 0,
        };
    }


    async getRevenueAnalytics(providerId: string) {
        const pId = new Types.ObjectId(providerId);


        const revenueByDay = await Order.aggregate([
            {
                $match: {
                    providerId: pId,
                    status: OrderStatus.COMPLETED,
                },
            },
            {
                $group: {
                    _id: { $dayOfWeek: '$createdAt' },
                    totalPrice: { $sum: '$totalPrice' },
                },
            },
        ]);


        const daysMap: { [key: number]: string } = {
            1: 'Sun', 2: 'Mon', 3: 'Tue', 4: 'Wed', 5: 'Thu', 6: 'Fri', 7: 'Sat'
        };


        const result = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({
            day,
            price: 0
        }));

        revenueByDay.forEach(item => {
            const dayName = daysMap[item._id];
            const dayIndex = result.findIndex(r => r.day === dayName);
            if (dayIndex !== -1) {
                result[dayIndex].price = item.totalPrice;
            }
        });

        return result;
    }


    async getPopularDishes(providerId: string) {
        const pId = new Types.ObjectId(providerId);

        const popularDishes = await Order.aggregate([
            { $match: { providerId: pId, status: OrderStatus.COMPLETED } },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.foodId',
                    totalSold: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
                },
            },
            {
                $lookup: {
                    from: 'foods',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'foodDetails',
                },
            },
            { $unwind: '$foodDetails' },
            { $match: { 'foodDetails.foodStatus': true } }, // Only active foods
            {
                $project: {
                    foodId: '$_id',
                    title: '$foodDetails.title',
                    totalSold: 1,
                    totalRevenue: 1,
                },
            },
            { $sort: { totalSold: -1, totalRevenue: -1 } },
            { $limit: 3 },
        ]);

        return popularDishes;
    }


    async getRecentOrders(providerId: string) {
        const pId = new Types.ObjectId(providerId);

        const recentOrders = await Order.find({ providerId: pId })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('customerId', 'fullName email') // Assuming fullName/email exist in User model
            .select('orderId customerId logisticsType paymentMethod status createdAt');

        return recentOrders.map(order => ({
            orderId: order.orderId,
            customerName: (order.customerId as any)?.fullName || 'Unknown',
            logisticsType: order.logisticsType,
            paymentMethod: order.paymentMethod,
            status: order.status,
            createdAt: order.createdAt,
        }));
    }

    /**
     * Unified Dashboard Data
     */
    async getUnifiedDashboardData(providerId: string) {
        const [dashboardOverview, revenueAnalytics, popularTopDishes, recentOrders] = await Promise.all([
            this.getDashboardOverview(providerId),
            this.getRevenueAnalytics(providerId),
            this.getPopularDishes(providerId),
            this.getRecentOrders(providerId),
        ]);

        return {
            dashboardOverview,
            revenueAnalytics,
            popularTopDishes,
            recentOrders,
        };
    }
}

export default new DashboardService();
