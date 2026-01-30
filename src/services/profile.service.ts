import { Profile } from '../models/profile.model';
import AppError from '../utils/AppError';
import { Types } from 'mongoose';

class ProfileService {

    /**
     * Get My Profile
     * Returns the profile even if it's inactive (soft-deleted)
     */
    async getProfile(userId: string) {
        const profile = await Profile.findOne({
            userId: new Types.ObjectId(userId)
        });

        if (!profile) {
            throw new AppError('Profile not found', 404, 'PROFILE_NOT_FOUND');
        }

        return profile;
    }


    /**
     * Update My Profile
     * Works even on inactive profiles
     */
    async updateProfile(userId: string, data: any) {
        const profile = await Profile.findOneAndUpdate(
            { userId: new Types.ObjectId(userId) },
            { $set: data },
            { new: true, runValidators: true }
        );

        if (!profile) {
            throw new AppError('Profile not found', 404, 'PROFILE_NOT_FOUND');
        }

        return profile;
    }


    /**
     * Delete My Profile (Soft Delete)
     * Marks profile as inactive. Data stays in the database.
     */
    async deleteProfile(userId: string) {
        const profile = await Profile.findOneAndUpdate(
            { userId: new Types.ObjectId(userId) },
            { $set: { isActive: false } },
            { new: true }
        );

        if (!profile) {
            throw new AppError('Profile not found', 404, 'PROFILE_NOT_FOUND');
        }

        return true;
    }
}

export default new ProfileService();
