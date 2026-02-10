import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import AppError from '../utils/AppError';
import adminOrderService from '../services/adminOrder.service';

class AdminOrderController {
    /**
     * GET /admin/orders/:providerId/:orderId
     * 
     * Get full order details for admin
     */
    getOrderDetails = catchAsync(async (req: Request, res: Response) => {
        const { providerId, orderId } = req.params;

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
