import { Profile } from '../models/profile.model';
import { ProviderProfile } from '../models/providerProfile.model';
import AppError from '../utils/AppError';
import { Types } from 'mongoose';

class ProfileService {
    async getProfile(userId: string) {
        let profile: any = await Profile.findOne({
            userId: new Types.ObjectId(userId)
        });

        if (!profile) {
            profile = await ProviderProfile.findOne({
                providerId: new Types.ObjectId(userId)
            });
        }

        if (!profile) {
            throw new AppError('Profile not found', 404, 'PROFILE_NOT_FOUND');
        }

        return profile;
    }


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
