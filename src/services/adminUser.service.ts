import { Types } from 'mongoose';
import { User, UserRole } from '../models/user.model';
import { Profile } from '../models/profile.model';
import { ProviderProfile } from '../models/providerProfile.model';
import { Food } from '../models/food.model';
import { Review } from '../models/review.model';

interface UserFilters {
    role: UserRole;
    status?: string;
    page: number;
    limit: number;
}

class AdminUserService {
    async getUsersByRole(filters: UserFilters) {
        const { role, status, page, limit } = filters;
        const skip = (page - 1) * limit;

        const matchStage: any = { role };

        if (status && status !== 'all_status') {
            if (status === 'active') matchStage.isActive = true;
            if (status === 'suspended') matchStage.isSuspended = true;
        }

        // We'll use aggregation to join User with Profile or ProviderProfile
        const profileCollection = role === UserRole.PROVIDER ? 'providerprofiles' : 'profiles';
        const profileLocalField = role === UserRole.PROVIDER ? '_id' : '_id';
        // In User model, _id is the link. In Profile, it's userId.

        const pipeline: any[] = [
            { $match: matchStage },
            {
                $lookup: {
                    from: profileCollection,
                    localField: '_id',
                    foreignField: role === UserRole.PROVIDER ? 'providerId' : 'userId',
                    as: 'profile'
                }
            },
            { $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } },
            // If provider, we can also count their foods/services
            {
                $lookup: {
                    from: 'foods',
                    localField: '_id',
                    foreignField: 'providerId',
                    as: 'foods'
                }
            },
            {
                $lookup: {
                    from: 'reviews',
                    localField: '_id',
                    foreignField: 'providerId',
                    as: 'userReviews'
                }
            },
            {
                $project: {
                    id: { $ifNull: ['$profile._id', '$_id'] },
                    userId: '$_id',
                    fullName: 1,
                    profilePicture: { $ifNull: ['$profile.profilePic', '$profile.profile', '$profilePic', null] },
                    coverPhoto: { $ifNull: ['$profile.coverPhoto', null] },
                    bio: { $ifNull: ['$profile.bio', null] },
                    ownersName: { $ifNull: ['$profile.ownersName', null] },
                    phoneNumber: { $ifNull: ['$profile.phone', '$phone', null] },
                    companyName: { $ifNull: ['$profile.restaurantName', '$profile.companyName', null] },
                    followers: { $ifNull: ['$profile.followers', 0] },
                    reviews: {
                        averageRating: { $ifNull: [{ $avg: '$userReviews.rating' }, 0] },
                        totalReviews: { $size: '$userReviews' }
                    },
                    serviceCategories: { $ifNull: ['$profile.cuisine', '$profile.serviceCategories', []] },
                    totalUpload: {
                        totalService: { $size: '$foods' },
                        totalMedia: 1 // Placeholder as per example
                    },
                    isPayment: { $ifNull: ['$profile.isPayment', false] },
                    facebook: { $ifNull: ['$profile.facebook', ''] },
                    instagram: { $ifNull: ['$profile.instagram', ''] },
                    website: { $ifNull: ['$profile.website', ''] },
                    address: { $ifNull: ['$profile.address', {}] },
                    location: { $ifNull: ['$profile.location', null] },
                    curatedLatitude: { $ifNull: ['$profile.location.lat', null] },
                    curatedLongitude: { $ifNull: ['$profile.location.lng', null] },
                    createdAt: 1,
                    updatedAt: 1
                }
            },
            {
                $facet: {
                    metadata: [{ $count: 'total' }],
                    data: [
                        { $sort: { createdAt: -1 } },
                        { $skip: skip },
                        { $limit: limit }
                    ]
                }
            }
        ];

        const result = await User.aggregate(pipeline);

        const total = result[0].metadata[0]?.total || 0;
        const data = result[0].data;

        // If it's a list request but the user example shows a single object under 'data',
        // we should decide if we return an array or just the first object if they only want one.
        // But the URL has page/limit, so it must be a list.
        // I'll return the array in 'data' and add pagination info.

        return {
            data: data,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        };
    }
}

export default new AdminUserService();
