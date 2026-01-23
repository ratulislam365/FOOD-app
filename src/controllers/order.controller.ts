import { Response } from 'express';
import { AuthRequest } from '../middlewares/authenticate';
import orderService from '../services/order.service';
import { catchAsync } from '../utils/catchAsync';
import { OrderStatus } from '../models/order.model';

class OrderController {
    getAllOrders = catchAsync(async (req: AuthRequest, res: Response) => {
        const providerId = req.user!.userId;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const data = await orderService.getProviderOrders(providerId, { page, limit, ...req.query });

        res.status(200).json({
            success: true,
            results: data.orders.length,
            pagination: data.pagination,
            data: data.orders,
        });
    });

    getPendingOrders = catchAsync(async (req: AuthRequest, res: Response) => {
        const providerId = req.user!.userId;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const data = await orderService.getProviderOrders(providerId, { status: OrderStatus.PENDING, page, limit });

        res.status(200).json({
            success: true,
            results: data.orders.length,
            pagination: data.pagination,
            data: data.orders,
        });
    });

    getPreparingOrders = catchAsync(async (req: AuthRequest, res: Response) => {
        const providerId = req.user!.userId;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const data = await orderService.getProviderOrders(providerId, { status: OrderStatus.PREPARING, page, limit });

        res.status(200).json({
            success: true,
            results: data.orders.length,
            pagination: data.pagination,
            data: data.orders,
        });
    });

    getReadyOrders = catchAsync(async (req: AuthRequest, res: Response) => {
        const providerId = req.user!.userId;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const data = await orderService.getProviderOrders(providerId, { status: OrderStatus.READY, page, limit });

        res.status(200).json({
            success: true,
            results: data.orders.length,
            pagination: data.pagination,
            data: data.orders,
        });
    });

    getCompletedOrders = catchAsync(async (req: AuthRequest, res: Response) => {
        const providerId = req.user!.userId;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const data = await orderService.getProviderOrders(providerId, { status: OrderStatus.COMPLETED, page, limit });

        res.status(200).json({
            success: true,
            results: data.orders.length,
            pagination: data.pagination,
            data: data.orders,
        });
    });

    getCancelledOrders = catchAsync(async (req: AuthRequest, res: Response) => {
        const providerId = req.user!.userId;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const data = await orderService.getProviderOrders(providerId, { status: OrderStatus.CANCELLED, page, limit });

        res.status(200).json({
            success: true,
            results: data.orders.length,
            pagination: data.pagination,
            data: data.orders,
        });
    });
}

export default new OrderController();
