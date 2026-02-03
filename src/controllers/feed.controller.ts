import { Response, Request } from 'express';
import { catchAsync } from '../utils/catchAsync';

class FeedController {
    getFeed = catchAsync(async (req: Request, res: Response) => {
        res.status(200).json({
            success: true,
            data: {
                message: "Feed Service Placeholder"
            }
        });
    });
}

export default new FeedController();
