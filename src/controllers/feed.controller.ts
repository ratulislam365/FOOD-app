import { Request, Response } from 'express';
import feedService from '../services/feed.service';
import { catchAsync } from '../utils/catchAsync';

class FeedController {
    /**
     * GET /feed
     * Serves the social-style food feed
     */
    getFeed = catchAsync(async (req: Request, res: Response) => {
        // req.query is now populated with parsed/transformed values from Zod
        const { categoryName, minRating, page, limit } = req.query as any;

        const result = await feedService.getFoodFeed({
            categoryName: categoryName as string,
            minRating: minRating ? parseFloat(minRating as string) : undefined,
            page: page || 1,
            limit: limit || 10,
        });

        res.status(200).json({
            success: true,
            meta: {
                page: result.pagination.page,
                limit: result.pagination.limit,
                total: result.pagination.total,
            },
            data: result.foods,
        });
    });
}

export default new FeedController();
