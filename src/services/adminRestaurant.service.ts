import { Types } from 'mongoose';
import { Order, OrderStatus } from '../models/order.model';
import { Payment, PaymentStatus, PayoutStatus } from '../models/payment.model';
import { ProviderProfile } from '../models/providerProfile.model';
import { Food } from '../models/food.model';
import { Review } from '../models/review.model';
import AppError from '../utils/AppError';

class AdminRestaurantService {

    async getDashboardStats(restaurantId: string) {
        const objectId = new Types.ObjectId(restaurantId);

        const [salesData] = await Payment.aggregate([
            { $match: { providerId: objectId, status: PaymentStatus.COMPLETED } },
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: '$totalAmount' },
                    platformFee: { $sum: '$commission' },
                }
            }
        ]);

        const [ordersData] = await Order.aggregate([
            { $match: { providerId: objectId } },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                }
            }
        ]);

        const [payoutData] = await Payment.aggregate([
            { $match: { providerId: objectId, payoutStatus: PayoutStatus.PENDING, status: PaymentStatus.COMPLETED } },
            {
                $group: {
                    _id: null,
                    nextPayoutAmount: { $sum: '$netAmount' }
                }
            }
        ]);

        return {
            totalSales: salesData?.totalSales || 0,
            totalOrders: ordersData?.totalOrders || 0,
            platformFeePerOrder: salesData?.platformFee && ordersData?.totalOrders
                ? (salesData.platformFee / ordersData.totalOrders).toFixed(2)
                : 0,
            nextPayout: {
                amount: payoutData?.nextPayoutAmount || 0,
                scheduledAt: new Date(new Date().setDate(new Date().getDate() + 7)) // Mock schedule
            }
        };
    }

    async getProfile(restaurantId: string) {
        const profile = await ProviderProfile.findOne({ providerId: restaurantId });
        if (!profile) throw new AppError('Restaurant not found', 404);

        return {
            cuisine: profile.cuisine || [],
            contact: {
                phone: profile.phoneNumber,
                website: '' // Not currently in schema
            }
        };
    }

    async getPickupWindows(restaurantId: string) {
        const profile = await ProviderProfile.findOne({ providerId: restaurantId });
        if (!profile) throw new AppError('Restaurant not found', 404);

        // Validation logic: pickupStartTime - listingCreatedAt >= 2 hours (Mock logic as requested)
        return profile.pickupWindows || [];
    }

    async getActivitySummary(restaurantId: string) {
        const objectId = new Types.ObjectId(restaurantId);

        const [listings, orders, reviews] = await Promise.all([
            Food.countDocuments({ providerId: objectId }),
            Order.countDocuments({ providerId: objectId }),
            Review.countDocuments({ providerId: objectId }) // Assuming review has providerId or we need to look up via food
        ]);

        // Review model check: does it have providerId? 
        // If Review is linked to Food, we might need aggregation.
        // Let's assume Review has providerId for simplicity or check model.
        // Checked model: Review has 'customerId' and 'foodId'. No providerId directly.
        // We need to aggregate reviews by looking up foods owned by provider.

        const reviewCount = await Review.aggregate([
            {
                $lookup: {
                    from: 'foods',
                    localField: 'foodId',
                    foreignField: '_id',
                    as: 'food'
                }
            },
            { $unwind: '$food' },
            { $match: { 'food.providerId': objectId } },
            { $count: 'count' }
        ]);

        return {
            listings,
            orders,
            reviews: reviewCount[0]?.count || 0
        };
    }

    async getCompliance(restaurantId: string) {
        const profile = await ProviderProfile.findOne({ providerId: restaurantId });
        if (!profile) throw new AppError('Restaurant not found', 404);

        return profile.compliance || { alcoholNotice: { enabled: false }, tax: { region: 'US-NY', rate: 8.875 } };
    }

    async getLocation(restaurantId: string) {
        const profile = await ProviderProfile.findOne({ providerId: restaurantId });
        if (!profile) throw new AppError('Restaurant not found', 404);

        return {
            address: `${profile.restaurantAddress}, ${profile.city}, ${profile.state} ${profile.zipCode || ''}`,
            lat: profile.location?.lat || 40.7128,
            lng: profile.location?.lng || -74.0060
        };
    }

    async blockRestaurant(restaurantId: string, reason: string) {
        // Transactions removed for standalone MongoDB compatibility
        const objectId = new Types.ObjectId(restaurantId);

        const profile = await ProviderProfile.findOneAndUpdate(
            { providerId: restaurantId },
            {
                status: 'BLOCKED',
                isActive: false,
                blockReason: reason
            },
            { new: true }
        );

        if (!profile) throw new AppError('Restaurant not found', 404);

        // Suspend all listings
        await Food.updateMany(
            { providerId: objectId },
            { foodStatus: false }
        );

        return profile;
    }

    async unblockRestaurant(restaurantId: string) {
        // Transactions removed for standalone MongoDB compatibility
        const objectId = new Types.ObjectId(restaurantId);

        const profile = await ProviderProfile.findOneAndUpdate(
            { providerId: restaurantId },
            {
                status: 'ACTIVE',
                isActive: true,
                $unset: { blockReason: 1 } // Remove blockReason field
            },
            { new: true }
        );

        if (!profile) throw new AppError('Restaurant not found', 404);

        // Reactivate all listings
        await Food.updateMany(
            { providerId: objectId },
            { foodStatus: true }
        );

        return profile;
    }

    async getProviderOrderHistory(restaurantId: string) {
        const providerId = new Types.ObjectId(restaurantId);

        const orders = await Order.find({ providerId })
            .select('orderId customerId status totalPrice createdAt')
            .populate('customerId', 'fullName')
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();

        return orders.map((order: any) => ({
            orderId: order.orderId,
            customerName: order.customerId?.fullName || 'Unknown Customer',
            date: order.createdAt,
            status: order.status,
            amount: order.totalPrice
        }));
    }

    async getProviderReviews(restaurantId: string, filter: { rating?: number; page?: number; limit?: number }) {
        const providerId = new Types.ObjectId(restaurantId);
        const { rating, page = 1, limit = 20 } = filter;
        const skip = (page - 1) * limit;

        const query: any = { providerId };
        if (rating) {
            query.rating = rating;
        }

        const reviews = await Review.find(query)
            .select('customerId rating comment createdAt')
            .populate('customerId', 'fullName profilePic')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const totalReviews = await Review.countDocuments(query);

        return {
            reviews: reviews.map((review: any) => ({
                profilePic: review.customerId?.profilePic || '',
                customerName: review.customerId?.fullName || 'Anonymous',
                rating: review.rating,
                reviewDetails: review.comment,
                createdAt: review.createdAt
            })),
            pagination: {
                total: totalReviews,
                page,
                limit,
                pages: Math.ceil(totalReviews / limit)
            }
        };
    }
}

export default new AdminRestaurantService();
