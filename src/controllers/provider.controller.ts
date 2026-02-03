import { Response } from 'express';
import { AuthRequest } from '../middlewares/authenticate';
import providerService from '../services/provider.service';
import { catchAsync } from '../utils/catchAsync';
import { z } from 'zod';
import AppError from '../utils/AppError';

class ProviderController {
    getCustomerDetails = catchAsync(async (req: AuthRequest, res: Response) => {
        const providerId = req.user!.userId;
        const customerId = req.params.customerId;

        if (!customerId.match(/^[0-9a-fA-F]{24}$/)) {
            throw new AppError('Invalid Customer ID', 400, 'VALIDATION_ERROR');
        }

        const data = await providerService.getCustomerDetails(providerId, customerId);

        res.status(200).json({
            success: true,
            data,
        });
    });
}

export default new ProviderController();
