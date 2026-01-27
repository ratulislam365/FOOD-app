import { Response } from 'express';
import { AuthRequest } from '../middlewares/authenticate';
import profileService from '../services/profile.service';
import { catchAsync } from '../utils/catchAsync';

class ProfileController {
    /**
     * Create Profile
     */
    createProfile = catchAsync(async (req: AuthRequest, res: Response) => {
        const userId = req.user!.userId;
        const profile = await profileService.createProfile(userId, req.body);

        res.status(201).json({
            success: true,
            message: 'Profile created successfully',
            data: profile,
        });
    });

    /**
     * Get Profile
     */
    getProfile = catchAsync(async (req: AuthRequest, res: Response) => {
        const userId = req.user!.userId;
        const profile = await profileService.getProfile(userId);

        res.status(200).json({
            success: true,
            data: profile,
        });
    });

    /**
     * Update Profile
     */
    updateProfile = catchAsync(async (req: AuthRequest, res: Response) => {
        const userId = req.user!.userId;
        const profile = await profileService.updateProfile(userId, req.body);

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: profile,
        });
    });

    /**
     * Delete Profile (Soft Delete)
     */
    deleteProfile = catchAsync(async (req: AuthRequest, res: Response) => {
        const userId = req.user!.userId;
        await profileService.deleteProfile(userId);

        res.status(200).json({
            success: true,
            message: 'Profile deleted successfully',
        });
    });
}

export default new ProfileController();
