import { Food } from '../models/food.model';
import { Review } from '../models/review.model';
import { Category } from '../models/category.model';
import { Types } from 'mongoose';
import AppError from '../utils/AppError';

class FeedService {
    /**
     * Get Food Feed with ratings and provider info
     */
    async getFoodFeed(filters: {
        categoryName?: string;
        minRating?: number;
        page: number;
        limit: number;
    }) {
        const { categoryName, minRating } = filters;
        const page = Number(filters.page) || 1;
        const limit = Number(filters.limit) || 10;
        const skip = (page - 1) * limit;

        // Optional: Validate category existence if provided
        if (categoryName) {
            const categoryExists = await Category.findOne({
                categoryName: { $regex: new RegExp(`^${categoryName}$`, 'i') },
            });
            if (!categoryExists) {
                throw new AppError(`Category '${categoryName}' not found`, 404, 'CATEGORY_NOT_FOUND_ERROR');
            }
        }

        const pipeline: any[] = [
            // 1. Fetch only active foods
            { $match: { foodStatus: true } },

            // 2. Join Category to filter by name
            {
                $lookup: {
                    from: 'categories',
                    localField: 'categoryId',
                    foreignField: '_id',
                    as: 'category',
                },
            },
            { $unwind: '$category' },

            // Apply category filter if provided
            ...(categoryName
                ? [
                    {
                        $match: {
                            'category.categoryName': { $regex: new RegExp(categoryName, 'i') },
                        },
                    },
                ]
                : []),

            // 3. Join Provider Profile for restaurant info
            {
                $lookup: {
                    from: 'providerprofiles',
                    localField: 'providerId',
                    foreignField: 'providerId',
                    as: 'providerInfo',
                },
            },
            { $unwind: '$providerInfo' },

            // 4. Join Reviews (per provider) to calculate average rating
            {
                $lookup: {
                    from: 'reviews',
                    localField: 'providerId',
                    foreignField: 'providerId',
                    as: 'reviews',
                },
            },

            // 5. Calculate Average Rating & Total Reviews
            {
                $addFields: {
                    averageRating: { $avg: '$reviews.rating' },
                    totalReviews: { $size: '$reviews' },
                },
            },

            // Handle null average rating (for foods with no reviews)
            {
                $addFields: {
                    averageRating: { $ifNull: ['$averageRating', 0] },
                },
            },

            // 6. Filter by minRating if provided
            ...(minRating !== undefined
                ? [
                    {
                        $match: {
                            averageRating: { $gte: Number(minRating) },
                        },
                    },
                ]
                : []),

            // 7. Sort: Primary (avg rating desc), Secondary (createdAt desc)
            { $sort: { averageRating: -1, createdAt: -1 } },

            // 8. Projection to match required response structure
            {
                $project: {
                    _id: 0,
                    foodId: '$_id',
                    title: 1,
                    categoryName: '$category.categoryName',
                    image: 1,
                    finalPriceTag: 1,
                    foodAvailability: 1,
                    averageRating: { $round: ['$averageRating', 1] },
                    totalReviews: 1,
                    provider: {
                        restaurantName: '$providerInfo.restaurantName',
                        profile: '$providerInfo.profile',
                    },
                    createdAt: 1,
                },
            },

            // 9. Pagination using Facet
            {
                $facet: {
                    metadata: [{ $count: 'total' }],
                    data: [{ $skip: skip }, { $limit: limit }],
                },
            },
        ];

        const result = await Food.aggregate(pipeline);

        const total = result[0].metadata[0]?.total || 0;
        const foods = result[0].data;

        return {
            foods,
            pagination: {
                total,
                page,
                limit,
            },
        };
    }
}

export default new FeedService();
