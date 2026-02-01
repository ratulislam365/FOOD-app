import { Request, Response } from 'express';
import analyticsService from '../services/analytics.service';
import { catchAsync } from '../utils/catchAsync';
import AppError from '../utils/AppError';

class AnalyticsController {
    /**
     * GET /provider/analytics/insights
     */
    /**
     * GET /provider/analytics/insights (Consolidated)
     */
    getInsights = catchAsync(async (req: Request, res: Response) => {
        const providerId = (req as any).user?.userId;
        const insights = await analyticsService.getProviderInsights(providerId);

        res.status(200).json({
            status: 'success',
            data: insights,
        });
    });

    /**
     * GET /provider/analytics/overview
     */
    getOverview = catchAsync(async (req: Request, res: Response) => {
        const providerId = (req as any).user?.userId;
        const data = await analyticsService.getOverview(providerId);
        res.status(200).json({ status: 'success', data });
    });

    /**
     * GET /provider/analytics/revenue
     */
    getRevenue = catchAsync(async (req: Request, res: Response) => {
        const providerId = (req as any).user?.userId;
        const data = await analyticsService.getRevenuePerformance(providerId);
        res.status(200).json({ status: 'success', data });
    });

    /**
     * GET /provider/analytics/orders
     */
    getOrders = catchAsync(async (req: Request, res: Response) => {
        const providerId = (req as any).user?.userId;
        const data = await analyticsService.getOrderDistribution(providerId);
        res.status(200).json({ status: 'success', data });
    });

    /**
     * GET /provider/analytics/users/distribution
     */
    getUserDistribution = catchAsync(async (req: Request, res: Response) => {
        const providerId = (req as any).user?.userId;
        const data = await analyticsService.getUserDistribution(providerId);
        res.status(200).json({ status: 'success', data });
    });

    /**
     * GET /provider/analytics/category-mix
     */
    getCategoryMix = catchAsync(async (req: Request, res: Response) => {
        const providerId = (req as any).user?.userId;
        const data = await analyticsService.getCategoryMix(providerId);
        res.status(200).json({ status: 'success', data });
    });

    /**
     * GET /provider/analytics/hourly-activity
     */
    getHourlyActivity = catchAsync(async (req: Request, res: Response) => {
        const providerId = (req as any).user?.userId;
        const data = await analyticsService.getHourlyActivity(providerId);
        res.status(200).json({ status: 'success', data });
    });
}

export default new AnalyticsController();
