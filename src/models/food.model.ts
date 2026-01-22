import { Schema, model, Document, Types } from 'mongoose';

export interface IFood extends Document {
    categoryId: Types.ObjectId;
    providerId: Types.ObjectId;
    image: string;
    title: string;
    foodAvailability: boolean;
    calories: number;
    productDescription: string;
    baseRevenue: number;
    serviceFee: number;
    finalPriceTag: number;
    foodStatus: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const foodSchema = new Schema<IFood>(
    {
        categoryId: {
            type: Schema.Types.ObjectId,
            ref: 'Category',
            required: [true, 'Category ID is required'],
        },
        providerId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Provider ID is required'],
        },
        image: {
            type: String,
            required: [true, 'Food image is required'],
        },
        title: {
            type: String,
            required: [true, 'Food title is required'],
            trim: true,
            minlength: [2, 'Title must be at least 2 characters'],
            maxlength: [100, 'Title cannot exceed 100 characters'],
        },
        foodAvailability: {
            type: Boolean,
            default: true,
        },
        calories: {
            type: Number,
            required: [true, 'Calories information is required'],
            min: [0, 'Calories cannot be negative'],
        },
        productDescription: {
            type: String,
            trim: true,
        },
        baseRevenue: {
            type: Number,
            required: [true, 'Base revenue is required'],
            min: [0, 'Base revenue cannot be negative'],
        },
        serviceFee: {
            type: Number,
            required: [true, 'Service fee is required'],
            min: [0, 'Service fee cannot be negative'],
        },
        finalPriceTag: {
            type: Number,
            required: [true, 'Final price tag is required'],
        },
        foodStatus: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for uniqueness of title per category per provider
foodSchema.index({ providerId: 1, categoryId: 1, title: 1 }, { unique: true });

export const Food = model<IFood>('Food', foodSchema);
