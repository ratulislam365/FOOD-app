import { Review } from '../models/review.model';
import { Order, OrderStatus } from '../models/order.model';
import AppError from '../utils/AppError';
import { Types } from 'mongoose';

class ReviewService {

    async createReview(customerId: string, data: { orderId: string; rating: number; comment: string; foodId?: string }) {
        const order = await Order.findOne({
            $or: [
                { orderId: data.orderId },
                { _id: Types.ObjectId.isValid(data.orderId) ? new Types.ObjectId(data.orderId) : undefined }
            ].filter(q => q._id !== undefined || q.orderId)
        });

        if (!order) {
            throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
        }

        if (order.status !== OrderStatus.COMPLETED) {
            throw new AppError('You can only review completed orders', 400, 'ORDER_NOT_COMPLETED');
        }

        if (order.customerId.toString() !== customerId) {
            throw new AppError('You are not authorized to review this order', 403, 'FORBIDDEN');
        }

        // If foodId is provided, verify it belongs to this order
        if (data.foodId) {
            const foodInOrder = order.items.find(item => item.foodId.toString() === data.foodId);
            if (!foodInOrder) {
                throw new AppError('Food item not found in this order', 400, 'FOOD_NOT_IN_ORDER');
            }
        }

        const review = await Review.create({
            providerId: order.providerId,
            customerId: order.customerId,
            orderId: order._id,
            foodId: data.foodId ? new Types.ObjectId(data.foodId) : undefined,
            rating: data.rating,
            comment: data.comment,
        });

        return review;
    }

    async getFoodReviews(foodId: string) {
        if (!Types.ObjectId.isValid(foodId)) {
            throw new AppError('Invalid Food ID', 400, 'INVALID_FOOD_ID');
        }

        const totalReviews = await Review.countDocuments({ foodId: new Types.ObjectId(foodId) });

        const reviews = await Review.find({ foodId: new Types.ObjectId(foodId) })
            .populate('customerId', 'fullName profilePic')
            .sort({ createdAt: -1 });

        return {
            totalReviews,
            reviews: reviews.map(rev => ({
                name: (rev.customerId as any)?.fullName || 'Anonymous',
                profileImage: (rev.customerId as any)?.profilePic || '',
                Reviews: rev.rating,
                descpson: rev.comment,
                date: rev.createdAt
            }))
        };
    }

    async getReviewById(reviewId: string) {
        if (!Types.ObjectId.isValid(reviewId)) throw new AppError('Invalid Review ID', 400, 'INVALID_ID');

        const review = await Review.findById(reviewId)
            .populate('customerId', 'fullName profilePicture')
            .populate('providerId', 'fullName');

        if (!review) throw new AppError('Review not found', 404, 'NOT_FOUND');
        return review;
    }

    async updateReview(reviewId: string, customerId: string, data: { rating?: number; comment?: string }) {
        const review = await Review.findOne({ _id: reviewId, customerId: new Types.ObjectId(customerId) });
        if (!review) throw new AppError('Review not found or not authorized', 404, 'NOT_FOUND');

        if (data.rating) review.rating = data.rating;
        if (data.comment) review.comment = data.comment;

        await review.save();
        return review;
    }

    async deleteReview(reviewId: string, customerId: string) {
        const result = await Review.findOneAndDelete({ _id: reviewId, customerId: new Types.ObjectId(customerId) });
        if (!result) throw new AppError('Review not found or not authorized', 404, 'NOT_FOUND');
        return true;
    }

    async replyToReview(providerId: string, reviewId: string, comment: string) {
        const review = await Review.findOne({ _id: reviewId, providerId: new Types.ObjectId(providerId) });
        if (!review) throw new AppError('Review not found or you are not the provider for this order', 404, 'FORBIDDEN');

        review.reply = {
            comment,
            createdAt: new Date(),
        };

        await review.save();
        return review;
    }

    async getRatingDistribution(providerId: string) {
        const stats = await Review.aggregate([
            { $match: { providerId: new Types.ObjectId(providerId) } },
            {
                $group: {
                    _id: '$rating',
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: -1 } },
        ]);

        const distribution = [5, 4, 3, 2, 1].map(star => {
            const found = stats.find(s => s._id === star);
            return { rating: star, count: found ? found.count : 0 };
        });

        const totalReviews = distribution.reduce((acc, curr) => acc + curr.count, 0);
        const averageRating = totalReviews > 0
            ? (distribution.reduce((acc, curr) => acc + (curr.rating * curr.count), 0) / totalReviews).toFixed(1)
            : 0;

        return { totalReviews, averageRating, distribution };
    }

    async searchAndFilterReviews(providerId: string, filters: any) {
        const { rating, customerName, page = 1, limit = 10 } = filters;
        const skip = (Number(page) - 1) * Number(limit);

        const pipeline: any[] = [
            { $match: { providerId: new Types.ObjectId(providerId) } }
        ];

        if (rating) {
            pipeline.push({ $match: { rating: Number(rating) } });
        }

        pipeline.push(
            {
                $lookup: {
                    from: 'users',
                    localField: 'customerId',
                    foreignField: '_id',
                    as: 'customer',
                },
            },
            { $unwind: '$customer' }
        );

        if (customerName) {
            pipeline.push({
                $match: {
                    'customer.fullName': { $regex: customerName, $options: 'i' }
                }
            });
        }

        pipeline.push({ $sort: { createdAt: -1 } });

        const result = await Review.aggregate([
            ...pipeline,
            {
                $facet: {
                    metadata: [{ $count: 'total' }],
                    data: [
                        { $skip: skip },
                        { $limit: Number(limit) },
                        {
                            $project: {
                                _id: 1,
                                rating: 1,
                                comment: 1,
                                reply: 1,
                                createdAt: 1,
                                customerName: '$customer.fullName',
                                customerProfile: '$customer.profilePic'
                            }
                        }
                    ],
                },
            },
        ]);

        const total = result[0].metadata[0]?.total || 0;
        const reviews = result[0].data;

        return {
            reviews,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / Number(limit)),
            },
        };
    }
}

export default new ReviewService();
