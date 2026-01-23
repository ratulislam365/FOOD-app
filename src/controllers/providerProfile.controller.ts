import { Response } from 'express';
import { AuthRequest } from '../middlewares/authenticate';
import providerProfileService from '../services/providerProfile.service';
import { catchAsync } from '../utils/catchAsync';

class ProviderProfileController {
    createProfile = catchAsync(async (req: AuthRequest, res: Response) => {
        const providerId = req.user!.userId;
        const profile = await providerProfileService.createProfile(providerId, req.body);

        res.status(201).json({
            success: true,
            data: profile,
        });
    });

    getProfile = catchAsync(async (req: AuthRequest, res: Response) => {
        const providerId = req.user!.userId;
        const targetId = req.params.providerId as string; // Explicit cast

        // Logic currently enforces providerId from token matches targetId if checked in service
        const profile = await providerProfileService.getProfile(providerId, targetId);

        res.status(200).json({
            success: true,
            data: profile,
        });
    });

    // Helper to get own profile without ID param
    getOwnProfile = catchAsync(async (req: AuthRequest, res: Response) => {
        const providerId = req.user!.userId;
        const profile = await providerProfileService.getProfile(providerId);

        res.status(200).json({
            success: true,
            data: profile,
        });
    });

    updateProfile = catchAsync(async (req: AuthRequest, res: Response) => {
        const providerId = req.user!.userId;
        const profile = await providerProfileService.updateProfile(providerId, req.body);

        res.status(200).json({
            success: true,
            data: profile,
        });
    });

    deleteProfile = catchAsync(async (req: AuthRequest, res: Response) => {
        const providerId = req.user!.userId;
        await providerProfileService.deleteProfile(providerId);

        res.status(200).json({
            success: true,
            message: 'Provider profile deleted successfully (soft delete)',
        });
    });
}

export default new ProviderProfileController();
