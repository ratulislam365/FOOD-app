import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import AppError from '../utils/AppError';
import adminOrderService from '../services/adminOrder.service';

class AdminOrderController {
    getOrderDetails = catchAsync(async (req: Request, res: Response) => {
        const providerId = req.params.providerId as string;
        const orderId = req.params.orderId as string;

        if (!providerId || !orderId) {
            throw new AppError('Provider ID and Order ID are required', 400);
        }

        const orderDetails = await adminOrderService.getOrderDetails(providerId, orderId);

        res.status(200).json({
            success: true,
            order: orderDetails
        });
    });
}

export default new AdminOrderController();
