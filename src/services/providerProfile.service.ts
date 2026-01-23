import { ProviderProfile } from '../models/providerProfile.model';
import { Types } from 'mongoose';
import AppError from '../utils/AppError';

class ProviderProfileService {
    async createProfile(providerId: string, profileData: any) {
        const pId = new Types.ObjectId(providerId);

        // Check if profile already exists
        const existingProfile = await ProviderProfile.findOne({ providerId: pId });
        if (existingProfile) {
            // Check if it was soft-deleted; if so, maybe reactivate? 
            // The logic: "One provider -> one profile only".
            // If soft deleted, we should probably allow update or reactivation, 
            // but for "CREATE", typically we throw if it exists.

            if (!existingProfile.isActive) {
                // Reactivate and update
                Object.assign(existingProfile, { ...profileData, isActive: true });
                await existingProfile.save();
                return existingProfile;
            }

            throw new AppError('Provider profile already exists', 409, 'PROFILE_ALREADY_EXISTS');
        }

        const newProfile = await ProviderProfile.create({
            ...profileData,
            providerId: pId,
        });

        return newProfile;
    }

    async getProfile(providerId: string, targetProviderId?: string) {
        // If targetProviderId is provided, used for admin or public view (?)
        // BUT strict requirement: "Provider can access ONLY their own profile"
        // So targetProviderId MUST match providerId or be ignored for this context.

        // Actually, the route /provider/profile/:providerId suggests we might look up by ID.
        // We should verify that the requester (providerId) is asking for their OWN profile.

        const pId = new Types.ObjectId(providerId);

        if (targetProviderId && targetProviderId !== providerId) {
            throw new AppError('You can only access your own profile', 403, 'PROFILE_ACCESS_ERROR');
        }

        const profile = await ProviderProfile.findOne({ providerId: pId, isActive: true });
        if (!profile) {
            throw new AppError('Provider profile not found', 404, 'PROFILE_NOT_FOUND');
        }

        return profile;
    }

    async updateProfile(providerId: string, updateData: any) {
        const pId = new Types.ObjectId(providerId);

        const profile = await ProviderProfile.findOne({ providerId: pId, isActive: true });
        if (!profile) {
            throw new AppError('Provider profile not found', 404, 'PROFILE_NOT_FOUND');
        }

        Object.assign(profile, updateData);
        await profile.save();

        return profile;
    }

    async deleteProfile(providerId: string) {
        const pId = new Types.ObjectId(providerId);

        const profile = await ProviderProfile.findOne({ providerId: pId, isActive: true });
        if (!profile) {
            throw new AppError('Provider profile not found', 404, 'PROFILE_NOT_FOUND');
        }

        // Soft delete
        profile.isActive = false;
        await profile.save();

        return profile;
    }
}

export default new ProviderProfileService();
