import { Order, OrderStatus } from '../models/order.model';
import { User, UserRole } from '../models/user.model';
import { Review } from '../models/review.model';
import { Types } from 'mongoose';
import { DateRange } from '../utils/date.utils';

class AdminAnalyticsService {
    /**
     * Requirement 2: Overview Metrics
     */
    async getOverviewMetrics(range: DateRange) {
        const [orderStats, customerCount] = await Promise.all([
            Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: range.startDate, $lte: range.endDate },
                        status: { $ne: OrderStatus.CANCELLED }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalOrders: { $sum: 1 },
                        totalRevenue: { $sum: '$totalPrice' }
                    }
                }
            ]),
            User.countDocuments({
                role: UserRole.CUSTOMER,
                createdAt: { $lte: range.endDate } // Total customers up to the end of range
            })
        ]);

        const stats = orderStats[0] || { totalOrders: 0, totalRevenue: 0 };

        return {
            totalOrders: stats.totalOrders,
            totalCustomers: customerCount,
            totalRevenue: stats.totalRevenue
        };
    }

    /**
     * Requirement 3 & 4: Trend Analytics (Revenue & Orders)
     */
    async getTrendAnalytics(filter: string, range: DateRange, type: 'revenue' | 'orders') {
        let groupBy: any = {};
        let project: any = {};
        let sort: any = { '_id': 1 };
        let labels: string[] = [];
        let initialValues: number[] = [];

        const valueField = type === 'revenue' ? '$totalPrice' : 1;
        const accumulator = type === 'revenue' ? { $sum: valueField } : { $sum: 1 };

        switch (filter) {
            case 'today':
                groupBy = { $hour: '$createdAt' };
                // We want buckets or all hours. Let's do all 24 hours for better granularity
                labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
                initialValues = new Array(24).fill(0);
                break;
            case 'week':
                groupBy = { $dayOfWeek: '$createdAt' }; // 1 (Sunday) to 7 (Saturday)
                labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                initialValues = new Array(7).fill(0);
                break;
            case 'month':
                // Group by week of month (approximate)
                groupBy = {
                    $subtract: [
                        { $ceil: { $divide: [{ $dayOfMonth: '$createdAt' }, 7] } },
                        0
                    ]
                };
                labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'];
                initialValues = new Array(5).fill(0);
                break;
            case 'year':
                groupBy = { $month: '$createdAt' }; // 1 to 12
                labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                initialValues = new Array(12).fill(0);
                break;
            default:
                // Custom range: Default to daily grouping
                groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
                // Labels will be dynamic
                break;
        }

        const data = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: range.startDate, $lte: range.endDate },
                    status: filter === 'cancelled' ? OrderStatus.CANCELLED : { $ne: OrderStatus.CANCELLED }
                }
            },
            {
                $group: {
                    _id: groupBy,
                    value: accumulator
                }
            },
            { $sort: sort }
        ]);

        // Map data to labels/values
        let finalValues = [...initialValues];
        let finalLabels = [...labels];

        if (filter === 'custom') {
            finalLabels = data.map(d => d._id);
            finalValues = data.map(d => d.value);
        } else {
            data.forEach(item => {
                const index = filter === 'week' ? item._id - 1 : (filter === 'year' || filter === 'today') ? item._id : item._id - 1;
                // Adjust for month/week if 0-indexed or 1-indexed
                let finalIndex = index;
                if (filter === 'year' || filter === 'week') {
                    // Mongoose/Mongo dayOfWeek 1-7, Month 1-12
                    finalIndex = item._id - 1;
                }

                if (finalValues[finalIndex] !== undefined) {
                    finalValues[finalIndex] = item.value;
                }
            });
        }

        const totalValue = finalValues.reduce((a, b) => a + b, 0);

        return {
            labels: finalLabels,
            values: finalValues,
            totalValue: type === 'revenue' ? totalValue : undefined,
            totalOrders: type === 'orders' ? totalValue : undefined
        };
    }

    /**
     * Requirement 5: Recent Orders
     */
    async getRecentOrders(page: number, limit: number) {
        const skip = (page - 1) * limit;

        const orders = await Order.aggregate([
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
            // Lookup customer name
            {
                $lookup: {
                    from: 'users',
                    localField: 'customerId',
                    foreignField: '_id',
                    as: 'customer'
                }
            },
            { $unwind: '$customer' },
            // Lookup food details for the first item
            {
                $lookup: {
                    from: 'foods',
                    localField: 'items.0.foodId',
                    foreignField: '_id',
                    as: 'foodInfo'
                }
            },
            { $unwind: { path: '$foodInfo', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    orderId: 1,
                    status: 1,
                    totalPrice: 1,
                    createdAt: 1,
                    customerName: '$customer.fullName',
                    quantity: { $sum: '$items.quantity' },
                    menu: {
                        title: '$foodInfo.title',
                        image: '$foodInfo.image'
                    }
                }
            }
        ]);

        const total = await Order.countDocuments();

        return {
            orders,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        };
    }/**
     * Requirement: Recent 5 Customer Reviews
     */
    async getRecentReviews() {
        const reviews = await Review.aggregate([
            { $sort: { createdAt: -1 } },
            { $limit: 5 },
            // Lookup customer info
            {
                $lookup: {
                    from: 'users',
                    localField: 'customerId',
                    foreignField: '_id',
                    as: 'customer'
                }
            },
            { $unwind: '$customer' },
            // Lookup food info if it's a food review
            {
                $lookup: {
                    from: 'foods',
                    localField: 'foodId',
                    foreignField: '_id',
                    as: 'foodInfo'
                }
            },
            { $unwind: { path: '$foodInfo', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 1,
                    rating: 1,
                    comment: 1,
                    createdAt: 1,
                    customerName: '$customer.fullName',
                    customerImage: '$customer.profilePic',
                    foodName: '$foodInfo.title'
                }
            }
        ]);

        return reviews;
    }

    /**
     * Requirement: Trending Menus (Top 3)
     */
    async getTrendingMenus(range: DateRange) {
        const trendingMenus = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: range.startDate, $lte: range.endDate },
                    status: { $in: [OrderStatus.COMPLETED, OrderStatus.READY_FOR_PICKUP, OrderStatus.PICKED_UP] }
                }
            },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.foodId',
                    totalOrders: { $sum: 1 },
                    totalQuantity: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
                }
            },
            { $sort: { totalOrders: -1 } },
            { $limit: 3 },
            {
                $lookup: {
                    from: 'foods',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'menuInfo'
                }
            },
            { $unwind: '$menuInfo' },
            {
                $project: {
                    _id: 0,
                    menuId: '$_id',
                    title: '$menuInfo.title',
                    image: '$menuInfo.image',
                    totalOrders: 1,
                    totalQuantity: 1,
                    totalRevenue: 1
                }
            }
        ]);

        return trendingMenus;
    }

    /**
     * Requirement: Top Restaurants (Top 3 by Sales)
     */
    async getTopRestaurants(range: DateRange) {
        const topRestaurants = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: range.startDate, $lte: range.endDate },
                    status: { $in: [OrderStatus.COMPLETED, OrderStatus.READY_FOR_PICKUP, OrderStatus.PICKED_UP] }
                }
            },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$providerId',
                    orderIds: { $addToSet: '$_id' },
                    totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
                    totalItemsSold: { $sum: '$items.quantity' }
                }
            },
            {
                $project: {
                    providerId: '$_id',
                    totalOrders: { $size: '$orderIds' },
                    totalRevenue: 1,
                    totalItemsSold: 1
                }
            },
            { $sort: { totalRevenue: -1 } },
            { $limit: 3 },
            {
                $lookup: {
                    from: 'providerprofiles',
                    localField: 'providerId',
                    foreignField: 'providerId',
                    as: 'restaurantInfo'
                }
            },
            { $unwind: '$restaurantInfo' },
            {
                $project: {
                    _id: 0,
                    restaurantId: '$providerId',
                    restaurantName: '$restaurantInfo.restaurantName',
                    logo: '$restaurantInfo.profile',
                    totalOrders: 1,
                    totalRevenue: 1,
                    avgOrderValue: {
                        $cond: [
                            { $eq: ['$totalOrders', 0] },
                            0,
                            { $divide: ['$totalRevenue', '$totalOrders'] }
                        ]
                    }
                }
            }
        ]);

        return topRestaurants;
    }

    /**
     * Requirement: Master Admin Analytics API
     * Combines all key metrics into a single high-performance response.
     */
    async getMasterAnalytics(filter: string, range: DateRange) {
        // Parallel execution to maintain <200ms response time
        const [overview, revenue, ordersOverview, recentOrders] = await Promise.all([
            this.getOverviewMetrics(range),
            this.getTrendAnalytics(filter, range, 'revenue'),
            this.getTrendAnalytics(filter, range, 'orders'),
            this.getRecentOrders(1, 5) // Fetch top 5 latest
        ]);

        return {
            overview,
            revenue: {
                labels: revenue.labels,
                values: revenue.values,
                totalRevenue: revenue.totalValue
            },
            ordersOverview: {
                labels: ordersOverview.labels,
                values: ordersOverview.values,
                totalOrders: ordersOverview.totalOrders
            },
            recentOrders: recentOrders.orders
        };
    }
}

export default new AdminAnalyticsService();
