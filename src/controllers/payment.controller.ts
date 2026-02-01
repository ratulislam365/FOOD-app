import { Request, Response } from 'express';
import paymentService from '../services/payment.service';
import { catchAsync } from '../utils/catchAsync';
import AppError from '../utils/AppError';

class PaymentController {
    /**
     * GET /provider/payments/overview
     */
    getOverview = catchAsync(async (req: Request, res: Response) => {
        const providerId = (req as any).user?.userId;

        const overview = await paymentService.getOverview(providerId);

        res.status(200).json({
            success: true,
            data: overview
        });
    });

    /**
     * GET /provider/payments/history
     */
    getHistory = catchAsync(async (req: Request, res: Response) => {
        const providerId = (req as any).user?.userId;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        if (page < 1 || limit < 1) {
            throw new AppError('Invalid pagination parameters', 400, 'INVALID_PAGINATION');
        }

        const history = await paymentService.getPaymentHistory(providerId, page, limit);

        res.status(200).json({
            success: true,
            data: history
        });
    });

    /**
     * GET /provider/payments/search
     */
    search = catchAsync(async (req: Request, res: Response) => {
        const providerId = (req as any).user?.userId;
        const query = req.query.query as string;

        if (!query) {
            throw new AppError('Search query is required', 400, 'INVALID_SEARCH_QUERY');
        }

        const results = await paymentService.searchPayments(providerId, query);

        res.status(200).json({
            success: true,
            data: results
        });
    });
}

export default new PaymentController();
