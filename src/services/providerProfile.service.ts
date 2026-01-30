import { ProviderProfile } from '../models/providerProfile.model';
import { Types } from 'mongoose';
import AppError from '../utils/AppError';

class ProviderProfileService {

    /**
     * Get Provider Profile
     * Returns profile even if inactive (social style)
     */
    async getProfile(providerId: string) {
        const pId = new Types.ObjectId(providerId);
        const profile = await ProviderProfile.findOne({ providerId: pId });

        if (!profile) {
            throw new AppError('Provider profile not found', 404, 'PROFILE_NOT_FOUND');
        }

        return profile;
    }

    /**
     * Update Provider Profile
     * Works even on inactive profiles
     */
    async updateProfile(providerId: string, updateData: any) {
        const pId = new Types.ObjectId(providerId);

        const profile = await ProviderProfile.findOneAndUpdate(
            { providerId: pId },
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!profile) {
            throw new AppError('Provider profile not found', 404, 'PROFILE_NOT_FOUND');
        }

        return profile;
    }

    /**
     * Delete Provider Profile (Soft Delete)
     * Marks as inactive, data stays in database
     */
    async deleteProfile(providerId: string) {
        const pId = new Types.ObjectId(providerId);

        const profile = await ProviderProfile.findOneAndUpdate(
            { providerId: pId },
            { $set: { isActive: false } },
            { new: true }
        );

        if (!profile) {
            throw new AppError('Provider profile not found', 404, 'PROFILE_NOT_FOUND');
        }

        return true;
    }
}

export default new ProviderProfileService();
