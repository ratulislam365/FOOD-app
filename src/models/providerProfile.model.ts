import { Schema, model, Document, Types } from 'mongoose';

export interface IProviderProfile extends Document {
    providerId: Types.ObjectId;
    profile: string; // URL for profile image
    restaurantName: string;
    contactEmail: string;
    phoneNumber: string;
    restaurantAddress: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const providerProfileSchema = new Schema<IProviderProfile>(
    {
        providerId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Provider ID is required'],
            unique: true,
            index: true,
        },
        profile: {
            type: String,
            default: '',
        },
        restaurantName: {
            type: String,
            required: [true, 'Restaurant name is required'],
            trim: true,
            minlength: [2, 'Restaurant name must be at least 2 characters'],
            maxlength: [100, 'Restaurant name cannot exceed 100 characters'],
        },
        contactEmail: {
            type: String,
            required: [true, 'Contact email is required'],
            lowercase: true,
            trim: true,
            validate: {
                validator: (email: string) => /^\S+@\S+\.\S+$/.test(email),
                message: 'Invalid email format',
            },
        },
        phoneNumber: {
            type: String,
            required: [true, 'Phone number is required'],
            trim: true,
        },
        restaurantAddress: {
            type: String,
            required: [true, 'Restaurant address is required'],
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
providerProfileSchema.index({ providerId: 1 });

export const ProviderProfile = model<IProviderProfile>('ProviderProfile', providerProfileSchema);
