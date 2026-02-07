import { Banner, BannerStatus } from '../models/banner.model';
import AppError from '../utils/AppError';

class BannerService {
    async createBanner(data: any) {
        return await Banner.create(data);
    }

    async updateBanner(id: string, data: any) {
        const banner = await Banner.findOneAndUpdate(
            { _id: id, isDeleted: false },
            { $set: data },
            { new: true, runValidators: true }
        );

        if (!banner) {
            throw new AppError('Banner not found', 404);
        }

        return banner;
    }

    async softDeleteBanner(id: string) {
        const banner = await Banner.findOneAndUpdate(
            { _id: id, isDeleted: false },
            {
                $set: {
                    isDeleted: true,
                    deletedAt: new Date(),
                    status: BannerStatus.INACTIVE
                }
            },
            { new: true }
        );

        if (!banner) {
            throw new AppError('Banner not found', 404);
        }

        return { message: 'Banner deleted successfully' };
    }

    async getActiveBanners() {
        const now = new Date();

        // Find banners that are ACTIVE, not deleted, and within the time range
        return await Banner.find({
            status: BannerStatus.ACTIVE,
            isDeleted: false,
            startTime: { $lte: now },
            endTime: { $gte: now }
        }).sort({ startTime: -1 }).lean();
    }

    async getAllBanners(filters: any) {
        const { status, page = 1, limit = 10 } = filters;
        const query: any = { isDeleted: false };

        if (status) query.status = status;

        const skip = (Number(page) - 1) * Number(limit);

        const [banners, total] = await Promise.all([
            Banner.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            Banner.countDocuments(query)
        ]);

        return {
            banners,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / Number(limit))
            }
        };
    }
}

export default new BannerService();
