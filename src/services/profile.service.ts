import { Profile } from '../models/profile.model';
import AppError from '../utils/AppError';
import { Types } from 'mongoose';

class ProfileService {

    async createProfile(userId: string, data: any) {
        const existingProfile = await Profile.findOne({ userId: new Types.ObjectId(userId) });

        if (existingProfile) {
            // If profile is active, prevent duplicate
            if (existingProfile.isActive) {
                throw new AppError('Profile already exists for this user', 400, 'PROFILE_ALREADY_EXISTS');
            }
            // If soft-deleted, remove it to allow fresh creation (handles unique index constraints)
            await Profile.deleteOne({ _id: existingProfile._id });
        }

        const profile = await Profile.create({
            ...data,
            userId: new Types.ObjectId(userId),
        });

        return profile;
    }


    async getProfile(userId: string) {
        const profile = await Profile.findOne({
            userId: new Types.ObjectId(userId),
            isActive: true
        });

        if (!profile) {
            throw new AppError('Profile not found', 404, 'PROFILE_NOT_FOUND');
        }

        return profile;
    }


    async updateProfile(userId: string, data: any) {
        const profile = await Profile.findOneAndUpdate(
            { userId: new Types.ObjectId(userId), isActive: true },
            { $set: data },
            { new: true, runValidators: true }
        );

        if (!profile) {
            throw new AppError('Profile not found or access denied', 404, 'PROFILE_NOT_FOUND');
        }

        return profile;
    }


    async deleteProfile(userId: string) {
        const profile = await Profile.findOneAndUpdate(
            { userId: new Types.ObjectId(userId), isActive: true },
            { $set: { isActive: false } },
            { new: true }
        );

        if (!profile) {
            throw new AppError('Profile not found or already deleted', 404, 'PROFILE_NOT_FOUND');
        }

        return true;
    }
}

export default new ProfileService();
