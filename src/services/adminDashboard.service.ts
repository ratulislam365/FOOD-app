import { Types } from 'mongoose';
import { Order, OrderStatus } from '../models/order.model';
import { Review } from '../models/review.model';
import { ProviderProfile } from '../models/providerProfile.model';
import AppError from '../utils/AppError';

class AdminDashboardService {
    /**
     * API 1: Orders & Analytics Overview
     * Fetch overall statistics for a specific restaurant/provider.
     */
    async getAnalyticsOverview(providerId: string) {
        if (!Types.ObjectId.isValid(providerId)) {
            throw new AppError('Invalid Provider ID', 400);
        }

        const pId = new Types.ObjectId(providerId);

        const stats = await Order.aggregate([
            { $match: { providerId: pId } },
            {
                $facet: {
                    orderCounts: [
                        {
                            $group: {
                                _id: '$status',
                                count: { $sum: 1 }
                            }
                        }
                    ],
                    profitData: [
                        {
                            $group: {
                                _id: null,
                                totalPlatformProfit: { $sum: '$platformFee' }
                            }
                        }
                    ]
                }
            }
        ]);

        const orderCountsRaw = stats[0].orderCounts;
        const profit = stats[0].profitData[0]?.totalPlatformProfit || 0;

        // Process status counts
        const statusMap: any = {
            totalOrders: 0,
            pendingOrders: 0,
            completedOrders: 0
        };

        orderCountsRaw.forEach((item: any) => {
            statusMap.totalOrders += item.count;
            if (item._id === OrderStatus.PENDING) {
                statusMap.pendingOrders += item.count;
            } else if (item._id === OrderStatus.COMPLETED || item._id === OrderStatus.PICKED_UP) {
                statusMap.completedOrders += item.count;
            }
        });

        // Sustainability Metric: 0.5kg CO2 reduced per completed order as a proxy for delivery optimization
        const co2Reduced = statusMap.completedOrders * 0.5;

        return {
            OrdersOverview: {
                totalOrders: statusMap.totalOrders,
                pendingOrders: statusMap.pendingOrders,
                completedOrders: statusMap.completedOrders
            },
            "CO2Reduced(kg)": co2Reduced,
            platformProfit: parseFloat(profit.toFixed(2))
        };
    }

    /**
     * API 2: Customer Feedback
     * Get aggregated customer ratings for the restaurant/provider.
     */
    async getCustomerFeedback(providerId: string) {
        if (!Types.ObjectId.isValid(providerId)) {
            throw new AppError('Invalid Provider ID', 400);
        }

        const pId = new Types.ObjectId(providerId);

        const feedback = await Review.aggregate([
            { $match: { providerId: pId } },
            {
                $group: {
                    _id: '$rating',
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const ratingDistribution: any = {
            "1Stars": 0,
            "2Stars": 0,
            "3Stars": 0,
            "4Stars": 0,
            "5Stars": 0
        };

        feedback.forEach((item: any) => {
            const key = `${item._id}Stars`;
            if (ratingDistribution.hasOwnProperty(key)) {
                ratingDistribution[key] = item.count;
            }
        });

        return {
            CustomerFeedback: ratingDistribution
        };
    }

    /**
     * API 3: Top Performing Restaurants
     * Fetch top performing restaurants across the platform.
     */
    async getTopPerformingRestaurants(page: number = 1, limit: number = 5) {
        const skip = (page - 1) * limit;

        const results = await Order.aggregate([
            {
                $match: {
                    status: { $in: [OrderStatus.COMPLETED, OrderStatus.PICKED_UP] }
                }
            },
            {
                $group: {
                    _id: '$providerId',
                    totalOrders: { $sum: 1 },
                    totalRevenue: { $sum: '$totalPrice' }
                }
            },
            { $sort: { totalRevenue: -1, totalOrders: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
                $lookup: {
                    from: 'providerprofiles',
                    localField: '_id',
                    foreignField: 'providerId',
                    as: 'profile'
                }
            },
            { $unwind: '$profile' },
            {
                $project: {
                    _id: 0,
                    providerId: '$_id',
                    RestaurantName: '$profile.restaurantName',
                    TotalOrders: '$totalOrders',
                    TotalRevenue: { $round: ['$totalRevenue', 2] }
                }
            }
        ]);

        return results.map((item, index) => ({
            Rank: skip + index + 1,
            ...item
        }));
    }
}

export default new AdminDashboardService();
