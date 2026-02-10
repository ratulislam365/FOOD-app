import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import AppError from '../utils/AppError';
import adminCustomerService from '../services/adminCustomer.service';

class AdminCustomerController {
    /**
     * GET /admin/customers/dashboard/:providerId
     * 
     * Get customer analytics dashboard for a specific provider
     */
    getProviderCustomerDashboard = catchAsync(async (req: Request, res: Response) => {
        const { providerId } = req.params;
        const page = parseInt(String(req.query.page || '1'), 10);
        const limit = parseInt(String(req.query.limit || '10'), 10);

        if (!providerId) {
            throw new AppError('Provider ID is required', 400);
        }

        const result = await adminCustomerService.getProviderCustomerDashboard(
            providerId,
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
