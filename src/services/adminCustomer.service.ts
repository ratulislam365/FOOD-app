import { Types } from 'mongoose';
import { Order, OrderStatus } from '../models/order.model';
import { ProviderProfile } from '../models/providerProfile.model';
import AppError from '../utils/AppError';

interface DashboardSummary {
    totalOrders: number;
    totalSpent: number;
    avgOrderValue: number;
}

interface OrderItem {
    orderId: string;
    restaurant: string;
    date: Date;
    amount: number;
    status: string;
}

interface ProviderCustomerDashboardResponse {
    providerId: string;
    restaurantName: string;
    summary: DashboardSummary;
    pagination: {
        page: number;
        limit: number;
        totalOrders: number;
        totalPages: number;
    };
    orders: OrderItem[];
}

class AdminCustomerService {
    /**
     * Get Customer Dashboard metrics for a specific Provider
     * 
     * @param providerId - The provider's ID
     * @param page - Page number for pagination
     * @param limit - Number of items per page
     */
    async getProviderCustomerDashboard(
        providerId: string,
        page: number = 1,
        limit: number = 10
    ): Promise<ProviderCustomerDashboardResponse> {
        const skip = (page - 1) * limit;
        const providerObjectId = new Types.ObjectId(providerId);

        // check if provider exists
        const providerProfile = await ProviderProfile.findOne({ providerId: providerObjectId });
        if (!providerProfile) {
            throw new AppError('Provider profile not found', 404);
        }

        // Aggregation Pipeline
        const result = await Order.aggregate([
            {
                $match: {
                    providerId: providerObjectId
                }
            },
            {
                $facet: {
                    // Summary Metrics
                    summary: [
                        {
                            $group: {
                                _id: null,
                                totalOrders: { $sum: 1 },
                                totalSpent: { $sum: '$totalPrice' }
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                totalOrders: 1,
                                totalSpent: 1,
                                avgOrderValue: {
                                    $cond: {
                                        if: { $eq: ['$totalOrders', 0] },
                                        then: 0,
                                        else: { $divide: ['$totalSpent', '$totalOrders'] }
                                    }
                                }
                            }
                        }
                    ],
                    // Paginated Orders List
                    orders: [
                        { $sort: { createdAt: -1 } },
                        { $skip: skip },
                        { $limit: limit },
                        // Lookup restaurant details (ProviderProfile)
                        {
                            $lookup: {
                                from: 'providerprofiles',
                                localField: 'providerId',
                                foreignField: 'providerId',
                                as: 'providerInfo'
                            }
                        },
                        {
                            $unwind: {
                                path: '$providerInfo',
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        {
                            $project: {
                                _id: 0, // Exclude Mongo ID from output object if strictly following response format, but keeping it is usually fine. User request has "orderId" string which is usually custom ID.
                                orderId: 1, // Custom order ID
                                restaurant: { $ifNull: ['$providerInfo.restaurantName', 'Unknown Restaurant'] },
                                date: '$createdAt',
                                amount: '$totalPrice',
                                status: 1
                            }
                        }
                    ],
                    // Total Count for Pagination
                    totalCount: [
                        { $count: 'count' }
                    ]
                }
            }
        ]);

        const summaryData = result[0].summary[0] || { totalOrders: 0, totalSpent: 0, avgOrderValue: 0 };
        const ordersData = result[0].orders || [];
        const totalOrdersCount = result[0].totalCount[0] ? result[0].totalCount[0].count : 0;
        const totalPages = Math.ceil(totalOrdersCount / limit);

        return {
            providerId,
            restaurantName: providerProfile.restaurantName,
            summary: {
                totalOrders: summaryData.totalOrders,
                totalSpent: Math.round(summaryData.totalSpent * 100) / 100, // Round to 2 decimals
                avgOrderValue: Math.round(summaryData.avgOrderValue * 100) / 100
            },
            pagination: {
                page,
                limit,
                totalOrders: totalOrdersCount,
                totalPages
            },
            orders: ordersData
        };
    }
}

export default new AdminCustomerService();
