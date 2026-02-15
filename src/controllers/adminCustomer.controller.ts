import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import AppError from '../utils/AppError';
import adminCustomerService from '../services/adminCustomer.service';

class AdminCustomerController {

    getProviderCustomerDashboard = catchAsync(async (req: Request, res: Response) => {
        const { providerId } = req.params;
        const page = parseInt(String(req.query.page || '1'), 10);
        const limit = parseInt(String(req.query.limit || '10'), 10);

        if (!providerId) {
            throw new AppError('Provider ID is required', 400);
        }

        const result = await adminCustomerService.getProviderCustomerDashboard(
            providerId as string,
            page,
            limit
        );

        res.status(200).json({
            success: true,
            providerId: result.providerId,
            restaurantName: result.restaurantName,
            summary: result.summary,
            pagination: result.pagination,
            orders: result.orders
        });
    });
}

export default new AdminCustomerController();
