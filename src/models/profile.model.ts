import { Schema, model, Document, Types } from 'mongoose';

export interface IProfile extends Document {
    userId: Types.ObjectId;
    name: string;
    phone: string;
    dateOfBirth: Date;
    address: string;
    profilePic: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const profileSchema = new Schema<IProfile>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
            index: true,
        },
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            minlength: [2, 'Name must be at least 2 characters'],
            maxlength: [100, 'Name cannot exceed 100 characters'],
        },
        phone: {
            type: String,
            required: [true, 'Phone number is required'],
            trim: true,
        },
        dateOfBirth: {
            type: Date,
            required: [true, 'Date of birth is required'],
        },
        address: {
            type: String,
            required: [true, 'Address is required'],
            trim: true,
            minlength: [5, 'Address must be at least 5 characters'],
        },
        profilePic: {
            type: String,
            default: '',
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

// Indexing for high-performance retrieval
profileSchema.index({ userId: 1 });

export const Profile = model<IProfile>('Profile', profileSchema);
